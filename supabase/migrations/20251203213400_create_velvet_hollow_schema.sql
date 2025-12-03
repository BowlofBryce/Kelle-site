/*
  # The Velvet Hollow - Complete Database Schema

  ## Overview
  Creates all tables for a MySpace-inspired tattoo merch store with Stripe payments,
  Printify fulfillment, admin CMS, and analytics tracking.

  ## New Tables

  ### 1. `users` - Admin users
    - `id` (uuid, FK to auth.users)
    - `email` (text, unique)
    - `role` (text, default 'admin')
    - `created_at` (timestamptz)

  ### 2. `categories` - Product categories (e.g., T-Shirts, Hoodies, Accessories)
    - `id` (uuid, primary key)
    - `name` (text)
    - `slug` (text, unique)
    - `created_at` (timestamptz)

  ### 3. `products` - Main product catalog
    - `id` (uuid, primary key)
    - `name` (text)
    - `slug` (text, unique)
    - `description` (text)
    - `price_cents` (integer) - Base price in cents
    - `currency` (text, default 'usd')
    - `thumbnail_url` (text)
    - `images` (text[]) - Array of image URLs
    - `printify_id` (text) - Printify product ID
    - `printify_shop_id` (text)
    - `active` (boolean, default true)
    - `featured` (boolean, default false) - For "Top 8" display
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 4. `variants` - Product variants (sizes, colors)
    - `id` (uuid, primary key)
    - `product_id` (uuid, FK to products)
    - `name` (text) - e.g., "Medium / Black"
    - `sku` (text)
    - `price_cents` (integer)
    - `printify_variant_id` (text)
    - `stock` (integer)
    - `created_at` (timestamptz)

  ### 5. `product_categories` - Many-to-many join table
    - `product_id` (uuid, FK to products)
    - `category_id` (uuid, FK to categories)

  ### 6. `orders` - Customer orders
    - `id` (uuid, primary key)
    - `stripe_payment_id` (text)
    - `status` (text) - 'pending', 'paid', 'failed', 'fulfilled'
    - `email` (text)
    - `total_cents` (integer)
    - `currency` (text, default 'usd')
    - `printify_order_id` (text)
    - `customer_name` (text)
    - `shipping_address` (jsonb)
    - `created_at` (timestamptz)

  ### 7. `order_items` - Line items for each order
    - `id` (uuid, primary key)
    - `order_id` (uuid, FK to orders)
    - `product_id` (uuid, FK to products)
    - `variant_id` (uuid, FK to variants)
    - `name` (text)
    - `quantity` (integer)
    - `price_cents` (integer)
    - `created_at` (timestamptz)

  ### 8. `editable_sections` - CMS content blocks
    - `id` (uuid, primary key)
    - `key` (text, unique) - e.g., 'home.hero.title'
    - `content_json` (jsonb) - Flexible JSON content
    - `updated_at` (timestamptz)

  ### 9. `analytics_events` - Simple event tracking
    - `id` (uuid, primary key)
    - `type` (text) - 'page_view', 'product_view', 'add_to_cart', 'checkout'
    - `path` (text)
    - `product_id` (uuid)
    - `session_id` (text)
    - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public read access for products, categories, editable_sections
  - Admin-only write access for products, categories, editable_sections
  - Order creation by anyone (for checkout), but read only by admins
  - Analytics events can be created by anyone
*/

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'admin' NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  price_cents integer NOT NULL,
  currency text DEFAULT 'usd',
  thumbnail_url text DEFAULT '',
  images text[] DEFAULT '{}',
  printify_id text,
  printify_shop_id text,
  active boolean DEFAULT true,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Variants table
CREATE TABLE IF NOT EXISTS variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sku text,
  price_cents integer NOT NULL,
  printify_variant_id text,
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Product categories join table
CREATE TABLE IF NOT EXISTS product_categories (
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (product_id, category_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_id text,
  status text DEFAULT 'pending' NOT NULL,
  email text NOT NULL,
  total_cents integer NOT NULL,
  currency text DEFAULT 'usd',
  printify_order_id text,
  customer_name text,
  shipping_address jsonb,
  created_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) NOT NULL,
  variant_id uuid REFERENCES variants(id),
  name text NOT NULL,
  quantity integer DEFAULT 1 NOT NULL,
  price_cents integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Editable sections (CMS)
CREATE TABLE IF NOT EXISTS editable_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  content_json jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  path text,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE editable_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for products (public read active products, admin full access)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for variants (public read, admin write)
CREATE POLICY "Anyone can view variants"
  ON variants FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = variants.product_id
      AND products.active = true
    )
  );

CREATE POLICY "Admins can manage variants"
  ON variants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for product_categories (public read, admin write)
CREATE POLICY "Anyone can view product categories"
  ON product_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage product categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for orders (anyone can create, admins can view all)
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for order_items (anyone can create, admins can view)
CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for editable_sections (public read, admin write)
CREATE POLICY "Anyone can view editable sections"
  ON editable_sections FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage editable sections"
  ON editable_sections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for analytics_events (anyone can create, admins can view)
CREATE POLICY "Anyone can create analytics events"
  ON analytics_events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view analytics events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Insert default editable sections for the MySpace-style homepage
INSERT INTO editable_sections (key, content_json) VALUES
  ('home.hero.title', '{"text": "Welcome to The Velvet Hollow", "color": "#ff0080"}'),
  ('home.hero.bio', '{"text": "Your darkest dreams, wearable. Tattoo-inspired streetwear for rebels and artists.", "style": "neon"}'),
  ('home.bulletin.1', '{"text": "New drop this Friday!", "color": "#00ff00", "rotation": -3}'),
  ('home.bulletin.2', '{"text": "Limited edition flash tees", "color": "#ff00ff", "rotation": 2}'),
  ('home.bulletin.3', '{"text": "Free shipping over $50", "color": "#ffff00", "rotation": -1}'),
  ('about.bio', '{"text": "The Velvet Hollow was born from late-night tattoo sessions and a love for early 2000s internet aesthetics. We create wearable art for those who never quite fit in.", "image": ""}'),
  ('music.nowPlaying', '{"artist": "The Velvet Underground", "track": "Venus in Furs", "playing": true}')
ON CONFLICT (key) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, slug) VALUES
  ('T-Shirts', 't-shirts'),
  ('Hoodies', 'hoodies'),
  ('Accessories', 'accessories'),
  ('Flash Designs', 'flash-designs'),
  ('Limited Edition', 'limited-edition')
ON CONFLICT (slug) DO NOTHING;