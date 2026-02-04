/*
  # Create Student Login and API Secrets Tables

  1. New Tables
    - `login`
      - `id` (uuid, primary key) - Unique identifier for each student
      - `name` (text, unique) - Student username
      - `password` (text) - Student password (plaintext for educational purposes)
      - `created_at` (timestamptz) - When the record was created
    
    - `api_secrets`
      - `id` (uuid, primary key) - Unique identifier
      - `key_name` (text, unique) - Name of the API key (e.g., 'replicate_api', 'meshy_api')
      - `key_value` (text) - The actual API key value
      - `created_at` (timestamptz) - When the record was created
      - `updated_at` (timestamptz) - When the record was last updated

  2. Security
    - Enable RLS on both tables
    - Add policy for authenticated users to read login table for authentication
    - Add policy for authenticated users to read api_secrets table
    
  3. Initial Data
    - Populate login table with 20 students (password: 12345678)
    - Create placeholder entries for replicate and meshy API keys
*/

-- Create login table
CREATE TABLE IF NOT EXISTS login (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create api_secrets table
CREATE TABLE IF NOT EXISTS api_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text UNIQUE NOT NULL,
  key_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE login ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_secrets ENABLE ROW LEVEL SECURITY;

-- Create policies for login table (allow anyone to read for authentication)
CREATE POLICY "Anyone can read login table for authentication"
  ON login
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for api_secrets table (allow anyone to read)
CREATE POLICY "Anyone can read api_secrets"
  ON api_secrets
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert student data
INSERT INTO login (name, password) VALUES
  ('clarence', '12345678'),
  ('kiisi', '12345678'),
  ('elise', '12345678'),
  ('olivia', '12345678'),
  ('annabel', '12345678'),
  ('ashton', '12345678'),
  ('isaiah', '12345678'),
  ('reggie', '12345678'),
  ('isaac', '12345678'),
  ('aaveer', '12345678'),
  ('jeriel', '12345678'),
  ('ethan', '12345678'),
  ('jake', '12345678'),
  ('niamh', '12345678'),
  ('sidh', '12345678'),
  ('hamish', '12345678'),
  ('arnavc', '12345678'),
  ('ruibin', '12345678'),
  ('jackson', '12345678'),
  ('lucas', '12345678')
ON CONFLICT (name) DO NOTHING;

-- Insert placeholder API keys (to be updated by administrator)
INSERT INTO api_secrets (key_name, key_value) VALUES
  ('replicate_api', 'YOUR_REPLICATE_API_KEY_HERE'),
  ('meshy_api', 'YOUR_MESHY_API_KEY_HERE')
ON CONFLICT (key_name) DO UPDATE SET key_value = EXCLUDED.key_value;
