# 13 — Gestion des stocks

Le module Stocks gère les articles consommables liés à l'activité (cartons, rubans adhésifs,
étiquettes QR, sacs, registres, etc.). Il permet de suivre les quantités, d'anticiper les
ruptures et de réaliser des inventaires.

## 13.1 Code écran
- `ECRAN-STOCK-LIST` : liste des articles
- `ECRAN-STOCK-ARTICLE` : création / édition d'un article
- `ECRAN-STOCK-MOUVEMENT` : enregistrement d'une entrée ou d'une sortie
- `ECRAN-STOCK-INVENTAIRE` : lancement et saisie d'un inventaire

## 13.2 Articles (`ECRAN-STOCK-ARTICLE`)
| Champ | Type | Obligatoire | Validation |
|---|---|:---:|---|
| Référence | Texte | ✔ | Unique |
| Désignation | Texte | ✔ | Non vide |
| Catégorie | Sélection | ✘ | Emballage / Fourniture / Autre |
| Unité | Sélection | ✔ | Pièce / Kg / Litre / Rouleau / Boîte |
| Quantité actuelle | Décimal | auto | Calculée depuis les mouvements |
| Seuil d'alerte | Décimal | ✔ | ≥ 0 ; alerte si quantité ≤ seuil |
| Prix unitaire | Décimal | ✘ | Pour valorisation |
| Fournisseur | Texte | ✘ | — |
| Notes | Texte | ✘ | — |

## 13.3 Entrées / Sorties (`ECRAN-STOCK-MOUVEMENT`)

### 13.3.1 Champs
| Champ | Type | Obligatoire |
|---|---|:---:|
| Article | Sélection | ✔ |
| Type | Sélection | ✔ (Entrée / Sortie) |
| Quantité | Décimal | ✔ (> 0) |
| Date | Date/heure | ✔ |
| Motif | Texte | ✔ |
| Référence (bon) | Texte | ✘ |
| Utilisateur | auto | — |

### 13.3.2 Comportement
- **Entrée** : `quantité_actuelle += quantité` (nouveau stock réapprovisionné).
- **Sortie** : `quantité_actuelle -= quantité`. Impossible si quantité demandée > stock
  (règle `REGLE-STOCK-01`), sauf autorisation admin avec motif.
- Chaque mouvement est stocké dans `mouvement_stock` (historique immuable).
- Si après le mouvement la quantité ≤ seuil d'alerte : émission du signal `stock_low` sur
  l'EventBus → alerte au tableau de bord + notification.

## 13.4 Alertes
- Une alerte est créée (table `alerte`) quand un article passe sous le seuil.
- Affichée dans le panneau d'alertes du tableau de bord (gravité moyenne).
- Acquittable manuellement ; recréée si le stock repasse sous le seuil.
- Possibilité d'acquitter automatiquement après un réappro (entrée au-dessus du seuil).

## 13.5 Inventaire (`ECRAN-STOCK-INVENTAIRE`)
- L'administrateur lance un inventaire (date, responsable).
- Pour chaque article : saisie de la quantité **comptée physiquement**.
- Le système calcule l'écart (compté − théorique) et propose un ajustement.
- Validation de l'inventaire : crée un mouvement `ENTREE` ou `SORTIE` de type « Ajustement
  inventaire » pour chaque écart, archive la fiche d'inventaire.
- Journalisation `STOCK_INVENTORY`.

## 13.6 Règles
| ID | Règle |
|---|---|
| `REGLE-STOCK-01` | DOIT : une sortie ne peut pas rendre la quantité négative (sauf admin + motif) |
| `REGLE-STOCK-02` | DOIT : les mouvements sont immuables (pas de modification, annulation par mouvement inverse) |
| `REGLE-STOCK-03` | DOIT : seuil d'alerte obligatoire pour chaque article |
| `REGLE-STOCK-04` | DOIT : chaque inventaire génère des mouvements d'ajustement journalisés |
| `REGLE-STOCK-05` | DEVRAIT : valorisation du stock = `SUM(quantité * prix_unitaire)` |

---

*Section précédente : [12 — Comptabilité](./12-Comptabilite.md)*
*Section suivante : [14 — Base de données](./14-Base-de-donnees.md)*
