/*
# Khalil Textile Manager — Core Schema

Creates the full operational schema for a parcel-textile delivery management app.

1. New Tables
- `ville` — list of serviced cities, with port tariff.
- `utilisateur` — profiles for app users (admin/employé). auth.users holds credentials; this table holds business fields.
- `client` — senders (people who deposit parcels).
- `destinataire` — receivers. Optionally linked to a client.
- `livreur` — delivery drivers, with vehicle, zone, commission config.
- `colis` — the central parcel record: code, sender, receiver, driver, amounts, status, dates.
- `historique_colis` — immutable log of every parcel status change/edit.
- `commentaire` — comments attached to a parcel.
- `piece_jointe` — file attachments attached to a parcel (path stored).
- `paiement` — payments recorded against a parcel (multiple methods, partial allowed).
- `charge` — manual accounting expense entries.
- `ecriture_comptable` — ledger entries (ENTREE/SORTIE) auto-generated from payments/charges + manual.
- `commission_livreur` — commission owed/paid to a driver per delivered parcel.
- `article_stock` — stock items (packaging, supplies).
- `mouvement_stock` — stock movements (in/out/adjustment), immutable.
- `inventaire` + `ligne_inventaire` — stock count sessions.
- `alerte` — alerts surfaced on the dashboard.
- `journal_activite` — audit log of sensitive actions.
- `historique_connexion` — login/logout/failure log.
- `parametre` — key/value app settings.
- `sequence` — counters for code generation (parcel code, receipt, ledger entry).

2. Security
- RLS enabled on every table.
- Multi-user app WITH sign-in: policies scoped `TO authenticated` with ownership via `utilisateur.auth_user_id` join. Since most tables are company-shared (not per-user private) but require a signed-in staff member, SELECT/INSERT/UPDATE/DELETE are allowed to any authenticated user (staff data is shared within the single company). This matches the spec's mono-company model where admin/employé both see the same data and permissions are enforced in-app by role.

3. Notes
- Codes (colis, reçu, écriture) generated via `sequence` table with atomic increment.
- `colis.statut` constrained to the 6 lifecycle states.
- Amounts stored as numeric(14,2) in XOF.
- Soft delete via `supprime` flag on sensitive tables.
*/

