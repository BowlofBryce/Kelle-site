/*
  # Add variant preview_url column

  1. Changes
    - Add `preview_url` column to `variants` table to store color-specific product images
    - This allows displaying the correct product image when a color variant is selected
  
  2. Notes
    - Column is nullable since existing variants may not have images yet
    - Will be populated by the sync-printify-products function
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'variants' AND column_name = 'preview_url'
  ) THEN
    ALTER TABLE variants ADD COLUMN preview_url text;
  END IF;
END $$;
