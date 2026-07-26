# 02 — Analyse des besoins

## 2.1 Besoins fonctionnels

Les besoins fonctionnels décrivent **ce que l'application doit faire**. Chaque besoin est
identifié par `BF-XX` et sera rattaché à un module dans les sections suivantes.

### 2.1.1 Authentification et utilisateurs
| ID | Besoin | Priorité |
|---|---|---|
| BF-01 | L'utilisateur doit pouvoir se connecter avec identifiant + mot de passe | Haute |
| BF-02 | L'utilisateur doit pouvoir se déconnecter | Haute |
| BF-03 | L'administrateur doit pouvoir créer, modifier, désactiver un compte employé | Haute |
| BF-04 | Le système doit gérer deux rôles : Administrateur, Employé | Haute |
| BF-05 | Le système doit journaliser chaque connexion et chaque action sensible | Haute |
| BF-06 | L'utilisateur doit pouvoir modifier son propre mot de passe | Moyenne |

### 2.1.2 Tableau de bord
| ID | Besoin | Priorité |
|---|---|---|
| BF-10 | Le tableau de bord doit afficher les cartes statistiques du jour (colis, clients, livreurs, paiements, bénéfice) | Haute |
| BF-11 | Le tableau de bord doit afficher des graphiques (colis/jour, revenus/jour) | Moyenne |
| BF-12 | Le tableau de bord doit afficher les alertes (stock bas, colis en retard, impayés) | Haute |
| BF-13 | Le tableau de bord doit proposer des raccourcis vers les modules principaux | Moyenne |

### 2.1.3 Module Colis
| ID | Besoin | Priorité |
|---|---|---|
| BF-20 | L'agent doit pouvoir créer un colis (expéditeur, destinataire, poids, montant, mode de paiement) | Haute |
| BF-21 | Le système doit générer automatiquement un code colis unique et un QR Code | Haute |
| BF-22 | L'agent doit pouvoir modifier un colis (selon permissions et statut) | Haute |
| BF-23 | L'agent doit pouvoir supprimer un colis (administrateur uniquement, avec journalisation) | Moyenne |
| BF-24 | L'agent doit pouvoir rechercher un colis par code, téléphone, nom, ville | Haute |
| BF-25 | L'agent doit pouvoir filtrer et trier la liste des colis (statut, date, livreur, ville) | Haute |
| BF-26 | Le système doit gérer les statuts : Reçu, Expédié, En livraison, Livré, Annulé, Retourné | Haute |
| BF-27 | Le système doit conserver l'historique des changements de statut d'un colis | Haute |
| BF-28 | L'agent doit pouvoir ajouter des commentaires et pièces jointes à un colis | Moyenne |
| BF-29 | L'agent doit pouvoir imprimer l'étiquette QR et le bordereau d'un colis | Haute |
| BF-30 | L'agent doit pouvoir exporter la liste des colis (PDF, Excel, CSV) | Haute |

### 2.1.4 Module Clients
| ID | Besoin | Priorité |
|---|---|---|
| BF-40 | L'agent doit pouvoir créer un client (nom, téléphone, ville, adresse, notes) | Haute |
| BF-41 | L'agent doit pouvoir modifier un client | Haute |
| BF-42 | L'agent doit pouvoir consulter l'historique des colis d'un client | Haute |
| BF-43 | Le système doit calculer le nombre de commandes et le montant total dépensé par client | Haute |
| BF-44 | L'agent doit pouvoir rechercher un client par nom, téléphone ou ville | Haute |

### 2.1.5 Module Destinataires
| ID | Besoin | Priorité |
|---|---|---|
| BF-50 | L'agent doit pouvoir créer un destinataire (nom, téléphone, ville, adresse, lien avec client) | Haute |
| BF-51 | L'agent doit pouvoir modifier un destinataire | Haute |
| BF-52 | L'agent doit pouvoir consulter l'historique des colis adressés à un destinataire | Haute |
| BF-53 | L'agent doit pouvoir rechercher un destinataire | Haute |

