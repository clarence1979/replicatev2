import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const REPLICATE_API_BASE = "https://api.replicate.com/v1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Replicate-Key",
};

async function getDbApiKey(): Promise<string | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: secrets, error } = await supabase
    .from("api_secrets")
    .select("key_value")
    .eq("key_name", "replicate_api")
    .maybeSingle();

  if (error || !secrets) return null;
  return secrets.key_value;
}

async function callReplicate(path: string, method: string, body: string | null, apiKey: string): Promise<Response> {
  const replicateUrl = `${REPLICATE_API_BASE}${path}`;

  const proxyOptions: RequestInit = {
    method,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  };

  if ((method === "POST" || method === "PUT") && body) {
    proxyOptions.body = body;
  }

  return fetch(replicateUrl, proxyOptions);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
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

    const body = (req.method === "POST" || req.method === "PUT") ? await req.text() : null;

    const providedApiKey = req.headers.get("X-Replicate-Key");

    if (providedApiKey && providedApiKey.startsWith("r8_")) {
      const response = await callReplicate(path, req.method, body, providedApiKey);

      if (response.status !== 401) {
        const data = await response.text();
        if (!response.ok) {
          console.error("Replicate API error:", { status: response.status, url: `${REPLICATE_API_BASE}${path}`, response: data });
        }
        return new Response(data, {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.warn("Parent-provided API key returned 401, falling back to database key");
    }

    const dbApiKey = await getDbApiKey();

    if (!dbApiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await callReplicate(path, req.method, body, dbApiKey);
    const data = await response.text();

    if (!response.ok) {
      console.error("Replicate API error:", { status: response.status, url: `${REPLICATE_API_BASE}${path}`, response: data });
    }

    return new Response(data, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
