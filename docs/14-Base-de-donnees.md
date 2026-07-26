# 14 — Base de données

Cette section est la **source de vérité** pour le schéma. Toute autre section qui décrit une table
renvoie ici. La base est SQLite 3, en mode WAL.

## 14.1 Conventions
- Moteur : SQLite 3 (fichier `database/ktm.db`).
- Encodage : UTF-8.
- Clés primaires : `id INTEGER PRIMARY KEY AUTOINCREMENT` sauf contre-indication.
- Clés étrangères : activées (`PRAGMA foreign_keys = ON`), contraintes `ON DELETE RESTRICT` par
  défaut pour préserver l'historique (sauf cas explicités).
- Horodatage : `TEXT` au format ISO 8601 UTC (`YYYY-MM-DD HH:MM:SS`) ; conversion en heure locale
  à l'affichage.
- Booléens : `INTEGER` (0/1).
- Montants : `REAL` avec 2 décimales ; affichage formaté selon devise.
- Soft delete : colonne `supprime INTEGER DEFAULT 0` + `date_suppression TEXT` pour les tables
  sensibles (colis, clients, destinataires, livreurs, utilisateurs).
- Index : décrits en 14.x après chaque table concernée.

## 14.2 Tables

### 14.2.1 `utilisateur`
Comptes utilisateurs de l'application.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK AUTOINCREMENT | — |
| identifiant | TEXT | NOT NULL UNIQUE | Identifiant de connexion |
| nom_complet | TEXT | NOT NULL | — |
| mot_de_passe_hash | TEXT | NOT NULL | Hash bcrypt |
| role | TEXT | NOT NULL CHECK IN ('ADMIN','EMPLOYE') | — |
| telephone | TEXT | | — |
| email | TEXT | | — |
| photo | BLOB | | Photo profil |
| question_secrete | TEXT | | Récupération |
| reponse_secrete_hash | TEXT | | Hash de la réponse |
| actif | INTEGER | NOT NULL DEFAULT 1 | 1=actif, 0=désactivé |
| tentatives_echec | INTEGER | NOT NULL DEFAULT 0 | Compteur verrouillage |
| verrouille_jusquau | TEXT | | Date/heure de fin de verrouillage |
| derniere_connexion | TEXT | | — |
| supprime | INTEGER | NOT NULL DEFAULT 0 | — |
| date_suppression | TEXT | | — |
| date_creation | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| date_modification | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |

Index : `idx_utilisateur_identifiant` (UNIQUE déjà), `idx_utilisateur_actif`.

### 14.2.2 `historique_connexion`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| utilisateur_id | INTEGER | FK → utilisateur.id ON DELETE SET NULL | — |
| date_heure | TEXT | NOT NULL | — |
| type | TEXT | NOT NULL CHECK IN ('CONNEXION','DECONNEXION','ECHEC','VERROUILLAGE','RECUPERATION') | — |
| succes | INTEGER | NOT NULL | 0/1 |
| ip | TEXT | | Locale |
| user_agent | TEXT | | Version app |

Index : `idx_historique_connexion_utilisateur`, `idx_historique_connexion_date`.

### 14.2.3 `journal_activite`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| date_heure | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| utilisateur_id | INTEGER | FK → utilisateur.id ON DELETE SET NULL | — |
| categorie | TEXT | NOT NULL | Voir 5.7.1 |
| action | TEXT | NOT NULL | Code (ex. COLIS_CREATE) |
| cible_type | TEXT | | Type d'objet |
| cible_id | INTEGER | | Id objet |
| details | TEXT | | JSON avant/après |
| ip | TEXT | | — |

Index : `idx_journal_date`, `idx_journal_user`, `idx_journal_categorie`, `idx_journal_action`.

