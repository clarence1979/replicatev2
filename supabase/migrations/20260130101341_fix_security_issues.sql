/*
  # Fix Security Issues

  1. Performance Improvements
    - Drop unused index `idx_student_generations_student_name` 
    - Drop unused index `idx_user_uploads_created_at`

  2. Security Improvements
    - Drop insecure UPDATE policy on login table (both USING and WITH CHECK were true)
    - Create secure stored procedure for password updates with validation
    - Replace overly permissive INSERT policies on student_generations with validated ones
    - Replace overly permissive INSERT policies on user_uploads with validated ones

  3. Important Notes
    - Password updates now go through a secure function that validates the current password
    - INSERT policies now require essential fields to be populated
    - This provides better security while maintaining functionality for educational use
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_student_generations_student_name;
DROP INDEX IF EXISTS idx_user_uploads_created_at;

-- Drop the insecure UPDATE policy on login table
DROP POLICY IF EXISTS "Users can update their own password" ON login;

-- Create a secure function for password updates
CREATE OR REPLACE FUNCTION update_user_password(
  p_username text,
  p_current_password text,
  p_new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_password text;
BEGIN
  -- Validate input
  IF p_username IS NULL OR p_current_password IS NULL OR p_new_password IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'All fields are required');
  END IF;

  IF length(p_new_password) < 8 THEN
    RETURN json_build_object('success', false, 'error', 'New password must be at least 8 characters');
  END IF;

  IF p_current_password = p_new_password THEN
    RETURN json_build_object('success', false, 'error', 'New password must be different from current password');
  END IF;

  -- Get stored password
  SELECT password INTO v_stored_password
  FROM login
  WHERE name = lower(trim(p_username));

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Verify current password
  IF v_stored_password != p_current_password THEN
    RETURN json_build_object('success', false, 'error', 'Current password is incorrect');
  END IF;

  -- Update password
  UPDATE login
  SET password = p_new_password
  WHERE name = lower(trim(p_username));

  RETURN json_build_object('success', true, 'message', 'Password updated successfully');
END;
$$;

-- Drop and recreate INSERT policy for student_generations with validation
DROP POLICY IF EXISTS "Anyone can insert student generations" ON student_generations;

CREATE POLICY "Users can insert valid student generations"
  ON student_generations
  FOR INSERT
  TO public
  WITH CHECK (
    student_name IS NOT NULL 
    AND length(trim(student_name)) > 0
    AND model_name IS NOT NULL 
    AND length(trim(model_name)) > 0
    AND generation_type IS NOT NULL
    AND length(trim(generation_type)) > 0
    AND content_url IS NOT NULL
    AND length(trim(content_url)) > 0
  );

-- Drop and recreate INSERT policy for user_uploads with validation
DROP POLICY IF EXISTS "Anyone can insert user uploads" ON user_uploads;

CREATE POLICY "Users can insert valid user uploads"
  ON user_uploads
  FOR INSERT
  TO public
  WITH CHECK (
    file_name IS NOT NULL 
    AND length(trim(file_name)) > 0
    AND file_type IS NOT NULL 
    AND length(trim(file_type)) > 0
    AND content_url IS NOT NULL
    AND length(trim(content_url)) > 0
  );
