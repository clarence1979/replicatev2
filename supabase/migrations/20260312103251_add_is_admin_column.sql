/*
  # Add is_admin column to login table

  1. Changes
    - Add `is_admin` boolean column to login table with default value of false
    - This column tracks whether a user has admin privileges
  
  2. Notes
    - Existing users will default to non-admin (false)
    - Column is NOT NULL with a default value for data safety
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'login' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE login ADD COLUMN is_admin boolean DEFAULT false NOT NULL;
  END IF;
END $$;