### 14.2.4 `client`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| nom_complet | TEXT | NOT NULL | — |
| telephone | TEXT | NOT NULL UNIQUE | — |
| telephone2 | TEXT | | — |
| email | TEXT | | — |
| ville | TEXT | NOT NULL | — |
| adresse | TEXT | | — |
| type | TEXT | NOT NULL CHECK IN ('PARTICULIER','ENTREPRISE') | — |
| notes | TEXT | | — |
| supprime | INTEGER | NOT NULL DEFAULT 0 | — |
| date_suppression | TEXT | | — |
| date_creation | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| date_modification | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |

Index : `idx_client_telephone` (UNIQUE), `idx_client_ville`, `idx_client_nom`.

### 14.2.5 `destinataire`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| nom_complet | TEXT | NOT NULL | — |
| telephone | TEXT | NOT NULL UNIQUE | — |
| ville | TEXT | NOT NULL | — |
| adresse | TEXT | NOT NULL | — |
| client_id | INTEGER | FK → client.id ON DELETE SET NULL | Client lié (optionnel) |
| notes | TEXT | | — |
| supprime | INTEGER | NOT NULL DEFAULT 0 | — |
| date_suppression | TEXT | | — |
| date_creation | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| date_modification | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |

Index : `idx_destinataire_telephone` (UNIQUE), `idx_destinataire_ville`, `idx_destinataire_client`.

### 14.2.6 `livreur`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| nom_complet | TEXT | NOT NULL | — |
| telephone | TEXT | NOT NULL UNIQUE | — |
| type_vehicule | TEXT | NOT NULL CHECK IN ('MOTO','VOITURE','CAMION','VELO','A_PIED') | — |
| plaque | TEXT | | — |
| zones | TEXT | | JSON liste de villes |
| statut | TEXT | NOT NULL CHECK IN ('ACTIF','INACTIF','EN_CONGE') DEFAULT 'ACTIF' | — |
| date_embauche | TEXT | | — |
| type_commission | TEXT | NOT NULL CHECK IN ('FIXE','POURCENTAGE','AUCUNE') DEFAULT 'AUCUNE' | — |
| valeur_commission | REAL | NOT NULL DEFAULT 0 | — |
| photo | BLOB | | — |
| notes | TEXT | | — |
| supprime | INTEGER | NOT NULL DEFAULT 0 | — |
| date_suppression | TEXT | | — |
| date_creation | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| date_modification | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |

Index : `idx_livreur_statut`, `idx_livreur_telephone` (UNIQUE).

### 14.2.7 `colis`
Table centrale.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| code | TEXT | NOT NULL UNIQUE | Code colis (KTM-YYMMDD-NNNNN) |
| client_id | INTEGER | NOT NULL FK → client.id ON DELETE RESTRICT | Expéditeur |
| destinataire_id | INTEGER | NOT NULL FK → destinataire.id ON DELETE RESTRICT | — |
| livreur_id | INTEGER | FK → livreur.id ON DELETE SET NULL | — |
| contenu | TEXT | NOT NULL | — |
| poids | REAL | NOT NULL CHECK > 0 | — |
| valeur_declaree | REAL | NOT NULL DEFAULT 0 | — |
| ville_destination | TEXT | NOT NULL | — |
| adresse_livraison | TEXT | NOT NULL | — |
| montant | REAL | NOT NULL CHECK >= 0 | À encaisser |
| montant_paye | REAL | NOT NULL DEFAULT 0 | Cumul payé |
| mode_paiement_attendu | TEXT | NOT NULL CHECK IN ('ESPECES','WAVE','ORANGE_MONEY','CARTE','VIREMENT','PORT_PAYE','A_LIVRAISON') | — |
| priorite | TEXT | NOT NULL CHECK IN ('NORMALE','EXPRESS') DEFAULT 'NORMALE' | — |
| fragile | INTEGER | NOT NULL DEFAULT 0 | — |
| statut | TEXT | NOT NULL CHECK IN ('RECU','EXPEDIE','EN_LIVRAISON','LIVRE','RETOURNE','ANNULE') DEFAULT 'RECU' | — |
| paye | INTEGER | NOT NULL DEFAULT 0 | 1 si soldé |
| date_reception | TEXT | NOT NULL | — |
| date_expedition | TEXT | | — |
| date_en_livraison | TEXT | | — |
| date_livraison | TEXT | | — |
| date_annulation | TEXT | | — |
| motif_annulation | TEXT | | — |
| notes_internes | TEXT | | — |
| qr_code_path | TEXT | | Chemin du PNG |
| supprime | INTEGER | NOT NULL DEFAULT 0 | — |
| date_suppression | TEXT | | — |
| date_creation | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| date_modification | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |

