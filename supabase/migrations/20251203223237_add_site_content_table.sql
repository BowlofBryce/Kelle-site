/*
  # Add Site Content Management Table

  1. New Tables
    - `site_content`
      - `id` (uuid, primary key)
      - `key` (text, unique) - The content key/identifier
      - `value` (jsonb) - The content value (supports any data type)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `site_content` table
    - Add policy for public read access
    - Add policy for authenticated admin write access (checks users.role = 'admin')
*/

CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site content"
  ON site_content
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage site content"
  ON site_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_site_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_site_content_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_site_content_updated_at_trigger
      BEFORE UPDATE ON site_content
      FOR EACH ROW
      EXECUTE FUNCTION update_site_content_updated_at();
  END IF;
END $$;

INSERT INTO site_content (key, value) VALUES
  ('site_title', '"The Velvet Hollow"'),
  ('site_tagline', '"Where ink meets fabric"'),
  ('hero_title', '"Welcome to The Velvet Hollow"'),
  ('hero_subtitle', '"Exclusive merch & designs from the underground"'),
  ('bulletin_text', '"🎉 NEW DROP ALERT! Check out our latest designs!"'),
  ('bulletin_enabled', 'true'),
  ('email_contact', '"hello@velvethollowe.com"')
ON CONFLICT (key) DO NOTHING;