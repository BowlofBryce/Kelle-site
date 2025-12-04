/*
  # Add unique constraints for efficient upsert operations

  1. Changes
    - Add unique constraint on `products.printify_id` for efficient product syncing
    - Add unique constraint on `variants.printify_variant_id` for efficient variant syncing
  
  2. Notes
    - These constraints enable O(1) upsert operations instead of select-then-update/insert
    - Dramatically improves sync performance for products and variants
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_printify_id_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_printify_id_key UNIQUE (printify_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'variants_printify_variant_id_key'
  ) THEN
    ALTER TABLE variants ADD CONSTRAINT variants_printify_variant_id_key UNIQUE (printify_variant_id);
  END IF;
END $$;
