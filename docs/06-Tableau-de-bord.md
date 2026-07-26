# 06 — Tableau de bord

## 6.1 Rôle

Le tableau de bord est l'écran d'accueil après connexion. Il offre une **vision synthétique et
temps réel** de l'activité de l'entreprise : indicateurs clés, graphiques, alertes et raccourcis
vers les actions courantes. Il doit permettre au gérant de savoir en moins de 10 secondes si la
journée se passe bien.

## 6.2 Code écran
`ECRAN-DASHBOARD-01` (voir section 16 pour la structure détaillée).

## 6.3 Cartes statistiques

Six cartes en haut de l'écran, rafraîchies à l'ouverture et sur signaux `EventBus`
(`colis_created`, `payment_recorded`, `charge_added`).

| Carte | Donnée affichée | Calcul | Icône |
|---|---|---|---|
| Colis du jour | Nombre + variation vs hier | `COUNT(colis) WHERE date_reception = aujourd'hui` | Boîte |
| Clients | Nombre total + nouveaux du jour | `COUNT(clients)` + `WHERE date_creation = aujourd'hui` | Utilisateur |
| Livreurs | Nombre actifs + en tournée | `COUNT(livreurs WHERE actif)` + en livraison | Camion |
| Paiements | Montant encaissé du jour (tous moyens) | `SUM(paiements WHERE date = aujourd'hui)` | Billet |
| Bénéfice | Recettes − charges du jour | `SUM(recettes) - SUM(charges) WHERE date = aujourd'hui` | Graphique |
| Colis en cours | Nombre non livrés | `COUNT(colis WHERE statut IN ('Reçu','Expédié','En livraison'))` | Horloge |

### 6.3.1 Comportement des cartes
- Variation vs la veille affichée en badge (vert si positif, rouge si négatif).
- Clic sur une carte ouvre le module filtré correspondant (ex. clic sur « Colis du jour » ouvre
  la liste des colis créés aujourd'hui).
- Les montants sont formatés avec la devise configurée (XOF par défaut).
- Les couleurs s'adaptent au thème (voir section 17).

## 6.4 Graphiques

Deux graphiques principaux, implémentés avec `QtCharts`.

### 6.4.1 Graphique « Colis par jour » (7 derniers jours)
- Type : barres verticales.
- Axe X : 7 derniers jours (libellés en date courte).
- Axe Y : nombre de colis.
- Couleur : or (couleur accent du thème).
- Légende : « Colis créés ».
- Interaction : survol d'une barre affiche la valeur exacte.

### 6.4.2 Graphique « Revenus par jour » (7 derniers jours)
- Type : courbe (ligne).
- Axe X : 7 derniers jours.
- Axe Y : montant encaissé.
- Couleur : vert (success).
- Interaction : survol d'un point affiche le montant.

### 6.4.3 Période ajustable
Un sélecteur en haut du tableau de bord permet de basculer entre : Aujourd'hui, 7 jours, 30 jours,
Mois en cours, Année en cours. Les cartes et graphiques s'adaptent.

## 6.5 Alertes

Panneau latéral droit listant les alertes prioritaires, triées par gravité.

| Alerte | Déclenchement | Gravité |
|---|---|---|
| Stock bas | Quantité article < seuil défini | Moyenne |
| Colis en retard | Colis « En livraison » depuis > 48 h (configurable) | Haute |
| Paiement partiel en attente | Colis livré avec solde > 0 depuis > 7 jours | Haute |
| Sauvegarde manquante | Dernière sauvegarde > 48 h | Moyenne |
| Compte verrouillé | Un compte est temporairement verrouillé | Basse |
| Espace disque faible | Espace disque < 1 Go | Basse |

### 6.5.1 Comportement
- Chaque alerte est cliquable et ouvre le contexte correspondant (ex. liste des colis en retard).
- Bouton « Acquitter » pour les alertes moyennes/basses (disparaît de la liste, journalisée).
- Les alertes hautes ne peuvent pas être acquittées tant que la cause persiste.
- Badge numérique sur l'icône du panneau d'alertes indique le nombre d'alertes non lues.

## 6.6 Notifications

Zone temporaire (toasts) en bas à droite lors d'événements :
- Nouveau colis créé (confirmation).
- Paiement encaissé (montant).
- Sauvegarde automatique terminée.
- Alerte de stock (si survient pendant la session).

Les notifications disparaissent après 5 secondes (configurable), cliquables pour ouvrir le
contexte. Historique consultable via l'icône cloche (liste des 50 dernières).

## 6.7 Raccourcis

Barre de raccourcis en bas du tableau de bord (grandes tuiles cliquables) :

| Raccourci | Action | Raccourci clavier |
|---|---|---|
| Nouveau colis | Ouvre le formulaire colis | `Ctrl+N` |
| Nouveau client | Ouvre le formulaire client | `Ctrl+Shift+C` |
| Encaisser | Ouvre la boîte de paiement rapide | `Ctrl+Shift+P` |
| Liste de tournée | Ouvre l'affectation livreur | `Ctrl+Shift+T` |
| Export du jour | Export Excel des colis du jour | `Ctrl+Shift+E` |
| Sauvegarder | Lance une sauvegarde manuelle (admin) | `Ctrl+Shift+B` |

## 6.8 Droits d'accès
- Consultation : Administrateur et Employé.
- Les cartes « Bénéfice » et « Charges » sont masquées pour l'Employé (permissions comptables).

## 6.9 Règles
| ID | Règle |
|---|---|
| `REGLE-DASH-01` | DOIT : le tableau de bord se recharge à l'ouverture et sur signaux métier |
| `REGLE-DASH-02` | DOIT : les montants respectent la devise et le format configurés |
| `REGLE-DASH-03` | DEVRAIT : les compteurs utilisent un cache de 60 s pour limiter les requêtes |
| `REGLE-DASH-04` | NE DOIT PAS : afficher des données d'autres entreprises (mono-entreprise en v1) |
| `REGLE-DASH-05` | DOIT : les alertes hautes restent visibles jusqu'à résolution |

---

*Section précédente : [05 — Gestion des utilisateurs](./05-Utilisateurs.md)*
*Section suivante : [07 — Module Colis](./07-Module-colis.md)*
