import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function GET({ request, url, locals }: RequestEvent) {
  const sessionResult = locals.session;
  
  if (!sessionResult) {
    throw error(401, 'Unauthorized - No active session detected.');
  }

  const session = sessionResult.data?.session;
  const user = sessionResult.data?.user || session?.user;

  if (!user?.id) {
    throw error(401, 'Unauthorized - Session missing user information.');
  }

  try {
    const serviceSchema = url.searchParams.get('service');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    if (!serviceSchema) {
      throw error(400, 'Service schema parameter is required');
    }

    console.log(`🔍 Fetching workflow executions for service: ${serviceSchema}`);

    // Fetch workflow executions for the service
    const { data: executions, error: fetchError } = await supabaseAdmin
      .from('workflow_executions')
      .select('*')
      .eq('service_schema', serviceSchema)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (fetchError) {
      console.error('Failed to fetch workflow executions:', fetchError);
      throw error(500, `Failed to fetch workflow executions: ${fetchError.message}`);
    }

    console.log(`✅ Found ${executions?.length || 0} workflow executions`);

    return json({
      success: true,
      executions: executions || []
    });

  } catch (err) {
    console.error('Workflow executions fetch error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw error(500, `Failed to fetch workflow executions: ${message}`);
  }
} 