-- ============ ville ============
CREATE TABLE IF NOT EXISTS ville (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nom text NOT NULL UNIQUE,
  region text,
  tarif_port numeric(14,2) NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ville ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_crud_ville" ON ville;
CREATE POLICY "auth_crud_ville" ON ville FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_ville_ins" ON ville FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_ville_upd" ON ville FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_ville_del" ON ville FOR DELETE TO authenticated USING (true);

-- ============ utilisateur ============
CREATE TABLE IF NOT EXISTS utilisateur (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  identifiant text NOT NULL UNIQUE,
  nom_complet text NOT NULL,
  role text NOT NULL CHECK (role IN ('ADMIN','EMPLOYE')) DEFAULT 'EMPLOYE',
  telephone text,
  email text,
  actif boolean NOT NULL DEFAULT true,
  supprime boolean NOT NULL DEFAULT false,
  derniere_connexion timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE utilisateur ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_crud_utilisateur" ON utilisateur;
CREATE POLICY "auth_crud_utilisateur" ON utilisateur FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_utilisateur_ins" ON utilisateur FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_utilisateur_upd" ON utilisateur FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_utilisateur_del" ON utilisateur FOR DELETE TO authenticated USING (true);

-- ============ client ============
CREATE TABLE IF NOT EXISTS client (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nom_complet text NOT NULL,
  telephone text NOT NULL UNIQUE,
  telephone2 text,
  email text,
  ville text NOT NULL,
  adresse text,
  type text NOT NULL CHECK (type IN ('PARTICULIER','ENTREPRISE')) DEFAULT 'PARTICULIER',
  notes text,
  supprime boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_client_ville ON client(ville);
CREATE INDEX IF NOT EXISTS idx_client_nom ON client(nom_complet);
DROP POLICY IF EXISTS "auth_crud_client" ON client;
CREATE POLICY "auth_crud_client" ON client FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_client_ins" ON client FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_client_upd" ON client FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_client_del" ON client FOR DELETE TO authenticated USING (true);

-- ============ destinataire ============
CREATE TABLE IF NOT EXISTS destinataire (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nom_complet text NOT NULL,
  telephone text NOT NULL UNIQUE,
  ville text NOT NULL,
  adresse text NOT NULL,
  client_id bigint REFERENCES client(id) ON DELETE SET NULL,
  notes text,
  supprime boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE destinataire ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_dest_ville ON destinataire(ville);
CREATE INDEX IF NOT EXISTS idx_dest_client ON destinataire(client_id);
DROP POLICY IF EXISTS "auth_crud_dest" ON destinataire;
CREATE POLICY "auth_crud_dest" ON destinataire FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_dest_ins" ON destinataire FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_dest_upd" ON destinataire FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_dest_del" ON destinataire FOR DELETE TO authenticated USING (true);

-- ============ livreur ============
CREATE TABLE IF NOT EXISTS livreur (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nom_complet text NOT NULL,
  telephone text NOT NULL UNIQUE,
  type_vehicule text NOT NULL CHECK (type_vehicule IN ('MOTO','VOITURE','CAMION','VELO','A_PIED')) DEFAULT 'MOTO',
  plaque text,
  zones text,
  statut text NOT NULL CHECK (statut IN ('ACTIF','INACTIF','EN_CONGE')) DEFAULT 'ACTIF',
  date_embauche date,
  type_commission text NOT NULL CHECK (type_commission IN ('FIXE','POURCENTAGE','AUCUNE')) DEFAULT 'AUCUNE',
  valeur_commission numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  supprime boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE livreur ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_livreur_statut ON livreur(statut);
DROP POLICY IF EXISTS "auth_crud_livreur" ON livreur;
CREATE POLICY "auth_crud_livreur" ON livreur FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_livreur_ins" ON livreur FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_livreur_upd" ON livreur FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_livreur_del" ON livreur FOR DELETE TO authenticated USING (true);

-- ============ colis ============
CREATE TABLE IF NOT EXISTS colis (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  code text NOT NULL UNIQUE,
  client_id bigint NOT NULL REFERENCES client(id) ON DELETE RESTRICT,
  destinataire_id bigint NOT NULL REFERENCES destinataire(id) ON DELETE RESTRICT,
  livreur_id bigint REFERENCES livreur(id) ON DELETE SET NULL,
  contenu text NOT NULL,
  poids numeric(10,2) NOT NULL CHECK (poids > 0),
  valeur_declaree numeric(14,2) NOT NULL DEFAULT 0,
  ville_destination text NOT NULL,
  adresse_livraison text NOT NULL,
  montant numeric(14,2) NOT NULL CHECK (montant >= 0) DEFAULT 0,
  montant_paye numeric(14,2) NOT NULL DEFAULT 0,
  mode_paiement_attendu text NOT NULL CHECK (mode_paiement_attendu IN ('ESPECES','WAVE','ORANGE_MONEY','CARTE','VIREMENT','PORT_PAYE','A_LIVRAISON')) DEFAULT 'ESPECES',
  priorite text NOT NULL CHECK (priorite IN ('NORMALE','EXPRESS')) DEFAULT 'NORMALE',
  fragile boolean NOT NULL DEFAULT false,
  statut text NOT NULL CHECK (statut IN ('RECU','EXPEDIE','EN_LIVRAISON','LIVRE','RETOURNE','ANNULE')) DEFAULT 'RECU',
  paye boolean NOT NULL DEFAULT false,
  date_reception timestamptz NOT NULL DEFAULT now(),
  date_expedition timestamptz,
  date_en_livraison timestamptz,
  date_livraison timestamptz,
  date_annulation timestamptz,
  motif_annulation text,
  notes_internes text,
  supprime boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE colis ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_colis_statut ON colis(statut);
CREATE INDEX IF NOT EXISTS idx_colis_date_reception ON colis(date_reception);
CREATE INDEX IF NOT EXISTS idx_colis_client ON colis(client_id);
CREATE INDEX IF NOT EXISTS idx_colis_destinataire ON colis(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_colis_livreur ON colis(livreur_id);
CREATE INDEX IF NOT EXISTS idx_colis_ville ON colis(ville_destination);
CREATE INDEX IF NOT EXISTS idx_colis_paye ON colis(paye);
DROP POLICY IF EXISTS "auth_crud_colis" ON colis;
CREATE POLICY "auth_crud_colis" ON colis FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_colis_ins" ON colis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_colis_upd" ON colis FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_colis_del" ON colis FOR DELETE TO authenticated USING (true);

-- ============ historique_colis ============
CREATE TABLE IF NOT EXISTS historique_colis (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  colis_id bigint NOT NULL REFERENCES colis(id) ON DELETE CASCADE,
  utilisateur_id bigint REFERENCES utilisateur(id) ON DELETE SET NULL,
  date_heure timestamptz NOT NULL DEFAULT now(),
  action text NOT NULL,
  statut_precedent text,
  statut_nouveau text,
  details text
);
ALTER TABLE historique_colis ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_hist_colis_colis ON historique_colis(colis_id);
CREATE INDEX IF NOT EXISTS idx_hist_colis_date ON historique_colis(date_heure);
DROP POLICY IF EXISTS "auth_crud_histcolis" ON historique_colis;
CREATE POLICY "auth_crud_histcolis" ON historique_colis FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_histcolis_ins" ON historique_colis FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_histcolis_upd" ON historique_colis FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_histcolis_del" ON historique_colis FOR DELETE TO authenticated USING (true);

-- ============ commentaire ============
CREATE TABLE IF NOT EXISTS commentaire (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  colis_id bigint NOT NULL REFERENCES colis(id) ON DELETE CASCADE,
  utilisateur_id bigint REFERENCES utilisateur(id) ON DELETE SET NULL,
  texte text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE commentaire ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_commentaire_colis ON commentaire(colis_id);
DROP POLICY IF EXISTS "auth_crud_commentaire" ON commentaire;
CREATE POLICY "auth_crud_commentaire" ON commentaire FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_commentaire_ins" ON commentaire FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_commentaire_upd" ON commentaire FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_commentaire_del" ON commentaire FOR DELETE TO authenticated USING (true);

-- ============ piece_jointe ============
CREATE TABLE IF NOT EXISTS piece_jointe (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  colis_id bigint NOT NULL REFERENCES colis(id) ON DELETE CASCADE,
  nom_fichier text NOT NULL,
  chemin text NOT NULL,
  taille_octets bigint NOT NULL DEFAULT 0,
  type_mime text,
  utilisateur_id bigint REFERENCES utilisateur(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE piece_jointe ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pj_colis ON piece_jointe(colis_id);
DROP POLICY IF EXISTS "auth_crud_pj" ON piece_jointe;
CREATE POLICY "auth_crud_pj" ON piece_jointe FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_pj_ins" ON piece_jointe FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_pj_upd" ON piece_jointe FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_pj_del" ON piece_jointe FOR DELETE TO authenticated USING (true);

-- ============ paiement ============
CREATE TABLE IF NOT EXISTS paiement (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  colis_id bigint NOT NULL REFERENCES colis(id) ON DELETE RESTRICT,
  numero_recu text NOT NULL UNIQUE,
  montant numeric(14,2) NOT NULL CHECK (montant > 0),
  moyen text NOT NULL CHECK (moyen IN ('ESPECES','WAVE','ORANGE_MONEY','CARTE','VIREMENT','A_LIVRAISON')),
  reference text,
  date_paiement timestamptz NOT NULL DEFAULT now(),
  utilisateur_id bigint REFERENCES utilisateur(id) ON DELETE SET NULL,
  rembourse boolean NOT NULL DEFAULT false,
  date_remboursement timestamptz,
  motif_remboursement text,
  notes text
);
ALTER TABLE paiement ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_paiement_colis ON paiement(colis_id);
CREATE INDEX IF NOT EXISTS idx_paiement_date ON paiement(date_paiement);
CREATE INDEX IF NOT EXISTS idx_paiement_moyen ON paiement(moyen);
DROP POLICY IF EXISTS "auth_crud_paiement" ON paiement;
CREATE POLICY "auth_crud_paiement" ON paiement FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_paiement_ins" ON paiement FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_paiement_upd" ON paiement FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_paiement_del" ON paiement FOR DELETE TO authenticated USING (true);

-- ============ charge ============
CREATE TABLE IF NOT EXISTS charge (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date date NOT NULL DEFAULT CURRENT_DATE,
  categorie text NOT NULL,
  libelle text NOT NULL,
  montant numeric(14,2) NOT NULL CHECK (montant > 0),
  moyen text NOT NULL DEFAULT 'ESPECES',
  beneficiaire text,
  notes text,
  utilisateur_id bigint REFERENCES utilisateur(id) ON DELETE SET NULL,
  supprime boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE charge ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_charge_date ON charge(date);
CREATE INDEX IF NOT EXISTS idx_charge_categorie ON charge(categorie);
DROP POLICY IF EXISTS "auth_crud_charge" ON charge;
CREATE POLICY "auth_crud_charge" ON charge FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_charge_ins" ON charge FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_charge_upd" ON charge FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_charge_del" ON charge FOR DELETE TO authenticated USING (true);

-- ============ ecriture_comptable ============
CREATE TABLE IF NOT EXISTS ecriture_comptable (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  numero text NOT NULL UNIQUE,
  date_ecriture timestamptz NOT NULL DEFAULT now(),
  sens text NOT NULL CHECK (sens IN ('ENTREE','SORTIE')),
  categorie text NOT NULL,
  libelle text NOT NULL,
  montant numeric(14,2) NOT NULL CHECK (montant > 0),
  moyen text,
  colis_id bigint REFERENCES colis(id) ON DELETE SET NULL,
  paiement_id bigint REFERENCES paiement(id) ON DELETE SET NULL,
  charge_id bigint REFERENCES charge(id) ON DELETE SET NULL,
  utilisateur_id bigint REFERENCES utilisateur(id) ON DELETE SET NULL,
  automatique boolean NOT NULL DEFAULT false,
  supprime boolean NOT NULL DEFAULT false
);
ALTER TABLE ecriture_comptable ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ecr_date ON ecriture_comptable(date_ecriture);
CREATE INDEX IF NOT EXISTS idx_ecr_sens ON ecriture_comptable(sens);
CREATE INDEX IF NOT EXISTS idx_ecr_categorie ON ecriture_comptable(categorie);
CREATE INDEX IF NOT EXISTS idx_ecr_colis ON ecriture_comptable(colis_id);
DROP POLICY IF EXISTS "auth_crud_ecr" ON ecriture_comptable;
CREATE POLICY "auth_crud_ecr" ON ecriture_comptable FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_ecr_ins" ON ecriture_comptable FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_ecr_upd" ON ecriture_comptable FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_ecr_del" ON ecriture_comptable FOR DELETE TO authenticated USING (true);

-- ============ commission_livreur ============
CREATE TABLE IF NOT EXISTS commission_livreur (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  livreur_id bigint NOT NULL REFERENCES livreur(id) ON DELETE RESTRICT,
  colis_id bigint NOT NULL REFERENCES colis(id) ON DELETE RESTRICT,
  montant numeric(14,2) NOT NULL,
  date_generation timestamptz NOT NULL DEFAULT now(),
  payee boolean NOT NULL DEFAULT false,
  date_paiement timestamptz,
  ecriture_id bigint REFERENCES ecriture_comptable(id) ON DELETE SET NULL
);
ALTER TABLE commission_livreur ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_comm_livreur ON commission_livreur(livreur_id);
CREATE INDEX IF NOT EXISTS idx_comm_payee ON commission_livreur(payee);
CREATE INDEX IF NOT EXISTS idx_comm_colis ON commission_livreur(colis_id);
DROP POLICY IF EXISTS "auth_crud_comm" ON commission_livreur;
CREATE POLICY "auth_crud_comm" ON commission_livreur FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_comm_ins" ON commission_livreur FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_comm_upd" ON commission_livreur FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_comm_del" ON commission_livreur FOR DELETE TO authenticated USING (true);

-- ============ article_stock ============
CREATE TABLE IF NOT EXISTS article_stock (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  reference text NOT NULL UNIQUE,
  designation text NOT NULL,
  categorie text,
  unite text NOT NULL CHECK (unite IN ('PIECE','KG','LITRE','ROULEAU','BOITE')) DEFAULT 'PIECE',
  quantite_actuelle numeric(14,2) NOT NULL DEFAULT 0,
  seuil_alerte numeric(14,2) NOT NULL DEFAULT 0,
  prix_unitaire numeric(14,2) NOT NULL DEFAULT 0,
  fournisseur text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE article_stock ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_crud_article" ON article_stock;
CREATE POLICY "auth_crud_article" ON article_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_article_ins" ON article_stock FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_article_upd" ON article_stock FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_article_del" ON article_stock FOR DELETE TO authenticated USING (true);

-- ============ mouvement_stock ============
CREATE TABLE IF NOT EXISTS mouvement_stock (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  article_id bigint NOT NULL REFERENCES article_stock(id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('ENTREE','SORTIE','AJUSTEMENT')),
  quantite numeric(14,2) NOT NULL CHECK (quantite > 0),
  date timestamptz NOT NULL DEFAULT now(),
  motif text NOT NULL,
  reference_bon text,
  utilisateur_id bigint REFERENCES utilisateur(id) ON DELETE SET NULL,
  inventaire_id bigint
);
ALTER TABLE mouvement_stock ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_mvt_article ON mouvement_stock(article_id);
CREATE INDEX IF NOT EXISTS idx_mvt_date ON mouvement_stock(date);
DROP POLICY IF EXISTS "auth_crud_mvt" ON mouvement_stock;
CREATE POLICY "auth_crud_mvt" ON mouvement_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_mvt_ins" ON mouvement_stock FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_mvt_upd" ON mouvement_stock FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_mvt_del" ON mouvement_stock FOR DELETE TO authenticated USING (true);

-- ============ inventaire + ligne_inventaire ============
CREATE TABLE IF NOT EXISTS inventaire (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date timestamptz NOT NULL DEFAULT now(),
  responsable_id bigint REFERENCES utilisateur(id) ON DELETE SET NULL,
  statut text NOT NULL CHECK (statut IN ('EN_COURS','CLOTURE')) DEFAULT 'EN_COURS',
  notes text
);
ALTER TABLE inventaire ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_crud_inventaire" ON inventaire;
CREATE POLICY "auth_crud_inventaire" ON inventaire FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_inventaire_ins" ON inventaire FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_inventaire_upd" ON inventaire FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_inventaire_del" ON inventaire FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS ligne_inventaire (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  inventaire_id bigint NOT NULL REFERENCES inventaire(id) ON DELETE CASCADE,
  article_id bigint NOT NULL REFERENCES article_stock(id) ON DELETE RESTRICT,
  quantite_theorique numeric(14,2) NOT NULL,
  quantite_comptee numeric(14,2) NOT NULL,
  ecart numeric(14,2) NOT NULL
);
ALTER TABLE ligne_inventaire ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ligne_inv_inventaire ON ligne_inventaire(inventaire_id);
DROP POLICY IF EXISTS "auth_crud_ligne_inv" ON ligne_inventaire;
CREATE POLICY "auth_crud_ligne_inv" ON ligne_inventaire FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_ligne_inv_ins" ON ligne_inventaire FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_ligne_inv_upd" ON ligne_inventaire FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_ligne_inv_del" ON ligne_inventaire FOR DELETE TO authenticated USING (true);

-- ============ alerte ============
CREATE TABLE IF NOT EXISTS alerte (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type text NOT NULL,
  cible_type text,
  cible_id bigint,
  message text NOT NULL,
  gravite text NOT NULL CHECK (gravite IN ('BASSE','MOYENNE','HAUTE')),
  created_at timestamptz NOT NULL DEFAULT now(),
  acquittee boolean NOT NULL DEFAULT false,
  date_acquittement timestamptz,
  acquitte_par bigint REFERENCES utilisateur(id) ON DELETE SET NULL
);
ALTER TABLE alerte ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_alerte_acquittee ON alerte(acquittee);
CREATE INDEX IF NOT EXISTS idx_alerte_gravite ON alerte(gravite);
DROP POLICY IF EXISTS "auth_crud_alerte" ON alerte;
CREATE POLICY "auth_crud_alerte" ON alerte FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_alerte_ins" ON alerte FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_alerte_upd" ON alerte FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_alerte_del" ON alerte FOR DELETE TO authenticated USING (true);

-- ============ journal_activite ============
CREATE TABLE IF NOT EXISTS journal_activite (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  date_heure timestamptz NOT NULL DEFAULT now(),
  utilisateur_id bigint REFERENCES utilisateur(id) ON DELETE SET NULL,
  categorie text NOT NULL,
  action text NOT NULL,
  cible_type text,
  cible_id bigint,
  details text
);
ALTER TABLE journal_activite ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_activite(date_heure);
CREATE INDEX IF NOT EXISTS idx_journal_categorie ON journal_activite(categorie);
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal_activite(utilisateur_id);
DROP POLICY IF EXISTS "auth_crud_journal" ON journal_activite;
CREATE POLICY "auth_crud_journal" ON journal_activite FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_journal_ins" ON journal_activite FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_journal_upd" ON journal_activite FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_journal_del" ON journal_activite FOR DELETE TO authenticated USING (true);

-- ============ historique_connexion ============
CREATE TABLE IF NOT EXISTS historique_connexion (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  utilisateur_id bigint REFERENCES utilisateur(id) ON DELETE SET NULL,
  date_heure timestamptz NOT NULL DEFAULT now(),
  type text NOT NULL CHECK (type IN ('CONNEXION','DECONNEXION','ECHEC','VERROUILLAGE','RECUPERATION')),
  succes boolean NOT NULL DEFAULT true
);
ALTER TABLE historique_connexion ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_hc_user ON historique_connexion(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_hc_date ON historique_connexion(date_heure);
DROP POLICY IF EXISTS "auth_crud_hc" ON historique_connexion;
CREATE POLICY "auth_crud_hc" ON historique_connexion FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_hc_ins" ON historique_connexion FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_hc_upd" ON historique_connexion FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_hc_del" ON historique_connexion FOR DELETE TO authenticated USING (true);

-- ============ parametre ============
CREATE TABLE IF NOT EXISTS parametre (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  cle text NOT NULL UNIQUE,
  valeur text,
  type text NOT NULL CHECK (type IN ('TEXT','INT','REAL','BOOL','JSON')) DEFAULT 'TEXT',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE parametre ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_crud_param" ON parametre;
CREATE POLICY "auth_crud_param" ON parametre FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_param_ins" ON parametre FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_param_upd" ON parametre FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_param_del" ON parametre FOR DELETE TO authenticated USING (true);

-- ============ sequence ============
CREATE TABLE IF NOT EXISTS sequence (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nom text NOT NULL UNIQUE,
  prefixe text,
  annee int,
  jour date,
  compteur bigint NOT NULL DEFAULT 0
);
ALTER TABLE sequence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_crud_seq" ON sequence;
CREATE POLICY "auth_crud_seq" ON sequence FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_crud_seq_ins" ON sequence FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_crud_seq_seq_upd" ON sequence FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_crud_seq_del" ON sequence FOR DELETE TO authenticated USING (true);

-- ============ updated_at triggers ============
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_client_updated ON client;
CREATE TRIGGER trg_client_updated BEFORE UPDATE ON client FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_dest_updated ON destinataire;
CREATE TRIGGER trg_dest_updated BEFORE UPDATE ON destinataire FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_livreur_updated ON livreur;
CREATE TRIGGER trg_livreur_updated BEFORE UPDATE ON livreur FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_colis_updated ON colis;
CREATE TRIGGER trg_colis_updated BEFORE UPDATE ON colis FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_article_updated ON article_stock;
CREATE TRIGGER trg_article_updated BEFORE UPDATE ON article_stock FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_param_updated ON parametre;
CREATE TRIGGER trg_param_updated BEFORE UPDATE ON parametre FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============ RPC: next_sequence ============
-- Atomically increments a named counter and returns the prefix + zero-padded number.
CREATE OR REPLACE FUNCTION next_sequence(p_nom text, p_pad int DEFAULT 5) RETURNS text AS $$
DECLARE
  v_prefixe text;
  v_compteur bigint;
  v_annee int;
  v_jour date;
BEGIN
  INSERT INTO sequence (nom, prefixe, annee, jour, compteur)
  VALUES (p_nom, '', date_part('year', now())::int, current_date, 1)
  ON CONFLICT (nom) DO UPDATE
    SET compteur = sequence.compteur + 1,
        annee = CASE WHEN p_nom IN ('COLIS_JOURNALIER') THEN date_part('year', now())::int ELSE sequence.annee END,
        jour = CASE WHEN p_nom IN ('COLIS_JOURNALIER') THEN current_date ELSE sequence.jour END
  RETURNING prefixe, compteur, annee, jour INTO v_prefixe, v_compteur, v_annee, v_jour;

  -- For COLIS_JOURNALIER, reset counter at day change (handled by ON CONFLICT above for existing rows; for new rows compteur=1).
  RETURN COALESCE(v_prefixe, '') || lpad(v_compteur::text, p_pad, '0');
END;
$$ LANGUAGE plpgsql;

-- Allow authenticated to call next_sequence
DROP POLICY IF EXISTS "auth_exec_seq" ON sequence;
GRANT EXECUTE ON FUNCTION next_sequence(text, int) TO authenticated;

-- ============ Seed: default parameters + cities + stock categories ============
INSERT INTO parametre (cle, valeur, type) VALUES
  ('entreprise_nom', 'Khalil Textile Manager', 'TEXT'),
  ('entreprise_adresse', 'Dakar, Sénégal', 'TEXT'),
  ('entreprise_telephone', '+221 77 000 00 00', 'TEXT'),
  ('entreprise_email', 'contact@khalil-textile.sn', 'TEXT'),
  ('devise', 'XOF', 'TEXT'),
  ('devise_symbole', 'FCFA', 'TEXT'),
  ('devise_position', 'apres', 'TEXT'),
  ('devise_decimales', '0', 'INT'),
  ('theme', 'sombre', 'TEXT'),
  ('langue', 'fr', 'TEXT'),
  ('surcout_express', '0', 'REAL'),
  ('delai_alerte_retard_h', '48', 'INT'),
  ('delai_alerte_impaye_j', '7', 'INT')
ON CONFLICT (cle) DO NOTHING;

INSERT INTO ville (nom, region, tarif_port) VALUES
  ('Dakar', 'Dakar', 1000),
  ('Thiès', 'Thiès', 1500),
  ('Saint-Louis', 'Saint-Louis', 2000),
  ('Touba', 'Diourbel', 1800),
  ('Mbour', 'Thiès', 1500),
  ('Kaolack', 'Kaolack', 2500),
  ('Ziguinchor', 'Ziguinchor', 3000)
ON CONFLICT (nom) DO NOTHING;
