import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadImageToStorage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = fileName;

  const { data, error } = await supabase.storage
    .from('replicate-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('replicate-images')
    .getPublicUrl(data.path);

  // Ensure the URL has the https:// protocol
  const fullUrl = publicUrl.startsWith('http') ? publicUrl : `https://${publicUrl}`;

  return fullUrl;
}

export async function downloadAndUploadMedia(mediaUrl: string, mediaType: 'image' | 'video' | 'audio' | 'other' = 'other'): Promise<string> {
  try {
    // Use media-proxy for replicate.delivery URLs to bypass CORS
    if (mediaUrl.includes('replicate.delivery')) {
      console.log('Using media-proxy for replicate.delivery URL');
      const response = await fetch(`${supabaseUrl}/functions/v1/media-proxy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaUrl, mediaType }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Media proxy failed: ${errorText}`);
      }

      const data = await response.json();
      return data.url;
    }

    // Direct download for non-replicate URLs
    const response = await fetch(mediaUrl);
    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.statusText}`);
    }

    const blob = await response.blob();

    const extension = mediaUrl.split('.').pop()?.split('?')[0] || 'bin';
    const fileName = `${mediaType}-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    const { data, error } = await supabase.storage
      .from('replicate-images')
      .upload(fileName, blob, {
        cacheControl: '31536000',
        contentType: blob.type,
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload media: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('replicate-images')
      .getPublicUrl(data.path);

    // Ensure the URL has the https:// protocol
    const fullUrl = publicUrl.startsWith('http') ? publicUrl : `https://${publicUrl}`;

    return fullUrl;
  } catch (error) {
    console.error('Error downloading and uploading media:', error);
    throw error;
  }
}

export async function createImageThumbnail(imageUrl: string, maxWidth: number = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          try {
            const fileName = `thumbnail-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

            const { data, error } = await supabase.storage
              .from('replicate-images')
              .upload(fileName, blob, {
                cacheControl: '31536000',
                contentType: 'image/jpeg',
                upsert: false
              });

            if (error) {
              throw new Error(`Failed to upload thumbnail: ${error.message}`);
            }

            const { data: { publicUrl } } = supabase.storage
              .from('replicate-images')
              .getPublicUrl(data.path);

            // Ensure the URL has the https:// protocol
            const fullUrl = publicUrl.startsWith('http') ? publicUrl : `https://${publicUrl}`;

            resolve(fullUrl);
          } catch (error) {
            reject(error);
          }
        }, 'image/jpeg', 0.8);

      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail creation'));
    };

    img.src = imageUrl;
  });
}

export async function extractVideoThumbnail(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;

    const timeout = setTimeout(() => {
      reject(new Error('Video thumbnail extraction timed out'));
    }, 30000);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 10);
    };

    video.onseeked = async () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const maxWidth = 400;
        const scale = maxWidth / video.videoWidth;
        canvas.width = maxWidth;
        canvas.height = video.videoHeight * scale;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          try {
            const fileName = `thumbnail-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

            const { data, error } = await supabase.storage
              .from('replicate-images')
              .upload(fileName, blob, {
                cacheControl: '31536000',
                contentType: 'image/jpeg',
                upsert: false
              });

            if (error) {
              throw new Error(`Failed to upload thumbnail: ${error.message}`);
            }

            const { data: { publicUrl } } = supabase.storage
              .from('replicate-images')
              .getPublicUrl(data.path);

            // Ensure the URL has the https:// protocol
            const fullUrl = publicUrl.startsWith('http') ? publicUrl : `https://${publicUrl}`;

            resolve(fullUrl);
          } catch (error) {
            reject(error);
          }
        }, 'image/jpeg', 0.8);

      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load video for thumbnail extraction (CORS or network error)'));
    };

    video.src = videoUrl;
    video.load();
  });
}
