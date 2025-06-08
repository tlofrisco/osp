-- Create worker registry table to track deployment status
-- workers/migrations/worker_registry.sql

CREATE TABLE IF NOT EXISTS osp_metadata.worker_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_schema TEXT NOT NULL,
  manifest_path TEXT NOT NULL,
  deployment_status TEXT NOT NULL DEFAULT 'pending',
  deployed_at TIMESTAMP DEFAULT now(),
  logs TEXT,
  
  -- Additional tracking fields
  retry_count INTEGER DEFAULT 0,
  last_health_check TIMESTAMP,
  worker_version TEXT,
  
  -- Indexes for common queries
  CONSTRAINT worker_registry_status_check CHECK (deployment_status IN ('pending', 'deploying', 'deployed', 'failed', 'stopped'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_registry_service_schema ON osp_metadata.worker_registry(service_schema);
CREATE INDEX IF NOT EXISTS idx_worker_registry_status ON osp_metadata.worker_registry(deployment_status);
CREATE INDEX IF NOT EXISTS idx_worker_registry_deployed_at ON osp_metadata.worker_registry(deployed_at);

-- Add RLS policy (if needed)
-- ALTER TABLE osp_metadata.worker_registry ENABLE ROW LEVEL SECURITY;

-- Grant permissions to service role
GRANT ALL ON osp_metadata.worker_registry TO service_role; 