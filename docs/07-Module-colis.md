# 07 — Module Colis

Le module Colis est le cœur de l'application. Il gère le cycle de vie complet d'un colis, depuis
sa réception au dépôt jusqu'à sa livraison (ou son retour/annulation).

## 7.1 Cycle de vie d'un colis

```
        ┌────────┐
        │  Reçu  │  ← Création au comptoir
        └───┬────┘
            │ Expédition
            ▼
        ┌──────────┐
        │ Expédié  │  ← Affecté à une tournée
        └───┬──────┘
            │ Mise en livraison
            ▼
     ┌──────────────┐
     │ En livraison │  ← Pris en charge par le livreur
     └──┬───────┬───┘
        │       │
   Livré│       │ Retour
        ▼       ▼
   ┌──────┐  ┌───────────┐
   │Livré │  │ Retourné  │
   └──────┘  └───────────┘

   Annulation possible depuis Reçu / Expédié → statut « Annulé » (terminal)
```

### 7.1.1 Statuts
| Statut | Code | Description | Transitions autorisées |
|---|---|---|---|
| Reçu | `RECU` | Colis enregistré au dépôt | → Expédié, Annulé |
| Expédié | `EXPEDIE` | Affecté à une tournée (pas encore parti) | → En livraison, Annulé |
| En livraison | `EN_LIVRAISON` | Pris en charge par le livreur | → Livré, Retourné |
| Livré | `LIVRE` | Remis au destinataire (terminal) | — |
| Retourné | `RETOURNE` | Refusé ou destinataire absent (terminal) | → Reçu (relivraison possible) |
| Annulé | `ANNULE` | Annulé avant livraison (terminal) | — |

