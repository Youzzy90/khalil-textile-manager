# 16 — Structure de chaque fenêtre

Cette section décrit, pour chaque écran de l'application, les éléments qui le composent : menus,
barres d'outils, champs, boutons, icônes, tableaux, raccourcis clavier. Les codes écran sont
référencés depuis les modules (sections 5 à 13).

## 16.1 Conventions de description

Chaque écran est décrit par :
- **Code** : `ECRAN-XXX-NN`
- **Titre** affiché dans la barre de titre
- **Accès** : menu / raccourci / bouton d'origine
- **Barre d'outils** : actions principales
- **Champs / contrôles** : liste tabulaire
- **Tableau** : colonnes, tri, largeurs (si applicable)
- **Raccourcis clavier** : combinaisons actives
- **Droits** : rôles autorisés

Icônes : toutes proviennent du jeu `assets/icons/` (SVG). Référence par nom logique
(ex. `icon-package`, `icon-search`).

## 16.2 Fenêtre principale (`ECRAN-MAIN`)

**Titre** : « Khalil Textile Manager — [nom entreprise] »
**Accès** : après connexion réussie.

### Barre de menus
| Menu | Items |
|---|---|
| **Fichier** | Nouveau colis (`Ctrl+N`), Nouveau client (`Ctrl+Shift+C`), Encaisser (`Ctrl+Shift+P`), Exporter (`Ctrl+Shift+E`), Sauvegarder (`Ctrl+Shift+B`, admin), Imprimer (`Ctrl+P`), Déconnexion (`Ctrl+Shift+L`), Quitter (`Ctrl+Q`) |
| **Édition** | Annuler (`Ctrl+Z`), Refaire (`Ctrl+Y`), Rechercher (`Ctrl+F`) |
| **Affichage** | Tableau de bord, Colis, Clients, Destinataires, Livreurs, Paiements, Comptabilité, Stocks, Plein écran (`F11`) |
| **Outils** | Sauvegarde, Restauration, Journal d'activité, Paramètres (admin) |
| **Aide** | À propos, Raccourcis clavier (`F1`), Documentation |

### Barre d'outils (en haut, sous le menu)
| Bouton | Icône | Action | Raccourci |
|---|---|---|---|
| Nouveau colis | `icon-package-plus` | Ouvre `ECRAN-COLIS-FORM` | `Ctrl+N` |
| Nouveau client | `icon-user-plus` | Ouvre `ECRAN-CLIENT-FORM` | `Ctrl+Shift+C` |
| Encaisser | `icon-cash` | Ouvre `ECRAN-PAIEMENT-FORM` | `Ctrl+Shift+P` |
| Exporter | `icon-download` | Export de la vue courante | `Ctrl+Shift+E` |
| Imprimer | `icon-printer` | Impression du contexte courant | `Ctrl+P` |
| Sauvegarder | `icon-save` | Sauvegarde manuelle (admin) | `Ctrl+Shift+B` |

### Barre de recherche globale
En haut à droite. Champ texte + bouton. Placeholder : « Rechercher colis, client, livreur… ».
Raccourci `Ctrl+F` place le focus. Résultats en menu déroulant (5 par catégorie).

### Barre latérale gauche (navigation)
Liste des modules avec icône + libellé :
- Tableau de bord (`icon-dashboard`)
- Colis (`icon-package`)
- Clients (`icon-users`)
- Destinataires (`icon-map-pin`)
- Livreurs (`icon-truck`)
- Paiements (`icon-cash`)
- Comptabilité (`icon-chart`) — admin
- Stocks (`icon-box`)
- Utilisateurs (`icon-shield`) — admin
- Paramètres (`icon-settings`) — admin

### Zone centrale
Onglets : chaque module ouvert s'affiche dans un onglet. Fermeture par croix. Raccourci
`Ctrl+W` ferme l'onglet courant.

### Barre de statut (en bas)
- Utilisateur connecté (nom + rôle)
- Connexion base : « Base connectée » / icône verte
- Dernière sauvegarde : date/heure
- Notifications : icône cloche avec badge

## 16.3 `ECRAN-LOGIN-01` — Connexion
Voir section 5.2.2. Champs : identifiant, mot de passe + cases. Bouton « Se connecter ».
Raccourci : `Entrée` valide, `Échap` efface.

