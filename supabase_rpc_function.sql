-- 🚀 OSP Manifest RPC Function
-- Deploy this in Supabase SQL Editor to bypass schema cache issues
-- Part of OSP Refactor Sets 04+05+07: Governance, Locking, and Auditability

CREATE OR REPLACE FUNCTION insert_service_manifest(
  p_service_id TEXT,
  p_service_name TEXT,
  p_version TEXT,
  p_manifest_content JSONB,
  p_status TEXT DEFAULT 'active',
  p_locked_fields TEXT[] DEFAULT ARRAY['service_id', 'schema_name']
)
RETURNS TABLE(manifest_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Validate input status
  IF p_status NOT IN ('draft', 'active', 'deprecated', 'locked') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be one of: draft, active, deprecated, locked', p_status;
  END IF;
  
  -- Insert the manifest with all governance fields
  INSERT INTO osp_metadata.service_manifests (
    service_id,
    service_name,
    version,
    manifest_content,
    status,
    locked_fields,
    created_at,
    updated_at
  ) VALUES (
    p_service_id,
    p_service_name,
    p_version,
    p_manifest_content,
    p_status::osp_metadata.manifest_status,
    p_locked_fields,
    NOW(),
    NOW()
  )
  RETURNING id INTO new_id;
  
  -- Log the successful creation
  RAISE NOTICE 'Manifest created successfully: ID=%, Service=%, Status=%', new_id, p_service_id, p_status;
  
  -- Return the UUID
  RETURN QUERY SELECT new_id;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION insert_service_manifest TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION insert_service_manifest IS 'Inserts service manifest with governance fields, bypassing schema cache issues';

-- 🧪 Test the function (optional - remove these lines if you prefer)
-- SELECT manifest_id FROM insert_service_manifest(
--   'test_service_123',
--   'Test Service',  
--   'v1.0.0',
--   '{"service_schema": "test_service_123", "workflows": []}',
--   'active',
--   ARRAY['service_id', 'schema_name']
-- );

-- Verify function was created
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'insert_service_manifest'; 