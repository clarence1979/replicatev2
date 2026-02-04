/*
  # Add Admin Role to Login System

  1. Changes
    - Add `is_admin` boolean column to `login` table
    - Set default value to false for security
    - Set user 'clarence' as admin
  
  2. Security
    - No changes to RLS policies needed
    - Admin verification will be handled in edge functions
    - Direct database access remains restricted by existing RLS
*/

-- Add is_admin column to login table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'login' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE login ADD COLUMN is_admin BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- Set clarence as admin
UPDATE login 
SET is_admin = true 
WHERE name = 'clarence';

-- If clarence doesn't exist, create the account
INSERT INTO login (name, password, is_admin)
VALUES ('clarence', 'admin123', true)
ON CONFLICT (name) DO UPDATE SET is_admin = true;
