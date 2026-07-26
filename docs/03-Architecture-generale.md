# 03 — Architecture générale

Cette section décrit l'organisation **physique** du projet sur disque : la structure des
dossiers et le rôle de chacun. L'architecture logique (couches, signaux, erreurs) est traitée
dans la section 04.

## 3.1 Structure complète du projet

```
KhalilTextileManager/
│
├── ktm/                          # Package Python principal
│   ├── __init__.py
│   ├── main.py                   # Point d'entrée (lancement de l'app)
│   ├── app.py                    # QApplication, thème, traductions
│   │
│   ├── controllers/              # Couche contrôleurs (MVC)
│   │   ├── __init__.py
│   │   ├── auth_controller.py
│   │   ├── dashboard_controller.py
│   │   ├── colis_controller.py
│   │   ├── clients_controller.py
│   │   ├── destinataires_controller.py
│   │   ├── livreurs_controller.py
│   │   ├── paiements_controller.py
│   │   ├── comptabilite_controller.py
│   │   ├── stocks_controller.py
│   │   ├── users_controller.py
│   │   └── settings_controller.py
│   │
│   ├── models/                   # Couche modèles (accès données)
│   │   ├── __init__.py
│   │   ├── database.py           # Connexion SQLite, init, migrations
│   │   ├── base_model.py         # Classe de base CRUD
│   │   ├── user.py
│   │   ├── colis.py
│   │   ├── client.py
│   │   ├── destinataire.py
│   │   ├── livreur.py
│   │   ├── paiement.py
│   │   ├── ecriture_comptable.py
│   │   ├── article_stock.py
│   │   ├── mouvement_stock.py
│   │   ├── piece_jointe.py
│   │   ├── commentaire.py
│   │   ├── historique_colis.py
│   │   ├── journal_activite.py
│   │   └── parametre.py
│   │
│   ├── ui/                       # Couche vues (fenêtres Qt)
│   │   ├── __init__.py
│   │   ├── main_window.py        # Fenêtre principale (menu, dock, onglets)
│   │   ├── widgets/              # Widgets réutilisables
│   │   │   ├── __init__.py
│   │   │   ├── stat_card.py
│   │   │   ├── search_bar.py
│   │   │   ├── data_table.py
│   │   │   ├── status_badge.py
│   │   │   ├── filter_panel.py
│   │   │   ├── chart_widget.py
│   │   │   ├── qr_display.py
│   │   │   └── attachment_list.py
│   │   ├── views/                # Une fenêtre par module
│   │   │   ├── __init__.py
│   │   │   ├── login_view.py
│   │   │   ├── dashboard_view.py
│   │   │   ├── colis_view.py
│   │   │   ├── colis_form_view.py
│   │   │   ├── colis_detail_view.py
│   │   │   ├── clients_view.py
│   │   │   ├── destinataires_view.py
│   │   │   ├── livreurs_view.py
│   │   │   ├── paiements_view.py
│   │   │   ├── comptabilite_view.py
│   │   │   ├── stocks_view.py
│   │   │   ├── users_view.py
│   │   │   └── settings_view.py
│   │   └── dialogs/              # Boîtes de dialogue modales
│   │       ├── __init__.py
│   │       ├── client_quick_dialog.py
│   │       ├── paiement_dialog.py
│   │       ├── charge_dialog.py
│   │       ├── affectation_dialog.py
│   │       ├── backup_dialog.py
│   │       └── confirm_dialog.py
│   │
│   ├── reports/                  # Génération de documents
│   │   ├── __init__.py
│   │   ├── report_engine.py      # Moteur de rendu
│   │   ├── invoice_report.py
│   │   ├── receipt_report.py
│   │   ├── delivery_note_report.py
│   │   ├── label_report.py       # Étiquettes QR
│   │   ├── tournee_report.py     # Liste de tournée
│   │   └── accounting_report.py
│   │
│   ├── exports/                  # Export de données
│   │   ├── __init__.py
│   │   ├── export_engine.py
│   │   ├── csv_exporter.py
│   │   ├── excel_exporter.py
│   │   └── pdf_exporter.py
│   │
│   ├── utils/                    # Utilitaires transverses
│   │   ├── __init__.py
│   │   ├── config.py             # Lecture/écriture config utilisateur
│   │   ├── security.py           # Hachage mots de passe, permissions
│   │   ├── qr_code.py            # Génération QR Codes
│   │   ├── formatting.py         # Formatage dates, montants, devise
│   │   ├── validators.py         # Validation téléphone, email, montants
│   │   ├── logger.py             # Journal applicatif
│   │   └── error_handler.py      # Gestion centralisée des erreurs
│   │
│   └── theme/                    # Thèmes QSS (Qt Style Sheets)
│       ├── __init__.py
│       ├── dark.qss              # Thème noir/or (défaut)
│       ├── light.qss
│       └── icons.py              # Mapping icônes -> ressources
│
├── assets/                       # Ressources statiques
│   ├── icons/                    # Icônes SVG (livraison, colis, etc.)
│   ├── images/                   # Logo, placeholders
│   ├── fonts/                    # Polices embarquées (si nécessaires)
│   └── qss/                      # Copies des feuilles de style (compilation)
│
├── database/                     # Base et schéma (runtime)
│   ├── ktm.db                    # Base SQLite principale (générée)
│   ├── migrations/               # Scripts SQL versionnés
│   │   ├── 001_init.sql
│   │   ├── 002_indexes.sql
│   │   └── ...
│   └── seeds/                    # Données initiales (rôles, paramètres)
│       └── 001_defaults.sql
│
├── backups/                      # Sauvegardes (runtime)
│   ├── ktm_backup_20260726_1530.db.gz
│   └── ...
│
├── logs/                         # Journaux (runtime)
│   ├── app.log
│   ├── activity.log
│   └── error.log
│
├── config/                       # Configuration (runtime)
│   ├── settings.json             # Préférences utilisateur (thème, langue)
│   └── company.json              # Infos entreprise (nom, logo, devise)
│
├── tests/                        # Tests automatisés
│   ├── unit/
│   ├── functional/
│   └── ui/
│
├── scripts/                      # Scripts utilitaires
│   ├── build_exe.py              # Création de l'exécutable (PyInstaller)
│   └── migrate.py                # Application des migrations
│
├── docs/                         # Documentation (ce cahier des charges)
│   └── *.md
│
├── requirements.txt              # Dépendances Python
├── pyproject.toml                # Métadonnées projet, outil de build
├── README.md                     # Installation et lancement
└── .gitignore
```

