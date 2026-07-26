# 25 — Déploiement

## 25.1 Installation

### 25.1.1 Prérequis système
| Plateforme | Version minimale | Architecture |
|---|---|---|
| Windows | 10 (1903+) | x64 |
| macOS | 12 Monterey | x64 / ARM64 |
| Linux (Ubuntu) | 22.04 LTS | x64 |

Aucun runtime Python requis chez l'utilisateur final (l'exécutable embarque tout).

### 25.1.2 Procédure d'installation (Windows)
1. Télécharger `KhalilTextileManager-Setup-x.y.z.exe`.
2. Double-clic → assistant d'installation.
3. Choix du dossier (défaut : `C:\Program Files\KhalilTextileManager`).
4. Choix du dossier de données (défaut : `C:\Users\<user>\Documents\KTM`).
5. Raccourci bureau + menu Démarrer (option).
6. Lancement de l'application → assistant premier lancement (section 5.2.1).

### 25.1.3 Procédure d'installation (macOS)
1. Télécharger `KhalilTextileManager-x.y.z.dmg`.
2. Monter le DMG, glisser l'app dans `Applications`.
3. Premier lancement (clic droit → Ouvrir, car non signé par Apple à terme).

### 25.1.4 Procédure d'installation (Linux)
1. Télécharger `KhalilTextileManager-x.y.z.AppImage` (ou `.deb`).
2. AppImage : `chmod +x` puis double-clic.
3. .deb : `sudo dpkg -i ...`.

## 25.2 Configuration post-installation
Au premier lancement, l'assistant (section 5.2.1) :
1. Crée la base dans le dossier de données.
2. Applique les migrations.
3. Crée le compte administrateur.
4. Demande les infos entreprise (nom, devise).
5. Propose une sauvegarde initiale.

## 25.3 Création de l'exécutable (PyInstaller)

### 25.3.1 Commande (Windows)
```
pyinstaller --noconfirm --onefile --windowed ^
  --name "KhalilTextileManager" ^
  --icon assets/images/logo.ico ^
  --add-data "assets;assets" ^
  --add-data "database/migrations;database/migrations" ^
  --add-data "database/seeds;database/seeds" ^
  --add-data "ktm/theme;ktm/theme" ^
  ktm/main.py
```

### 25.3.2 Spécifications
- `--onefile` : exécutable unique (plus simple à distribuer, démarrage légèrement plus long).
- `--windowed` : pas de console (application graphique).
- `--add-data` : embarque les ressources (icônes, migrations, thème).
- Le dossier runtime (`database/ktm.db`, `backups/`, `logs/`, `config/`, `attachments/`) est
  créé dans le dossier de données utilisateur (pas dans le dossier d'installation, qui peut être
  en lecture seule).

### 25.3.3 Multi-plateforme
L'exécutable est construit sur chaque OS cible (pas de cross-compilation native PyInstaller).
Un CI (GitHub Actions par exemple) peut produire les trois binaires automatiquement à chaque tag.

## 25.4 Signature (recommandé)
- Windows : signature de code (certificat EV) pour éviter les avertissements SmartScreen.
- macOS : notarization Apple (à terme).
- Linux : pas de signature spécifique (AppImage est autonome).

## 25.5 Mise à jour

### 25.5.1 Mécanisme (v1)
- Pas de mise à jour automatique en v1.
- Vérification manuelle : menu Aide → « Vérifier les mises à jour » (lien vers le site de
  téléchargement, si connexion).
- L'utilisateur télécharge le nouvel installateur et l'exécute : il détecte l'installation
  existante et propose « Mettre à niveau ».
- Les données utilisateur (dossier de données) sont préservées.

### 25.5.2 Migration de base
- Au démarrage, l'app compare la version de la base (table `parametre` clé `db_version`) avec la
  version du code.
- Si la base est plus ancienne, les migrations manquantes sont appliquées automatiquement
  (dossier `database/migrations/`).
- Une sauvegarde de sécurité est faite avant migration.
- Si la base est plus récente que le code (downgrade) : avertissement, refus de démarrer ou
  mode lecture seule.

## 25.6 Désinstallation
- Windows : « Ajout/Suppression de programmes » ou désinstalleur inclus.
- macOS : suppression de l'app de `Applications`.
- Linux : suppression du paquet ou de l'AppImage.
- Le dossier de données (base, sauvegardes, logs) **n'est pas supprimé** par défaut
  (préservation des données). Option « Tout supprimer » dans le désinstalleur (avec
  confirmation).

## 25.7 Règles
| ID | Règle |
|---|---|
| `REGLE-DEPLOY-01` | DOIT : l'exécutable est autonome (aucun Python requis chez l'utilisateur) |
| `REGLE-DEPLOY-02` | DOIT : les données utilisateur sont séparées du dossier d'installation |
| `REGLE-DEPLOY-03` | DOIT : une sauvegarde de sécurité est faite avant migration de base |
| `REGLE-DEPLOY-04` | DOIT : la désinstallation préserve les données par défaut |
| `REGLE-DEPLOY-05` | DEVRAIT : signature de code sur Windows et macOS |

---

*Section précédente : [24 — Tests](./24-Tests.md)*
*Section suivante : [26 — Maintenance](./26-Maintenance.md)*
