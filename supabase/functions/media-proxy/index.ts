import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { mediaUrl, mediaType } = await req.json();

    if (!mediaUrl) {
      return new Response(
        JSON.stringify({ error: "Missing mediaUrl parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Downloading media: ${mediaUrl}`);

    // Download the media from the source
    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) {
      throw new Error(`Failed to download media: ${mediaResponse.statusText}`);
    }

    const mediaBlob = await mediaResponse.blob();
    const extension = mediaUrl.split('.').pop()?.split('?')[0] || 'bin';
    const fileName = `${mediaType || 'media'}-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

    console.log(`Uploading to Supabase storage: ${fileName}`);

    // Upload to Supabase storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('replicate-images')
      .upload(fileName, mediaBlob, {
        cacheControl: '31536000',
        contentType: mediaBlob.type,
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Failed to upload to storage: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('replicate-images')
      .getPublicUrl(uploadData.path);

    const fullUrl = publicUrl.startsWith('http') ? publicUrl : `https://${publicUrl}`;

    console.log(`Media uploaded successfully: ${fullUrl}`);

    // Generate thumbnail for videos
    let thumbnailUrl = null;
    if (mediaType === 'video') {
      console.log('Generating thumbnail for video...');
      // Note: Thumbnail generation happens on client-side after video is downloaded
      // We just return the video URL and let the client handle thumbnail extraction
      thumbnailUrl = fullUrl;
    }

    return new Response(
      JSON.stringify({
        url: fullUrl,
        thumbnailUrl: thumbnailUrl || fullUrl
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in media-proxy:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
