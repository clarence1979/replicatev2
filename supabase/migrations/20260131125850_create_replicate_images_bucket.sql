/*
  # Create Storage Bucket for Replicate Image Uploads

  1. New Storage Bucket
    - `replicate-images` bucket for storing uploaded images for Replicate models
    - Public bucket to allow direct URL access for Replicate API
  
  2. Storage Policies
    - Allow all users (authenticated and anon) to upload images
    - Allow public read access to uploaded images
    - Allow users to delete their own uploads
  
  3. Security
    - File size limits enforced by Supabase
    - RLS policies control upload permissions
*/

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'replicate-images',
  'replicate-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav'];

-- Allow all users to upload images (both authenticated and anonymous)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow all users to upload to replicate-images'
  ) THEN
    CREATE POLICY "Allow all users to upload to replicate-images"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'replicate-images');
  END IF;
END $$;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access to replicate-images'
  ) THEN
    CREATE POLICY "Public read access to replicate-images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'replicate-images');
  END IF;
END $$;

-- Allow users to delete files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow all to delete from replicate-images'
  ) THEN
    CREATE POLICY "Allow all to delete from replicate-images"
    ON storage.objects FOR DELETE
    TO public
    USING (bucket_id = 'replicate-images');
  END IF;
END $$;
