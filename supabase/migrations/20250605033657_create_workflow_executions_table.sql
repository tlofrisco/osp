-- Create workflow_executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
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

-- Add indexes for performance
CREATE INDEX idx_workflow_executions_service_schema ON public.workflow_executions(service_schema);
CREATE INDEX idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_user_id ON public.workflow_executions(user_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_workflow_executions_execution_id ON public.workflow_executions(execution_id);

-- Enable RLS
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own workflow executions" ON public.workflow_executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create workflow executions" ON public.workflow_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can do everything" ON public.workflow_executions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_workflow_executions_updated_at
  BEFORE UPDATE ON public.workflow_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
