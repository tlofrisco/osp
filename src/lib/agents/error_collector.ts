import { supabaseAdmin } from '$lib/supabaseAdmin';
import type { DebugInput } from './debug_suggestion_agent';

export async function collectErrorContext(run_id: string): Promise<DebugInput> {
  const context: DebugInput['context'] = {};

  // 1. Fetch recent failed Supabase query logs (optional function)
  try {
    const { data: recentSqlLogs } = await supabaseAdmin.rpc('get_recent_sql_errors');
    context.sql_logs = recentSqlLogs?.map((log: any) => log.message) ?? [];
  } catch (err) {
    console.warn('⚠️ Failed to fetch SQL logs:', err);
    context.sql_logs = [];
  }

  // 2. Fetch API error logs
  try {
    const { data: apiLogs } = await supabaseAdmin
      .schema('ai_osp_runtime')
      .from('agent_event_log')
      .select('event_description')
      .order('detected_at', { ascending: false })
      .limit(5);
    context.api_logs = apiLogs?.map((e) => e.event_description) ?? [];
  } catch (err) {
    console.warn('⚠️ Failed to fetch API logs:', err);
    context.api_logs = [];
  }

  // 3. Frontend logs
  try {
    const { data: clientLogs } = await supabaseAdmin
      .from('frontend_error_log')
      .select('message')
      .order('created_at', { ascending: false })
      .limit(5);
    context.console_logs = clientLogs?.map((e) => e.message) ?? [];
  } catch (err) {
    console.warn('⚠️ Failed to fetch frontend logs:', err);
    context.console_logs = [];
  }

  return {
    run_id,
    context
  };
}

