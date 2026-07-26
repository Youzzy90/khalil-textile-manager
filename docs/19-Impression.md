# 19 — Impression

Le module Impression produit des documents physiques via l'imprimante configurée. Il s'appuie
sur `QPrinter` (Qt) qui supporte imprimantes thermiques et A4, locales ou réseau.

## 19.1 Types de documents

| Document | Format papier | Déclencheur |
|---|---|---|
| Facture | A4 portrait | Fiche colis (si payé) |
| Reçu de paiement | A5 portrait ou thermique 80 mm | Boîte de paiement |
| Bon de livraison | A4 portrait | Fiche colis / tournée |
| Étiquette QR | Thermique 100×50 mm ou A4 multicolonnes | Fiche colis / liste |
| Liste de tournée | A4 portrait | Affectation livreur |
| Bordereau d'expédition | A4 portrait | Fiche colis |
| Rapport comptable | A4 portrait | Module Comptabilité |

## 19.2 Facture

### 19.2.1 Contenu
- **En-tête** : logo, nom + adresse + téléphone entreprise (depuis Paramètres).
- **Titre** : « FACTURE » + numéro de facture (`FAC-YYMMDD-NNNNN`).
- **Date d'émission**, date de paiement.
- **Client** : nom, téléphone, ville, adresse.
- **Destinataire** : nom, téléphone, ville, adresse.
- **Détail** : code colis, contenu, poids, ville destination, priorité.
- **Montants** : montant colis, total payé, solde éventuel.
- **Pied** : conditions, signature/cachet, mentions légales (option).
- **QR Code** : en bas à droite (lien vers la fiche colis).

### 19.2.2 Règles
| ID | Règle |
|---|---|
| `REGLE-FACT-01` | DOIT : numéro de facture unique et séquentiel |
| `REGLE-FACT-02` | DOIT : la facture n'est disponible que si le colis est soldé (paye = 1) |
| `REGLE-FACT-03` | DOIT : les infos entreprise proviennent des Paramètres |
| `REGLE-FACT-04` | DOIT : génération d'une entrée `facture` (table optionnelle) pour traçabilité |

## 19.3 Reçu de paiement
### 19.3.1 Contenu
- En-tête entreprise.
- Titre « REÇU DE PAIEMENT » + numéro (`REC-YYMMDD-NNNNN`).
- Date/heure, code colis, destinataire.
- Montant payé + moyen + référence.
- Solde restant.
- Signature.

### 19.3.2 Variantes
- Format A5 pour imprimante A4.
- Format thermique 80 mm pour imprimante de caisse (sans marges).

## 19.4 Bon de livraison
- En-tête entreprise.
- Titre « BON DE LIVRAISON » + code colis.
- Expéditeur, destinataire, adresse.
- Contenu, poids, nombre de pièces.
- Case « Reçu le ____ » + signature destinataire.
- QR Code de validation.

## 19.5 Étiquette QR
### 19.5.1 Format thermique 100×50 mm
- QR Code centré (80 % de la hauteur).
- Code colis au-dessus (police monospace 14 pt).
- Destinataire + ville en dessous (10 pt).
- Logo entreprise réduit (option).

### 19.5.2 Format A4 multicolonnes
- Grille configurable (par défaut 3 colonnes × 8 lignes = 24 étiquettes).
- Mêmes infos par étiquette.
- Pratique pour imprimer une série de colis en une fois.

## 19.6 Liste de tournée
- En-tête entreprise.
- Titre « TOURNÉE — [livreur] — [date] ».
- Tableau : code colis, destinataire, téléphone, adresse, ville, montant à encaisser (si
  paiement à la livraison).
- Totaux en bas : nombre de colis, montant total à encaisser.
- Pied : signature du livreur + cachet.

## 19.7 Bordereau d'expédition
Document récapitulatif pour le transport (entre dépôts). Contient :
- Expéditeur, destinataire, contenu, poids, valeur déclarée.
- QR Code de suivi.
- Mention « Fragile » si applicable.
- Cases de validation par étape (Reçu, Expédié, Livré) avec date/initials.

## 19.8 Boîte de dialogue d'impression
Toute action d'impression ouvre le dialogue standard Qt (`QPrintDialog`) :
- Choix de l'imprimante.
- Nombre de copies.
- Orientation (portrait/paysage) si modifiable.
- Aperçu (`QPrintPreviewDialog`) avant impression — recommandé.
- Bouton « Imprimer » / « Annuler ».

Un bouton « Aperçu » est toujours proposé avant l'impression finale.

## 19.9 Paramètres d'impression (voir section 21)
- Imprimante par défaut (sélecteur).
- Format d'étiquette par défaut (thermique / A4).
- Inclure le logo (oui/non).
- Inclure les mentions légales (oui/non, texte configurable).
- Marges personnalisables (avancé).

## 19.10 Règles
| ID | Règle |
|---|---|
| `REGLE-PRINT-01` | DOIT : un aperçu est disponible avant toute impression |
| `REGLE-PRINT-02` | DOIT : chaque impression d'un document financier (facture, reçu) est journalisée |
| `REGLE-PRINT-03` | DOIT : le logo et les infos entreprise sont repris des Paramètres |
| `REGLE-PRINT-04` | DEVRAIT : mémoriser la dernière imprimante utilisée |
| `REGLE-PRINT-05` | DOIT : les étiquettes thermiques s'impriment sans marges blanches |

---

*Section précédente : [18 — Export](./18-Export.md)*
*Section suivante : [20 — Sauvegarde](./20-Sauvegarde.md)*
