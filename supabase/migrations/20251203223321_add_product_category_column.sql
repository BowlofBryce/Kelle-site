/*
  # Add category column to products table

  1. Changes
    - Add `category` column to `products` table with default value 'merch'
    - This allows categorizing products for filtering (e.g., 'merch', 'apparel', 'accessories')
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category'
  ) THEN
    ALTER TABLE products ADD COLUMN category text DEFAULT 'merch';
  END IF;
END $$;