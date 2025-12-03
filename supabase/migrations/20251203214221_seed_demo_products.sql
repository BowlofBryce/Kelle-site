/*
  # Seed Demo Products

  ## Overview
  Adds demo products with variants to showcase The Velvet Hollow store.
  Uses Pexels stock photos for tattoo and apparel imagery.

  ## Products Added
  1. Skull & Roses Classic Tee - Traditional tattoo design
  2. Snake Coil Hoodie - Neo-traditional serpent design
  3. Sacred Heart Longsleeve - Classic flash design
  4. Death Moth Tank Top - Dark illustrative design
  5. Geometric Wolf Tee - Modern geometric style
  6. Vintage Flash Bundle - Limited edition print set
  7. Blackwork Rose Hoodie - Minimalist blackwork design
  8. Pin-Up Vixen Tee - Classic Americana style

  All products are marked as active and the first 4 are featured for the "Top 8" section.
*/

-- Insert demo products with featured status
INSERT INTO products (name, slug, description, price_cents, thumbnail_url, images, active, featured) VALUES
(
  'Skull & Roses Classic Tee',
  'skull-roses-classic-tee',
  'Traditional tattoo flash meets premium comfort. This heavyweight cotton tee features a hand-drawn skull wrapped in thorny roses, printed with eco-friendly inks that won''t fade.',
  3500,
  'https://images.pexels.com/photos/1058728/pexels-photo-1058728.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['https://images.pexels.com/photos/1058728/pexels-photo-1058728.jpeg?auto=compress&cs=tinysrgb&w=800'],
  true,
  true
),
(
  'Snake Coil Hoodie',
  'snake-coil-hoodie',
  'Stay warm with attitude. Neo-traditional serpent design coils around the back of this ultra-soft fleece hoodie. Front features subtle snake scales pattern.',
  6500,
  'https://images.pexels.com/photos/2887766/pexels-photo-2887766.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['https://images.pexels.com/photos/2887766/pexels-photo-2887766.jpeg?auto=compress&cs=tinysrgb&w=800'],
  true,
  true
),
(
  'Sacred Heart Longsleeve',
  'sacred-heart-longsleeve',
  'Classic flash design on premium long sleeve. The sacred heart burns bright on the chest with detailed scrollwork and banner reading "Amor Eterno".',
  4500,
  'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=800'],
  true,
  true
),
(
  'Death Moth Tank Top',
  'death-moth-tank-top',
  'Dark and mysterious. Giant death''s-head hawk moth spreads across the back of this relaxed fit tank. Perfect for hot summer nights and concert season.',
  3200,
  'https://images.pexels.com/photos/991509/pexels-photo-991509.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['https://images.pexels.com/photos/991509/pexels-photo-991509.jpeg?auto=compress&cs=tinysrgb&w=800'],
  true,
  true
),
(
  'Geometric Wolf Tee',
  'geometric-wolf-tee',
  'Modern meets primal. Striking geometric wolf design in stark black and white. Each line is precision-printed for sharp, clean edges that stand out.',
  3800,
  'https://images.pexels.com/photos/2897531/pexels-photo-2897531.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['https://images.pexels.com/photos/2897531/pexels-photo-2897531.jpeg?auto=compress&cs=tinysrgb&w=800'],
  true,
  false
),
(
  'Vintage Flash Bundle',
  'vintage-flash-bundle',
  'Limited edition print set featuring 12 classic tattoo flash designs. Each 8x10 print is archival quality and ready to frame. Perfect for your studio or collection.',
  8900,
  'https://images.pexels.com/photos/1797428/pexels-photo-1797428.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['https://images.pexels.com/photos/1797428/pexels-photo-1797428.jpeg?auto=compress&cs=tinysrgb&w=800'],
  true,
  false
),
(
  'Blackwork Rose Hoodie',
  'blackwork-rose-hoodie',
  'Minimalist elegance. Single blackwork rose blooms on the front of this premium heavyweight hoodie. Made from organic cotton blend with a buttery soft feel.',
  7200,
  'https://images.pexels.com/photos/2294342/pexels-photo-2294342.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['https://images.pexels.com/photos/2294342/pexels-photo-2294342.jpeg?auto=compress&cs=tinysrgb&w=800'],
  true,
  false
),
(
  'Pin-Up Vixen Tee',
  'pin-up-vixen-tee',
  'Classic Americana meets modern attitude. Vintage pin-up girl with tattoos and a smirk. This design celebrates old school cool with a contemporary twist.',
  3600,
  'https://images.pexels.com/photos/4666751/pexels-photo-4666751.jpeg?auto=compress&cs=tinysrgb&w=800',
  ARRAY['https://images.pexels.com/photos/4666751/pexels-photo-4666751.jpeg?auto=compress&cs=tinysrgb&w=800'],
  true,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- Get product IDs for variant creation (using CTEs to make this more maintainable)
DO $$
DECLARE
  skull_roses_id uuid;
  snake_coil_id uuid;
  sacred_heart_id uuid;
  death_moth_id uuid;
  geometric_wolf_id uuid;
  blackwork_rose_id uuid;
  pin_up_vixen_id uuid;
BEGIN
  -- Get product IDs
  SELECT id INTO skull_roses_id FROM products WHERE slug = 'skull-roses-classic-tee';
  SELECT id INTO snake_coil_id FROM products WHERE slug = 'snake-coil-hoodie';
  SELECT id INTO sacred_heart_id FROM products WHERE slug = 'sacred-heart-longsleeve';
  SELECT id INTO death_moth_id FROM products WHERE slug = 'death-moth-tank-top';
  SELECT id INTO geometric_wolf_id FROM products WHERE slug = 'geometric-wolf-tee';
  SELECT id INTO blackwork_rose_id FROM products WHERE slug = 'blackwork-rose-hoodie';
  SELECT id INTO pin_up_vixen_id FROM products WHERE slug = 'pin-up-vixen-tee';

  -- Insert variants for Skull & Roses Classic Tee
  IF skull_roses_id IS NOT NULL THEN
    INSERT INTO variants (product_id, name, sku, price_cents, stock) VALUES
    (skull_roses_id, 'Small / Black', 'SKR-BLK-S', 3500, 50),
    (skull_roses_id, 'Medium / Black', 'SKR-BLK-M', 3500, 50),
    (skull_roses_id, 'Large / Black', 'SKR-BLK-L', 3500, 50),
    (skull_roses_id, 'XL / Black', 'SKR-BLK-XL', 3500, 50)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert variants for Snake Coil Hoodie
  IF snake_coil_id IS NOT NULL THEN
    INSERT INTO variants (product_id, name, sku, price_cents, stock) VALUES
    (snake_coil_id, 'Small / Charcoal', 'SNC-CHR-S', 6500, 30),
    (snake_coil_id, 'Medium / Charcoal', 'SNC-CHR-M', 6500, 30),
    (snake_coil_id, 'Large / Charcoal', 'SNC-CHR-L', 6500, 30),
    (snake_coil_id, 'XL / Charcoal', 'SNC-CHR-XL', 6500, 30)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert variants for Sacred Heart Longsleeve
  IF sacred_heart_id IS NOT NULL THEN
    INSERT INTO variants (product_id, name, sku, price_cents, stock) VALUES
    (sacred_heart_id, 'Small / Burgundy', 'SCH-BUR-S', 4500, 40),
    (sacred_heart_id, 'Medium / Burgundy', 'SCH-BUR-M', 4500, 40),
    (sacred_heart_id, 'Large / Burgundy', 'SCH-BUR-L', 4500, 40),
    (sacred_heart_id, 'XL / Burgundy', 'SCH-BUR-XL', 4500, 40)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert variants for Death Moth Tank Top
  IF death_moth_id IS NOT NULL THEN
    INSERT INTO variants (product_id, name, sku, price_cents, stock) VALUES
    (death_moth_id, 'Small / Black', 'DTH-BLK-S', 3200, 45),
    (death_moth_id, 'Medium / Black', 'DTH-BLK-M', 3200, 45),
    (death_moth_id, 'Large / Black', 'DTH-BLK-L', 3200, 45)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert variants for Geometric Wolf Tee
  IF geometric_wolf_id IS NOT NULL THEN
    INSERT INTO variants (product_id, name, sku, price_cents, stock) VALUES
    (geometric_wolf_id, 'Small / White', 'GEO-WHT-S', 3800, 50),
    (geometric_wolf_id, 'Medium / White', 'GEO-WHT-M', 3800, 50),
    (geometric_wolf_id, 'Large / White', 'GEO-WHT-L', 3800, 50),
    (geometric_wolf_id, 'XL / White', 'GEO-WHT-XL', 3800, 50)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert variants for Blackwork Rose Hoodie
  IF blackwork_rose_id IS NOT NULL THEN
    INSERT INTO variants (product_id, name, sku, price_cents, stock) VALUES
    (blackwork_rose_id, 'Small / Black', 'BLK-BLK-S', 7200, 25),
    (blackwork_rose_id, 'Medium / Black', 'BLK-BLK-M', 7200, 25),
    (blackwork_rose_id, 'Large / Black', 'BLK-BLK-L', 7200, 25),
    (blackwork_rose_id, 'XL / Black', 'BLK-BLK-XL', 7200, 25)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Insert variants for Pin-Up Vixen Tee
  IF pin_up_vixen_id IS NOT NULL THEN
    INSERT INTO variants (product_id, name, sku, price_cents, stock) VALUES
    (pin_up_vixen_id, 'Small / Vintage White', 'PIN-VIN-S', 3600, 40),
    (pin_up_vixen_id, 'Medium / Vintage White', 'PIN-VIN-M', 3600, 40),
    (pin_up_vixen_id, 'Large / Vintage White', 'PIN-VIN-L', 3600, 40),
    (pin_up_vixen_id, 'XL / Vintage White', 'PIN-VIN-XL', 3600, 40)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Assign products to categories
DO $$
DECLARE
  tshirt_cat_id uuid;
  hoodie_cat_id uuid;
  accessories_cat_id uuid;
  limited_cat_id uuid;
BEGIN
  SELECT id INTO tshirt_cat_id FROM categories WHERE slug = 't-shirts';
  SELECT id INTO hoodie_cat_id FROM categories WHERE slug = 'hoodies';
  SELECT id INTO accessories_cat_id FROM categories WHERE slug = 'accessories';
  SELECT id INTO limited_cat_id FROM categories WHERE slug = 'limited-edition';

  -- Assign categories to products
  INSERT INTO product_categories (product_id, category_id)
  SELECT p.id, tshirt_cat_id
  FROM products p
  WHERE p.slug IN ('skull-roses-classic-tee', 'death-moth-tank-top', 'geometric-wolf-tee', 'pin-up-vixen-tee')
  AND tshirt_cat_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  INSERT INTO product_categories (product_id, category_id)
  SELECT p.id, hoodie_cat_id
  FROM products p
  WHERE p.slug IN ('snake-coil-hoodie', 'blackwork-rose-hoodie', 'sacred-heart-longsleeve')
  AND hoodie_cat_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  INSERT INTO product_categories (product_id, category_id)
  SELECT p.id, accessories_cat_id
  FROM products p
  WHERE p.slug = 'vintage-flash-bundle'
  AND accessories_cat_id IS NOT NULL
  ON CONFLICT DO NOTHING;

  INSERT INTO product_categories (product_id, category_id)
  SELECT p.id, limited_cat_id
  FROM products p
  WHERE p.slug = 'vintage-flash-bundle'
  AND limited_cat_id IS NOT NULL
  ON CONFLICT DO NOTHING;
END $$;