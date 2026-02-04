import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const REPLICATE_API_BASE = "https://api.replicate.com/v1";

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
    // Check if API key is provided in request header (from iframe parent)
    const providedApiKey = req.headers.get("X-Replicate-Key");

    let replicateApiKey: string;

    if (providedApiKey) {
      // Use the API key provided from parent window
      replicateApiKey = providedApiKey;
    } else {
      // Fall back to database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { data: secrets, error: secretError } = await supabase
        .from("api_secrets")
        .select("key_value")
        .eq("key_name", "replicate_api")
        .maybeSingle();

      if (secretError || !secrets) {
        return new Response(
          JSON.stringify({ error: "API key not configured" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      replicateApiKey = secrets.key_value;
    }

    const url = new URL(req.url);
    const path = url.searchParams.get("path");

    if (!path) {
      return new Response(
        JSON.stringify({ error: "Missing path parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const replicateUrl = `${REPLICATE_API_BASE}${path}`;

    const proxyHeaders: Record<string, string> = {
      "Authorization": `Bearer ${replicateApiKey}`,
      "Content-Type": "application/json",
    };

    const proxyOptions: RequestInit = {
      method: req.method,
      headers: proxyHeaders,
    };

    if (req.method === "POST" || req.method === "PUT") {
      const body = await req.text();
      proxyOptions.body = body;
    }

    const response = await fetch(replicateUrl, proxyOptions);
    const data = await response.text();

    // Log errors for debugging
    if (!response.ok) {
      console.error('Replicate API error:', {
        status: response.status,
        url: replicateUrl,
        response: data
      });
    }

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
