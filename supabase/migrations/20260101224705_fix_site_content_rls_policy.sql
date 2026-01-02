/*
  # Fix site_content RLS Policy

  Update site_content admin policy to use (select auth.uid()) for better performance
*/

DROP POLICY IF EXISTS "Admins can manage site content" ON site_content;

CREATE POLICY "Admins can manage site content"
  ON site_content
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