### 7.1.2 Règles de transition (`REGLE-COLIS-TRANS-XX`)
| ID | Règle |
|---|---|
| `REGLE-COLIS-TRANS-01` | DOIT : toute transition hors cycle (ex. Livré → En livraison) est interdite |
| `REGLE-COLIS-TRANS-02` | DOIT : un colis Livré ne peut plus être modifié (verrouillage) |
| `REGLE-COLIS-TRANS-03` | DOIT : un colis Annulé libère la référence (code non réutilisable, mais le solde est remboursé si payé d'avance) |
| `REGLE-COLIS-TRANS-04` | DOIT : chaque changement de statut crée une entrée dans `historique_colis` (date, utilisateur, statut précédent, nouveau statut) |
| `REGLE-COLIS-TRANS-05` | DEVRAIT : un colis Retourné peut être remis en cycle via « Relivrer » (retour à Reçu) |

## 7.2 Création d'un colis (`ECRAN-COLIS-FORM`)

### 7.2.1 Champs de saisie
| Champ | Type | Obligatoire | Validation |
|---|---|:---:|---|
| Expéditeur (client) | Sélection autocomplétion | ✔ | Doit exister en base (création rapide possible) |
| Destinataire | Sélection autocomplétion | ✔ | Doit exister (création rapide possible) |
| Contenu / description | Texte | ✔ | Non vide |
| Poids (kg) | Décimal | ✔ | > 0, 2 décimales |
| Valeur déclarée | Décimal | ✘ | ≥ 0 (devise) |
| Ville de destination | Sélection | ✔ | Issue d'une liste configurable |
| Adresse de livraison | Texte | ✔ | Non vide |
| Montant à encaisser | Décimal | ✔ | ≥ 0 (port + marchandise, selon config) |
| Mode de paiement attendu | Sélection | ✔ | Espèces / Wave / Orange Money / Carte / Virement / À la livraison |
| Livreur | Sélection | ✘ | Peut être affecté plus tard |
| Date de réception | Date/heure | ✔ | Défaut = maintenant |
| Priorité | Sélection | ✘ | Normale / Express (surcoût configurable) |
| Fragile | Booléen | ✘ | — |
| Notes internes | Texte | ✘ | — |

### 7.2.2 Génération automatique
À la validation :
- **Code colis** : format configurable, par défaut `KTM-YYMMDD-NNNNN` (ex. `KTM-260726-00042`).
  Le compteur est quotidien et stocké en base (séquence). Un code est **unique** et **immuable**.
- **QR Code** : encode le code colis et un identifiant de suivi ; généré en PNG via
  `utils/qr_code.py`, stocké dans `attachments/` et référencé en base.
- **Statut initial** : `RECU`.
- **Historique** : entrée initiale dans `historique_colis`.
- **Journal d'activité** : `COLIS_CREATE` avec `cible_id`.

### 7.2.3 Règles
| ID | Règle |
|---|---|
| `REGLE-COLIS-CREATE-01` | DOIT : code colis unique, généré atomiquement (verrou sur le compteur) |
| `REGLE-COLIS-CREATE-02` | DOIT : QR Code généré et lié au colis à la création |
| `REGLE-COLIS-CREATE-03` | DOIT : expéditeur et destinataire distincts (interdiction d'auto-envoi) |
| `REGLE-COLIS-CREATE-04` | DEVRAIT : si priorité Express, un surcoût est ajouté au montant (configurable) |
| `REGLE-COLIS-CREATE-05` | DOIT : la création est journalisée avec l'utilisateur actif |

## 7.3 Modification (`ECRAN-COLIS-FORM` en édition)
- Champs modifiables : description, poids, valeur, adresse, livreur, priorité, fragile, notes.
- Champs **non modifiables** : code colis, expéditeur/destinataire (sauf admin), montant déjà
  encaissé, statut (via le workflow dédié).
- Règle `REGLE-COLIS-EDIT-01` : un colis Livré ou Annulé ne peut plus être modifié (sauf admin
  pour correction, avec journalisation « sensible »).

## 7.4 Suppression
- Réservée à l'administrateur.
- **Soft delete** recommandé (colonne `supprime` + `date_suppression`), pas de suppression
  physique pour préserver l'historique comptable et le journal.
- Confirmation obligatoire avec saisie du code colis pour éviter les erreurs.
- Journalisation `COLIS_DELETE` avec détails complets avant suppression.
- Règle `REGLE-COLIS-DEL-01` : NE DOIT PAS supprimer un colis lié à un paiement sans supprimer
  d'abord le paiement (ou le rembourser).

## 7.5 Recherche

### 7.5.1 Barre de recherche globale
En en-tête de l'application (`search_bar.py`). Recherche instantanée (BNF-03) sur :
- Code colis
- Numéro de téléphone (expéditeur ou destinataire)
- Nom (expéditeur ou destinataire)
- Ville de destination

Résultats groupés par type (Colis / Client / Destinataire / Livreur), 5 par groupe, cliquables.

### 7.5.2 Recherche dans la liste des colis
Champ au-dessus du tableau : filtre en temps réel sur les colonnes affichées.

## 7.6 Filtres

Panneau latéral gauche (`filter_panel.py`) :

| Filtre | Type | Valeurs |
|---|---|---|
| Statut | Multi-sélection | Reçu, Expédié, En livraison, Livré, Retourné, Annulé |
| Date de réception | Plage | Du / Au (calendrier) |
| Ville | Multi-sélection | Liste configurable |
| Livreur | Sélection | Tous / un livreur / Non affecté |
| Expéditeur | Sélection | Tous / un client |
| Mode de paiement | Multi-sélection | — |
| Priorité | Sélection | Toutes / Normale / Express |
| Montant | Plage | Min / Max |

Boutons « Appliquer », « Réinitialiser ». Filtres mémorisés par utilisateur (préférences).

## 7.7 Tri
- Clic sur l'en-tête de colonne trie ascendant/descendant.
- Tri par défaut : date de réception descendant (plus récent en haut).
- Tri multicritère via `Ctrl+clic` (implémentation Qt standard).

## 7.8 Statuts et workflow
Voir 7.1. Les actions de changement de statut sont accessibles :
- Depuis la fiche détail du colis (boutons contextuels selon le statut courant).
- Depuis la liste (sélection multiple + action groupée : Expédier, Mettre en livraison,
  Marquer livré/retourné).

## 7.9 Historique d'un colis
Affiché dans la fiche détail (`ECRAN-COLIS-DETAIL`), onglet « Historique » :
- Date/heure, utilisateur, action (création, modification, changement de statut, paiement,
  commentaire), détails (avant/après).
- Chronologie descendante.
- Export PDF possible (annexe à la facture).

## 7.10 QR Code et code colis
- QR Code affiché dans la fiche et imprimable sur étiquette (voir section 19).
- Le QR Code encode une chaîne configurable : par défaut
  `KTM|<code_colis>|<telephone_destinataire>`.
- Un scanner QR future (v2 mobile) pourra décoder cette chaîne pour ouvrir directement le colis.

## 7.11 Impression
Depuis la fiche détail ou la liste :
- **Étiquette QR** : format thermique 100×50 mm ou A4 multicolonnes (configurable).
- **Bordereau d'expédition** : A4, contient expéditeur, destinataire, contenu, montant, QR Code.
- **Facture** : si le colis est payé (voir section 19).
- **Reçu de paiement** : si paiement enregistré (voir section 19).
- **Bon de livraison** : pour la tournée du livreur.

## 7.12 Export
Depuis la liste, bouton « Exporter » :
- Formats : PDF, Excel, CSV.
- Périmètre : liste filtrée courante ou sélection manuelle.
- Colonnes : configurables (sélecteur de colonnes avant export).
- Voir section 18 pour le détail.

## 7.13 Réception / Expédition / Livraison / Annulation
Actions groupées et individuelles accessibles selon le statut :

| Action | Statut source | Statut cible | Droit |
|---|---|---|---|
| Créer | — | Reçu | Admin, Employé |
| Expédier | Reçu | Expédié | Admin, Employé |
| Mettre en livraison | Expédié | En livraison | Admin, Employé (affectation livreur) |
| Marquer livré | En livraison | Livré | Admin, Employé |
| Marquer retourné | En livraison | Retourné | Admin, Employé |
| Relivrer | Retourné | Reçu | Admin |
| Annuler | Reçu / Expédié | Annulé | Admin ( Employé avec motif obligatoire) |
| Supprimer | Tous (soft) | — | Admin |

Chaque action ouvre un dialogue de confirmation (avec motif pour annulation et retour).

## 7.14 Commentaires
- Onglet « Commentaires » dans la fiche détail.
- Champ texte + bouton « Ajouter ». Horodaté, signé (utilisateur).
- Visible par tous les utilisateurs ayant accès au colis.
- Édition limitée à l'auteur dans les 15 minutes (règle `REGLE-COLIS-COMMENT-01`).

## 7.15 Pièces jointes
- Onglet « Pièces jointes » dans la fiche détail.
- Bouton « Ajouter » : ouvre un sélecteur de fichiers (images, PDF, max 5 Mo par fichier).
- Stockage : fichier dans `attachments/<code_colis>/`, chemin stocké en base.
- Aperçu image intégré, ouverture PDF via application externe.
- Suppression réservée à l'auteur ou à l'admin.

## 7.16 Colonnes de la liste (`ECRAN-COLIS-LIST`)
| Colonne | Source | Tri | Largeur défaut |
|---|---|:---:|---|
| Code colis | colis.code | ✔ | 140 |
| Statut | badge | ✔ | 110 |
| Expéditeur | client.nom | ✔ | 150 |
| Destinataire | destinataire.nom | ✔ | 150 |
| Ville | colis.ville_destination | ✔ | 120 |
| Montant | colis.montant | ✔ | 100 |
| Payé | solde == 0 | ✔ | 80 |
| Livreur | livreur.nom | ✔ | 120 |
| Date réception | colis.date_reception | ✔ | 140 |
| Priorité | badge | ✔ | 90 |

## 7.17 Écrans liés
- `ECRAN-COLIS-LIST` : liste + filtres + recherche
- `ECRAN-COLIS-FORM` : création / édition
- `ECRAN-COLIS-DETAIL` : fiche détail avec onglets (Infos, Historique, Paiements, Commentaires, Pièces jointes)
- `ECRAN-COLIS-AFFECTATION` : affectation groupée à un livreur

---

*Section précédente : [06 — Tableau de bord](./06-Tableau-de-bord.md)*
*Section suivante : [08 — Module Clients](./08-Module-clients.md)*