## 3.2 Rôle de chaque dossier

| Dossier | Rôle | Contenu versionné ? |
|---|---|---|
| `ktm/` | Code source de l'application (package Python) | Oui |
| `ktm/controllers/` | Logique applicative : orchestre modèles et vues, traite les actions utilisateur | Oui |
| `ktm/models/` | Accès aux données : classes représentant les tables, requêtes SQL, CRUD | Oui |
| `ktm/ui/` | Interface Qt : fenêtres, widgets, dialogues. Aucune logique métier ici | Oui |
| `ktm/ui/widgets/` | Widgets réutilisables (cartes statistiques, tableaux, badges de statut) | Oui |
| `ktm/ui/views/` | Une fenêtre par module métier | Oui |
| `ktm/ui/dialogs/` | Boîtes de dialogue modales (paiement, sauvegarde, confirmation) | Oui |
| `ktm/reports/` | Génération de documents imprimables (factures, reçus, étiquettes) | Oui |
| `ktm/exports/` | Export de données vers PDF, Excel, CSV | Oui |
| `ktm/utils/` | Fonctions utilitaires transverses (sécurité, formatage, validation, logs) | Oui |
| `ktm/theme/` | Feuilles de style QSS et mapping d'icônes | Oui |
| `assets/` | Ressources statiques : icônes SVG, logo, polices | Oui |
| `database/` | Base SQLite et scripts de migration | Scripts oui, `.db` non |
| `database/migrations/` | Scripts SQL versionnés appliqués au démarrage | Oui |
| `database/seeds/` | Données initiales (rôles, paramètres par défaut) | Oui |
| `backups/` | Archives de sauvegarde générées par l'app | Non (runtime) |
| `logs/` | Journaux applicatif, activité, erreurs | Non (runtime) |
| `config/` | Fichiers de préférences générés à l'utilisation | Non (runtime) |
| `tests/` | Tests unitaires, fonctionnels et d'interface | Oui |
| `scripts/` | Outils de build et de maintenance | Oui |
| `docs/` | Ce cahier des charges et la documentation | Oui |

## 3.3 Principes d'organisation

1. **Un module = un triplet modèle / vue / contrôleur.** Par exemple, le module Colis est
   composé de `models/colis.py`, `ui/views/colis_view.py`, `controllers/colis_controller.py`.
2. **Les vues ne contiennent aucune logique métier ni accès direct à la base.** Elles émettent
   des signaux ou appellent le contrôleur.
3. **Les modèles ne connaissent pas l'interface.** Ils exposent des méthodes `create`, `read`,
   `update`, `delete`, `search` et renvoient des dictionnaires ou des objets simples.
4. **Les contrôleurs font le pont.** Ils réagissent aux signaux des vues, appellent les modèles,
   et mettent à jour les vues via des signaux de retour.
5. **Le dossier `assets/` est compilé dans l'exécutable** via les ressources Qt
   (`:/icons/...`) afin de garantir la portabilité.
6. **Le dossier `database/` est créé au premier lancement** s'il n'existe pas. La base est
   initialisée par les migrations.
7. **Les dossiers runtime** (`backups/`, `logs/`, `config/`) sont créés à la volée et exclus du
   contrôle de version via `.gitignore`.

---

*Section précédente : [02 — Analyse des besoins](./02-Analyse-besoins.md)*
*Section suivante : [04 — Architecture logicielle](./04-Architecture-logicielle.md)*
