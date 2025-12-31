/*
  # Track Printify publish lifecycle

  1. Changes
    - Add publish_state column to products table to reflect Printify publishing status
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
