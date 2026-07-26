# 15 — Diagramme relationnel

Cette section décrit les relations entre les tables définies en section 14. Les cardinalités
utilisent la notation `1..1` (un et un seul), `0..1` (zéro ou un), `1..N` (un ou plusieurs),
`0..N` (zéro ou plusieurs).

## 15.1 Liste des relations

| Relation | Table source | Cardinalité | Table cible | Cardinalité | Clé étrangère |
|---|---|---|---|---|---|
| R1 | utilisateur | 1..1 | historique_connexion | 0..N | `historique_connexion.utilisateur_id` |
| R2 | utilisateur | 1..1 | journal_activite | 0..N | `journal_activite.utilisateur_id` |
| R3 | client | 1..1 | colis | 0..N | `colis.client_id` (RESTRICT) |
| R4 | destinataire | 1..1 | colis | 0..N | `colis.destinataire_id` (RESTRICT) |
| R5 | livreur | 1..1 | colis | 0..N | `colis.livreur_id` (SET NULL) |
| R6 | client | 1..1 | destinataire | 0..N | `destinataire.client_id` (SET NULL) |
| R7 | colis | 1..1 | historique_colis | 0..N | `historique_colis.colis_id` (CASCADE) |
| R8 | colis | 1..1 | paiement | 0..N | `paiement.colis_id` (RESTRICT) |
| R9 | colis | 1..1 | commentaire | 0..N | `commentaire.colis_id` (CASCADE) |
| R10 | colis | 1..1 | piece_jointe | 0..N | `piece_jointe.colis_id` (CASCADE) |
| R11 | colis | 1..1 | commission_livreur | 0..1 | `commission_livreur.colis_id` (RESTRICT) |
| R12 | paiement | 1..1 | ecriture_comptable | 0..1 | `ecriture_comptable.paiement_id` (SET NULL) |
| R13 | charge | 1..1 | ecriture_comptable | 0..1 | `ecriture_comptable.charge_id` (SET NULL) |
| R14 | colis | 1..1 | ecriture_comptable | 0..N | `ecriture_comptable.colis_id` (SET NULL) |
| R15 | livreur | 1..1 | commission_livreur | 0..N | `commission_livreur.livreur_id` (RESTRICT) |
| R16 | article_stock | 1..1 | mouvement_stock | 0..N | `mouvement_stock.article_id` (RESTRICT) |
| R17 | inventaire | 1..1 | ligne_inventaire | 1..N | `ligne_inventaire.inventaire_id` (CASCADE) |
| R18 | article_stock | 1..1 | ligne_inventaire | 1..N | `ligne_inventaire.article_id` (RESTRICT) |
| R19 | inventaire | 1..1 | mouvement_stock | 0..N | `mouvement_stock.inventaire_id` (SET NULL) |
| R20 | utilisateur | 1..1 | paiement | 0..N | `paiement.utilisateur_id` (SET NULL) |
| R21 | utilisateur | 1..1 | charge | 0..N | `charge.utilisateur_id` (SET NULL) |
| R22 | utilisateur | 1..1 | ecriture_comptable | 0..N | `ecriture_comptable.utilisateur_id` (SET NULL) |
| R23 | utilisateur | 1..1 | commentaire | 0..N | `commentaire.utilisateur_id` (SET NULL) |
| R24 | utilisateur | 1..1 | piece_jointe | 0..N | `piece_jointe.utilisateur_id` (SET NULL) |
| R25 | utilisateur | 1..1 | mouvement_stock | 0..N | `mouvement_stock.utilisateur_id` (SET NULL) |

## 15.2 Représentation textuelle (MCD simplifié)

```
┌──────────────┐
│  utilisateur │
└──────┬───────┘
       │ 1
       │
   ┌───┴────────────┬──────────────┬───────────────┬──────────────┐
   │0..N            │0..N          │0..N           │0..N          │0..N
   ▼                ▼              ▼               ▼              ▼
historique_     journal_        paiement       charge        ecriture_
connexion       activite                                     comptable
                                                                │0..N
                                                                │
                                                                ▼
                                                              colis ◄──┐
                                                                │0..N  │
                                              ┌─────────────────┼──────┼──────┬──────────────┐
                                              │0..N            │0..N  │0..N  │0..N          │0..1
                                              ▼                ▼      ▼      ▼              ▼
                                       historique_colis  paiement commentaire piece_jointe  commission_livreur
                                                                │0..N
                                                                ▼
                                                              ecriture_comptable
                                                                ▲0..1
                                                                │
                                                              charge

colis ──► client          (N..1)
colis ──► destinataire    (N..1)
colis ──► livreur         (N..1, optionnel)
destinataire ──► client   (N..1, optionnel)
livreur ──► commission_livreur (1..N)
article_stock ──► mouvement_stock (1..N)
inventaire ──► ligne_inventaire (1..N)
ligne_inventaire ──► article_stock (N..1)
```

## 15.3 Règles d'intégrité référentielle
| ID | Règle |
|---|---|
| `REGLE-FK-01` | DOIT : `PRAGMA foreign_keys = ON` activé à chaque connexion |
| `REGLE-FK-02` | DOIT : suppression d'un client lié à un colis interdite (RESTRICT) → soft delete |
| `REGLE-FK-03` | DOIT : suppression d'un destinataire lié à un colis interdite → soft delete |
| `REGLE-FK-04` | DOIT : suppression d'un livreur lié à un colis met `livreur_id` à NULL (SET NULL) |
| `REGLE-FK-05` | DOIT : suppression d'un colis supprime en cascade commentaires et pièces jointes |
| `REGLE-FK-06` | DOIT : suppression d'un paiement interdite (remboursement uniquement) |
| `REGLE-FK-07` | DOIT : suppression d'une écriture comptable met à NULL les références paiements/charges |

## 15.4 Cohérence transactionnelle
Certaines opérations modifient plusieurs tables simultanément et **doivent** être atomiques :

| Opération | Tables touchées | Transaction requise |
|---|---|---|
| Création colis | `colis`, `historique_colis`, `journal_activite`, `sequence` | ✔ |
| Encaissement | `paiement`, `colis.montant_paye`, `ecriture_comptable`, `journal_activite` | ✔ |
| Remboursement | `paiement.rembourse`, `colis.montant_paye`, `ecriture_comptable`, `journal_activite` | ✔ |
| Livraison | `colis.statut`, `historique_colis`, `commission_livreur`, `journal_activite` | ✔ |
| Paiement commission | `commission_livreur.payee`, `ecriture_comptable`, `journal_activite` | ✔ |
| Saisie charge | `charge`, `ecriture_comptable`, `journal_activite` | ✔ |
| Mouvement stock | `mouvement_stock`, `article_stock.quantite_actuelle`, `alerte` (si seuil), `journal_activite` | ✔ |
| Inventaire (clôture) | `inventaire`, `ligne_inventaire`, `mouvement_stock`, `article_stock` | ✔ |

L'implémentation utilise le contexte `with db.transaction():` du module `Database`.

---

*Section précédente : [14 — Base de données](./14-Base-de-donnees.md)*
*Section suivante : [16 — Structure de chaque fenêtre](./16-Structure-fenetres.md)*
