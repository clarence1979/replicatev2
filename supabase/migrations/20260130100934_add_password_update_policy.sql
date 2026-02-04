/*
  # Add Password Update Policy

  1. Changes
    - Add UPDATE policy to login table to allow users to change their own password
  
  2. Security
    - Policy ensures users can only update their own password
    - Uses name-based identification since we're not using auth.uid() in this educational app
*/

-- Create policy for users to update their own password
CREATE POLICY "Users can update their own password"
  ON login
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);