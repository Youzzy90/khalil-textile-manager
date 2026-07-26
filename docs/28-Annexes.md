# 28 — Annexes

## 28.1 Glossaire

| Terme | Définition |
|---|---|
| Agent de comptoir | Employé qui reçoit les colis au dépôt et effectue les saisies |
| Bordereau | Document accompagnant un colis (expédition / livraison) |
| Charge | Sortie d'argent (carburant, salaire, loyer…) |
| Code colis | Identifiant unique d'un colis (KTM-YYMMDD-NNNNN) |
| Commission | Rémunération du livreur par colis livré |
| Comptoir | Poste de saisie au dépôt |
| Destinataire | Personne qui reçoit le colis |
| Dépôt | Local de l'entreprise où sont centralisés les colis |
| Encaissement | Enregistrement d'un paiement |
| Expéditeur | Client qui dépose le colis au dépôt |
| Écriture comptable | Ligne du journal comptable (entrée ou sortie) |
| FCFA / XOF | Franc CFA, devise par défaut |
| Journal d'activité | Historique des actions sensibles effectuées dans l'app |
| Livreur | Personne qui transporte et remet le colis |
| Mode WAL | Write-Ahead Logging, mode SQLite résistant aux crashes |
| Moyen de paiement | Espèces, Wave, Orange Money, carte, virement, à la livraison |
| Paramètre | Configuration clé/valeur de l'app |
| Permissions | Droits attachés à un rôle (Admin / Employé) |
| QR Code | Code 2D apposé sur l'étiquette du colis |
| Récupération | Procédure de reprise après crash ou restauration |
| Recette | Entrée d'argent (paiement client) |
| RLS | Row Level Security (non applicable en SQLite mono-poste) |
| Sauvegarde | Archive compressée de la base et des pièces jointes |
| Soft delete | Suppression logique (colonne `supprime`) sans destruction physique |
| Solde | Montant restant à encaisser sur un colis |
| Statut | État d'un colis dans son cycle (Reçu → Livré) |
| Tournée | Ensemble de colis affectés à un livreur pour une journée |
| XOF | Code ISO du Franc CFA |

## 28.2 Diagrammes UML

### 28.2.1 Diagramme de cas d'utilisation (résumé)
Voir section 2.5 (CU-01 à CU-12). Représentation :
```
   ┌──────────┐         ┌───────────────────┐
   │  Agent   │────────▶│  Créer un colis   │
   │          │────────▶│  Encaisser        │
   │          │────────▶│  Imprimer reçu    │
   └──────────┘         └───────────────────┘

   ┌──────────┐         ┌───────────────────┐
   │ Gérant   │────────▶│  Tableau de bord  │
   │ (Admin)  │────────▶│  Comptabilité     │
   │          │────────▶│  Sauvegarder      │
   │          │────────▶│  Gérer users      │
   └──────────┘         └───────────────────┘

   ┌──────────────┐     ┌───────────────────┐
   │ Chef livr.   │────▶│  Affecter tournée │
   │              │────▶│  Clôturer livr.   │
   └──────────────┘     └───────────────────┘

   ┌──────────┐         ┌───────────────────┐
   │Comptable │────────▶│  Saisir charge    │
   │          │────────▶│  Éditer rapport   │
   └──────────┘         └───────────────────┘
```

### 28.2.2 Diagramme de classes (résumé)
```
Utilisateur ──┬── HistoriqueConnexion
              ├── JournalActivite
              └── (actions)

Client 1 ──── N Colis N ──── 1 Destinataire
                │
                ├── N HistoriqueColis
                ├── N Paiement 1 ──── 1 EcritureComptable
                ├── N Commentaire
                ├── N PieceJointe
                └── 0..1 CommissionLivreur N ──── 1 Livreur

Charge 1 ──── 1 EcritureComptable
ArticleStock 1 ──── N MouvementStock
Inventaire 1 ──── N LigneInventaire N ──── 1 ArticleStock
```

### 28.2.3 Diagramme de séquence (création colis)
```
Agent  Vue  Contrôleur  Modèle  Base
  │      │       │        │      │
  │─clic▶│       │        │      │
  │      │─sig──▶│        │      │
  │      │       │─create▶│      │
  │      │       │        │─BEGIN▶
  │      │       │        │─INSERT▶
  │      │       │        │─hist──▶
  │      │       │        │─COMMIT▶
  │      │       │◀─ok────│      │
  │      │◀─done─│        │      │
  │◀─────│       │        │      │
```

