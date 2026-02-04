/*
  # Fix API Secrets Security

  1. Changes
    - Drop the insecure public read policy on api_secrets table
    - API secrets should NEVER be readable by clients
    - Only edge functions (using service role) should access api_secrets
  
  2. Security
    - Remove "Anyone can read api_secrets" policy
    - This ensures API keys are only accessible by backend edge functions
*/

-- Drop the insecure policy that allows anyone to read API secrets
DROP POLICY IF EXISTS "Anyone can read api_secrets" ON api_secrets;

-- No new policies needed - edge functions use service role which bypasses RLS
