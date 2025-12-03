/*
  # Add available column to variants table

  1. Changes
    - Add `available` column to `variants` table with default value true
    - This tracks if a variant is currently available for purchase
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'available'
  ) THEN
    ALTER TABLE variants ADD COLUMN available boolean DEFAULT true;
  END IF;
END $$;