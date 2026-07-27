/*
# Add BROUILLON (draft) to the allowed colis statuts

1. Modified constraints
- `colis_statut_check` on `colis` is dropped and recreated to include the new
  `BROUILLON` value, so a colis can be saved as a draft with incomplete info.

2. Security
- No RLS or policy changes.

3. Important notes
- The old constraint is dropped only to be replaced; no data is touched.
- Existing rows keep their current statut; only future inserts/updates can now
  use `BROUILLON`.
*/

ALTER TABLE colis DROP CONSTRAINT colis_statut_check;
ALTER TABLE colis ADD CONSTRAINT colis_statut_check
  CHECK (statut = ANY (ARRAY['BROUILLON'::text, 'RECU'::text, 'EXPEDIE'::text, 'EN_LIVRAISON'::text, 'LIVRE'::text, 'RETOURNE'::text, 'ANNULE'::text]));