## 28.3 Maquettes des fenêtres

Maquettes en fil de fer (wireframes) décrites textuellement. Chaque maquette correspond à un
écran de la section 16.

### 28.3.1 Maquette — Connexion
```
┌───────────────────────────────────┐
│              [LOGO]               │
│                                   │
│   Identifiant: [____________]     │
│   Mot de passe: [____________] 👁 │
│                                   │
│   [ ] Se souvenir de l'identifiant│
│                                   │
│       [  Se connecter  ]          │
│                                   │
│        Mot de passe oublié ?      │
└───────────────────────────────────┘
```

### 28.3.2 Maquette — Tableau de bord
```
┌─ Sidebar ─┬─────────────────────────────────────────┐
│ Dashboard │  ┌Card─┐ ┌Card─┐ ┌Card─┐ ┌Card─┐ ┌Card┐ │
│ Colis     │  │Colis│ │Clien│ │Livr.│ │Payé │ │Bén.│ │
│ Clients   │  └─────┘ └─────┘ └─────┘ └─────┘ └────┘ │
│ Dest.     │                                          │
│ Livreurs  │  ┌─ Graphique colis/jour ─┐ ┌─ Alertes ─┐│
│ Paiements │  │   ▌▌▌▌▌▌                │ │ ! Stock   ││
│ Compta    │  │   (7 jours)             │ │ ! Retard  ││
│ Stocks    │  └─────────────────────────┘ └───────────┘│
│ Users     │  ┌─ Graphique revenus/jour ┐               │
│ Param.    │  │   ──────                 │               │
│           │  └─────────────────────────┘               │
│           │  ┌Raccourcis────────────────────────────┐  │
│           │  │ [Nouveau colis] [Client] [Encaisser] │  │
│           │  └─────────────────────────────────────┘  │
└───────────┴───────────────────────────────────────────┘
```

### 28.3.3 Maquette — Liste des colis
```
┌─ Sidebar ─┬─────────────────────────────────────────┐
│  • Colis  │ [Rechercher...]  [Filtres ▼]  [Exporter] │
│           │ ┌Filtres────────┐ ┌Tableau──────────────┐│
│           │ │ Statut ☐      │ │Code│Statut│Client│..││
│           │ │ Ville  ☐      │ │...│...│...│...│...││
│           │ │ Date   [..]   │ │...│...│...│...│...││
│           │ │ Livreur ☐     │ │   (pagination)      ││
│           │ └───────────────┘ └─────────────────────┘│
│           │ [Nouveau] [Modifier] [Suppr] [Expédier]   │
└───────────┴───────────────────────────────────────────┘
```

### 28.3.4 Maquette — Fiche colis
```
┌────────────────────────────────────────────────────┐
│ KTM-260726-00042      [Expédié]      [QR]          │
│ [Expédier] [Affecter] [Encaisser] [Imprimer] ...   │
├──────┬──────┬──────┬──────┬───────────────────────┤
│Infos │Hist. │Paymt │Comm. │Pièces jointes         │
├──────┴──────┴──────┴──────┴───────────────────────┤
│ Expéditeur: Diallo Fatou  ☎ 77 123 45 67          │
│ Destinataire: Sow Amadou  ☎ 76 987 65 43          │
│ Contenu: Tissus wax (3 pièces)                    │
│ Poids: 12.5 kg   Montant: 15 000 FCFA             │
│ Solde: 5 000 FCFA    [Encaisser]                  │
└────────────────────────────────────────────────────┘
```

### 28.3.5 Maquette — Comptabilité
```
┌─ Sidebar ─┬─────────────────────────────────────────┐
│ Compta    │ [Nouvelle charge] [Rapports] [Exporter]  │
│           │ ┌Tableau journal────────────────────────┐│
│           │ │N°│Date│Sens│Catégorie│Libellé│Montant ││
│           │ │..│..│ENTREE│RECETTE_LIV│..│10 000   ││
│           │ │..│..│SORTIE│CHARGE_CARb│..│5 000    ││
│           │ └───────────────────────────────────────┘│
│           │ Recettes: 150 000  Charges: 80 000       │
│           │ Bénéfice: 70 000 FCFA                    │
└───────────┴───────────────────────────────────────────┘
```

Les maquettes détaillées (par écran) seront produites dans un outil dédié (Figma) en phase de
design et référencées ici.

