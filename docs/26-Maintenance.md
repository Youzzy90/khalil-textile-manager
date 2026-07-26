# 26 — Maintenance

## 26.1 Corrections de bugs
- Toute correction est accompagnée d'un test de régression (un test qui aurait échoué avant la
  correction).
- Procédure : reproduire → diagnostiquer → corriger → tester → livrer un patch.
- Les correctifs critiques (perte de données, blocage) donnent lieu à un correctif (patch release,
  ex. `1.0.1`).

## 26.2 Évolutions
- Les évolutions fonctionnelles suivent un cycle : besoin → spécification → implémentation →
  test → documentation → release.
- Versionnement sémantique : `MAJEURE.MINEURE.CORRECTIF`.
  - MAJEURE : changements incompatibles.
  - MINEURE : nouvelles fonctionnalités rétrocompatibles.
  - CORRECTIF : corrections rétrocompatibles.
- Chaque release est accompagnée d'un `CHANGELOG.md` (annexe 28.10).

## 26.3 Support
- Niveaux de support (recommandé pour commercialisation) :
  - **N1** (gratuit, communauté) : documentation, FAQ.
  - **N2** (payant) : assistance email/téléphone, correction de bugs.
  - **N3** (payant) : intervention sur site, formation, personnalisation.
- Les tickets sont tracés dans un outil (GitHub Issues, Redmine, etc.).

## 26.4 Versioning
- Le code source est versionné avec Git.
- Branches : `main` (stable), `develop` (intégration), `feature/*`, `bugfix/*`, `release/*`.
- Tags : `v1.0.0`, `v1.0.1`, etc.
- Les releases sont archivées (binaire + code) pour permettre le retour arrière.

## 26.5 Maintenance préventive
| Action | Fréquence | Outil |
|---|---|---|
| `VACUUM` de la base | Mensuel (auto si > 100 Mo) | Paramètres → Données |
| `REINDEX` | Trimestriel | Paramètres → Données |
| Rotation des logs | Auto (10 Mo / 5 fichiers) | Configuration logger |
| Purge du journal d'activité | Selon rétention (défaut 1 an) | Admin (avec archive) |
| Vérification sauvegardes | Quotidienne (auto) | Au démarrage |
| Mise à jour dépendances | Trimestriel | `pip-audit`, mise à jour `requirements.txt` |

## 26.6 Surveillance
- Les logs (`logs/app.log`, `logs/error.log`) permettent de diagnostiquer les problèmes à
  distance (l'utilisateur peut les envoyer au support).
- L'écran Diagnostic (Paramètres → Données) fournit un instantané de santé (taille base, nombre
  de lignes, intégrité).
- Option « Envoyer un rapport de diagnostic » : génère un zip (logs + infos système + taille
  base, sans données métier) à transmettre au support.

## 26.7 Procédure de release
1. Feature freeze sur `develop`.
2. Création de la branche `release/x.y.z`.
3. Tests complets (unitaires, fonctionnels, UI, recette).
4. Mise à jour du `CHANGELOG.md` et de la version dans `pyproject.toml`.
5. Build des exécutables (Windows, macOS, Linux) via CI.
6. Tests smoke sur chaque plateforme.
7. Tag Git `vx.y.z`.
8. Publication des binaires + notes de version.
9. Fusion `release/x.y.z` → `main` et `develop`.

## 26.8 Gestion des données en maintenance
- Toute intervention sur site commence par une **sauvegarde manuelle** avant manipulation.
- Les migrations destructives (ALTER de type, DROP) sont **interdites** (voir section 22 et
  supabase_guidance pour la philosophie) ; on préfère créer une nouvelle colonne et migrer
  progressivement.
- En cas de migration risquée : double sauvegarde + test sur copie avant application.

## 26.9 Règles
| ID | Règle |
|---|---|
| `REGLE-MAINT-01` | DOIT : toute correction de bug est accompagnée d'un test de régression |
| `REGLE-MAINT-02` | DOIT : versionnement sémantique respecté |
| `REGLE-MAINT-03` | DOIT : chaque release a un CHANGELOG |
| `REGLE-MAINT-04` | DOIT : sauvegarde avant toute intervention de maintenance |
| `REGLE-MAINT-05` | NE DOIT PAS : appliquer de migration destructrice sans sauvegarde et test préalable |
| `REGLE-MAINT-06` | DEVRAIT : audits de sécurité réguliers des dépendances |

---

*Section précédente : [25 — Déploiement](./25-Deploiement.md)*
*Section suivante : [27 — Évolutions futures](./27-Evolutions-futures.md)*
