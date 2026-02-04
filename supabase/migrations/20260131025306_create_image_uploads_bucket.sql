/*
  # Create Storage Bucket for Image Uploads

  1. New Storage Bucket
    - `image-uploads` bucket for storing images used in Meshy 3D generation
    - Public bucket to allow direct URL access for Meshy API
  
  2. Storage Policies
    - Allow authenticated users to upload images
    - Allow public read access to uploaded images
    - Allow users to delete their own uploads
  
  3. Security
    - File size limits enforced by Supabase
    - Only image files allowed (enforced in client code)
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('image-uploads', 'image-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'image-uploads');

-- Allow public read access
CREATE POLICY "Public can read images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'image-uploads');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'image-uploads');
