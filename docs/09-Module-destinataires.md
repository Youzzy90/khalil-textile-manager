# 09 — Module Destinataires

Le module Destinataires gère les personnes qui **reçoivent** les colis. Un destinataire peut être
lié à un client (un même expéditeur envoie souvent au même destinataire) ou indépendant.

## 9.1 Code écran
- `ECRAN-DEST-LIST`
- `ECRAN-DEST-FORM`
- `ECRAN-DEST-DETAIL`

## 9.2 Champs
| Champ | Type | Obligatoire | Validation |
|---|---|:---:|---|
| Nom complet | Texte | ✔ | Non vide |
| Téléphone | Texte | ✔ | Format téléphone |
| Ville | Sélection | ✔ | — |
| Adresse | Texte | ✔ | Non vide (nécessaire pour la livraison) |
| Client lié | Sélection | ✘ | Référence à un client (autocomplétion) |
| Notes | Texte | ✘ | — |

## 9.3 Relation avec les clients
- Un destinataire **PEUT** être lié à un client (relation N-1 : un client envoie à plusieurs
  destinataires, un destinataire peut être lié à un seul client principal).
- Si le destinataire n'est pas lié, il reste utilisable pour n'importe quel expéditeur.
- La fiche destinataire affiche la liste des clients qui lui ont déjà envoyé un colis.

## 9.4 Historique
Onglet « Colis reçus » : liste des colis adressés (code, expéditeur, date, statut, montant).

## 9.5 Recherche
Par nom, téléphone, ville, client lié.

## 9.6 Règles
| ID | Règle |
|---|---|
| `REGLE-DEST-01` | DOIT : le téléphone est unique |
| `REGLE-DEST-02` | DOIT : adresse obligatoire (livraison physique) |
| `REGLE-DEST-03` | DOIT : un destinataire lié à des colis ne peut être supprimé physiquement |

---

*Section précédente : [08 — Module Clients](./08-Module-clients.md)*
*Section suivante : [10 — Module Livreurs](./10-Module-livreurs.md)*
