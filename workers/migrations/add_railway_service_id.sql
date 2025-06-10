-- Add railway_service_id column to services table
-- This stores the Railway service ID for each OSP service
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS railway_service_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_services_railway_service_id 
ON services(railway_service_id);

-- Also add railway_service_id to worker_registry table
ALTER TABLE worker_registry
ADD COLUMN IF NOT EXISTS railway_service_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN services.railway_service_id IS 'Railway service ID for the deployed worker';
COMMENT ON COLUMN worker_registry.railway_service_id IS 'Railway service ID for tracking deployments'; 