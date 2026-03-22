/*
  # Create student_generations table

  1. New Tables
    - `student_generations`
      - `id` (uuid, primary key)
      - `student_name` (text) - Name of the student who created this generation
      - `model_name` (text) - Name of the AI model used
      - `model_version` (text) - Version ID of the model
      - `generation_type` (text) - Type: image, video, audio, text, or 3d
      - `content_url` (text) - URL to the generated content stored in Supabase storage
      - `thumbnail_url` (text, nullable) - URL to the thumbnail image
      - `input_data` (jsonb) - The inputs used to generate the content
      - `prediction_id` (text) - The Replicate prediction ID
      - `output_data` (jsonb, nullable) - Raw output data from the prediction
      - `created_at` (timestamptz) - When the generation was created

  2. Security
    - Enable RLS on student_generations table
    - Allow anon and authenticated users to SELECT (view gallery)
    - Allow anon and authenticated users to INSERT (save generations)
    - Allow anon and authenticated users to DELETE (cleanup old records)

  Note: This app uses custom login (not Supabase Auth), so policies use anon/authenticated roles
  rather than auth.uid() checks, consistent with the existing login and api_secrets tables.
*/

CREATE TABLE IF NOT EXISTS student_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL DEFAULT '',
  model_name text NOT NULL DEFAULT '',
  model_version text NOT NULL DEFAULT '',
  generation_type text NOT NULL DEFAULT 'image',
  content_url text NOT NULL DEFAULT '',
  thumbnail_url text,
  input_data jsonb,
  prediction_id text NOT NULL DEFAULT '',
  output_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read student generations"
  ON student_generations
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert student generations"
  ON student_generations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete student generations"
  ON student_generations
  FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS student_generations_created_at_idx ON student_generations (created_at DESC);
CREATE INDEX IF NOT EXISTS student_generations_student_name_idx ON student_generations (student_name);