Index :
- `idx_colis_code` (UNIQUE)
- `idx_colis_statut`
- `idx_colis_date_reception`
- `idx_colis_client`
- `idx_colis_destinataire`
- `idx_colis_livreur`
- `idx_colis_ville`
- `idx_colis_paye`

### 14.2.8 `historique_colis`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| colis_id | INTEGER | NOT NULL FK → colis.id ON DELETE CASCADE | — |
| utilisateur_id | INTEGER | FK → utilisateur.id ON DELETE SET NULL | — |
| date_heure | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| action | TEXT | NOT NULL | CREATE / STATUS_CHANGE / EDIT / AFFECT / etc. |
| statut_precedent | TEXT | | — |
| statut_nouveau | TEXT | | — |
| details | TEXT | | JSON (champs modifiés) |

Index : `idx_historique_colis_colis`, `idx_historique_colis_date`.

### 14.2.9 `paiement`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| colis_id | INTEGER | NOT NULL FK → colis.id ON DELETE RESTRICT | — |
| numero_recu | TEXT | NOT NULL UNIQUE | REC-YYMMDD-NNNNN |
| montant | REAL | NOT NULL CHECK > 0 | — |
| moyen | TEXT | NOT NULL CHECK IN ('ESPECES','WAVE','ORANGE_MONEY','CARTE','VIREMENT','A_LIVRAISON') | — |
| reference | TEXT | | ID transaction / autorisation |
| date_paiement | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| utilisateur_id | INTEGER | NOT NULL FK → utilisateur.id ON DELETE SET NULL | — |
| rembourse | INTEGER | NOT NULL DEFAULT 0 | — |
| date_remboursement | TEXT | | — |
| motif_remboursement | TEXT | | — |
| notes | TEXT | | — |

Index : `idx_paiement_colis`, `idx_paiement_date`, `idx_paiement_moyen`, `idx_paiement_numero` (UNIQUE).

### 14.2.10 `ecriture_comptable`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| numero | TEXT | NOT NULL UNIQUE | ECR-YY-NNNNN (annuel) |
| date_ecriture | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| sens | TEXT | NOT NULL CHECK IN ('ENTREE','SORTIE') | — |
| categorie | TEXT | NOT NULL | Voir 12.4.1 / 12.3 |
| libelle | TEXT | NOT NULL | — |
| montant | REAL | NOT NULL CHECK > 0 | — |
| moyen | TEXT | | — |
| colis_id | INTEGER | FK → colis.id ON DELETE SET NULL | Si recette liée |
| paiement_id | INTEGER | FK → paiement.id ON DELETE SET NULL | — |
| charge_id | INTEGER | FK → charge.id ON DELETE SET NULL | — |
| utilisateur_id | INTEGER | FK → utilisateur.id ON DELETE SET NULL | — |
| automatique | INTEGER | NOT NULL DEFAULT 0 | 1 si générée par le système |
| supprime | INTEGER | NOT NULL DEFAULT 0 | — |

Index : `idx_ecriture_date`, `idx_ecriture_sens`, `idx_ecriture_categorie`, `idx_ecriture_numero` (UNIQUE).

