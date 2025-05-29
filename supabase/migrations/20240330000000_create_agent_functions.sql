-- Create the insert_agent_run function
CREATE OR REPLACE FUNCTION ai_osp_runtime.insert_agent_run(
    branch_name text,
    service_id text,
    trigger_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_run_id uuid := gen_random_uuid();
BEGIN
    -- Insert new run record
    INSERT INTO ai_osp_runtime.agent_run_log (
        run_id,
        trigger_reason,
        branch_name,
        service_id,
        status,
        created_at
    ) VALUES (
        new_run_id,
        trigger_reason,
        branch_name,
        service_id,
        'started',
        NOW()
    );

    RETURN new_run_id;
END;
$$; 