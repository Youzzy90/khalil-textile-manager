# 20 — Sauvegarde

## 20.1 Objectif
Garantir qu'aucune donnée ne soit perdue en cas d'arrêt brutal, de panne matérielle ou d'erreur
humaine. La stratégie combine sauvegardes automatiques, manuelles, compression, vérification et
restauration.

## 20.2 Sauvegarde automatique

### 20.2.1 Déclenchement
- À la première ouverture de l'application du jour, si la dernière sauvegarde date de plus de
  24 h (configurable : 12 h / 24 h / 7 jours).
- À la fermeture de l'application (si paramètre activé, défaut non).
- Fréquence configurable dans Paramètres → Sauvegarde.

### 20.2.2 Contenu
- `database/ktm.db` (base SQLite, avec un `VACUUM INTO` pour produire un fichier propre et
  compact).
- Dossier `attachments/` (pièces jointes des colis).
- `config/company.json` (infos entreprise).
- Manifeste JSON listant la version de l'app, la date, le nombre de colis, la taille.

### 20.2.3 Format et emplacement
- Archive `.zip` (compression standard).
- Nom : `ktm_backup_YYYYMMDD_HHMM.zip`.
- Emplacement par défaut : `backups/` (configurable).

### 20.2.4 Rétention
- Les N dernières sauvegardes sont conservées (N configurable, défaut 10).
- Les plus anciennes sont supprimées automatiquement (avec journalisation).
- Option « Conserver une sauvegarde par semaine pendant 3 mois » (archive à long terme).

## 20.3 Sauvegarde manuelle
- `ECRAN-BACKUP` (dialogue) ou Paramètres → Sauvegarde → « Sauvegarder maintenant ».
- L'utilisateur choisit l'emplacement (par défaut `backups/`).
- Le système produit l'archive, vérifie l'intégrité, affiche un récapitulatif (taille, nombre de
  colis inclus, durée).
- Réservé à l'administrateur.

## 20.4 Compression
- Algorithme : ZIP deflate (niveau 6, bon ratio / vitesse).
- Taille typique : base SQLite de 100 000 colis ≈ 30–60 Mo, archive ≈ 10–20 Mo.
- Pour les très grosses bases : option « Compression maximale » (niveau 9, plus lent).

## 20.5 Vérification d'intégrité
Après chaque sauvegarde :
1. Lecture du zip (vérifie que l'archive n'est pas corrompue).
2. Extraction temporaire de `ktm.db`.
3. Exécution de `PRAGMA integrity_check;` et `PRAGMA foreign_key_check;`.
4. Si OK : archive conservée + entrée dans `journal_activite` (`BACKUP_AUTO` ou `BACKUP_MANUAL`).
5. Si échec : archive supprimée, alerte affichée, journalisation `BACKUP_FAILED`.

## 20.6 Restauration
- `ECRAN-BACKUP` (dialogue) ou Paramètres → Sauvegarde → « Restaurer ».
- Réservé à l'administrateur.

### 20.6.1 Procédure
1. Sélection de l'archive (parcourt `backups/` ou choix d'un fichier externe).
2. Vérification d'intégrité (zip + `PRAGMA integrity_check`).
3. Lecture du manifeste (version, date, nombre de colis) → récapitulatif.
4. Confirmation obligatoire avec saisie du mot de passe administrateur.
5. Fermeture propre de la base courante (commit des journaux, fermeture connexion).
6. Sauvegarde de sécurité de la base courante (avant remplacement, nom
   `ktm_pre_restore_YYYYMMDD_HHMM.zip`).
7. Remplacement de `ktm.db` et de `attachments/`.
8. Redémarrage de l'application (nouvelle session, reconnexion requise).
9. Journalisation `BACKUP_RESTORE` avec détails.

### 20.6.2 Règles
| ID | Règle |
|---|---|
| `REGLE-RESTORE-01` | DOIT : une sauvegarde de sécurité est faite avant toute restauration |
| `REGLE-RESTORE-02` | DOIT : la restauration nécessite une confirmation par mot de passe |
| `REGLE-RESTORE-03` | DOIT : l'intégrité de l'archive est vérifiée avant restauration |
| `REGLE-RESTORE-04` | DOIT : l'événement est journalisé avec date, utilisateur, archive source |
| `REGLE-RESTORE-05` | NE DOIT PAS : permettre la restauration pendant qu'une saisie est en cours (vérification sessions actives) |

## 20.7 Sauvegarde externe (recommandation)
L'application **PEUT** proposer un export manuel vers une clé USB ou un disque externe (boîte de
dialogue standard de sélection de dossier). Aucune synchro cloud automatique en v1 (prévue v3).

## 20.8 Interface (`ECRAN-BACKUP`)
| Élément | Description |
|---|---|
| Liste des sauvegardes | Tableau : nom, date, taille, type (Auto/Manuelle), statut intégrité |
| Bouton « Sauvegarder maintenant » | Lance une sauvegarde manuelle |
| Bouton « Restaurer » | Ouvre le dialogue de restauration sur la sélection |
| Bouton « Exporter vers… » | Copie l'archive sélectionnée vers un emplacement externe |
| Bouton « Supprimer » | Supprime une sauvegarde (admin, confirmation) |
| Panneau « Configuration » | Fréquence auto, emplacement, rétention, compression |
| Indicateur « Dernière sauvegarde » | Date/heure + taille, badge vert/rouge selon fraîcheur |

## 20.9 Récupération après crash
Si l'application détecte au démarrage que la fermeture précédente était anormale (présence d'un
fichier `ktm.lock` résiduel) :
1. Exécution de `PRAGMA integrity_check` sur la base.
2. Si OK : ouverture normale + notification « Récupération réussie ».
3. Si KO : proposition de restauration de la dernière sauvegarde valide.
4. Le mode WAL de SQLite garantit la cohérence même en cas de coupure (journal WAL rejoué).

---

*Section précédente : [19 — Impression](./19-Impression.md)*
*Section suivante : [21 — Paramètres](./21-Parametres.md)*
