# 21 — Paramètres

Le module Paramètres (réservé à l'administrateur) centralise la configuration de l'application.
Il est organisé en onglets dans `ECRAN-SETTINGS`.

## 21.1 Onglet « Entreprise »
| Champ | Type | Description |
|---|---|---|
| Nom de l'entreprise | Texte | Affiché en en-tête et documents |
| Logo | Image (PNG/SVG) | Stocké en base, max 500 Ko |
| Adresse | Texte multi-lignes | Pour documents |
| Téléphone | Texte | — |
| Email | Texte | — |
| N° RC / registre commerce | Texte | Mentions légales |
| N° IFU / NIF | Texte | Mentions fiscales (selon pays) |
| Site web | Texte | — |
| Devise | Sélection | XOF (défaut), XAF, EUR, USD, etc. |
| Symbole devise | Texte | Ex. « FCFA », « € » |
| Position symbole | Sélection | Avant / après le montant |
| Décimales | Entier | 0 ou 2 |
| Taxe (TVA) | Décimal | Pourcentage applicable (optionnel) |
| Pays | Sélection | Pour formatage |

## 21.2 Onglet « Apparence »
| Champ | Type | Description |
|---|---|---|
| Thème | Sélection | Sombre (défaut) / Clair |
| Couleur accent | Sélection | Or (défaut), Bleu, Vert — voir section 17 |
| Densité | Sélection | Confortable / Compacte |
| Animations | Booléen | Activées (défaut) / Désactivées |
| Taille police | Sélection | Petite / Normale / Grande |
| Langue | Sélection | Français (défaut), English (v1.1) |

## 21.3 Onglet « Sauvegarde »
Voir section 20.8 pour le détail.

| Champ | Défaut |
|---|---|
| Sauvegarde automatique | Activée |
| Fréquence | 24 h |
| Emplacement | `backups/` |
| Rétention | 10 sauvegardes |
| Compression maximale | Désactivée |
| Sauvegarde à la fermeture | Désactivée |
| Archive long terme (1/semaine) | Désactivée |

## 21.4 Onglet « Sécurité »
| Champ | Défaut | Description |
|---|---|---|
| Tentatives avant verrouillage | 5 | Voir `REGLE-AUTH-01` |
| Durée de verrouillage | 15 min | — |
| Expiration session (inactivité) | 30 min | 0 = jamais |
| Complexité mot de passe | Activée | Min 8 caractères, 1 maj, 1 chiffre |
| Rotation mot de passe | 0 jours | 0 = jamais |
| Conservation journal | 365 jours | Avant purge |
| Purge auto du journal | Désactivée | Si activée, archive avant purge |

## 21.5 Onglet « Impression »
| Champ | Défaut |
|---|---|
| Imprimante par défaut | Imprimante système |
| Format étiquette | Thermique 100×50 mm |
| Inclure logo | Oui |
| Inclure mentions légales | Non |
| Texte mentions légales | (configurable) |
| Marges (mm) | 10 (haut/bas), 15 (gauche/droite) |
| Aperçu avant impression | Oui |

## 21.6 Onglet « Colis »
| Champ | Défaut | Description |
|---|---|---|
| Préfixe code colis | `KTM-` | — |
| Surcoût Express | 0 | Montant ajouté en priorité Express |
| Délai d'alerte colis en retard | 48 h | Pour alerte tableau de bord |
| Délai paiement partiel en attente | 7 jours | Pour alerte |
| Liste des villes | Éditable | Ajout / modification / suppression |

## 21.7 Onglet « Données »
| Action | Description |
|---|---|
| Exporter toute la base | Génère un dump SQL ou un zip complet |
| Importer données initiales | Pour migration depuis un autre système (CSV) |
| Vider les données (reset) | **Dangereux** : supprime toutes les données, garde la structure. Admin + mot de passe |
| Réindexer | `REINDEX` sur toutes les tables |
| Compacter | `VACUUM` sur la base |

## 21.8 Onglet « À propos »
- Version de l'application.
- Version de la base de données.
- Moteur SQLite.
- Lien vers la documentation.
- Crédits et licence.

## 21.9 Persistance
- Les paramètres sont stockés dans la table `parametre` (clé/valeur, voir section 14.2.20).
- Au démarrage, l'app charge tous les paramètres en mémoire (cache session).
- Toute modification émet le signal `settings_changed` sur l'EventBus → mise à jour des vues
  concernées (thème, langue, modèles de documents).
- Les modifications sont journalisées (`SETTINGS_CHANGE`).

## 21.10 Règles
| ID | Règle |
|---|---|
| `REGLE-SETTINGS-01` | DOIT : les paramètres sont persistés en base (pas seulement dans un fichier) |
| `REGLE-SETTINGS-02` | DOIT : le changement de thème est appliqué sans redémarrage |
| `REGLE-SETTINGS-03` | DOIT : le changement de devise recalcule les affichages (les montants en base restent dans la devise d'origine) |
| `REGLE-SETTINGS-04` | DOIT : la réinitialisation des données nécessite mot de passe admin + confirmation tapée « EFFACER » |
| `REGLE-SETTINGS-05` | DOIT : toutes les modifications de paramètres sont journalisées |

---

*Section précédente : [20 — Sauvegarde](./20-Sauvegarde.md)*
*Section suivante : [22 — Sécurité](./22-Securite.md)*
