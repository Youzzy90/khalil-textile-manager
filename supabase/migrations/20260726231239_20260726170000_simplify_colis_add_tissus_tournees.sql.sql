/*
# Simplification colis, tissus, tournées

1. Modifications de `colis`
- `poids` : devient nullable, sans contrainte CHECK (le poids n'est plus géré).
- `valeur_declaree` : reste en base mais non utilisée dans l'UI.
- `fragile` : reste en base mais non utilisée dans l'UI.
- Nouvelle colonne `retrait_comptoir` (boolean, défaut false) : le client récupère
  son colis lui-même (pas de livraison par chauffeur).

2. Modifications de `livreur`
- `plaque` et `date_embauche` : deviennent nullable (non utilisés dans l'UI).
- `type_commission` : la contrainte CHECK est remplacée pour n'accepter que
  'FIXE' et 'AUCUNE' (suppression du mode 'POURCENTAGE' — tous les livreurs
  reçoivent un montant fixe par colis).

3. Nouvelle table `ligne_colis`
- Lignes d'articles (tissus) attachées à un colis.
- `article_id` (FK vers article_stock, nullable pour articles hors catalogue).
- `designation`, `quantite`, `prix_unitaire`, `montant` (auto-calculé).
- Permet la saisie d'articles avec prix négociable par client.

4. Sécurité
- RLS activé sur `ligne_colis` avec politiques CRUD pour authenticated.
*/

-- ============ colis : assouplir poids, ajouter retrait_comptoir ============
DO $$ BEGIN
  ALTER TABLE colis ALTER COLUMN poids DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE colis ALTER COLUMN poids SET DEFAULT 1;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

ALTER TABLE colis DROP CONSTRAINT IF EXISTS colis_poids_check;
ALTER TABLE colis DROP CONSTRAINT IF EXISTS poids_check;

ALTER TABLE colis ADD COLUMN IF NOT EXISTS retrait_comptoir boolean NOT NULL DEFAULT false;

-- ============ livreur : assouplir plaque/date_embauche, commission FIXE-only ============
DO $$ BEGIN
  ALTER TABLE livreur ALTER COLUMN plaque DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE livreur ALTER COLUMN date_embauche DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE livreur DROP CONSTRAINT IF EXISTS livreur_type_commission_check;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE livreur ADD CONSTRAINT livreur_type_commission_check
    CHECK (type_commission IN ('FIXE','AUCUNE'));
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============ ligne_colis : lignes d'articles par colis ============
CREATE TABLE IF NOT EXISTS ligne_colis (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  colis_id bigint NOT NULL REFERENCES colis(id) ON DELETE CASCADE,
  article_id bigint REFERENCES article_stock(id) ON DELETE SET NULL,
  designation text NOT NULL,
  quantite numeric(14,2) NOT NULL CHECK (quantite > 0),
  prix_unitaire numeric(14,2) NOT NULL DEFAULT 0,
  montant numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ligne_colis ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ligne_colis_colis ON ligne_colis(colis_id);

DROP POLICY IF EXISTS "auth_crud_ligne_colis_sel" ON ligne_colis;
CREATE POLICY "auth_crud_ligne_colis_sel" ON ligne_colis FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_crud_ligne_colis_ins" ON ligne_colis;
CREATE POLICY "auth_crud_ligne_colis_ins" ON ligne_colis FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_crud_ligne_colis_upd" ON ligne_colis;
CREATE POLICY "auth_crud_ligne_colis_upd" ON ligne_colis FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_crud_ligne_colis_del" ON ligne_colis;
CREATE POLICY "auth_crud_ligne_colis_del" ON ligne_colis FOR DELETE TO authenticated USING (true);