### 14.2.11 `charge`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| date | TEXT | NOT NULL | — |
| categorie | TEXT | NOT NULL | Voir 12.4.1 |
| libelle | TEXT | NOT NULL | — |
| montant | REAL | NOT NULL CHECK > 0 | — |
| moyen | TEXT | NOT NULL | — |
| beneficiaire | TEXT | | — |
| justificatif_path | TEXT | | — |
| notes | TEXT | | — |
| utilisateur_id | INTEGER | NOT NULL FK → utilisateur.id ON DELETE SET NULL | — |
| supprime | INTEGER | NOT NULL DEFAULT 0 | — |
| date_creation | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |

Index : `idx_charge_date`, `idx_charge_categorie`.

### 14.2.12 `commission_livreur`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| livreur_id | INTEGER | NOT NULL FK → livreur.id ON DELETE RESTRICT | — |
| colis_id | INTEGER | NOT NULL FK → colis.id ON DELETE RESTRICT | — |
| montant | REAL | NOT NULL | — |
| date_generation | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | Calculée à la livraison |
| payee | INTEGER | NOT NULL DEFAULT 0 | — |
| date_paiement | TEXT | | — |
| ecriture_id | INTEGER | FK → ecriture_comptable.id ON DELETE SET NULL | Écriture de charge générée au paiement |

Index : `idx_commission_livreur`, `idx_commission_payee`, `idx_commission_date`.

### 14.2.13 `article_stock`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| reference | TEXT | NOT NULL UNIQUE | — |
| designation | TEXT | NOT NULL | — |
| categorie | TEXT | | — |
| unite | TEXT | NOT NULL CHECK IN ('PIECE','KG','LITRE','ROULEAU','BOITE') | — |
| quantite_actuelle | REAL | NOT NULL DEFAULT 0 | Calculée |
| seuil_alerte | REAL | NOT NULL DEFAULT 0 | — |
| prix_unitaire | REAL | NOT NULL DEFAULT 0 | — |
| fournisseur | TEXT | | — |
| notes | TEXT | | — |
| date_creation | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| date_modification | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |

Index : `idx_article_reference` (UNIQUE).

### 14.2.14 `mouvement_stock`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| article_id | INTEGER | NOT NULL FK → article_stock.id ON DELETE RESTRICT | — |
| type | TEXT | NOT NULL CHECK IN ('ENTREE','SORTIE','AJUSTEMENT') | — |
| quantite | REAL | NOT NULL CHECK > 0 | — |
| date | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| motif | TEXT | NOT NULL | — |
| reference_bon | TEXT | | — |
| utilisateur_id | INTEGER | FK → utilisateur.id ON DELETE SET NULL | — |
| inventaire_id | INTEGER | FK → inventaire.id ON DELETE SET NULL | — |

Index : `idx_mouvement_article`, `idx_mouvement_date`.

### 14.2.15 `inventaire`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| date | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| responsable_id | INTEGER | FK → utilisateur.id ON DELETE SET NULL | — |
| statut | TEXT | NOT NULL CHECK IN ('EN_COURS','CLOTURE') DEFAULT 'EN_COURS' | — |
| notes | TEXT | | — |

### 14.2.16 `ligne_inventaire`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| inventaire_id | INTEGER | NOT NULL FK → inventaire.id ON DELETE CASCADE | — |
| article_id | INTEGER | NOT NULL FK → article_stock.id ON DELETE RESTRICT | — |
| quantite_theorique | REAL | NOT NULL | — |
| quantite_comptee | REAL | NOT NULL | — |
| ecart | REAL | NOT NULL | comptée − théorique |

### 14.2.17 `alerte`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| type | TEXT | NOT NULL | STOCK_LOW / COLIS_RETARD / PAIEMENT_PARTIEL / BACKUP_MISSING / ACCOUNT_LOCKED / DISK_LOW |
| cible_type | TEXT | | — |
| cible_id | INTEGER | | — |
| message | TEXT | NOT NULL | — |
| gravite | TEXT | NOT NULL CHECK IN ('BASSE','MOYENNE','HAUTE') | — |
| date_creation | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| acquittee | INTEGER | NOT NULL DEFAULT 0 | — |
| date_acquittement | TEXT | | — |
| acquitte_par | INTEGER | FK → utilisateur.id ON DELETE SET NULL | — |

