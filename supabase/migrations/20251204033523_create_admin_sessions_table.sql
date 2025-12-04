/*
  # Admin Sessions Table

  1. New Tables
    - `admin_sessions`
      - `id` (uuid, primary key)
      - `session_token` (text, unique) - session token for admin access
      - `expires_at` (timestamp) - when the session expires
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `admin_sessions` table
    - Only service role can manage sessions
*/

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage admin sessions"
  ON admin_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
