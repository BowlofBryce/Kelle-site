/*
  # Fix Security and Performance Issues

  1. Indexes
    - Add missing indexes for foreign keys
    - Keep existing indexes (they may be used in production)

  2. RLS Policy Optimizations
    - Wrap auth functions with SELECT to prevent re-evaluation per row
    - Consolidate multiple permissive policies into restrictive ones where appropriate

  3. Users Table Policies
    - Add proper RLS policies for users table

  4. Function Security
    - Fix verify_admin_key function search path

  ## Changes

  ### Foreign Key Indexes
  - Add index on analytics_events(product_id)
  - Add index on order_items(product_id)
  - Add index on order_items(variant_id)
  - Add index on product_categories(category_id)

  ### RLS Policy Performance
  - Update all policies to use (select auth.uid()) instead of auth.uid()

  ### Users Table Security
  - Add policies for users table

  ### Function Security
  - Fix verify_admin_key function with immutable search path
*/

-- =============================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id
  ON analytics_events(product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_variant_id
  ON order_items(variant_id);

CREATE INDEX IF NOT EXISTS idx_product_categories_category_id
  ON product_categories(category_id);

-- =============================================
-- 2. FIX RLS POLICIES - CATEGORIES TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

CREATE POLICY "Admins can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

-- =============================================
-- 3. FIX RLS POLICIES - PRODUCTS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

CREATE POLICY "Admins can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

-- =============================================
-- 4. FIX RLS POLICIES - VARIANTS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can manage variants" ON variants;

CREATE POLICY "Admins can manage variants"
  ON variants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

-- =============================================
-- 5. FIX RLS POLICIES - PRODUCT_CATEGORIES TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can manage product categories" ON product_categories;

CREATE POLICY "Admins can manage product categories"
  ON product_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

-- =============================================
-- 6. FIX RLS POLICIES - ORDERS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

-- =============================================
-- 7. FIX RLS POLICIES - ORDER_ITEMS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

CREATE POLICY "Admins can view all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

-- =============================================
-- 8. FIX RLS POLICIES - EDITABLE_SECTIONS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can manage editable sections" ON editable_sections;

CREATE POLICY "Admins can manage editable sections"
  ON editable_sections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

-- =============================================
-- 9. FIX RLS POLICIES - ANALYTICS_EVENTS TABLE
-- =============================================

DROP POLICY IF EXISTS "Admins can view analytics events" ON analytics_events;

CREATE POLICY "Admins can view analytics events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid()) AND users.role = 'admin'
    )
  );

-- =============================================
-- 10. ADD RLS POLICIES - USERS TABLE
-- =============================================

CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid()) AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid()) AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid()) AND u.role = 'admin'
    )
  );

-- =============================================
-- 11. FIX FUNCTION SECURITY - VERIFY_ADMIN_KEY
-- =============================================

DROP FUNCTION IF EXISTS verify_admin_key(text);

CREATE FUNCTION verify_admin_key(input_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_keys
    WHERE key = input_key
    AND (expires_at IS NULL OR expires_at > now())
    AND revoked = false
  );
END;
$$;