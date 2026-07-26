# 17 — Design

## 17.1 Identité visuelle

L'application adopte une identité **moderne, premium et professionnelle**, inspirée des
tableaux de bord SaaS (type Linear, Stripe Dashboard) adaptée à un usage bureautique quotidien.

### 17.1.1 Thème principal : noir / or
Le thème par défaut est sombre (noir profond) avec un accent doré. Il évoque le sérieux, le
luxe textile et la fiabilité, tout en réduisant la fatigue oculaire lors d'un usage prolongé en
comptoir.

| Élément | Couleur (thème sombre) |
|---|---|
| Fond principal | `#0F1115` (noir bleuté) |
| Fond secondaire (cartes, panneaux) | `#1A1D24` |
| Fond de tableau (lignes alternées) | `#15181E` / `#1A1D24` |
| Bordures | `#2A2F3A` |
| Texte principal | `#F5F5F7` |
| Texte secondaire | `#A0A4AE` |
| Accent (or) | `#D4AF37` |
| Accent or clair (hover) | `#E6C75A` |
| Succès | `#3FB950` |
| Avertissement | `#E8A33D` |
| Erreur | `#F85149` |
| Info | `#58A6FF` |

### 17.1.2 Thème clair (optionnel)
| Élément | Couleur |
|---|---|
| Fond principal | `#FAFAFA` |
| Fond secondaire | `#FFFFFF` |
| Bordures | `#E1E4E8` |
| Texte principal | `#1F2328` |
| Texte secondaire | `#57606A` |
| Accent (or) | `#B8860B` |
| Succès | `#1A7F37` |
| Avertissement | `#9A6700` |
| Erreur | `#CF222E` |
| Info | `#0969DA` |

## 17.2 Système de couleurs (ramps)

Le système comporte 6 ramps + neutres, chacune avec 5 nuances.

| Ramp | 50 | 100 | 300 | 500 | 700 |
|---|---|---|---|---|---|
| primary (or) | `#FBF6E3` | `#F5EBC0` | `#E6C75A` | `#D4AF37` | `#8B6914` |
| secondary | `#E8F0FE` | `#C5D9F8` | `#7AA5F0` | `#3B82F6` | `#1E40AF` |
| accent | `#F0E6FF` | `#D9C2F5` | `#A574E0` | `#7C3AED` | `#4C1D95` |
| success | `#E6F4EA` | `#C7E9D0` | `#6FCF97` | `#3FB950` | `#1A7F37` |
| warning | `#FFF4E5` | `#FFE0B3` | `#F0B66A` | `#E8A33D` | `#9A6700` |
| error | `#FFEDED` | `#FCD5D5` | `#F87171` | `#F85149` | `#CF222E` |
| neutral | `#F5F5F7` | `#E1E4E8` | `#A0A4AE` | `#57606A` | `#1F2328` |

L'accent violet (`accent`) est utilisé **uniquement** pour les badges d'information secondaires,
jamais comme couleur principale (conformément aux préférences design : pas de violet dominant).

## 17.3 Typographie

| Rôle | Police | Poids | Taille |
|---|---|---|---|
| Titre principal (H1) | Inter | 700 | 24 px |
| Titre section (H2) | Inter | 600 | 18 px |
| Titre de carte (H3) | Inter | 600 | 14 px |
| Corps de texte | Inter | 400 | 13 px |
| Corps secondaire | Inter | 400 | 12 px |
| Étiquettes / libellés | Inter | 500 | 12 px |
| Données tabulaires | JetBrains Mono ou Inter | 400 | 12 px |
| Montants / chiffres | JetBrains Mono | 500 | 14 px (alignés à droite) |
| Code colis | JetBrains Mono | 600 | 16 px |

- Hauteur de ligne : 150 % corps, 120 % titres.
- 3 poids maximum (400, 500, 600/700).
- Les polices sont embarquées dans `assets/fonts/` si non installées sur le système, sinon
  fallback sur la police système sans empattement.