Index : `idx_alerte_acquittee`, `idx_alerte_gravite`, `idx_alerte_type`.

### 14.2.18 `commentaire`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| colis_id | INTEGER | NOT NULL FK → colis.id ON DELETE CASCADE | — |
| utilisateur_id | INTEGER | NOT NULL FK → utilisateur.id ON DELETE SET NULL | — |
| texte | TEXT | NOT NULL | — |
| date_creation | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |
| date_modification | TEXT | | — |
| modifie | INTEGER | NOT NULL DEFAULT 0 | — |

Index : `idx_commentaire_colis`.

### 14.2.19 `piece_jointe`
| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| colis_id | INTEGER | NOT NULL FK → colis.id ON DELETE CASCADE | — |
| nom_fichier | TEXT | NOT NULL | — |
| chemin | TEXT | NOT NULL | attachments/<code_colis>/ |
| taille_octets | INTEGER | NOT NULL | — |
| type_mime | TEXT | | — |
| utilisateur_id | INTEGER | NOT NULL FK → utilisateur.id ON DELETE SET NULL | — |
| date_creation | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |

Index : `idx_piece_jointe_colis`.

### 14.2.20 `parametre`
Stockage clé/valeur des paramètres applicatifs (entreprise, devise, thème, etc.).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| cle | TEXT | NOT NULL UNIQUE | — |
| valeur | TEXT | | — |
| type | TEXT | NOT NULL CHECK IN ('TEXT','INT','REAL','BOOL','JSON') | — |
| date_modification | TEXT | NOT NULL DEFAULT CURRENT_TIMESTAMP | — |

### 14.2.21 `ville`
Liste configurable des villes desservies.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| nom | TEXT | NOT NULL UNIQUE | — |
| region | TEXT | | — |
| tarif_port | REAL | NOT NULL DEFAULT 0 | Surchargé par colis si nécessaire |
| actif | INTEGER | NOT NULL DEFAULT 1 | — |

### 14.2.22 `sequence`
Compteurs de codes (colis, reçus, écritures).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| id | INTEGER | PK | — |
| nom | TEXT | NOT NULL UNIQUE | 'COLIS_JOURNALIER' / 'RECU' / 'ECRITURE' |
| prefixe | TEXT | | 'KTM-' / 'REC-' / 'ECR-' |
| annee | INTEGER | | Pour séquences annuelles |
| jour | TEXT | | Pour séquences journalières (colis) |
| compteur | INTEGER | NOT NULL DEFAULT 0 | — |

## 14.3 Requêtes SQL de référence

### 14.3.1 Création d'un colis (transaction)
```sql
BEGIN;
-- Verrouillage du compteur
UPDATE sequence SET compteur = compteur + 1
  WHERE nom = 'COLIS_JOURNALIER' AND jour = date('now');
-- Récupération du compteur
SELECT compteur, prefixe FROM sequence
  WHERE nom = 'COLIS_JOURNALIER' AND jour = date('now');
-- Insertion du colis
INSERT INTO colis (code, client_id, destinataire_id, contenu, poids, ville_destination,
  adresse_livraison, montant, mode_paiement_attendu, date_reception)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
-- Historique initial
INSERT INTO historique_colis (colis_id, utilisateur_id, action, statut_nouveau)
  VALUES (last_insert_rowid(), ?, 'CREATE', 'RECU');
-- Journal d'activité
INSERT INTO journal_activite (utilisateur_id, categorie, action, cible_type, cible_id)
  VALUES (?, 'COLIS', 'COLIS_CREATE', 'colis', last_insert_rowid());
COMMIT;
```

