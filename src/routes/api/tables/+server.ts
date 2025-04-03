import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';

export async function GET({ request, locals }) {
  let session = locals.session;
  const supabase = locals.supabase || createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );

  if (!session) {
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header:', authHeader);
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Validating token:', token.slice(0, 10) + '...');
      const { data, error } = await supabase.auth.getUser(token);
      if (error) {
        console.error('Token validation error:', error);
        return json({ error: 'Unauthorized' }, { status: 401 });
      }
      console.log('User validated:', data.user?.email);
      if (!error && data.user) session = { user: data.user };
    }
  }

  if (!session) {
    console.log('No session found, returning 401');
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Use execute_sql to query information_schema.tables
    const sql = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`;
    const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql_text: sql });

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Supabase query error: ${error.message}`);
    }

    // Check if the response contains an error
    if (data && data.error) {
      console.error('SQL execution error:', data.error);
      throw new Error(`SQL execution error: ${data.error}`);
    }

    // The response should be a JSONB array of rows
    if (!Array.isArray(data)) {
      console.warn('Unexpected response format:', data);
      return json({ tables: [] });
    }

    // Format the response to match the expected structure
    const tables = data.map(row => ({ table_name: row.table_name }));
    console.log('Tables in public schema:', tables);

    return json({ tables });
  } catch (err) {
    console.error('Error fetching tables:', err);
    return json({ error: err.message }, { status: 500 });
  }
}