## 16.4 `ECRAN-DASHBOARD-01` — Tableau de bord
Voir section 6. Six cartes statistiques (clic → module filtré), deux graphiques, panneau
d'alertes (droite), raccourcis (bas), notifications (toasts).

Raccourcis :
- `Ctrl+1` à `Ctrl+9` : bascule vers le module N de la barre latérale
- `F5` : rafraîchir

## 16.5 `ECRAN-COLIS-LIST` — Liste des colis
**Accès** : barre latérale / `Ctrl+2`.

### Barre d'outils locale
| Bouton | Action | Droit |
|---|---|---|
| Nouveau | `ECRAN-COLIS-FORM` | Admin, Employé |
| Modifier | `ECRAN-COLIS-FORM` (édition) | Admin, Employé |
| Détail | `ECRAN-COLIS-DETAIL` | Tous |
| Supprimer | Soft delete | Admin |
| Expédier | Statut → Expédié | Admin, Employé |
| Affecter | `ECRAN-COLIS-AFFECTATION` | Admin, Employé |
| Exporter | Export liste filtrée | Tous |
| Imprimer étiquettes | Etiquettes QR sélection | Tous |
| Rafraîchir | Recharge | Tous |

### Panneau de filtres (gauche)
Voir section 7.6. Boutons « Appliquer », « Réinitialiser ».

### Tableau
Voir section 7.16 pour les colonnes.
- Sélection multiple : `Ctrl+clic`, `Shift+clic`.
- Sélection totale : `Ctrl+A`.
- Clic droit : menu contextuel (Modifier, Détail, Expédier, Affecter, Imprimer étiquette,
  Historique, Supprimer).
- Double-clic sur une ligne : ouvre `ECRAN-COLIS-DETAIL`.

### Raccourcis
| Touche | Action |
|---|---|
| `Ctrl+N` | Nouveau |
| `Entrée` | Détail du colis sélectionné |
| `Suppr` | Supprimer (admin, confirmation) |
| `Ctrl+F` | Focus sur la recherche de la liste |
| `Ctrl+E` | Exporter |
| `Ctrl+P` | Imprimer étiquettes sélection |

## 16.6 `ECRAN-COLIS-FORM` — Création / édition colis
**Accès** : bouton « Nouveau » / « Modifier » / `Ctrl+N`.

### Sections
1. **Expéditeur** : sélecteur autocomplétion client + bouton « + Nouveau client » (ouvre
   `ECRAN-CLIENT-FORM` en dialogue).
2. **Destinataire** : sélecteur autocomplétion destinataire + bouton « + Nouveau destinataire ».
3. **Colis** : contenu, poids, valeur déclarée, priorité, fragile.
4. **Livraison** : ville, adresse, livreur (optionnel).
5. **Paiement** : montant, mode attendu.
6. **Notes**.

### Boutons bas
| Bouton | Action | Raccourci |
|---|---|---|
| Valider | Enregistre + propose impression | `Ctrl+Entrée` |
| Annuler | Ferme sans enregistrer | `Échap` |
| Imprimer après validation | Coche | — |

### Raccourcis
- `Tab` / `Shift+Tab` : navigation entre champs.
- `Ctrl+Entrée` : valider.
- `Échap` : annuler.

## 16.7 `ECRAN-COLIS-DETAIL` — Fiche détail colis
**Accès** : double-clic liste / bouton « Détail ».

### En-tête
- Code colis (grand, or)
- Badge statut
- QR Code (vignette cliquable → plein écran / impression)

### Barre d'actions (contextuelle au statut)
| Bouton | Visible si statut |
|---|---|
| Expédier | Reçu |
| Affecter / Mettre en livraison | Expédié |
| Marquer livré / Retourné | En livraison |
| Relivrer | Retourné (admin) |
| Annuler | Reçu / Expédié |
| Encaisser | Tous sauf Annulé |
| Imprimer étiquette | Tous |
| Imprimer bordereau | Tous |
| Imprimer facture | Payé |
| Modifier | Non Livré/Annulé |
| Supprimer (admin) | Tous |

### Onglets
1. **Infos** : tous les champs du colis (lecture seule en consultation).
2. **Historique** : tableau chronologique (date, utilisateur, action, statut précédent →
   nouveau, détails).
3. **Paiements** : liste des paiements (n° reçu, date, montant, moyen, référence), bouton
   « Encaisser » si solde > 0.