## 28.4 Règles métier (récapitulatif)

Liste consolidée de toutes les règles `REGLE-*` du document :

### Authentification / Permissions
- `REGLE-AUTH-01` à `REGLE-AUTH-06` (section 5)
- `REGLE-PERM-01` à `REGLE-PERM-05` (section 5)

### Tableau de bord
- `REGLE-DASH-01` à `REGLE-DASH-05` (section 6)

### Colis
- `REGLE-COLIS-TRANS-01` à `05` (section 7.1)
- `REGLE-COLIS-CREATE-01` à `05` (section 7.2)
- `REGLE-COLIS-EDIT-01` (section 7.3)
- `REGLE-COLIS-DEL-01` (section 7.4)
- `REGLE-COLIS-COMMENT-01` (section 7.14)

### Clients / Destinataires / Livreurs
- `REGLE-CLIENT-01` à `04` (section 8)
- `REGLE-DEST-01` à `03` (section 9)
- `REGLE-LIVREUR-01` à `05` (section 10)

### Paiements / Comptabilité / Stocks
- `REGLE-PAY-01` à `07` (section 11)
- `REGLE-COMPTA-01` à `06` (section 12)
- `REGLE-STOCK-01` à `05` (section 13)

### Base de données / Intégrité
- `REGLE-FK-01` à `07` (section 15.3)

### Export / Impression / Sauvegarde
- `REGLE-EXPORT-01` à `05` (section 18)
- `REGLE-FACT-01` à `04` (section 19.2)
- `REGLE-PRINT-01` à `05` (section 19)
- `REGLE-RESTORE-01` à `05` (section 20.6)

### Paramètres / Sécurité / Performances
- `REGLE-SETTINGS-01` à `05` (section 21)
- `REGLE-SEC-01` à `10` (section 22)
- `REGLE-PERF-01` à `07` (section 23)

### Déploiement / Maintenance
- `REGLE-DEPLOY-01` à `05` (section 25)
- `REGLE-MAINT-01` à `06` (section 26)

Total : ~70 règles métier uniques. Chaque règle est référencée depuis le module concerné et doit
être couverte par au moins un test (section 24).

## 28.5 Conventions de nommage

### Code
- Python : `snake_case` pour fonctions et variables, `PascalCase` pour les classes.
- Fichiers : `snake_case.py`.
- Constantes : `UPPER_SNAKE_CASE`.
- Signaux Qt : `snake_case` nommé d'après l'événement métier (`colis_created`).

### Base de données
- Tables : `snake_case` au singulier ou pluriel selon cohérence (ici pluriel pour les
  collections : `colis`, `paiements`, `clients` ; singulier pour les entités :
  `utilisateur`, `client`). Cohérence à trancher en phase d'implémentation (recommandé :
  singulier partout).
- Colonnes : `snake_case`.
- Clés primaires : `id`.
- Clés étrangères : `<table>_id` (ex. `client_id`).
- Index : `idx_<table>_<colonne(s)>`.
- Contraintes uniques : `uq_<table>_<colonne(s)>`.

### Codes métier
- Codes colis : `KTM-YYMMDD-NNNNN`.
- Numéros de reçu : `REC-YYMMDD-NNNNN`.
- Numéros d'écriture : `ECR-YY-NNNNN` (annuel).
- Numéros de facture : `FAC-YYMMDD-NNNNN`.

### Écrans
- `ECRAN-<MODULE>-<TYPE>` (ex. `ECRAN-COLIS-LIST`, `ECRAN-COLIS-FORM`, `ECRAN-COLIS-DETAIL`).

### Règles
- `REGLE-<MODULE>-<NN>` (ex. `REGLE-COLIS-CREATE-01`).

## 28.6 Structure complète de la base de données
Voir section 14 (source de vérité). Les 22 tables :
`utilisateur`, `historique_connexion`, `journal_activite`, `client`, `destinataire`, `livreur`,
`colis`, `historique_colis`, `paiement`, `ecriture_comptable`, `charge`, `commission_livreur`,
`article_stock`, `mouvement_stock`, `inventaire`, `ligne_inventaire`, `alerte`, `commentaire`,
`piece_jointe`, `parametre`, `ville`, `sequence`.

## 28.7 Flux de navigation

