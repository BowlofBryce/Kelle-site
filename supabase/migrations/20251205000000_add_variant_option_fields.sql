/*
  # Add variant option fields

  1. Changes
    - Add size, color, option_values columns to variants table if missing
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'size'
  ) THEN
    ALTER TABLE variants ADD COLUMN size text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'color'
  ) THEN
    ALTER TABLE variants ADD COLUMN color text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'option_values'
  ) THEN
    ALTER TABLE variants ADD COLUMN option_values jsonb;
  END IF;
END $$;
