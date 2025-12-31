/*
  # Add Missing publish_state Column

  ## Changes
  Adds the publish_state column to products table if it doesn't exist.

  ## Tables Affected
  - products

  ## Notes
  This ensures the sync function can properly track product publish state.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'publish_state'
  ) THEN
    ALTER TABLE products ADD COLUMN publish_state text DEFAULT 'published';
  END IF;
END $$;
