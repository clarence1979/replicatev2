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
        .from('login')
        .select('name, is_admin')
        .order('name');

      if (error) throw error;

      return new Response(
        JSON.stringify({ users: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'search') {
      const { query } = params;
      const { data, error } = await supabase
        .from('login')
        .select('name, is_admin')
        .ilike('name', `%${query}%`)
        .order('name');

      if (error) throw error;

      return new Response(
        JSON.stringify({ users: data }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'add') {
      const { username, password, isAdmin } = params;

      if (!username || !password) {
        return new Response(
          JSON.stringify({ error: 'Username and password required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 8 characters' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data, error } = await supabase
        .from('login')
        .insert([{ name: username.toLowerCase().trim(), password, is_admin: isAdmin || false }])
        .select();

      if (error) {
        if (error.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'Username already exists' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, user: data[0] }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'update') {
      const { username, password, isAdmin } = params;

      if (!username) {
        return new Response(
          JSON.stringify({ error: 'Username required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const updateData: any = {};
      if (password !== undefined && password !== '') {
        if (password.length < 8) {
          return new Response(
            JSON.stringify({ error: 'Password must be at least 8 characters' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        updateData.password = password;
      }
      if (isAdmin !== undefined) {
        updateData.is_admin = isAdmin;
      }

      if (Object.keys(updateData).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No updates provided' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('login')
        .update(updateData)
        .eq('name', username.toLowerCase().trim());

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'delete') {
      const { usernames } = params;

      if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Usernames array required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Prevent deleting yourself
      const lowerUsernames = usernames.map(u => u.toLowerCase().trim());
      if (lowerUsernames.includes(adminName.toLowerCase().trim())) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete your own account' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { error } = await supabase
        .from('login')
        .delete()
        .in('name', lowerUsernames);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, deleted: usernames.length }),
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
