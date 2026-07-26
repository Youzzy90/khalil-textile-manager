# 22 — Sécurité

## 22.1 Authentification
- Identifiant + mot de passe (section 5).
- Mots de passe **hachés** avec bcrypt (coût 12) ou argon2id (préféré si disponible). Jamais
  stockés en clair, jamais en mémoire après hachage.
- Verrouillage temporaire après 5 échecs (15 min).
- Question/réponse secrète pour récupération (réponse hachée également).
- Session expire après 30 min d'inactivité (configurable).
- Au moins un administrateur doit exister en permanence (`REGLE-PERM-01`).

## 22.2 Permissions
- Deux rôles (Admin / Employé) avec matrice de permissions (section 5.5.2).
- Vérification **double** : côté UI (masquage/désactivation) **et** côté contrôleur
  (`security.can(user, action)`). La vérification côté contrôleur est la barrière effective.
- Toute action sensible est précédée d'une vérification de permission ; en cas de refus,
  `KTMPermissionError` est levée et journalisée.

## 22.3 Journalisation
Voir section 5.7. Toutes les actions sensibles sont journalisées :
- Authentification (réussite, échec, verrouillage, récupération).
- Création / modification / suppression de données.
- Paiements, remboursements, charges.
- Sauvegardes et restaurations.
- Exports et impressions de documents financiers.
- Changements de paramètres.
- Changements de rôle utilisateur.

Le journal est consultable par l'administrateur, exportable, et conservé 1 an par défaut.

## 22.4 Chiffrement
| Donnée | Protection |
|---|---|
| Mots de passe | bcrypt / argon2id (hachage) |
| Réponses secrètes | Hachage (même algorithme) |
| Base SQLite | Non chiffrée en v1 (fichier local, mono-poste) |
| Sauvegardes | Non chiffrées en v1 ; option chiffrement ZIP prévue (v1.1) |
| Photos / pièces jointes | Stockées en clair dans `attachments/` |

### 22.4.1 Évolution prévue (v1.1)
- Chiffrement de la base SQLite via SQLCipher (extension) ou chiffrement applicatif des champs
  sensibles (téléphones, adresses) avec une clé dérivée du mot de passe administrateur.
- Chiffrement des archives de sauvegarde (mot de passe optionnel).

## 22.5 Sauvegardes
Voir section 20. Les sauvegardes garantissent la résilience :
- Automatiques quotidiennes.
- Vérification d'intégrité.
- Sauvegarde de sécurité avant restauration.
- Mode WAL SQLite pour résistance aux arrêts brutaux.

## 22.6 Protection contre les erreurs
| Risque | Protection |
|---|---|
| Saisie invalide | Validateurs (téléphone, montant, email) avant validation |
| Suppression accidentelle | Soft delete + confirmation par saisie du code |
| Modification d'un colis livré | Verrouillage (sauf admin + journalisation) |
| Paiement > solde | Validation côté contrôleur + UI |
| Stock négatif | Blocage (sauf admin + motif) |
| Conflit de concurrence | Mono-poste en v1 (pas de verrous multiples) ; transactions SQLite |
| Arrêt brutal | Mode WAL + récupération au démarrage (section 20.9) |
| Corruption base | `PRAGMA integrity_check` au démarrage + sauvegardes |

## 22.7 Protection de la base
- `PRAGMA foreign_keys = ON` : intégrité référentielle.
- `PRAGMA journal_mode = WAL` : résistance aux crashes.
- `PRAGMA synchronous = NORMAL` : bon compromis performance / sécurité.
- Transactions pour toutes les opérations multi-tables (section 15.4).
- Requêtes paramétrées (`?` placeholders) : aucune concaténation de SQL → pas d'injection.

## 22.8 Protection des fichiers
- Pièces jointes : stockées dans `attachments/<code_colis>/`, non exécutables (extension
  vérifiée, types autorisés : images, PDF).
- Taille limite : 5 Mo par fichier (configurable).
- Logs : rotation automatique (max 10 Mo par fichier, 5 fichiers conservés).

## 22.9 Règles de sécurité
| ID | Règle |
|---|---|
| `REGLE-SEC-01` | DOIT : mots de passe hachés (jamais en clair, jamais loggés) |
| `REGLE-SEC-02` | DOIT : requêtes SQL paramétrées (pas d'injection) |
| `REGLE-SEC-03` | DOIT : permissions vérifiées côté contrôleur, pas seulement UI |
| `REGLE-SEC-04` | DOIT : actions sensibles journalisées avec utilisateur + cible |
| `REGLE-SEC-05` | DOIT : mode WAL activé pour résister aux arrêts brutaux |
| `REGLE-SEC-06` | DOIT : validation des entrées utilisateur aux frontières du système |
| `REGLE-SEC-07` | NE DOIT PAS : afficher de stack trace brute à l'utilisateur |
| `REGLE-SEC-08` | NE DOIT PAS : permettre la suppression physique de données liées |
| `REGLE-SEC-09` | DEVRAIT : chiffrer la base en v1.1 |
| `REGLE-SEC-10` | DEVRAIT : proposer le chiffrement des sauvegardes |

---

*Section précédente : [21 — Paramètres](./21-Parametres.md)*
*Section suivante : [23 — Performances](./23-Performances.md)*
