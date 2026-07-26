# 10 — Module Livreurs

Le module Livreurs gère les livreurs, leur disponibilité, leurs performances et leurs
commissions.

## 10.1 Code écran
- `ECRAN-LIVREUR-LIST`
- `ECRAN-LIVREUR-FORM`
- `ECRAN-LIVREUR-DETAIL`

## 10.2 Champs
| Champ | Type | Obligatoire | Validation |
|---|---|:---:|---|
| Nom complet | Texte | ✔ | Non vide |
| Téléphone | Texte | ✔ | Format téléphone |
| Type de véhicule | Sélection | ✔ | Moto / Voiture / Camion / Vélo / À pied |
| Plaque / immatriculation | Texte | ✘ | — |
| Zone principale | Sélection (multi) | ✘ | Villes desservies |
| Statut | Sélection | ✔ | Actif / Inactif / En congé |
| Date d'embauche | Date | ✘ | — |
| Type de commission | Sélection | ✔ | Fixe par colis / Pourcentage / Aucune |
| Valeur commission | Décimal | ✔ | Montant ou % selon le type |
| Photo | Image | ✘ | Stockée en base (binaire) |
| Notes | Texte | ✘ | — |

## 10.3 Disponibilité
- Statut **Actif** : peut se voir affecter des tournées.
- Statut **Inactif / En congé** : n'apparaît pas dans le sélecteur d'affectation ; ses tournées
  en cours restent visibles.
- L'administrateur peut changer le statut à tout moment.

## 10.4 Statistiques (`ECRAN-LIVREUR-DETAIL`)
| Indicateur | Calcul |
|---|---|
| Nombre de livraisons totales | `COUNT(colis WHERE livreur_id = ? AND statut = 'LIVRE')` |
| Livraisons du mois | Idem, période courante |
| Taux de réussite | `Livrés / (Livrés + Retournés)` |
| Colis en cours | `COUNT(colis WHERE livreur_id = ? AND statut = 'EN_LIVRAISON')` |
| Commission due (mois) | `SUM(commission) WHERE date_livraison dans le mois` |
| Délai moyen de livraison | `AVG(date_livraison - date_en_livraison)` |

## 10.5 Performance
- Un onglet « Performance » affiche un graphique (livraisons par jour, 30 jours) et un tableau des
  derniers colis avec leur durée de livraison.
- Comparaison avec la moyenne de l'équipe (anonyme).
- Badge couleur : vert (au-dessus de la moyenne), orange (dans la moyenne), rouge (en dessous).

## 10.6 Commission
- Calculée automatiquement à chaque livraison marquée « Livré » :
  - Type **Fixe** : `valeur_commission` ajoutée à `commission_due`.
  - Type **Pourcentage** : `colis.montant * valeur / 100`.
  - Type **Aucune** : aucune commission.
- Enregistrée dans une table `commission_livreur` (date, colis_id, montant, payée).
- Le paiement des commissions au livreur est tracé (bouton « Payer commissions » qui solde les
  commissions dues et crée une écriture comptable de charge).

## 10.7 Affectation des colis (`ECRAN-COLIS-AFFECTATION`)
- Accessible depuis le module Colis (sélection multiple) ou le module Livreurs (sélection d'un
  livreur puis choix des colis).
- Filtre par ville/zone pour suggérer les colis correspondant à la zone du livreur.
- À l'affectation : statut `Expédié` → `En livraison`, `livreur_id` renseigné, entrée
  `historique_colis`.

## 10.8 Règles
| ID | Règle |
|---|---|
| `REGLE-LIVREUR-01` | DOIT : un livreur inactif ne peut recevoir de nouvelles affectations |
| `REGLE-LIVREUR-02` | DOIT : la commission est calculée et enregistrée à chaque livraison |
| `REGLE-LIVREUR-03` | DOIT : le paiement des commissions génère une écriture comptable de charge |
| `REGLE-LIVREUR-04` | DOIT : un livreur lié à des colis ne peut être supprimé (désactivation seulement) |
| `REGLE-LIVREUR-05` | DEVRAIT : alerter si un livreur a plus de 10 colis en livraison simultanés |

---

*Section précédente : [09 — Module Destinataires](./09-Module-destinataires.md)*
*Section suivante : [11 — Module Paiements](./11-Module-paiements.md)*