### 2.1.6 Module Livreurs
| ID | Besoin | Priorité |
|---|---|---|
| BF-60 | L'administrateur doit pouvoir créer un livreur (nom, téléphone, véhicule, zone) | Haute |
| BF-61 | L'administrateur doit pouvoir modifier un livreur et son statut de disponibilité | Haute |
| BF-62 | Le système doit calculer le nombre de livraisons et le taux de réussite par livreur | Haute |
| BF-63 | Le système doit gérer les commissions par livreur (montant fixe ou pourcentage) | Haute |
| BF-64 | L'agent doit pouvoir affecter des colis à un livreur | Haute |

### 2.1.7 Module Paiements
| ID | Besoin | Priorité |
|---|---|---|
| BF-70 | L'agent doit pouvoir enregistrer un paiement (espèces, Wave, Orange Money, carte, virement) | Haute |
| BF-71 | Le système doit gérer les paiements partiels et les paiements complets | Haute |
| BF-72 | L'agent doit pouvoir enregistrer un remboursement | Moyenne |
| BF-73 | Le système doit conserver l'historique des paiements d'un colis | Haute |
| BF-74 | L'agent doit pouvoir imprimer un reçu de paiement | Haute |

### 2.1.8 Comptabilité
| ID | Besoin | Priorité |
|---|---|---|
| BF-80 | Le système doit enregistrer automatiquement les recettes (paiements) | Haute |
| BF-81 | L'utilisateur doit pouvoir saisir des charges (carburant, salaires, loyer, autres) | Haute |
| BF-82 | Le système doit calculer le bénéfice (recettes − charges) par période | Haute |
| BF-83 | L'utilisateur doit pouvoir générer un rapport comptable (jour, semaine, mois, année) | Haute |
| BF-84 | Le système doit tenir un journal comptable | Moyenne |

### 2.1.9 Stocks
| ID | Besoin | Priorité |
|---|---|---|
| BF-90 | L'utilisateur doit pouvoir créer des articles de stock | Moyenne |
| BF-91 | L'utilisateur doit pouvoir enregistrer les entrées et sorties de stock | Moyenne |
| BF-92 | Le système doit émettre une alerte quand la quantité passe sous un seuil | Moyenne |
| BF-93 | L'utilisateur doit pouvoir lancer un inventaire | Basse |

### 2.1.10 Export, impression, sauvegarde, paramètres
| ID | Besoin | Priorité |
|---|---|---|
| BF-100 | L'utilisateur doit pouvoir exporter les données (PDF, Excel, CSV) | Haute |
| BF-101 | L'utilisateur doit pouvoir imprimer factures, reçus, bons, étiquettes | Haute |
| BF-102 | Le système doit effectuer des sauvegardes automatiques | Haute |
| BF-103 | L'utilisateur doit pouvoir lancer une sauvegarde manuelle et restaurer | Haute |
| BF-104 | L'administrateur doit pouvoir configurer l'entreprise (nom, logo, adresse, téléphone, devise, taxes) | Haute |
| BF-105 | L'administrateur doit pouvoir choisir le thème (clair/sombre, couleur accent) | Moyenne |
| BF-106 | L'administrateur doit pouvoir choisir la langue (français, anglais) | Basse |

## 2.2 Besoins non fonctionnels

Les besoins non fonctionnels décrivent **comment** l'application doit se comporter.

