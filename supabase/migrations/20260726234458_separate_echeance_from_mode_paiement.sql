/*
# Separate payment timing from payment method

## Context
Previously, the colis "mode_paiement_attendu" field mixed two distinct concepts:
- WHEN the customer pays (in advance / at delivery)
- HOW the customer pays (cash, Wave, Orange Money, card, transfer)

This migration separates them into two independent fields.

## Changes

### 1. colis table
- ADD COLUMN `echeance_paiement` text NOT NULL DEFAULT 'LIVRAISON'
  CHECK (echeance_paiement IN ('AVANCE','LIVRAISON'))
  — records whether the customer pays in advance (AVANCE) or at delivery (LIVRAISON).
- REPLACE CHECK constraint on `mode_paiement_attendu` to only allow real payment
  methods: ESPECES, WAVE, ORANGE_MONEY, CARTE, VIREMENT.
  (Removed PORT_PAYE and A_LIVRAISON which were timing values, not methods.)

### 2. paiement table
- REPLACE CHECK constraint on `moyen` to only allow:
  ESPECES, WAVE, ORANGE_MONEY, CARTE, VIREMENT.
  (Removed A_LIVRAISON which was a timing value, not a method.)

## Security
No RLS changes — existing policies remain valid and unaffected.

## Notes
- The colis and paiement tables are currently empty (test data was cleared),
  so no data migration is needed for existing rows.
- echeance_paiement defaults to 'LIVRAISON' (pay at delivery), the most common case.
- The constraint replacement is idempotent: it drops the old constraint if it
  exists before adding the new one.
*/

-- 1. Add echeance_paiement column to colis
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'colis' AND column_name = 'echeance_paiement'
  ) THEN
    ALTER TABLE colis
      ADD COLUMN echeance_paiement text NOT NULL DEFAULT 'LIVRAISON'
      CHECK (echeance_paiement IN ('AVANCE','LIVRAISON'));
  END IF;
END $$;

-- 2. Replace check constraint on colis.mode_paiement_attendu
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'colis' AND constraint_name = 'colis_mode_paiement_attendu_check'
  ) THEN
    ALTER TABLE colis DROP CONSTRAINT colis_mode_paiement_attendu_check;
  END IF;
END $$;
ALTER TABLE colis ADD CONSTRAINT colis_mode_paiement_attendu_check
  CHECK (mode_paiement_attendu IN ('ESPECES','WAVE','ORANGE_MONEY','CARTE','VIREMENT'));

-- 3. Replace check constraint on paiement.moyen
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'paiement' AND constraint_name = 'paiement_moyen_check'
  ) THEN
    ALTER TABLE paiement DROP CONSTRAINT paiement_moyen_check;
  END IF;
END $$;
ALTER TABLE paiement ADD CONSTRAINT paiement_moyen_check
  CHECK (moyen IN ('ESPECES','WAVE','ORANGE_MONEY','CARTE','VIREMENT'));