## 17.4 Thème noir/or — application
- **Arrière-plan** : noir profond `#0F1115`.
- **Cartes** : `#1A1D24` avec bordure fine `#2A2F3A`, ombre légère, coins arrondis 8 px.
- **Accent or** : boutons primaires, badges de statut actifs, code colis, en-têtes de section.
- **Boutons secondaires** : bordure or, fond transparent, texte or.
- **Boutons primaires** : fond or, texte noir (contraste élevé).
- **Tableaux** : en-têtes sur fond `#15181E`, texte or léger, séparateurs fins `#2A2F3A`.
- **Barre latérale** : fond `#0B0D11` (légèrement plus sombre), icônes or au survol, item actif
  avec liseré or à gauche.
- **Barre de statut** : fond `#0B0D11`, texte secondaire.

## 17.5 Responsive et densité

L'application est pensée pour des écrans de **1280×720 à 1920×1080** (et au-delà). La fenêtre est
redimensionnable ; la disposition s'adapte :

| Largeur | Comportement |
|---|---|
| ≥ 1440 px | Panneau de filtres visible, tableaux complets |
| 1024–1439 px | Panneau de filtres repliable, colonnes secondaires masquées |
| < 1024 px | Panneau de filtres en drawer, navigation en icônes seules, tableaux scrollables |

Densité réglable dans Paramètres → Apparence : « Confortable » (défaut) ou « Compacte ».

## 17.6 Animations et micro-interactions

| Élément | Animation |
|---|---|
| Boutons | Fondu de fond au survol (150 ms), léger scale au clic (95 %, 100 ms) |
| Cartes statistiques | Apparition en cascade (stagger 80 ms) à l'ouverture du tableau de bord |
| Changement de valeur | Comptage animé (de l'ancienne à la nouvelle valeur, 400 ms) |
| Badges de statut | Pulse léger sur les statuts actifs (En livraison) |
| Onglets | Glissement du contenu (200 ms) |
| Notifications (toasts) | Glissement depuis la droite + fondu, 300 ms |
| Boîtes de dialogue | Fondu + léger scale (95 % → 100 %), 200 ms |
| Chargement de liste | Spinner or centré, 600 ms max avant affichage |
| Lignes de tableau | Surlignage or au survol, 100 ms |
| Panneau d'alertes | Icône pulse rouge pour les alertes hautes |

Les animations respectent `prefers-reduced-motion` (désactivables dans Paramètres → Apparence).

## 17.7 Icônes
- Bibliothèque : SVG sur mesure ou jeu type Lucide/Feather (linear, 1.5 px stroke).
- Couleur : héritée du texte (currentcolor), or pour les actions principales.
- Tailles : 16 px (barres), 20 px (barre latérale), 24 px (cartes), 32 px (raccourcis tableau de
  bord).
- Stockées dans `assets/icons/`, référencées via `theme/icons.py`.

## 17.8 Badges de statut
| Statut | Couleur de fond | Couleur texte | Icône |
|---|---|---|---|
| Reçu | info 100 | info 700 | `icon-inbox` |
| Expédié | warning 100 | warning 700 | `icon-truck` |
| En livraison | accent 100 | accent 700 | `icon-route` |
| Livré | success 100 | success 700 | `icon-check` |
| Retourné | error 100 | error 700 | `icon-rotate` |
| Annulé | neutral 200 | neutral 700 | `icon-x` |
| Payé | success 100 | success 700 | `icon-cash` |
| Impayé | error 100 | error 700 | `icon-clock` |

## 17.9 Contraste et accessibilité
- Tous les textes respectent un ratio de contraste ≥ 4.5:1 (WCAG AA) sur leur fond.
- Le texte noir sur bouton or `#D4AF37` : ratio ~9:1 (conforme AAA).
- Le texte secondaire `#A0A4AE` sur `#0F1115` : ratio ~7:1 (conforme).
- Focus clavier visible : contour or de 2 px sur tout contrôle focusable.
- Tailles de texte minimum 12 px (aucun texte en dessous).

---

*Section précédente : [16 — Structure de chaque fenêtre](./16-Structure-fenetres.md)*
*Section suivante : [18 — Export](./18-Export.md)*