```
Login ──ok──▶ MainWindow
                 │
                 ├──▶ Dashboard
                 ├──▶ Colis ──┬──▶ Form (créer/éditer)
                 │            ├──▶ Detail (onglets)
                 │            └──▶ Affectation
                 ├──▶ Clients ──┬──▶ Form
                 │              └──▶ Detail
                 ├──▶ Destinataires
                 ├──▶ Livreurs ──┬──▶ Form
                 │               └──▶ Detail (Performance, Commissions)
                 ├──▶ Paiements ──▶ Form (encaisser)
                 ├──▶ Comptabilité ──┬──▶ Charge
                 │                    └──▶ Rapports
                 ├──▶ Stocks ──┬──▶ Article
                 │             ├──▶ Mouvement
                 │             └──▶ Inventaire
                 ├──▶ Utilisateurs (admin) ──┬──▶ Form
                 │                            ├──▶ Historique
                 │                            └──▶ Journal
                 └──▶ Paramètres (admin) ──┬──▶ Sauvegarde/Restauration
                                            └──▶ Données
```

## 28.8 Checklist de développement

Ordre suggéré pour implémenter l'application à partir de ce cahier des charges :

- [ ] 1. Initialiser le projet (`pyproject.toml`, `requirements.txt`, structure section 3).
- [ ] 2. Implémenter `Database` (connexion, migrations, pragmas, transactions).
- [ ] 3. Créer les migrations SQL (toutes les tables section 14).
- [ ] 4. Implémenter `BaseModel` puis chaque modèle (CRUD + requêtes spécifiques).
- [ ] 5. Implémenter `utils/` (validators, security, qr_code, formatting, logger, error_handler).
- [ ] 6. Construire le thème QSS (section 17) et `theme/icons.py`.
- [ ] 7. Construire les widgets réutilisables (stat_card, search_bar, data_table, etc.).
- [ ] 8. Construire l'écran de connexion + authentification.
- [ ] 9. Construire la fenêtre principale (menu, sidebar, onglets).
- [ ] 10. Construire le tableau de bord (cartes, graphiques, alertes).
- [ ] 11. Module Colis (liste, form, detail, workflow statuts).
- [ ] 12. Module Clients.
- [ ] 13. Module Destinataires.
- [ ] 14. Module Livreurs (+ commissions).
- [ ] 15. Module Paiements (+ reçus).
- [ ] 16. Module Comptabilité (+ rapports).
- [ ] 17. Module Stocks (+ inventaire).
- [ ] 18. Module Utilisateurs + Journal.
- [ ] 19. Module Paramètres.
- [ ] 20. Module Sauvegarde / Restauration.
- [ ] 21. Export (PDF, Excel, CSV).
- [ ] 22. Impression (factures, reçus, bons, étiquettes).
- [ ] 23. Tests unitaires (modèles, utils).
- [ ] 24. Tests fonctionnels (flux).
- [ ] 25. Tests UI (`pytest-qt`).
- [ ] 26. Tests non fonctionnels (perf, sécurité).
- [ ] 27. Build exécutable (PyInstaller).
- [ ] 28. Documentation utilisateur (PDF / aide intégrée).

## 28.9 Plan de tests (résumé)
Voir section 24. Détail des scénarios de recette :
1. Journée type d'un agent (créer 5 colis, encaisser 3, expédier 4).
2. Journée type d'un chef de livraison (affecter 2 tournées, clôturer 1).
3. Fin de mois du comptable (saisir charges, générer rapport, vérifier bénéfice).
4. Sauvegarde et restauration (sauvegarder, modifier, restaurer, vérifier).
5. Robustesse (couper l'app pendant saisie, redémarrer, vérifier intégrité).
6. Permissions (compte employé : tenter suppression → refus).
7. Performance (10 000 colis, mesurer les temps).
8. Export et impression (générer chaque type de document).

## 28.10 Historique des versions

| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-07-26 | Version initiale du cahier des charges |

L'historique des versions de l'application sera tenu dans `CHANGELOG.md` à partir de la première
release livrée.

---

*Section précédente : [27 — Évolutions futures](./27-Evolutions-futures.md)*
*Retour à l'index : [00 — Index](./00-Index.md)*

---

**Fin du cahier des charges.** Ce document décrit 100 % de l'application Khalil Textile Manager :
chaque écran, chaque bouton, chaque table, chaque donnée, chaque règle métier et chaque
interaction. Un développeur disposant de ce document et des technologies citées (Python 3.11+,
PySide6, SQLite) peut reconstruire l'application dans son intégralité.
