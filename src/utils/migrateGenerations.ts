import { supabase } from './supabase';

async function downloadMediaViaProxy(mediaUrl: string, mediaType: 'image' | 'video' | 'audio'): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/media-proxy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mediaUrl, mediaType }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Media proxy failed: ${error}`);
  }

  const data = await response.json();
  return data.url;
}

async function extractVideoThumbnailViaCanvas(videoUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;

    const timeout = setTimeout(() => {
      resolve(null);
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
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            resolve(null);
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
              resolve(null);
              return;
            }

            const { data: { publicUrl } } = supabase.storage
              .from('replicate-images')
              .getPublicUrl(data.path);

            const fullUrl = publicUrl.startsWith('http') ? publicUrl : `https://${publicUrl}`;
            resolve(fullUrl);
          } catch {
            resolve(null);
          }
        }, 'image/jpeg', 0.8);

      } catch {
        resolve(null);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };

    video.src = videoUrl;
  });
}

export async function migrateReplicateDeliveryVideos(): Promise<void> {
  console.log('Starting migration of replicate.delivery videos...');

  try {
    const { data: generations, error: fetchError } = await supabase
      .from('student_generations')
      .select('id, content_url, thumbnail_url, generation_type')
      .eq('generation_type', 'video')
      .like('content_url', 'https://replicate.delivery/%');

    if (fetchError) {
      console.error('Error fetching generations:', fetchError);
      return;
    }

    if (!generations || generations.length === 0) {
      console.log('No videos to migrate');
      return;
    }

    console.log(`Found ${generations.length} videos to migrate`);

    for (const gen of generations) {
      try {
        console.log(`Migrating video ${gen.id}...`);

        const newContentUrl = await downloadMediaViaProxy(gen.content_url, 'video');
        console.log(`Video uploaded to Supabase: ${newContentUrl}`);

        let newThumbnailUrl: string | null = null;
        try {
          newThumbnailUrl = await extractVideoThumbnailViaCanvas(newContentUrl);
          if (newThumbnailUrl) {
            console.log(`Thumbnail created: ${newThumbnailUrl}`);
          }
        } catch (error) {
          console.warn('Failed to create thumbnail:', error);
        }

        const { error: updateError } = await supabase
          .from('student_generations')
          .update({
            content_url: newContentUrl,
            thumbnail_url: newThumbnailUrl || newContentUrl,
          })
          .eq('id', gen.id);

        if (updateError) {
          console.error(`Failed to update record ${gen.id}:`, updateError);
        } else {
          console.log(`Successfully migrated ${gen.id}`);
        }
      } catch (error) {
        console.error(`Failed to migrate video ${gen.id}:`, error);
      }
    }

    console.log('Migration complete');
    window.dispatchEvent(new CustomEvent('generation-saved'));
  } catch (error) {
    console.error('Migration error:', error);
  }
}
