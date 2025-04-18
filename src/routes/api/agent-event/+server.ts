// src/routes/api/agent-event/+server.ts
import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

// POST: Log a new event using RPC
export async function POST({ request }) {
  try {
    const body = await request.json();
    const { run_id, rule_id, description } = body;

    console.log('🚀 Incoming Payload:', body);

    // Assumes 'insert_agent_event_log' returns the new event's ID or similar
    const { data: event_data, error } = await supabaseAdmin.rpc('insert_agent_event_log', {
      _run_id: run_id,
      _rule_id: rule_id,
      _event_description: description
    });

    if (error) {
      console.error('❌ Insert Error:', error);
      // Return detailed error in development, potentially generic in production
      return json({ error: error.message || 'Unknown insert error', details: error.details }, { status: 500 });
    }

    // Assuming the RPC returns the ID in the 'data' field. Adjust if needed.
    // If the RPC returns void or just success, you might not have an event_id here.
    // Let's assume it returns an object like { event_id: ... }
    const event_id = event_data?.event_id; // Example: Accessing returned ID

    return json({ success: true, event_id: event_id }); // Return the actual ID if available

  } catch (err) {
    console.error('💥 Unexpected error in POST:', err);
    // Avoid leaking detailed error info unless intended
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return json({ error: 'Unexpected server error', message: message }, { status: 500 });
  }
}

// GET: Fetch most recent pending agent event for human review
export async function GET() {
  try { // Added try...catch for robustness
    const { data, error } = await supabaseAdmin
      .schema('ai_osp_runtime')
      .from('agent_event_log')
      .select('*')
      .eq('status', 'pending')
      .order('detected_at', { ascending: false })
      .limit(1)
      .maybeSingle(); // Returns the single object or null, doesn't error if not found

    if (error) {
      console.error('❌ Failed to fetch pending agent event:', error);
      return json({ error: 'Could not fetch event due to database error' }, { status: 500 });
    }

    // data will be null if no pending event is found, or the event object if found.
    return json({ event: data });

  } catch (err) {
    console.error('💥 Unexpected error in GET:', err);
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return json({ error: 'Unexpected server error', message: message }, { status: 500 });
  }
}