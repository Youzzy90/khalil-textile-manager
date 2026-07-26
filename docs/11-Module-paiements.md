# 11 — Module Paiements

Le module Paiements enregistre tout encaissement lié à un colis et tient l'historique des
règlements. Il alimente automatiquement la comptabilité (recettes).

## 11.1 Moyens de paiement
| Code | Moyen | Champ référence attendu | Notes |
|---|---|---|---|
| `ESPECES` | Espèces | — | Le plus courant au comptoir |
| `WAVE` | Wave | ID transaction | Mobile money Sénégal/Afrique de l'Ouest |
| `ORANGE_MONEY` | Orange Money | ID transaction | Mobile money |
| `CARTE` | Carte bancaire | N° autorisation | TPE |
| `VIREMENT` | Virement bancaire | N° virement / IBAN | Pour les clients entreprise |
| `PORT_PAYE` | Port payé (avance) | — | Payé à la création, avant livraison |
| `A_LIVRAISON` | Paiement à la livraison | — | Payé par le destinataire à réception |

## 11.2 Code écran
- `ECRAN-PAIEMENT-LIST` : historique global des paiements
- `ECRAN-PAIEMENT-FORM` (dialogue modal) : enregistrement d'un paiement sur un colis
- `ECRAN-PAIEMENT-REMBOURSEMENT` : enregistrement d'un remboursement

## 11.3 Enregistrement d'un paiement (`ECRAN-PAIEMENT-FORM`)

### 11.3.1 Champs
| Champ | Type | Obligatoire | Validation |
|---|---|:---:|---|
| Colis | Affiché (lecture seule) | — | Contexte |
| Solde actuel | Affiché | — | Calculé |
| Montant payé | Décimal | ✔ | > 0 et ≤ solde |
| Moyen de paiement | Sélection | ✔ | Voir 11.1 |
| Référence | Texte | conditionnel | Obligatoire pour Wave/Orange/Carte/Virement |
| Date/heure | Date/heure | ✔ | Défaut = maintenant |
| Reçu à imprimer | Booléen | ✘ | Défaut = oui |

### 11.3.2 Comportement
1. L'agent saisit le montant. Le système affiche le nouveau solde en temps réel.
2. Validation : le paiement est inséré, le solde du colis est recalculé, une écriture comptable
   de recette est créée (catégorie `RECETTE_LIVRAISON`), le journal d'activité est mis à jour.
3. Si le solde devient 0 : le colis passe en statut `paye = TRUE` (drapeau), un badge « Payé »
   s'affiche dans la liste des colis.
4. Impression du reçu proposée automatiquement (si case cochée).

## 11.4 Paiement partiel / paiement complet
- **Paiement partiel** : montant < solde. Le solde reste > 0. Le colis n'est pas marqué « payé ».
  Plusieurs paiements partiels sont possibles et cumulés dans `paiement` (table).
- **Paiement complet** : montant = solde. Le colis est soldé. Badge « Payé » activé.
- Le total payé = `SUM(paiements WHERE colis_id = ?)`.

## 11.5 Remboursement
- Réservé à l'administrateur.
- Cas : colis annulé après paiement, colis retourné après paiement, erreur de saisie.
- Flux : sélection du paiement concerné → « Rembourser » → saisie du montant et du motif →
  validation.
- Le remboursement crée une écriture comptable de **sortie** (catégorie `REMBOURSEMENT`) et
  recrédite le solde du colis.
- Journalisation `PAYMENT_REFUND` (sensible).

## 11.6 Historique des paiements
- `ECRAN-PAIEMENT-LIST` : liste globale filtrable par date, moyen, utilisateur, colis, montant.
- Onglet « Paiements » dans la fiche colis : liste des paiements de ce colis uniquement.
- Onglet « Paiements » dans la fiche client : liste des paiements de ses colis.

## 11.7 Reçu de paiement
Document imprimable (voir section 19) :
- En-tête entreprise (logo, nom, adresse, téléphone)
- N° de reçu (unique, format `REC-YYMMDD-NNNNN`)
- Date et heure
- Code colis + nom destinataire
- Montant payé + moyen de paiement + référence
- Solde restant éventuel
- Signature / cachet

## 11.8 Règles
| ID | Règle |
|---|---|
| `REGLE-PAY-01` | DOIT : un paiement ne peut dépasser le solde dû |
| `REGLE-PAY-02` | DOIT : chaque paiement génère une écriture comptable de recette dans la même transaction |
| `REGLE-PAY-03` | DOIT : la référence est obligatoire pour les moyens électroniques |
| `REGLE-PAY-04` | DOIT : un remboursement génère une écriture de sortie et recrédite le solde |
| `REGLE-PAY-05` | DOIT : les paiements d'un colis Livré restent modifiables (admin) mais avec journalisation |
| `REGLE-PAY-06` | NE DOIT PAS : supprimer un paiement (remboursement uniquement) |
| `REGLE-PAY-07` | DEVRAIT : les paiements à la livraison (`A_LIVRAISON`) sont enregistrés au retour du livreur |

---

*Section précédente : [10 — Module Livreurs](./10-Module-livreurs.md)*
*Section suivante : [12 — Comptabilité](./12-Comptabilite.md)*
