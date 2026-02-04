import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function verifyAdmin(supabase: any, adminName: string, adminPassword: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('login')
    .select('is_admin')
    .eq('name', adminName.toLowerCase().trim())
    .eq('password', adminPassword)
    .maybeSingle();

  return !error && data && data.is_admin === true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { adminName, adminPassword, action, ...params } = await req.json();

    if (!adminName || !adminPassword) {
      return new Response(
        JSON.stringify({ error: 'Admin credentials required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isAdmin = await verifyAdmin(supabase, adminName, adminPassword);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle different actions
    if (action === 'list') {
      const { data, error } = await supabase
        .from('api_secrets')
        .select('key_name, key_value')
        .order('key_name');

      if (error) throw error;

      return new Response(
        JSON.stringify({ apiKeys: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'update') {
      const { keyName, keyValue } = params;

      if (!keyName || keyValue === undefined) {
        return new Response(
          JSON.stringify({ error: 'Key name and value required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if key exists
      const { data: existing } = await supabase
        .from('api_secrets')
        .select('key_name')
        .eq('key_name', keyName)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing key
        result = await supabase
          .from('api_secrets')
          .update({ key_value: keyValue })
          .eq('key_name', keyName);
      } else {
        // Insert new key
        result = await supabase
          .from('api_secrets')
          .insert([{ key_name: keyName, key_value: keyValue }]);
      }

      if (result.error) throw result.error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'delete') {
      const { keyName } = params;

      if (!keyName) {
        return new Response(
          JSON.stringify({ error: 'Key name required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('api_secrets')
        .delete()
        .eq('key_name', keyName);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
