# 08 — Module Clients

Le module Clients gère l'annuaire des **expéditeurs** (clients qui déposent les colis au dépôt).

## 8.1 Code écran
- `ECRAN-CLIENT-LIST` : liste + recherche
- `ECRAN-CLIENT-FORM` : création / édition
- `ECRAN-CLIENT-DETAIL` : fiche détaillée avec historique des colis

## 8.2 Création / modification (`ECRAN-CLIENT-FORM`)

### 8.2.1 Champs
| Champ | Type | Obligatoire | Validation |
|---|---|:---:|---|
| Nom complet | Texte | ✔ | Non vide, max 120 |
| Téléphone | Texte | ✔ | Format téléphone (validateur local/international) |
| Téléphone secondaire | Texte | ✘ | — |
| Email | Texte | ✘ | Format email si renseigné |
| Ville | Sélection | ✔ | Liste configurable |
| Adresse | Texte | ✘ | — |
| Type | Sélection | ✔ | Particulier / Entreprise |
| Notes | Texte | ✘ | — |
| Date de création | Date/heure | auto | — |

### 8.2.2 Règles
| ID | Règle |
|---|---|
| `REGLE-CLIENT-01` | DOIT : le téléphone est unique (deux clients ne peuvent partager le même numéro principal) |
| `REGLE-CLIENT-02` | DEVRAIT : autocomplétion par téléphone lors de la saisie d'un colis (évite les doublons) |
| `REGLE-CLIENT-03` | DOIT : un client lié à au moins un colis ne peut être supprimé (soft delete seulement) |
| `REGLE-CLIENT-04` | DOIT : toute modification est journalisée |

## 8.3 Recherche
- Recherche instantanée par nom, téléphone, ville (depuis la barre du module).
- Accès aussi via la recherche globale (en-tête).

## 8.4 Fiche détaillée (`ECRAN-CLIENT-DETAIL`)
Onglets :
1. **Infos** : coordonnées, type, notes.
2. **Colis** : liste des colis envoyés par ce client (code, date, destinataire, statut, montant).
3. **Paiements** : historique des paiements effectués par ce client.
4. **Statistiques** : voir 8.5.

## 8.5 Statistiques affichées
| Indicateur | Calcul |
|---|---|
| Nombre de commandes | `COUNT(colis WHERE client_id = ?)` |
| Montant total dépensé | `SUM(colis.montant) WHERE client_id = ?` |
| Solde dû | `SUM(colis.montant - paye)` pour les colis non soldés |
| Dernière commande | `MAX(colis.date_reception) WHERE client_id = ?` |
| Ville principale | `MODE(colis.ville_destination)` |
| Panier moyen | `AVG(colis.montant) WHERE client_id = ?` |

## 8.6 Suppression
- Soft delete (colonne `supprime`).
- Interdite si colis liés : proposer « Désactiver » (le client n'apparaît plus dans les
  autocomplétions mais reste dans l'historique).
- Admin uniquement.

---

*Section précédente : [07 — Module Colis](./07-Module-colis.md)*
*Section suivante : [09 — Module Destinataires](./09-Module-destinataires.md)*
