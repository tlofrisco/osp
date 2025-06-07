import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';

export async function POST({ request, locals }: RequestEvent) {
  const sessionResult = locals.session;
  
  if (!sessionResult) {
    throw error(401, 'Unauthorized - No active session detected.');
  }

  const session = sessionResult.data?.session;
  const user = sessionResult.data?.user || session?.user;

  if (!user?.id || user.email !== 'tlofrisco@gmail.com') {
    throw error(403, 'Unauthorized - Admin access required.');
  }

  try {
    console.log('🔧 Checking and creating missing database objects...');

    // First, test if workflow_executions table exists
    const { data: existingTable, error: checkError } = await supabaseAdmin
      .from('workflow_executions')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('❌ workflow_executions table does not exist');
      
      // Return SQL for manual execution
      const manualSQL = `
-- 1. Create workflow_executions table
CREATE TABLE public.workflow_executions (
  id BIGSERIAL PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  execution_id TEXT UNIQUE NOT NULL,
  service_schema TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  workflow_definition JSONB NOT NULL,
  error TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX idx_workflow_executions_service_schema ON public.workflow_executions(service_schema);
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON public.workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_workflow_executions_execution_id ON public.workflow_executions(execution_id);

-- 3. Enable RLS
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own workflow executions" ON public.workflow_executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflow executions" ON public.workflow_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can do everything" ON public.workflow_executions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Create essential RPC functions
CREATE OR REPLACE FUNCTION public.execute_sql(sql_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE sql_text;
  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN json_build_object('rows_affected', result);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE sql;
  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN json_build_object('rows_affected', result);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_table_columns(schema_name TEXT, table_name TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT, is_nullable TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = schema_name
    AND c.table_name = table_name
  ORDER BY c.ordinal_position;
END;
$$;

CREATE OR REPLACE FUNCTION public.insert_into_dynamic_table(
  in_schema_name TEXT,
  in_table_name TEXT,
  json_data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_names TEXT[];
  column_values TEXT[];
  sql_query TEXT;
  key TEXT;
  value TEXT;
BEGIN
  -- Extract keys and values from JSONB
  FOR key IN SELECT jsonb_object_keys(json_data)
  LOOP
    column_names := array_append(column_names, '"' || key || '"');
    
    -- Handle different value types
    IF json_data->key = 'null'::jsonb THEN
      column_values := array_append(column_values, 'NULL');
    ELSE
      value := json_data->>key;
      column_values := array_append(column_values, quote_literal(value));
    END IF;
  END LOOP;

  -- Build the INSERT query
  sql_query := format(
    'INSERT INTO %I.%I (%s) VALUES (%s)',
    in_schema_name,
    in_table_name,
    array_to_string(column_names, ', '),
    array_to_string(column_values, ', ')
  );

  -- Execute the query
  EXECUTE sql_query;

  RETURN json_build_object('success', true, 'sql', sql_query);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Insert failed: % - SQL: %', SQLERRM, sql_query;
END;
$$;
      `;

      return json({
        success: false,
        needsManualMigration: true,
        message: 'Database objects missing - manual migration required',
        sql: manualSQL
      });
    }

    console.log('✅ workflow_executions table exists');

    // Test if RPC functions exist
    try {
      await supabaseAdmin.rpc('execute_sql', { sql_text: 'SELECT 1' });
      console.log('✅ RPC functions exist');
    } catch (rpcError) {
      console.log('❌ RPC functions missing');
      
      return json({
        success: false,
        needsManualMigration: true,
        message: 'RPC functions missing - see SQL above',
        sql: 'See the RPC function creation SQL in the manual migration above'
      });
    }

    console.log('✅ All database objects exist');

    return json({
      success: true,
      message: 'All database objects exist - no migration needed'
    });

  } catch (err) {
    console.error('Migration error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw error(500, `Failed to apply migration: ${message}`);
  }
} 