-- Add regeneration support tables

-- Table to store protected customizations
CREATE TABLE IF NOT EXISTS public.service_customizations (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    protected_regions JSONB DEFAULT '{}',
    custom_components JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_id)
);

-- Table to track schema evolution
CREATE TABLE IF NOT EXISTS public.schema_evolution (
    id BIGSERIAL PRIMARY KEY,
    service_id BIGINT NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    changes JSONB NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_service_customizations_service_id ON public.service_customizations(service_id);
CREATE INDEX idx_schema_evolution_service_id ON public.schema_evolution(service_id);
CREATE INDEX idx_schema_evolution_version ON public.schema_evolution(service_id, version);

-- Add RLS policies
ALTER TABLE public.service_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_evolution ENABLE ROW LEVEL SECURITY;

-- Service customizations policies
CREATE POLICY "Users can view their own service customizations" ON public.service_customizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.services 
            WHERE services.id = service_customizations.service_id 
            AND services.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own service customizations" ON public.service_customizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.services 
            WHERE services.id = service_customizations.service_id 
            AND services.user_id = auth.uid()
        )
    );

-- Schema evolution policies
CREATE POLICY "Users can view their own schema evolution" ON public.schema_evolution
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.services 
            WHERE services.id = schema_evolution.service_id 
            AND services.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert schema evolution for their services" ON public.schema_evolution
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.services 
            WHERE services.id = schema_evolution.service_id 
            AND services.user_id = auth.uid()
        )
    );

-- Add updated_at column to services table if it doesn't exist
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add regeneration_history to metadata column (this will be stored in the JSON)
COMMENT ON COLUMN public.services.metadata IS 'Service manifest including regeneration_history array'; 