| ID | Catégorie | Besoin | Cible |
|---|---|---|---|
| BNF-01 | Performance | Démarrage de l'application | < 3 secondes |
| BNF-02 | Performance | Affichage d'une liste de 1 000 colis | < 1 seconde |
| BNF-03 | Performance | Recherche instantanée (frappe par frappe) | < 200 ms |
| BNF-04 | Performance | Création d'un colis (validation incluse) | < 1 seconde |
| BNF-05 | Disponibilité | Fonctionnement 100 % hors-ligne | Obligatoire |
| BNF-06 | Sécurité | Mots de passe stockés hachés (bcrypt/argon2) | Obligatoire |
| BNF-07 | Sécurité | Journalisation des actions sensibles | Obligatoire |
| BNF-08 | Sécurité | Permissions par rôle appliquées côté UI et données | Obligatoire |
| BNF-09 | Portabilité | Fonctionne sur Windows 10+, macOS 12+, Ubuntu 22.04+ | Obligatoire |
| BNF-10 | Portabilité | Données portables (fichier SQLite unique) | Obligatoire |
| BNF-11 | Ergonomie | Interface utilisable sans formation informatique | < 1 journée de prise en main |
| BNF-12 | Ergonomie | Raccourcis clavier pour les actions fréquentes | Obligatoire |
| BNF-13 | Fiabilité | Aucune perte de données sur arrêt brutal | Obligatoire (WAL SQLite) |
| BNF-14 | Fiabilité | Sauvegarde automatique quotidienne | Obligatoire |
| BNF-15 | Maintenabilité | Architecture MVC, modules découplés | Obligatoire |
| BNF-16 | Internationalisation | Code prêt pour FR/EN (gettext ou Qt tr) | Souhaitable |
| BNF-17 | Accessibilité | Contrastes conformes WCAG AA | Obligatoire |
| BNF-18 | Évolutivité | Possibilité d'ajouter une synchro cloud future | Architecture le permettant |

## 2.3 Contraintes

| ID | Contrainte | Justification |
|---|---|---|
| C-01 | Application bureautique (pas web) | Usage sur poste de comptoir, souvent hors-ligne |
| C-02 | Python 3.11+ + PySide6 + SQLite | Stack légère, gratuite, portable, maintenable |
| C-03 | Base de données locale (SQLite) | Pas de serveur à installer, fichier unique transportable |
| C-04 | Aucune dépendance à Internet | Réseau instable sur les zones d'opération |
| C-05 | Interface en français (langue principale) | Public cible ouest-africain francophone |
| C-06 | Devise par défaut : Franc CFA (XOF), multi-devises | Contexte économique local |
| C-07 | Distribution par exécutable autonome (.exe / .app / .bin) | Installation simple chez des non-techniciens |
| C-08 | Pas de télémétrie ni envoi de données externes | Confidentialité et confiance |
| C-09 | Licence open-source ou propriétaire (à définir) | Décision commerciale |
| C-10 | Taille d'installation < 100 Mo | Téléchargement sur connexions limitées |

## 2.4 Hypothèses

| ID | Hypothèse |
|---|---|
| H-01 | L'entreprise dispose d'au moins un ordinateur dédié au comptoir. |
| H-02 | L'imprimante du poste est compatible avec le système d'impression Qt (thermique ou A4). |
| H-03 | Le nombre de colis gérés ne dépasse pas 100 000 sur 5 ans (volume SQLite maîtrisable). |
| H-04 | Une seule machine gère la base à la fois (pas de concurrence multi-postes en v1). |
| H-05 | Les livreurs n'utilisent pas l'application sur le terrain en version 1 (prévu en v2 mobile). |
| H-06 | L'utilisateur administrateur initial est créé au premier lancement (assistant d'installation). |
| H-07 | La devise et les taxes sont configurables mais restent stables pendant une session. |

## 2.5 Cas d'utilisation

Chaque cas d'utilisation est noté `CU-XX` et détaillé dans le module correspondant.

