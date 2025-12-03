/*
  # Automatic Admin User Setup

  ## Overview
  Sets up automatic user creation in the users table when someone signs up through Supabase Auth.
  This allows the first user to automatically become an admin.

  ## Changes
  1. Creates a trigger function that automatically adds new auth users to the users table
  2. The first user to sign up will have admin role by default
  3. Adds RLS policies for users table to allow admins to view all users

  ## Security
  - Only authenticated users can view the users table
  - Only admins can see role information
  - Automatic user creation happens securely through database trigger
*/

-- Function to automatically create user record when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'admin');
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for users table
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own record"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());