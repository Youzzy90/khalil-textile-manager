# 04 — Architecture logicielle

Cette section décrit l'architecture **logique** : choix technologiques, pattern MVC, gestion des
signaux Qt, gestion des erreurs, sauvegardes et cache.

## 4.1 Pile technologique

| Composant | Technologie | Rôle |
|---|---|---|
| Langage | Python 3.11+ | Logique applicative |
| Interface graphique | PySide6 (Qt6) | Fenêtres, widgets, signaux |
| Base de données | SQLite 3 (via `sqlite3` stdlib + WAL) | Stockage local |
| QR Code | `qrcode` (Pillow pour rendu) | Génération des QR Codes colis |
| Export Excel | `openpyxl` | Fichiers `.xlsx` |
| Export PDF / impression | Qt `QPrinter` + `QTextDocument` (ou ReportLab en alternative) | Documents imprimables |
| Hachage mots de passe | `bcrypt` ou `argon2-cffi` | Sécurité authentification |
| Compression sauvegardes | `shutil.make_archive` (zip) ou `gzip` | Archives de base |
| Packaging | PyInstaller | Exécutable autonome |
| Tests | `pytest` + `pytest-qt` | Tests automatisés |

### 4.1.1 Pourquoi PySide6 ?
- Liaison officielle Qt pour Python, licence LGPL compatible avec un produit commercial.
- Richesse de widgets, moteur de rendu, impression native, feuilles de style QSS.
- Signaux/slots natifs pour une UI réactive.
- Multi-plateforme (Windows, macOS, Linux) avec un même code.

### 4.1.2 Pourquoi SQLite ?
- Aucun serveur à installer : un seul fichier `.db` transportable et sauvegardable.
- Performances suffisantes pour 100 000 lignes avec index.
- Mode WAL (Write-Ahead Logging) : lectures non bloquantes, résistance aux arrêts brutaux.
- Intégré à la bibliothèque standard Python.

## 4.2 Pattern MVC (Modèle — Vue — Contrôleur)

L'application suit une architecture MVC stricte avec une séparation nette des responsabilités.

### 4.2.1 Couche Modèle (`ktm/models/`)
- Une classe par table, héritant de `BaseModel`.
- Responsable de l'accès aux données : `create()`, `find_by_id()`, `search()`, `update()`,
  `delete()`, `count()`, `aggregates()`.
- N'utilise pas de framework ORM lourd : requêtes SQL écrites à la main et préparées
  (`?` placeholders) pour maîtriser les performances et éviter les injections.
- Renvoie des dictionnaires ou des `dataclass` simples, jamais de widgets Qt.
- Gère les transactions critiques (paiement + écriture comptable) via un contexte
  `with db.transaction():`.

### 4.2.2 Couche Vue (`ktm/ui/`)
- Construit l'interface avec des widgets Qt.
- **Ne contient aucune logique métier ni requête SQL.**
- Émet des signaux Qt pour notifier le contrôleur des actions utilisateur
  (ex. `form_submitted`, `filter_changed`, `row_selected`).
- Reçoit des signaux du contrôleur pour se mettre à jour (ex. `data_loaded`, `operation_done`).
- Les vues sont des classes héritant de `QWidget`, `QMainWindow`, `QDialog`.

### 4.2.3 Couche Contrôleur (`ktm/controllers/`)
- Instancie la vue et le modèle associés.
- Connecte les signaux de la vue à des méthodes (slots) du contrôleur.
- Orchestre les opérations : validation des entrées, appel au modèle, gestion des erreurs,
  journalisation, mise à jour de la vue.
- Maintient l'état courant (utilisateur connecté, période sélectionnée, filtres actifs).
- Un contrôleur par module ; un contrôleur principal (`app.py`) gère la navigation entre modules.

### 4.2.4 Exemple de flux (création d'un colis)
```
Utilisateur clique "Valider"
   │
   ▼
ColisFormView émet le signal form_submitted(dict_colis)
   │
   ▼
ColisController.on_form_submitted(dict_colis)
   │  - valide les champs (utils/validators.py)
   │  - appelle ColisModel.create(dict_colis)
   │      └── INSERT dans la base + historique_colis
   │  - génère le QR Code (utils/qr_code.py)
   │  - journalise (JournalActiviteModel.log(...))
   ▼
ColisController émet operation_done(success, message)
   │
   ▼
ColisFormView affiche la confirmation et propose l'impression
```

## 4.3 Gestion des signaux Qt

PySide6 utilise le mécanisme signaux/slots. Conventions de l'application :

| Convention | Exemple |
|---|---|
| Les signaux personnalisés sont déclarés avec `Signal(...)` en haut de classe | `form_submitted = Signal(dict)` |
| Les slots sont des méthodes ordinaires décorées `@Slot(...)` | `@Slot(dict) def on_form_submitted(self, data):` |
| Les noms de signaux décrivent l'événement métier, pas l'action UI | `payment_recorded`, pas `button_clicked` |
| Les connexions sont établies dans le contrôleur, jamais dans la vue | `self.view.form_submitted.connect(self.on_form_submitted)` |
| Les mises à jour de la vue se font via des signaux du contrôleur | `self.view.set_data(rows)` (appel direct) ou `data_loaded = Signal(list)` |

### 4.3.1 Signaux globaux (bus d'événements)
Un bus d'événements singleton (`EventBus`) permet la communication entre modules indépendants :

