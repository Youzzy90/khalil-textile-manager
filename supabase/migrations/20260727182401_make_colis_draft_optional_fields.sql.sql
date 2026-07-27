/*
# Allow saving a colis as a draft with incomplete information

1. Modified tables
- `colis`
  - `client_id` changed from NOT NULL to NULLABLE (a draft may be saved before the sender is chosen).
  - `destinataire_id` changed from NOT NULL to NULLABLE (a draft may be saved before the recipient is chosen).
  - `contenu` changed from NOT NULL to NULLABLE (a draft may be saved with no content description yet).
  - `ville_destination` changed from NOT NULL to NULLABLE (a draft may be saved before the delivery city is known).
  - `adresse_livraison` changed from NOT NULL to NULLABLE (a draft may be saved before the delivery address is known).

2. Security
- No RLS or policy changes.

3. Important notes
- No data is lost: existing rows keep their values; only the NOT NULL constraint is dropped so future inserts can omit these fields.
- Existing foreign keys on client_id / destinataire_id are preserved; nullable just means the column can be empty for drafts.
*/

ALTER TABLE colis ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE colis ALTER COLUMN destinataire_id DROP NOT NULL;
ALTER TABLE colis ALTER COLUMN contenu DROP NOT NULL;
ALTER TABLE colis ALTER COLUMN ville_destination DROP NOT NULL;
ALTER TABLE colis ALTER COLUMN adresse_livraison DROP NOT NULL;
