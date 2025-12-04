/*
  # Admin Keys System

  1. New Tables
    - `admin_keys`
      - `id` (uuid, primary key)
      - `key_hash` (text, unique) - hashed version of the admin key
      - `name` (text) - description of the key
      - `is_active` (boolean) - whether the key is currently active
      - `created_at` (timestamp)
      - `last_used_at` (timestamp)
  
  2. Security
    - Enable RLS on `admin_keys` table
    - Keys are stored as hashes, never in plain text
    - Only the system can read keys for verification
*/

CREATE TABLE IF NOT EXISTS admin_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text UNIQUE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE admin_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage admin keys"
  ON admin_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
