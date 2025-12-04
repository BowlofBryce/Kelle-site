/*
  # Admin Key Verification Function

  1. Functions
    - `verify_admin_key(key text)` - Verifies an admin key and returns true if valid
    - Updates last_used_at timestamp when key is used
  
  2. Security
    - Function runs with SECURITY DEFINER to access admin_keys table
    - Returns only boolean, never exposes key data
*/

CREATE OR REPLACE FUNCTION verify_admin_key(input_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM admin_keys
    WHERE key_hash = crypt(input_key, key_hash)
    AND is_active = true
  ) INTO key_exists;
  
  IF key_exists THEN
    UPDATE admin_keys
    SET last_used_at = now()
    WHERE key_hash = crypt(input_key, key_hash);
  END IF;
  
  RETURN key_exists;
END;
$$;
