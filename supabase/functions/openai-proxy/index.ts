import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const OPENAI_API_BASE = "https://api.openai.com/v1";

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
      .eq("key_name", "openai_api")
      .maybeSingle();

    if (secretError || !secrets) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = secrets.key_value;
    const { prompt, modelContext } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = `You are a helpful AI assistant that improves prompts for AI image/video generation models.
Your task is to take a simple or ambiguous prompt and enhance it with more vivid details, better descriptions, and technical specifications that will produce better results.

Context: ${modelContext || 'General AI model'}

Guidelines:
- Keep the core concept from the original prompt
- Add specific details about lighting, style, composition, colors, mood, and atmosphere
- Use descriptive adjectives and technical terms
- Keep it concise but detailed (aim for 2-3 sentences)
- Make it more realistic and production-ready
- Don't add unrelated concepts, just enhance what's already there

Return ONLY the improved prompt, nothing else.`;

    const openaiResponse = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Improve this prompt: "${prompt}"`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", {
        status: openaiResponse.status,
        response: errorData,
      });
      return new Response(
        JSON.stringify({ error: "OpenAI API request failed" }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await openaiResponse.json();
    const improvedPrompt = data.choices[0]?.message?.content?.trim();

    return new Response(
      JSON.stringify({ improvedPrompt }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
