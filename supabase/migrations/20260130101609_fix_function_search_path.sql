/*
  # Fix Function Search Path Security Issue

  1. Security Improvements
    - Recreate `update_user_password` function with fixed search_path
    - Set `search_path = public` to prevent search_path injection attacks
    - This ensures the function always uses the public schema and cannot be manipulated

  2. Important Notes
    - Using `SET search_path = public` in the function definition makes it secure
    - This prevents malicious users from changing the search path to hijack function behavior
    - The function maintains all existing validation and security features
*/

-- Drop and recreate the function with a fixed search_path
CREATE OR REPLACE FUNCTION update_user_password(
  p_username text,
  p_current_password text,
  p_new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
