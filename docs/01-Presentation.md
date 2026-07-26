# 01 — Présentation du projet

## 1.1 Nom de l'application

**Khalil Textile Manager** (KTM)

Nom court : **KTM**. Le nom interne de l'exécutable est `khalil-textile-manager.exe`.
Le nom commercial affiché dans l'interface est « Khalil Textile Manager ».

## 1.2 Vision

Devenir l'outil de référence pour la gestion quotidienne des entreprises de livraison de colis
textiles en Afrique de l'Ouest, en remplaçant les registres papier par une solution bureautique
rapide, fiable et utilisable hors-connexion, qui donne au gérant une vision claire de ses
colis, de ses clients, de ses livreurs et de sa trésorerie.

## 1.3 Objectifs

| # | Objectif | Indicateur de succès |
|---|---|---|
| O1 | Numériser la création et le suivi des colis | 100 % des colis enregistrés dans l'app |
| O2 | Réduire le temps de saisie d'un colis | < 90 secondes par colis |
| O3 | Suivre les paiements multi-canaux (espèces, Wave, Orange Money, carte, virement) | 0 écart entre app et caisse |
| O4 | Donner une vision comptable temps réel | Bénéfice du jour calculé automatiquement |
| O5 | Produire factures, reçus, bons et étiquettes QR imprimables | 1 clic pour chaque document |
| O6 | Sécuriser les données (sauvegardes, permissions, journal) | Aucune perte de données sur 1 an |
| O7 | Fonctionner sans connexion Internet | 100 % des fonctions disponibles hors-ligne |

## 1.4 Problématique

Les entreprises de livraison textile de la sous-région gèrent aujourd'hui leur activité avec des
**registres papier**, des **cahiers de relèves** et des **messages WhatsApp**. Cette organisation
présente des défauts majeurs :

- **Perte d'informations** : un cahier égaré ou une page déchirée efface l'historique d'un colis.
- **Recherche lente** : retrouver un colis non livré parmi des centaines de lignes manuscrites
  prend plusieurs minutes, voire reste impossible.
- **Erreurs de saisie** : les montants, les numéros de téléphone et les adresses sont recopiés à
  la main, source de doublons et d'erreurs.
- **Aucun suivi de paiement centralisé** : un colis peut être marqué « payé » sur le cahier du
  livreur mais rester « impayé » au bureau.
- **Comptabilité absente** : les charges (carburant, salaires livreurs, location dépôt) ne sont
  jamais rapprochées des recettes ; le bénéfice réel est inconnu.
- **Pas d'historique fiable** : il est impossible de savoir quel employé a modifié quel colis et
  quand.
- **Pas d'alertes** : les ruptures de stock, les colis en retard et les paiements en attente
  passent inaperçus.
- **Difficulté de transmission** : un nouveau gérant ne peut pas reprendre l'activité sans
  reconstituer les cahiers à la main.

Khalil Textile Manager résout ces problèmes en centralisant l'ensemble de l'activité dans une
base de données locale, avec une interface pensée pour un usage quotidien par des opérateurs
non techniciens.

## 1.5 Public cible

| Public | Description | Usage dans l'app |
|---|---|---|
| **Gérant / propriétaire** | Dirige l'entreprise de livraison textile | Tableau de bord, comptabilité, paramètres, sauvegardes |
| **Agent de comptoir** | Reçoit les colis au dépôt, crée les bordereaux | Modules Colis, Clients, Paiements |
| **Chef de livraison** | Affecte les colis aux livreurs, suit les tournées | Module Colis (affectation), Module Livreurs |
| **Livreur** | Effectue les livraisons sur le terrain (usage futur via mobile) | Aujourd'hui : consulté par le chef de livraison |
| **Comptable** | Rapproche recettes et charges | Module Comptabilité, exports |
| **Investisseur / futur repreneur** | Consulte les rapports et exports | Exports PDF/Excel, tableau de bord (lecture seule) |

L'application est conçue pour des entreprises de **1 à 50 employés** traitant de **20 à 2 000
colis par jour**.

## 1.6 Avantages

### Pour le gérant
- Vision instantanée du chiffre du jour, des colis en cours, des impayés.
- Bénéfice net calculé (recettes − charges) sans tableur.
- Sauvegardes automatiques : plus de perte de données.
- Journal d'activité : savoir qui a fait quoi et quand.
- Multi-devises et multi-moyens de paiement adaptés au contexte ouest-africain.

### Pour l'agent de comptoir
- Saisie d'un colis en moins de 90 secondes avec autocomplétion client.
- QR Code et code colis générés automatiquement pour le suivi.
- Recherche instantanée par code, téléphone, nom ou ville.
- Impression d'étiquettes, reçus et bons en un clic.

### Pour le livreur et le chef de livraison
- Liste de tournée imprimable par livreur.
- Statuts clairs : Reçu → Expédié → En livraison → Livré → (Annulé / Retourné).
- Suivi des commissions par livreur.

### Pour le comptable
- Exports Excel/CSV pour rapprochement avec la banque.
- Journal comptable (entrées/sorties) généré automatiquement.
- Rapports mensuels prêts à imprimer.

## 1.7 Limites actuelles de la gestion papier

| Limite | Conséquence chiffrée (estimation terrain) |
|---|---|
| Recherche d'un colis | 3 à 10 minutes par recherche |
| Doublons de colis | 5 à 10 % des saisies |
| Pertes de registres | 1 incident/an en moyenne |
| Calcul du bénéfice mensuel | 1 à 2 jours de travail manuel |
| Suivi des impayés | Inexistant ou approximatif |
| Formation d'un nouvel employé | 1 à 2 semaines pour maîtriser les cahiers |
| Édition d'une facture ou d'un reçu | Impossible sans logiciel externe |

Khalil Textile Manager cible une réduction de ces coûts de plus de 80 % dès le premier mois
d'utilisation.

---

*Section suivante : [02 — Analyse des besoins](./02-Analyse-besoins.md)*
