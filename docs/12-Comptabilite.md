# 12 — Comptabilité

Le module Comptabilité consolide les recettes (générées par les paiements) et les charges (saisies
manuellement) pour produire le bénéfice et les rapports financiers.

## 12.1 Code écran
- `ECRAN-COMPTA-LIST` : journal des écritures
- `ECRAN-COMPTA-CHARGE` : saisie d'une charge
- `ECRAN-COMPTA-RAPPORT` : génération de rapports

## 12.2 Entrées et sorties

Toute opération financière est enregistrée dans la table `ecriture_comptable` (voir section 14)
avec un sens :

| Sens | Origine | Catégories typiques |
|---|---|---|
| `ENTREE` (recette) | Paiements colis (automatique) | `RECETTE_LIVRAISON` |
| `ENTREE` (recette) | Vente accessoire (saisie manuelle) | `RECETTE_ACCESSOIRE` |
| `SORTIE` (charge) | Saisie manuelle | Voir 12.4 |
| `SORTIE` (charge) | Commission livreur payée (automatique) | `CHARGE_COMMISSION` |
| `SORTIE` (charge) | Remboursement (automatique) | `REMBOURSEMENT` |

## 12.3 Recettes
- **Automatiques** : à chaque paiement enregistré (module Paiements), une écriture `ENTREE` est
  créée dans la même transaction (règle `REGLE-PAY-02`).
- **Manuelles** : pour les recettes accessoires (vente d'emballages, services annexes). Bouton
  « Nouvelle recette » dans le module Comptabilité.

## 12.4 Charges

### 12.4.1 Catégories de charges
| Catégorie | Exemples |
|---|---|
| `CHARGE_CARBURANT` | Carburant livreurs |
| `CHARGE_SALAIRE` | Salaires employés |
| `CHARGE_LOYER` | Loyer du dépôt |
| `CHARGE_COMMISSION` | Commissions livreurs (auto) |
| `CHARGE_ELECTRICITE` | Électricité, eau |
| `CHARGE_TELEPHONE` | Forfaits téléphone/data |
| `CHARGE_FOURNITURE` | Fournitures bureau, registres, étiquettes |
| `CHARGE_MAINTENANCE` | Maintenance véhicule, informatique |
| `CHARGE_MARKETING` | Publicité, flyers |
| `CHARGE_AUTRE` | Autres (libellé obligatoire) |

### 12.4.2 Saisie (`ECRAN-COMPTA-CHARGE`)
| Champ | Type | Obligatoire |
|---|---|:---:|
| Date | Date | ✔ |
| Catégorie | Sélection | ✔ |
| Libellé | Texte | ✔ |
| Montant | Décimal | ✔ |
| Moyen de paiement | Sélection | ✔ |
| Bénéficiaire | Texte | ✘ |
| Justificatif (pièce jointe) | Fichier | ✘ |
| Notes | Texte | ✘ |

- Réservé à l'administrateur et au comptable (rôle dédié à venir en v2).
- Journalisation `CHARGE_CREATE`.

## 12.5 Bénéfice
- Bénéfice (période) = `SUM(ENTREES) - SUM(SORTIES)` sur la période.
- Affiché en temps réel dans le tableau de bord (carte « Bénéfice »).
- Calculable par jour, semaine, mois, année.

## 12.6 Rapports (`ECRAN-COMPTA-RAPPORT`)
| Rapport | Périmètre | Format |
|---|---|---|
| Journal comptable | Période, filtrable par catégorie | PDF, Excel |
| Compte de résultat | Période (recettes, charges par catégorie, bénéfice) | PDF |
| Rapport mensuel | Mois sélectionné, synthèse + détails | PDF |
| Rapport annuel | Année, 12 mois comparés | PDF, Excel |
| Rapport par catégorie | Une catégorie, période | Excel |

### 12.6.1 Contenu du compte de résultat
```
RECETTES
  Recettes de livraison ............... X
  Recettes accessoires ................ Y
  Total recettes ...................... X + Y

CHARGES
  Carburant ........................... a
  Salaires ............................ b
  Loyer ............................... c
  Commissions livreurs ................ d
  Électricité / eau ................... e
  Téléphone / data .................... f
  Fournitures ......................... g
  Maintenance ......................... h
  Marketing ........................... i
  Autres .............................. j
  Total charges ....................... a + ... + j

BÉNÉFICE NET ........................ Total recettes − Total charges
```

## 12.7 Journal comptable
- `ECRAN-COMPTA-LIST` : liste chronologique de toutes les écritures.
- Colonnes : date, n° écriture, sens, catégorie, libellé, montant, colis lié (si recette),
  utilisateur, justificatif.
- Filtres : plage de dates, sens, catégorie, utilisateur, recherche texte.
- Export PDF/Excel.

## 12.8 Règles
| ID | Règle |
|---|---|
| `REGLE-COMPTA-01` | DOIT : chaque paiement crée une écriture dans la même transaction SQLite |
| `REGLE-COMPTA-02` | DOIT : chaque commission payée crée une écriture de charge |
| `REGLE-COMPTA-03` | DOIT : les écritures automatiques ne sont pas modifiables (seules les manuelles le sont) |
| `REGLE-COMPTA-04` | DOIT : un justificatif peut être joint à une charge |
| `REGLE-COMPTA-05` | DOIT : suppression d'une écriture manuelle = admin + journalisation sensible |
| `REGLE-COMPTA-06` | DEVRAIT : le n° d'écriture est séquentiel et continu (jamais réutilisé) |

---

*Section précédente : [11 — Module Paiements](./11-Module-paiements.md)*
*Section suivante : [13 — Gestion des stocks](./13-Stocks.md)*
