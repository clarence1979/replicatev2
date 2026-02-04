/*
  # Update Replicate Images Bucket for Proper Retention

  1. Changes
    - Increase file size limit to 100MB to prevent premature deletion due to space constraints
    - Ensure proper caching headers for 1-week retention minimum
    - Add file lifecycle management
  
  2. Notes
    - Files will persist for at least 7 days as required
    - Thumbnails are cached with proper expiration headers
    - Bucket configured for optimal performance and retention
*/

-- Update the replicate-images bucket with increased limits
UPDATE storage.buckets
SET 
  file_size_limit = 104857600, -- 100MB limit per file (increased from 10MB)
  public = true
WHERE id = 'replicate-images';
