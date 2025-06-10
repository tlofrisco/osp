-- 🔐 OSP Manifest Audit Table Creation
-- Part of OSP Refactor Sets 04+05+07: Governance, Locking, and Auditability
-- 
-- This script creates the audit table for tracking manifest changes
-- Run this in Supabase SQL Editor to enable audit logging

-- Create the audit log table
CREATE TABLE IF NOT EXISTS osp_metadata.manifest_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'lock', 'deprecate', 'activate')),
    manifest_id UUID NOT NULL,
    previous_version TEXT,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changes JSONB NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_manifest_audit_log_manifest_id 
ON osp_metadata.manifest_audit_log(manifest_id);

CREATE INDEX IF NOT EXISTS idx_manifest_audit_log_action 
ON osp_metadata.manifest_audit_log(action);

CREATE INDEX IF NOT EXISTS idx_manifest_audit_log_changed_at 
ON osp_metadata.manifest_audit_log(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_manifest_audit_log_changed_by 
ON osp_metadata.manifest_audit_log(changed_by);

-- Add foreign key relationship to service_manifests (if desired)
-- Note: This might fail if there are existing audit entries for deleted manifests
-- Uncomment if you want to enforce referential integrity:
-- ALTER TABLE osp_metadata.manifest_audit_log 
-- ADD CONSTRAINT fk_manifest_audit_log_manifest_id 
-- FOREIGN KEY (manifest_id) REFERENCES osp_metadata.service_manifests(id) ON DELETE CASCADE;

-- Add RLS (Row Level Security) policies if needed
-- This depends on your security requirements
ALTER TABLE osp_metadata.manifest_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role full access (for the OSP system)
CREATE POLICY IF NOT EXISTS "Service role can manage audit log" 
ON osp_metadata.manifest_audit_log 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Policy for authenticated users to read audit entries (optional)
-- CREATE POLICY IF NOT EXISTS "Users can read audit log" 
-- ON osp_metadata.manifest_audit_log 
-- FOR SELECT 
-- TO authenticated 
-- USING (true);

-- Add helpful comments
COMMENT ON TABLE osp_metadata.manifest_audit_log IS 'Audit trail for all manifest changes in OSP';
COMMENT ON COLUMN osp_metadata.manifest_audit_log.action IS 'Type of action performed on the manifest';
COMMENT ON COLUMN osp_metadata.manifest_audit_log.manifest_id IS 'UUID of the manifest that was changed';
COMMENT ON COLUMN osp_metadata.manifest_audit_log.previous_version IS 'Previous version identifier if applicable';
COMMENT ON COLUMN osp_metadata.manifest_audit_log.changed_by IS 'User or system that made the change';
COMMENT ON COLUMN osp_metadata.manifest_audit_log.changes IS 'JSON diff of what was changed';
COMMENT ON COLUMN osp_metadata.manifest_audit_log.reason IS 'Optional reason for the change';

-- Verify the table was created successfully
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'osp_metadata' 
  AND table_name = 'manifest_audit_log'
ORDER BY ordinal_position;

-- Show indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'osp_metadata' 
  AND tablename = 'manifest_audit_log';

-- Sample query to test the audit table (will be empty initially)
SELECT 
    action,
    manifest_id,
    changed_by,
    changed_at,
    reason
FROM osp_metadata.manifest_audit_log 
ORDER BY changed_at DESC 
LIMIT 10; 