# 24 — Tests

## 24.1 Stratégie
La qualité est garantie par une stratégie de tests en pyramide :
- **Tests unitaires** (base, nombreux, rapides) : logique métier, modèles, validateurs.
- **Tests fonctionnels** (milieu) : contrôleurs + modèles ensemble, flux métier complets.
- **Tests d'interface** (sommet, moins nombreux) : interactions Qt via `pytest-qt`.
- **Tests utilisateurs** (manuel, recette) : scénarios métier bout-en-bout.

## 24.2 Outils
| Outil | Usage |
|---|---|
| `pytest` | Runner de tests |
| `pytest-qt` | Interactions avec les widgets Qt |
| `pytest-cov` | Couverture de code |
| `pytest-mock` | Mocks des dépendances |
| Base SQLite temporaire en RAM (`:memory:`) | Tests isolés, rapides |

## 24.3 Tests unitaires (`tests/unit/`)

### 24.3.1 Modèles (`test_colis_model.py`, `test_paiement_model.py`, etc.)
- `create` insère correctement et génère un code unique.
- `find_by_id` renvoie les bonnes colonnes.
- `search` respecte les filtres.
- `update` modifie les bons champs.
- `delete` (soft) positionne `supprime = 1`.
- Contraintes : téléphone unique, montant > 0, etc.
- Transactions : rollback en cas d'erreur.

### 24.3.2 Utilitaires (`test_validators.py`, `test_security.py`, `test_formatting.py`)
- Validation téléphone (formats locaux et internationaux).
- Validation email.
- Validation montants (positifs, 2 décimales).
- Hachage mots de passe (vérification correcte, refus mauvais mot de passe).
- Vérification permissions (`can(admin, 'DELETE_COLIS')` vrai, `can(employe, ...)` faux).
- Formatage montants selon devise et position symbole.

### 24.3.3 Génération QR Code (`test_qr_code.py`)
- Le QR généré contient la bonne chaîne.
- Fichier PNG valide (dimensions attendues).

## 24.4 Tests fonctionnels (`tests/functional/`)

### 24.4.1 Flux colis complet (`test_colis_flow.py`)
1. Créer un client → créer un destinataire → créer un colis.
2. Vérifier le code généré, le statut « Reçu », l'entrée historique, le journal.
3. Expédier → En livraison → Livré.
4. Vérifier l'historique complet, la commission du livreur.

### 24.4.2 Flux paiement (`test_payment_flow.py`)
1. Créer colis montant 10 000.
2. Paiement partiel 4 000 → solde 6 000, `paye = 0`.
3. Paiement 6 000 → solde 0, `paye = 1`.
4. Vérifier écritures comptables (2 entrées), journal.
5. Remboursement (admin) → écriture de sortie, solde recrédité.

### 24.4.3 Flux comptabilité (`test_compta_flow.py`)
- Saisie charge → écriture de sortie + bénéfice recalculé.
- Rapport mensuel : recettes, charges, bénéfice corrects sur la période.

### 24.4.4 Flux stock (`test_stock_flow.py`)
- Entrée → quantité augmentée.
- Sortie → quantité diminuée, alerte si sous seuil.
- Sortie > stock → refusée (sauf admin).
- Inventaire → ajustements générés.

### 24.4.5 Authentification (`test_auth_flow.py`)
- Connexion réussie → journalisation.
- 5 échecs → verrouillage 15 min.
- Récupération par question secrète.
- Permissions : employé ne peut pas supprimer un colis.

### 24.4.6 Sauvegarde / restauration (`test_backup_flow.py`)
- Sauvegarde manuelle → archive valide, intégrité OK.
- Restauration → base remplacée, données restaurées, sauvegarde pré-restore créée.

## 24.5 Tests d'interface (`tests/ui/`)

Avec `pytest-qt` :
- Ouverture de chaque écran sans erreur.
- Saisie dans les formulaires + validation → données en base.
- Filtres et tri réagissent correctement.
- Boutons désactivés selon le rôle.
- Recherche globale renvoie les bons résultats.
- Raccourcis clavier actifs.

## 24.6 Tests utilisateurs (recette)
Plan de recette (détail en annexe 28) :
- Scénarios métier réalistes (journée type d'un agent, d'un gérant, d'un comptable).
- Vérification de la conformité aux règles métier (`REGLE-*`).
- Tests de robustesse (arrêt brutal, restauration, données corrompues).
- Tests d'acceptation par l'utilisateur final (sign-off).

## 24.7 Couverture
- Cible : ≥ 80 % sur les modèles et contrôleurs.
- ≥ 60 % sur l'UI (difficile à couvrir exhaustivement).
- Rapport de couverture généré à chaque exécution (`pytest --cov=ktm --cov-report=html`).
- Le CI (si mis en place) fait échouer le build si la couverture descend sous 80 % sur les
  couches métier.

## 24.8 Tests non fonctionnels
| Test | Méthode |
|---|---|
| Performance (BNF-01..04) | Script de charge : 10 000 colis, mesure des temps |
| Sécurité | Tests d'injection (entrées malicieuses), tests de permission |
| Portabilité | Exécution sur Windows 10, macOS 12, Ubuntu 22.04 |
| Robustesse | Arrêt brutal pendant transaction, récupération |
| Sauvegarde | Restauration après crash |

## 24.9 Plan d'exécution
- À chaque commit : tests unitaires + fonctionnels (< 30 s).
- Avant chaque release : tests UI + recette utilisateur + tests non fonctionnels.
- Tests de régression : toute correction de bug génère un test qui aurait échoué avant.

---

*Section précédente : [23 — Performances](./23-Performances.md)*
*Section suivante : [25 — Déploiement](./25-Deploiement.md)*
