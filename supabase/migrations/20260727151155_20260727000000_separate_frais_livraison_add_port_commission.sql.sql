/*
# Séparer les frais de livraison du montant des articles

## Contexte
Actuellement, `colis.montant` mélange la valeur des articles et les frais de port.
Les frais de livraison doivent être indépendants de la comptabilité de l'entreprise
et être crédités automatiquement au livreur lors de la livraison, que le client
ait payé en avance ou à la livraison.

## Changes

### 1. colis table
- ADD COLUMN `frais_livraison` numeric(14,2) NOT NULL DEFAULT 0
  — stocke le frais de port (tarif de la ville de destination) séparément du
  montant des articles. Le total à encaisser du client = montant + frais_livraison.
  Les frais de livraison sont crédités au livreur à la livraison, pas à l'entreprise.

### 2. livreur table
- REPLACE CHECK constraint on type_commission to add 'PORT' option:
  'PORT' = le livreur reçoit les frais de livraison (port) pour chaque colis livré.
  'FIXE' = le livreur reçoit un montant fixe par colis (comportement existant).
  'AUCUNE' = aucune commission.

## Security
No RLS changes — existing policies remain valid and unaffected.

## Notes
- `frais_livraison` defaults to 0 for existing colis.
- When a colis is marked LIVRE with a livreur assigned (type_commission = 'PORT'),
  the frais_livraison amount is automatically credited to commission_livreur.
- The delivery fee is independent of the enterprise: it enters as a recette when
  the client pays, and exits as a commission charge when the livreur is paid.
  Net effect on the enterprise: zero for the delivery fee portion.
*/

-- 1. Add frais_livraison column to colis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'colis' AND column_name = 'frais_livraison'
  ) THEN
    ALTER TABLE colis
      ADD COLUMN frais_livraison numeric(14,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2. Replace check constraint on livreur.type_commission to add 'PORT'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'livreur' AND constraint_name = 'livreur_type_commission_check'
  ) THEN
    ALTER TABLE livreur DROP CONSTRAINT livreur_type_commission_check;
  END IF;
END $$;
ALTER TABLE livreur ADD CONSTRAINT livreur_type_commission_check
  CHECK (type_commission IN ('PORT','FIXE','AUCUNE'));