import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const MESHY_API_BASE = "https://api.meshy.ai/openapi";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: secrets, error: secretError } = await supabase
      .from("api_secrets")
      .select("key_value")
      .eq("key_name", "meshy_api")
      .maybeSingle();

    if (secretError || !secrets) {
      return new Response(
        JSON.stringify({ error: "Meshy API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const meshyApiKey = secrets.key_value;

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

    const isAssetUrl = path.startsWith("https://assets.meshy.ai");
    const meshyUrl = isAssetUrl ? path : `${MESHY_API_BASE}${path}`;

    const proxyHeaders: Record<string, string> = {
      "Authorization": `Bearer ${meshyApiKey}`,
    };

    if (!isAssetUrl) {
      proxyHeaders["Content-Type"] = "application/json";
    }

    const proxyOptions: RequestInit = {
      method: req.method,
      headers: proxyHeaders,
    };

    if (req.method === "POST" || req.method === "PUT") {
      const body = await req.text();
      proxyOptions.body = body;
    }

    const response = await fetch(meshyUrl, proxyOptions);

    if (isAssetUrl) {
      const arrayBuffer = await response.arrayBuffer();
      const contentType = response.headers.get("Content-Type") || "application/octet-stream";

      return new Response(arrayBuffer, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } else {
      const data = await response.text();

      console.log('Meshy API Response:', {
        status: response.status,
        url: meshyUrl,
        data: data
      });

      return new Response(data, {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }
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