4. **Commentaires** : liste + champ d'ajout.
5. **Pièces jointes** : liste + bouton « Ajouter » + aperçu.

## 16.8 `ECRAN-COLIS-AFFECTATION` — Affectation tournée
**Accès** : depuis liste colis (sélection multiple) ou module Livreurs.

### Champs
- Livreur (sélection, seulement Actif)
- Date de tournée (défaut aujourd'hui)
- Liste des colis sélectionnés (tableau : code, destinataire, ville, montant)

### Boutons
- « Confirmer l'affectation » : statut → En livraison, `livreur_id` renseigné.
- « Imprimer la tournée » : liste PDF pour le livreur.
- « Annuler ».

## 16.9 `ECRAN-CLIENT-LIST` — Liste clients
**Accès** : barre latérale / `Ctrl+3`.

### Barre d'outils
Nouveau, Modifier, Désactiver (admin), Exporter, Rafraîchir.

### Tableau
| Colonne | Source | Tri |
|---|---|:---:|
| Nom | client.nom_complet | ✔ |
| Téléphone | client.telephone | ✔ |
| Ville | client.ville | ✔ |
| Type | badge | ✔ |
| Commandes | COUNT(colis) | ✔ |
| Total dépensé | SUM(montant) | ✔ |
| Date création | client.date_creation | ✔ |

### Filtres
Ville, type, recherche texte.

### Raccourcis
`Ctrl+N` (nouveau), `Ctrl+E` (export), `Entrée` (détail).

## 16.10 `ECRAN-CLIENT-FORM` — Création / édition client
Champs section 8.2.1. Boutons Valider / Annuler. Raccourcis `Ctrl+Entrée`, `Échap`.

## 16.11 `ECRAN-CLIENT-DETAIL` — Fiche client
Onglets : Infos, Colis, Paiements, Statistiques.

## 16.12 `ECRAN-DEST-LIST`, `ECRAN-DEST-FORM`, `ECRAN-DEST-DETAIL`
Structure identique au module Clients, adaptée aux champs destinataire (section 9).

## 16.13 `ECRAN-LIVREUR-LIST`, `ECRAN-LIVREUR-FORM`, `ECRAN-LIVREUR-DETAIL`
Liste similaire. Détail avec onglets Infos, Colis, Performance (graphique + statistiques),
Commissions.

## 16.14 `ECRAN-PAIEMENT-LIST` — Historique des paiements
**Accès** : barre latérale / `Ctrl+6`.

### Tableau
| Colonne | Source | Tri |
|---|---|:---:|
| N° reçu | paiement.numero_recu | ✔ |
| Date | paiement.date_paiement | ✔ |
| Colis | colis.code | ✔ |
| Client | client.nom_complet | ✔ |
| Montant | paiement.montant | ✔ |
| Moyen | badge | ✔ |
| Référence | paiement.reference | ✔ |
| Utilisateur | utilisateur.nom_complet | ✔ |
| Remboursé | badge | ✔ |

### Filtres
Plage de dates, moyen, utilisateur, remboursé, recherche par n° reçu ou code colis.

### Boutons
Exporter, Imprimer reçu (sélection), Détail colis.

## 16.15 `ECRAN-PAIEMENT-FORM` — Encaissement (dialogue modal)
Champs section 11.3.1. Boutons Valider / Annuler. Case « Imprimer le reçu » (défaut cochée).

## 16.16 `ECRAN-COMPTA-LIST` — Journal comptable
**Accès** : barre latérale / `Ctrl+7` (admin).

### Tableau
| Colonne | Source |
|---|---|
| N° écriture | ecriture_comptable.numero |
| Date | ecriture_comptable.date_ecriture |
| Sens | badge ENTREE/SORTIE |
| Catégorie | ecriture_comptable.categorie |
| Libellé | ecriture_comptable.libelle |
| Montant | ecriture_comptable.montant |
| Colis lié | colis.code (si recette) |
| Utilisateur | utilisateur.nom_complet |

### Filtres
Plage, sens, catégorie, utilisateur, recherche texte.

### Boutons
Nouvelle charge (`ECRAN-COMPTA-CHARGE`), Nouvelle recette accessoire, Rapports
(`ECRAN-COMPTA-RAPPORT`), Exporter.

## 16.17 `ECRAN-COMPTA-CHARGE` — Saisie charge (dialogue)
Champs section 12.4.2.

## 16.18 `ECRAN-COMPTA-RAPPORT` — Rapports
Sélecteur de type (journal, compte de résultat, mensuel, annuel, par catégorie), période,
bouton « Générer PDF », « Générer Excel ».

## 16.19 `ECRAN-STOCK-LIST` — Liste articles
**Accès** : barre latérale / `Ctrl+8`.

### Tableau
| Colonne | Source |
|---|---|
| Référence | article_stock.reference |
| Désignation | article_stock.designation |
| Catégorie | article_stock.categorie |
| Unité | article_stock.unite |
| Quantité | article_stock.quantite_actuelle (badge rouge si ≤ seuil) |
| Seuil | article_stock.seuil_alerte |
| Prix unitaire | article_stock.prix_unitaire |
| Valeur | quantité × prix |

### Boutons
Nouveau, Modifier, Entrée (`ECRAN-STOCK-MOUVEMENT` type Entrée), Sortie (idem), Inventaire
(`ECRAN-STOCK-INVENTAIRE`), Exporter.

## 16.20 `ECRAN-STOCK-MOUVEMENT` — Mouvement (dialogue)
Champs section 13.3.1.

## 16.21 `ECRAN-STOCK-INVENTAIRE` — Inventaire
- Bouton « Démarrer un inventaire ».
- Tableau des articles avec colonnes : théorique, comptée (saisie), écart (auto).
- Bouton « Clôturer » (admin) : génère les mouvements d'ajustement.

## 16.22 `ECRAN-USER-LIST` — Liste utilisateurs (admin)
**Accès** : barre latérale / `Ctrl+9` (admin).

### Tableau
| Colonne | Source |
|---|---|
| Identifiant | utilisateur.identifiant |
| Nom | utilisateur.nom_complet |
| Rôle | badge ADMIN/EMPLOYE |
| Téléphone | utilisateur.telephone |
| Actif | badge |
| Dernière connexion | utilisateur.derniere_connexion |

### Boutons
Nouveau (`ECRAN-USER-FORM`), Modifier, Désactiver/Activer, Réinitialiser mot de passe,
Historique (`ECRAN-USER-HISTORIQUE`), Journal (`ECRAN-JOURNAL`).

## 16.23 `ECRAN-USER-FORM` — Création / édition utilisateur
Champs : identifiant, nom complet, rôle, téléphone, email, mot de passe (création / réinitialisation),
question/réponse secrète, photo, actif.

## 16.24 `ECRAN-USER-PROFIL` — Mon profil
Accessible via menu Fichier ou clic sur l'utilisateur dans la barre de statut. Édition limitée à
ses propres infos + changement de mot de passe.

## 16.25 `ECRAN-USER-HISTORIQUE` — Historique connexions
Tableau de `historique_connexion` filtrable.

## 16.26 `ECRAN-JOURNAL` — Journal d'activité (admin)
Tableau de `journal_activite` filtrable (catégorie, utilisateur, date, recherche texte). Export
PDF/Excel.

## 16.27 `ECRAN-SETTINGS` — Paramètres (admin)
Onglets (voir section 21) : Entreprise, Apparence, Sauvegarde, Sécurité, Impression, Données.

## 16.28 `ECRAN-BACKUP` — Sauvegarde / restauration (dialogue)
Voir section 20.

## 16.29 Raccourcis clavier globaux
| Raccourci | Action |
|---|---|
| `Ctrl+N` | Nouveau colis |
| `Ctrl+Shift+C` | Nouveau client |
| `Ctrl+Shift+P` | Encaisser |
| `Ctrl+Shift+T` | Affecter tournée |
| `Ctrl+Shift+E` | Exporter vue courante |
| `Ctrl+Shift+B` | Sauvegarder (admin) |
| `Ctrl+P` | Imprimer |
| `Ctrl+F` | Recherche globale |
| `Ctrl+W` | Fermer onglet |
| `Ctrl+Q` | Quitter |
| `Ctrl+Shift+L` | Déconnexion |
| `Ctrl+1..9` | Module N |
| `F1` | Aide |
| `F5` | Rafraîchir |
| `F11` | Plein écran |
| `Échap` | Fermer dialogue / annuler |

---

*Section précédente : [15 — Diagramme relationnel](./15-Diagramme-relationnel.md)*
*Section suivante : [17 — Design](./17-Design.md)*
