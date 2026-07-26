# 23 — Performances

## 23.1 Cibles (rappel besoins non fonctionnels)
| ID | Cible |
|---|---|
| BNF-01 | Démarrage de l'application < 3 s |
| BNF-02 | Affichage d'une liste de 1 000 colis < 1 s |
| BNF-03 | Recherche instantanée (frappe par frappe) < 200 ms |
| BNF-04 | Création d'un colis < 1 s |

## 23.2 Chargement
- Démarrage : initialisation de la base, chargement des paramètres (cache session), construction
  de la fenêtre principale. Les modules ne sont instanciés qu'à la première ouverture (lazy
  loading) pour ne pas pénaliser le démarrage.
- Splash screen pendant l'initialisation (logo + barre de progression).

## 23.3 Recherche instantanée
- Barre de recherche globale : requête SQL sur tables indexées (sections 7.5 et 14.3.4).
- **Debounce** de 200 ms sur la frappe (évite une requête par caractère).
- Résultats limités à 5 par catégorie (limit SQL).
- Index couvrants sur `code`, `telephone`, `nom_complet`, `ville`.

## 23.4 Pagination
Les listes volumineuses (colis, paiements, journal) utilisent une **pagination** :
- Taille de page configurable (défaut 50, options 50/100/200/500).
- Navigation : « Précédent », « Suivant », n° de page, « Aller à ».
- `LIMIT ? OFFSET ?` côté SQL.
- Le total est calculé une fois (ou mis en cache) pour afficher « Page X / Y ».
- Filtres et tri conservés entre les pages.

## 23.5 Optimisation SQLite
| Pragma | Valeur | Raison |
|---|---|---|
| `journal_mode` | `WAL` | Lectures non bloquantes, résistance crashes |
| `synchronous` | `NORMAL` | Bon compromis perf/sécurité en WAL |
| `foreign_keys` | `ON` | Intégrité |
| `temp_store` | `MEMORY` | Tables temporaires en RAM |
| `cache_size` | `-20000` (20 Mo) | Cache de pages |
| `mmap_size` | `268435456` (256 Mo) | Memory-mapped I/O pour grosses bases |

## 23.6 Index
Les index sont définis section 14. Liste récapitulative des index critiques pour les
performances :

| Index | Table | Cible de perf |
|---|---|---|
| `idx_colis_code` (UNIQUE) | colis | Recherche par code |
| `idx_colis_statut` | colis | Filtre par statut |
| `idx_colis_date_reception` | colis | Tri, filtres date |
| `idx_colis_client` | colis | Fiche client |
| `idx_colis_destinataire` | colis | Fiche destinataire |
| `idx_colis_livreur` | colis | Fiche livreur |
| `idx_colis_ville` | colis | Filtre ville |
| `idx_client_telephone` (UNIQUE) | client | Autocomplétion, recherche |
| `idx_destinataire_telephone` (UNIQUE) | destinataire | Idem |
| `idx_paiement_date` | paiement | Historique, tableaude bord |
| `idx_paiement_colis` | paiement | Fiche colis |
| `idx_ecriture_date` | ecriture_comptable | Comptabilité, rapports |
| `idx_journal_date` | journal_activite | Consultation |
| `idx_historique_colis_colis` | historique_colis | Fiche colis |

## 23.7 Cache en mémoire
Voir section 4.6. Le cache cible les données stables et fréquemment lues :
- Clients / destinataires / livreurs (autocomplétion).
- Paramètres.
- Compteurs du tableau de bord (60 s).

Les listes de colis **ne sont pas** mises en cache (volume + fraîcheur) ; les index SQLite
suffisent.

## 23.8 Rendu de listes
- Utilisation de `QTableView` + `QAbstractTableModel` (modèle virtuel) plutôt que
  `QTableWidget` : seules les lignes visibles sont rendues.
- Tri et filtres délégués au SQL (`ORDER BY`, `WHERE`) plutôt qu'en Python.
- Colonnes calculées (total dépensé, nombre de commandes) précalculées par requêtes agrégées,
  pas recalculées à chaque rendu de ligne.

## 23.9 Transactions et concurrence
- Mono-poste en v1 : pas de contention multi-utilisateurs.
- Transactions courtes (BEGIN/COMMIT au plus près de l'opération).
- Mode WAL : les lectures n'attendent pas les écritures.

## 23.10 Mesure et surveillance
- Compteurs de performance dans `logs/app.log` (temps de requêtes critiques, temps de
  chargement des modules).
- Un écran « Diagnostic » (admin, dans Paramètres → Données) affiche :
  - Taille de la base.
  - Nombre de lignes par table.
  - Résultat de `EXPLAIN QUERY PLAN` sur les requêtes clés.
  - Temps moyen des dernières requêtes.
- Alerte si la base dépasse 500 Mo (proposition de `VACUUM` ou archivage).

## 23.11 Règles
| ID | Règle |
|---|---|
| `REGLE-PERF-01` | DOIT : pagination sur toutes les listes volumineuses |
| `REGLE-PERF-02` | DOIT : index sur toutes les colonnes filtrées/triées fréquemment |
| `REGLE-PERF-03` | DOIT : requêtes paramétrées et triées côté SQL |
| `REGLE-PERF-04` | DOIT : debounce sur la recherche instantanée |
| `REGLE-PERF-05` | DOIT : modèle virtuel pour les tableaux (`QTableView`) |
| `REGLE-PERF-06` | DEVRAIT : `VACUUM` mensuel automatique (si base > 100 Mo) |
| `REGLE-PERF-07` | DEVRAIT : monitoring des temps de requêtes en mode debug |

---

*Section précédente : [22 — Sécurité](./22-Securite.md)*
*Section suivante : [24 — Tests](./24-Tests.md)*