### CU-01 — Créer un colis (Agent)
**Acteur** : Agent de comptoir
**Précondition** : connecté, client et destinataire connus (ou créés à la volée)
**Scénario nominal** :
1. L'agent clique sur « Nouveau colis ».
2. Saisit l'expéditeur (client) — autocomplétion depuis l'annuaire.
3. Saisit le destinataire — autocomplétion ou création rapide.
4. Saisit le poids, le contenu, la ville de destination, le montant à encaisser.
5. Choisit le mode de paiement et le livreur.
6. Valide.
7. Le système génère le code colis, le QR Code, enregistre le colis (statut « Reçu »), crée une
   entrée dans l'historique et propose l'impression de l'étiquette.
**Postcondition** : le colis existe en base, est visible dans la liste et au tableau de bord.

### CU-02 — Encaisser un paiement (Agent)
**Acteur** : Agent de comptoir
**Scénario** :
1. L'agent ouvre un colis « à encaisser ».
2. Clique sur « Encaisser ».
3. Saisit le montant (total ou partiel), le moyen de paiement, la référence (ex. ID transaction Wave).
4. Valide.
5. Le système enregistre le paiement, met à jour le solde du colis, génère une écriture comptable
   de recette, propose l'impression du reçu.

### CU-03 — Affecter une tournée (Chef de livraison)
**Acteur** : Chef de livraison
**Scénario** :
1. Filtre les colis « Expédiés » vers une ville donnée.
2. Sélectionne plusieurs colis.
3. Clique sur « Affecter au livreur » et choisit un livreur disponible.
4. Les colis passent en statut « En livraison ».
5. Impression de la liste de tournée.

### CU-04 — Clôturer une livraison (Livreur/Chef)
1. Le livreur revient, le chef ouvre la tournée.
2. Pour chaque colis : « Livré » ou « Retourné » + commentaire.
3. Le système met à jour les statistiques du livreur et calcule la commission.

### CU-05 — Consulter le tableau de bord (Gérant)
1. Le gérant se connecte en tant qu'administrateur.
2. Le tableau de bord affiche les cartes du jour et les alertes.
3. Il peut changer la période (aujourd'hui, semaine, mois, année).

### CU-06 — Saisir une charge (Comptable)
1. Le comptable ouvre le module Comptabilité.
2. Clique sur « Nouvelle charge ».
3. Saisit le libellé, le montant, la catégorie, la date.
4. Valide : une écriture de sortie est créée, le bénéfice est recalculé.

### CU-07 — Effectuer une sauvegarde (Administrateur)
1. L'administrateur ouvre Paramètres → Sauvegarde.
2. Choisit l'emplacement, clique sur « Sauvegarder maintenant ».
3. Le système compresse la base et les fichiers joints dans une archive horodatée.
4. Confirmation affichée.

### CU-08 — Restaurer une sauvegarde (Administrateur)
1. Paramètres → Sauvegarde → Restaurer.
2. Sélectionne une archive.
3. Le système vérifie l'intégrité, ferme la base courante, remplace, redémarre l'app.
4. Journal d'activité conservé.

### CU-09 — Imprimer une facture (Agent)
1. Ouvre un colis livré et payé.
2. Clique sur « Imprimer la facture ».
3. L'app génère le PDF selon le modèle paramétré et lance l'impression.

### CU-10 — Exporter les colis (Comptable)
1. Module Colis → Exporter.
2. Choisit le format (Excel/CSV/PDF), les filtres et colonnes.
3. Le fichier est généré et enregistré à l'emplacement choisi.

### CU-11 — Gérer les permissions (Administrateur)
1. Paramètres → Utilisateurs.
2. Crée un compte Employé, attribue le rôle, active/désactive.
3. Les permissions sont appliquées immédiatement à la prochaine connexion.

### CU-12 — Lancer une recherche instantanée (Tous)
1. L'utilisateur tape dans la barre de recherche globale (en-tête).
2. Le système propose colis, clients, destinataires, livreurs correspondants.
3. Un clic ouvre la fiche correspondante.

---

*Section précédente : [01 — Présentation](./01-Presentation.md)*
*Section suivante : [03 — Architecture générale](./03-Architecture-generale.md)*