| Signal | Émis par | Écouté par |
|---|---|---|
| `colis_created` | ColisController | DashboardController (cartes), ComptabiliteController |
| `payment_recorded` | PaiementsController | DashboardController, ComptabiliteController, ColisController |
| `stock_low` | StocksController | DashboardController (alertes), NotificationsController |
| `user_changed` | UsersController | Tous les contrôleurs (vérification permissions) |
| `settings_changed` | SettingsController | App (thème, langue), Reports (modèles) |

`EventBus` est injecté dans chaque contrôleur (pas de global mutable caché) afin de rester
testable.

## 4.4 Gestion des erreurs

### 4.4.1 Stratégie en couches
| Couche | Responsabilité |
|---|---|
| Modèle | Lève des exceptions typées (`NotFoundError`, `IntegrityError`, `DatabaseError`) |
| Contrôleur | Attrape les exceptions, journalise, décide du message utilisateur, émet un signal d'erreur |
| Vue | Affiche le message (bannière non bloquante ou boîte de dialogue selon gravité) |

### 4.4.2 Exceptions personnalisées (`utils/error_handler.py`)
| Exception | Usage |
|---|---|
| `KTMBusinessError` | Règle métier violée (ex. suppression d'un colis livré) |
| `KTMValidationError` | Champ invalide (téléphone, montant) |
| `KTMDatabaseError` | Erreur SQLite (contrainte, verrou) |
| `KTMPermissionError` | Action non autorisée pour le rôle |
| `KTMNotFoundError` | Enregistrement introuvable |

### 4.4.3 Journalisation
- `logs/app.log` : événements applicatifs (démarrage, arrêt, navigation).
- `logs/error.log` : exceptions avec stack trace.
- `logs/activity.log` : actions sensibles journalisées en base (voir section 22).
- Niveau configurable dans `config/settings.json` (`DEBUG`, `INFO`, `WARNING`, `ERROR`).

### 4.4.4 Règles
- **DOIT** : aucune exception non gérée ne remonte à l'utilisateur sous forme de stack trace
  brute ; un message lisible est toujours affiché.
- **DOIT** : toute erreur de base de données est journalisée avec la requête et les paramètres
  (sans données sensibles).
- **DEVRAIT** : les erreurs de validation n'ouvrent pas de boîte modale (bannière inline) pour ne
  pas interrompre la saisie.
- **NE DOIT PAS** : masquer une erreur de permission (toujours informer l'utilisateur).

## 4.5 Sauvegardes

### 4.5.1 Sauvegarde automatique
- Fréquence : quotidienne, à la première ouverture de l'app si la dernière sauvegarde date de
  plus de 24 h (configurable).
- Emplacement : `backups/` par défaut, configurable dans Paramètres → Sauvegarde.
- Format : archive `.zip` (ou `.gz`) contenant `ktm.db` + dossier `attachments/`.
- Rétention : les N dernières sauvegardes sont conservées (N configurable, défaut 10). Les plus
  anciennes sont supprimées automatiquement.

### 4.5.2 Sauvegarde manuelle
- Paramètres → Sauvegarde → « Sauvegarder maintenant ».
- L'utilisateur choisit l'emplacement (par défaut `backups/`).
- Nom : `ktm_backup_YYYYMMDD_HHMM.zip`.
- Vérification d'intégrité après création (lecture du zip + `PRAGMA integrity_check`).

### 4.5.3 Restauration
- Paramètres → Sauvegarde → « Restaurer ».
- Sélection d'une archive ; vérification d'intégrité.
- Fermeture propre de la base courante, extraction, remplacement, redémarrage de l'app.
- L'historique de restauration est journalisé.

Voir section 20 pour le détail complet.

## 4.6 Cache

Afin d'atteindre les cibles de performance (BNF-02, BNF-03), un cache en mémoire est utilisé de
façon ciblée et maîtrisée.

| Élément mis en cache | Durée | Invalidation |
|---|---|---|
| Liste des clients (pour autocomplétion) | Session | À chaque création/modification client |
| Liste des destinataires | Session | À chaque modification |
| Liste des livreurs | Session | À chaque modification |
| Paramètres entreprise (nom, logo, devise) | Session | À la modification dans Paramètres |
| Comptages du tableau de bord | 60 secondes | Timer + invalidation sur signaux `colis_created`, `payment_recorded` |
| QR Codes générés | Session (par code colis) | Jamais (code immuable) |

### 4.6.1 Règles de cache
- **NE DOIT PAS** mettre en cache les listes de colis (volume trop important, fraîcheur critique) ;
  la recherche utilise les index SQLite directement.
- **DOIT** invalider le cache concerné à chaque écriture (les contrôleurs émettent les signaux
  appropriés sur l'`EventBus`).
- **DOIT** limiter la taille du cache (LRU, par exemple 1 000 entrées) pour éviter une croissance
  mémoire incontrôlée.
- Le cache est interne au processus : pas de cache disque (la base SQLite joue ce rôle).

## 4.7 Cycle de vie de l'application

```
main.py
  │
  ▼
App.__init__()
  │  - charge config/settings.json
  │  - applique le thème QSS
  │  - initialise la base (Database.init() → migrations)
  │  - crée l'EventBus
  ▼
LoginController
  │  - authentification
  │  - chargement permissions
  ▼
MainWindowController
  │  - instancie la fenêtre principale
  │  - enregistre les contrôleurs de modules
  │  - affiche le tableau de bord par défaut
  ▼
Boucle d'événements Qt (app.exec())
  │
  ▼
Fermeture
  │  - flush des journaux
  │  - vérification sauvegarde du jour
  │  - fermeture propre de la base
  │  - app.exit()
```

---

*Section précédente : [03 — Architecture générale](./03-Architecture-generale.md)*
*Section suivante : [05 — Gestion des utilisateurs](./05-Utilisateurs.md)*