### 14.3.2 Encaissement (transaction)
```sql
BEGIN;
INSERT INTO paiement (colis_id, numero_recu, montant, moyen, reference, utilisateur_id)
  VALUES (?, ?, ?, ?, ?, ?);
UPDATE colis SET montant_paye = montant_paye + ?,
  paye = CASE WHEN montant_paye + ? >= montant THEN 1 ELSE 0 END
  WHERE id = ?;
INSERT INTO ecriture_comptable (numero, date_ecriture, sens, categorie, libelle, montant,
  colis_id, paiement_id, utilisateur_id, automatique)
  VALUES (?, CURRENT_TIMESTAMP, 'ENTREE', 'RECETTE_LIVRAISON', ?, ?, ?, ?, ?, 1);
INSERT INTO journal_activite (utilisateur_id, categorie, action, cible_type, cible_id)
  VALUES (?, 'PAIEMENT', 'PAYMENT_RECORD', 'colis', ?);
COMMIT;
```

### 14.3.3 Cartes tableau de bord (aujourd'hui)
```sql
-- Colis du jour
SELECT COUNT(*) FROM colis WHERE date(date_reception) = date('now') AND supprime = 0;
-- Paiements du jour
SELECT COALESCE(SUM(montant),0) FROM paiement WHERE date(date_paiement) = date('now')
  AND rembourse = 0;
-- Charges du jour
SELECT COALESCE(SUM(montant),0) FROM charge WHERE date(date) = date('now') AND supprime = 0;
-- Colis en cours
SELECT COUNT(*) FROM colis
  WHERE statut IN ('RECU','EXPEDIE','EN_LIVRAISON') AND supprime = 0;
```

### 14.3.4 Recherche globale
```sql
-- Colis par code ou téléphone expéditeur/destinataire
SELECT c.id, c.code, c.statut FROM colis c
  LEFT JOIN client cl ON cl.id = c.client_id
  LEFT JOIN destinataire d ON d.id = c.destinataire_id
  WHERE c.code LIKE ? OR cl.telephone LIKE ? OR d.telephone LIKE ?
     OR cl.nom_complet LIKE ? OR d.nom_complet LIKE ? OR c.ville_destination LIKE ?
  ORDER BY c.date_reception DESC LIMIT 5;
```

### 14.3.5 Statistiques client
```sql
SELECT
  COUNT(*) AS nb_commandes,
  COALESCE(SUM(montant),0) AS total_depense,
  COALESCE(SUM(montant - montant_paye),0) AS solde_du,
  MAX(date_reception) AS derniere_commande,
  COALESCE(AVG(montant),0) AS panier_moyen
FROM colis WHERE client_id = ? AND supprime = 0;
```

### 14.3.6 Performance livreur
```sql
SELECT
  COUNT(*) FILTER (WHERE statut = 'LIVRE') AS livres,
  COUNT(*) FILTER (WHERE statut = 'RETOURNE') AS retournes,
  AVG(julianday(date_livraison) - julianday(date_en_livraison)) AS delai_moyen_jours
FROM colis WHERE livreur_id = ? AND supprime = 0;
```

### 14.3.7 Bénéfice période
```sql
SELECT
  (SELECT COALESCE(SUM(montant),0) FROM ecriture_comptable
     WHERE sens = 'ENTREE' AND date(date_ecriture) BETWEEN ? AND ?) AS recettes,
  (SELECT COALESCE(SUM(montant),0) FROM ecriture_comptable
     WHERE sens = 'SORTIE' AND date(date_ecriture) BETWEEN ? AND ?) AS charges;
```

## 14.4 Vues (facultatif, pour les exports)
- `vue_colis_complet` : colis joint à client, destinataire, livreur.
- `vue_paiements_complet` : paiement joint à colis et client.
- `vue_comptabilité_periodique` : agrégats par mois (recettes, charges, bénéfice).

---

*Section précédente : [13 — Gestion des stocks](./13-Stocks.md)*
*Section suivante : [15 — Diagramme relationnel](./15-Diagramme-relationnel.md)*
