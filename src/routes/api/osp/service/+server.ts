import { json, error } from '@sveltejs/kit'; // Added 'error' import
import { supabaseAdmin } from '$lib/supabaseAdmin';
// Removed unused createClient import from '@supabase/supabase-js'
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private'; // Import secret key using $env

// Initialize OpenAI client safely
const openai = new OpenAI({
  // apiKey: process.env.OPENAI_KEY, // Use $env instead
  apiKey: OPENAI_API_KEY,
  timeout: 60000, // 60 seconds
  maxRetries: 3
});

// --- createTableFromModel function remains the same as you provided ---
// (Make sure it works as intended, especially the permission/RLS parts)
async function createTableFromModel(blendedModel: any, serviceDraft: any, serviceSchema: string) {
    console.log('Calling createTableFromModel with model:', blendedModel);
    let entities = blendedModel.entities || [];
    if (!Array.isArray(entities)) {
        console.log('Converting object entities to array');
        entities = Object.entries(entities).map(([key, value]) => ({
        name: key,
        ...value
        }));
    }

    // --- Schema Creation/Verification ---
    const createSchemaSql = `CREATE SCHEMA IF NOT EXISTS ${serviceSchema}`;
    const { data: schemaData, error: schemaError } = await supabaseAdmin.rpc('execute_sql', { sql_text: createSchemaSql });
    if (schemaError || (schemaData && schemaData.error)) {
        console.error('Schema creation failed:', schemaError?.message || schemaData.error);
        throw new Error(`Schema creation failed for ${serviceSchema}`);
    }
    console.log(`Schema ${serviceSchema} ensured`);
    // (Verification logic kept as is)
    const schemaVerifySql = `SELECT schema_name FROM information_schema.schemata WHERE schema_name = '${serviceSchema}'`;
    const { data: schemaVerifyData, error: schemaVerifyError } = await supabaseAdmin.rpc('execute_sql', { sql_text: schemaVerifySql });
    if (schemaVerifyError || (schemaVerifyData && schemaVerifyData.error) || !schemaVerifyData || schemaVerifyData.length === 0) {
        console.error('Schema verification failed:', schemaVerifyError?.message || schemaVerifyData?.error);
        throw new Error('Failed to verify schema creation');
    }
    console.log(`Schema ${serviceSchema} verified`);

    // --- Table Column Definition ---
    const tableColumns: Record<string, { name: string; type: string; constraints?: string }[]> = {};
    for (const entity of entities) {
        // (Logic for determining columns kept as is)
        const entityName = entity.name;
        if (!entityName) {
            console.error('Entity missing name:', entity);
            throw new Error('All entities must have a name');
        }
        const normalizedEntityName = entityName.toLowerCase().replace(/\s+/g, '_');
        const columns: { name: string; type: string; constraints?: string }[] = [];
        const attributes = entity.attributes || {};
        const seenColumns = new Set<string>();

        columns.push({ name: 'id', type: 'text', constraints: 'PRIMARY KEY' });
        seenColumns.add('id');

        const attributesArray = typeof attributes === 'object' && !Array.isArray(attributes)
        ? Object.entries(attributes).map(([name, type]) => ({ name, type }))
        : attributes;

        for (const attr of attributesArray) {
            let cleanName = (attr.name || attr).replace(/^(sid_|arts_)/, '').replace(/-/g, '_');
            cleanName = cleanName.toLowerCase().replace(/_/g, ''); // Further simplified cleaning
             if (/^\d+$/.test(cleanName) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanName) || ['table', 'schema', 'select', 'insert', 'update', 'delete'].includes(cleanName)) { // Added reserved word check
                cleanName = `attr_${cleanName.replace(/[^a-zA-Z0-9_]/g, '') || 'unknown'}`;
                console.warn(`Potentially invalid attribute name "${attr.name || attr}" for ${normalizedEntityName}, renamed to "${cleanName}"`);
             }

            const sqlType = attr.type === 'string' ? 'text' :
                            attr.type === 'int' || attr.type === 'integer' || attr.type === 'number' ? 'numeric' :
                            attr.type === 'float' || attr.type === 'decimal' ? 'numeric' :
                            attr.type === 'date' || attr.type === 'datetime' ? 'timestamptz' : // Use timestamptz usually
                            'text'; // Default to text
            if (!seenColumns.has(cleanName)) {
                columns.push({ name: cleanName, type: sqlType });
                seenColumns.add(cleanName);
            }
        }
        tableColumns[normalizedEntityName] = columns;
    }

    // --- Create/Update Tables ---
    for (const [tableName, columns] of Object.entries(tableColumns)) {
        const qualifiedTableName = `${serviceSchema}.${tableName}`;
        console.log(`Checking if table ${qualifiedTableName} exists`);
        const existsSql = `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${serviceSchema}' AND table_name = '${tableName}')`;
        const { data: existsData, error: existsError } = await supabaseAdmin.rpc('execute_sql', { sql_text: existsSql });
        if (existsError || (existsData && existsData.error)) {
            console.error('Error checking table existence:', existsError?.message || existsData.error);
            throw new Error(`Failed to check if table ${qualifiedTableName} exists`);
        }
        const exists = existsData && existsData.length > 0 ? existsData[0].exists : false;
        console.log(`Does ${qualifiedTableName} exist?`, exists);

        if (exists) {
             // (Alter table logic kept as is)
             const columnsSql = `SELECT column_name FROM information_schema.columns WHERE table_schema = '${serviceSchema}' AND table_name = '${tableName}'`;
             const { data: existingColumnsData, error: columnsError } = await supabaseAdmin.rpc('execute_sql', { sql_text: columnsSql });
             if (columnsError || (existingColumnsData && existingColumnsData.error)) {
                console.error('Error fetching columns:', columnsError?.message || existingColumnsData.error);
                continue;
             }
             const existingColumns = new Set(existingColumnsData.map(col => col.column_name)); // Use Set for faster lookup

             for (const col of columns) {
                if (col.name !== 'id' && !existingColumns.has(col.name)) {
                    const alterSql = `ALTER TABLE ${qualifiedTableName} ADD COLUMN "${col.name}" ${col.type}`; // Quote column name
                    console.log(`Adding missing column with SQL: ${alterSql}`);
                    const { data: alterData, error: alterError } = await supabaseAdmin.rpc('execute_sql', { sql_text: alterSql });
                    if (alterError || (alterData && alterData.error)) {
                        console.error(`Failed to add column ${col.name} to ${qualifiedTableName}:`, alterError?.message || alterData.error);
                    } else {
                        console.log(`Column ${col.name} added to ${qualifiedTableName} successfully`);
                    }
                }
             }
             console.log(`Table ${qualifiedTableName} already exists, updated with new columns if necessary`);

        } else {
            // (Create table logic kept as is, added quotes around column names)
             const sql = `CREATE TABLE ${qualifiedTableName} (${columns.map(c => `"${c.name}" ${c.type}${c.constraints ? ' ' + c.constraints : ''}`).join(', ')})`;
             console.log('Creating table with SQL:', sql);
             const { data, error: createError } = await supabaseAdmin.rpc('execute_sql', { sql_text: sql });
             console.log('RPC execute_sql response:', { data, createError });
             if (createError || (data && data.error)) {
                console.error('SQL execution failed:', createError?.message || data.error);
                throw new Error(`Table creation failed for ${qualifiedTableName}: ${createError?.message || data.error}`);
             }
             console.log(`Table ${qualifiedTableName} created successfully`);

             // (Enable RLS logic kept as is)
             const enableRlsSql = `ALTER TABLE ${qualifiedTableName} ENABLE ROW LEVEL SECURITY`;
             const { data: rlsData, error: rlsError } = await supabaseAdmin.rpc('execute_sql', { sql_text: enableRlsSql });
             if (rlsError || (rlsData && rlsData.error)) {
                console.error('RLS enabling failed:', rlsError?.message || rlsData.error);
             } else {
                console.log(`RLS enabled for ${qualifiedTableName}`);
             }
             // Apply RLS policy for regular users (kept your policy logic)
             // CONSIDER: Maybe a simpler initial policy?
             const policySql = `
                CREATE POLICY service_creator_access ON ${qualifiedTableName}
                FOR ALL TO authenticated USING (true) WITH CHECK (true);
             `; // Simplified for initial test - grants access to any authenticated user. Revisit this.
             const { data: policyData, error: policyError } = await supabaseAdmin.rpc('execute_sql', { sql_text: policySql });
             if (policyError || (policyData && policyData.error)) {
                 console.error('RLS policy creation failed:', policyError?.message || policyData.error);
             } else {
                 console.log(`RLS policy applied for ${qualifiedTableName}`);
             }

            // (Service role bypass policy kept as is)
             const serviceRolePolicySql = `
                CREATE POLICY service_role_bypass ON ${qualifiedTableName}
                FOR ALL TO service_role USING (true) WITH CHECK (true);
             `;
             const { data: serviceRoleData, error: serviceRoleError } = await supabaseAdmin.rpc('execute_sql', { sql_text: serviceRolePolicySql });
             if (serviceRoleError || (serviceRoleData && serviceRoleData.error)) {
                console.error('Service role RLS policy creation failed:', serviceRoleError?.message || serviceRoleData.error);
             } else {
                console.log(`Service role RLS bypass policy applied for ${qualifiedTableName}`);
             }
        }
    }

    // --- Grant Schema/Table Permissions ---
    console.log(`Granting USAGE on schema ${serviceSchema} to authenticated`);
    const { error: usageError } = await supabaseAdmin.rpc('execute_sql', {
        sql_text: `GRANT USAGE ON SCHEMA ${serviceSchema} TO authenticated`
    });
    if (usageError) console.error('Error granting USAGE on schema:', usageError);
    else console.log(`USAGE granted on schema ${serviceSchema} to authenticated`);

    console.log(`Granting table permissions on schema ${serviceSchema} to authenticated`);
    const { error: grantTablePermsError } = await supabaseAdmin.rpc('execute_sql', {
        sql_text: `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${serviceSchema} TO authenticated;`
        // Consider if ALTER DEFAULT PRIVILEGES is needed or safe here
    });
    if (grantTablePermsError) console.error('Error granting table permissions:', grantTablePermsError);
    else console.log(`Table permissions granted on schema ${serviceSchema} to authenticated`);

    // --- Handle Relationships ---
    // (Relationship handling logic kept mostly as is, added quotes)
    for (const entity of entities) {
        const entityName = entity.name;
        const normalizedEntityName = entityName.toLowerCase().replace(/\s+/g, '_');
        const qualifiedTableName = `${serviceSchema}.${normalizedEntityName}`;
        const relationships = entity.relationships || {};
        console.log(`Processing relationships for ${qualifiedTableName}:`, relationships);

        for (const [relName, relTarget] of Object.entries(relationships)) {
             const cleanRelName = relName.toLowerCase().replace(/^(sid_|arts_)/, '').replace(/-/g, '_');
             let targetEntity: string | null = null;
             let relationshipType: string = 'unknown';

             if (typeof relTarget === 'object' && relTarget !== null) {
                 targetEntity = relTarget.target;
                 relationshipType = relTarget.type?.toLowerCase() || 'unknown';
             } else if (typeof relTarget === 'string') {
                 targetEntity = relTarget; // Assume target name if only string provided
             }

             if (!targetEntity) {
                 console.warn(`Invalid or missing target for relationship ${cleanRelName} in ${entityName}. Skipping.`);
                 continue;
             }

             // Basic handling for potential array indicators (e.g., "Order[]") - just use base name
             targetEntity = targetEntity.replace(/\[\]$/, '');
             const targetName = targetEntity.toLowerCase().replace(/\s+/g, '_');

             // Skip if target table doesn't exist in our model keys
             if (!tableColumns[targetName]) {
                  console.warn(`Target entity '${targetName}' for relationship '${cleanRelName}' not found in the model's tables. Skipping FK constraint.`);
                  continue;
             }

             const qualifiedTargetName = `${serviceSchema}.${targetName}`;

             // Check if the relationship column already exists
             const columnExistsSql = `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${serviceSchema}' AND table_name = '${normalizedEntityName}' AND column_name = '${cleanRelName}')`;
             const { data: colExistsData, error: colExistsError } = await supabaseAdmin.rpc('execute_sql', { sql_text: columnExistsSql });
             if (colExistsError || (colExistsData && colExistsData.error)) {
                 console.error('Error checking relationship column existence:', colExistsError?.message || colExistsData.error);
                 continue;
             }
             const columnExists = colExistsData && colExistsData.length > 0 ? colExistsData[0].exists : false;

             if (columnExists) {
                 console.log(`Column "${cleanRelName}" already exists in ${qualifiedTableName}, skipping foreign key addition.`);
                 continue;
             }

             // Add the foreign key column
             // Determine if it should reference target's 'id'. Assuming 'id' is always the PK.
             const fkSql = `ALTER TABLE ${qualifiedTableName} ADD COLUMN "${cleanRelName}" text REFERENCES ${qualifiedTargetName}(id)`;
             console.log(`Adding foreign key with SQL: ${fkSql}`);
             const { data: fkData, error: fkError } = await supabaseAdmin.rpc('execute_sql', { sql_text: fkSql });
             console.log('Add FK RPC response:', { fkData, fkError });

             if (fkError || (fkData && fkData.error)) {
                 console.error(`Failed to add foreign key "${cleanRelName}" to ${qualifiedTableName}: ${fkError?.message || fkData.error}`);
             } else {
                  console.log(`Foreign key "${cleanRelName}" added successfully to ${qualifiedTableName}.`);
             }
        }
    }

    // --- Insert Sample Data ---
    // (Sample data insertion logic kept mostly as is, added quotes)
    for (const entity of entities) {
        // (Code to build sampleRecord kept as is)
        const entityName = entity.name;
        const normalizedEntityName = entityName.toLowerCase().replace(/\s+/g, '_');
        const qualifiedTableName = `${serviceSchema}.${normalizedEntityName}`;
        const attributes = entity.attributes || {};

        const attributesArray = typeof attributes === 'object' && !Array.isArray(attributes)
        ? Object.entries(attributes).map(([name, type]) => ({ name, type }))
        : attributes;

        if (attributesArray.length === 0) continue; // Skip if no attributes defined

        const sampleRecord: Record<string, any> = {
            id: `${normalizedEntityName}_sample_1` // Use a consistent sample ID format
        };

        for (const attr of attributesArray) {
            // Use the same cleaning logic as column creation
             let cleanName = (attr.name || attr).replace(/^(sid_|arts_)/, '').replace(/-/g, '_');
             cleanName = cleanName.toLowerCase().replace(/_/g, '');
              if (/^\d+$/.test(cleanName) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanName) || ['table', 'schema', 'select', 'insert', 'update', 'delete'].includes(cleanName)) {
                cleanName = `attr_${cleanName.replace(/[^a-zA-Z0-9_]/g, '') || 'unknown'}`;
             }

            if (cleanName === 'id') continue; // Skip ID, already set

            // Provide sample values based on type
             const sqlType = attr.type === 'string' ? 'text' :
                             attr.type === 'int' || attr.type === 'integer' || attr.type === 'number' ? 'numeric' :
                             attr.type === 'float' || attr.type === 'decimal' ? 'numeric' :
                             attr.type === 'date' || attr.type === 'datetime' ? 'timestamptz' :
                             'text';

             if (sqlType === 'text') {
                sampleRecord[cleanName] = `${cleanName}_sample`;
             } else if (sqlType === 'numeric') {
                sampleRecord[cleanName] = (Math.random() * 100).toFixed(2); // Random numeric
             } else if (sqlType === 'timestamptz') {
                sampleRecord[cleanName] = new Date().toISOString();
             } else {
                sampleRecord[cleanName] = 'sample_text';
             }
        }


        // Check if the sample record already exists
        const checkExistsSql = `SELECT EXISTS (SELECT 1 FROM ${qualifiedTableName} WHERE id = '${sampleRecord.id}')`;
        const { data: existsData, error: existsError } = await supabaseAdmin.rpc('execute_sql', { sql_text: checkExistsSql });
        if (existsError || (existsData && existsData.error)) {
            console.error(`Error checking if sample record exists in ${qualifiedTableName}:`, existsError?.message || existsData.error);
            continue;
        }
        const recordExists = existsData && existsData.length > 0 ? existsData[0].exists : false;

        if (recordExists) {
            console.log(`Record with id '${sampleRecord.id}' already exists in ${qualifiedTableName}, skipping.`);
            continue;
        }

        // Construct INSERT statement safely
        const columns = Object.keys(sampleRecord).map(k => `"${k}"`).join(', '); // Quote column names
        const values = Object.values(sampleRecord)
            .map(val => {
                if (val === null || val === undefined) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`; // Escape single quotes
                return val; // Numbers, booleans handled directly
            })
            .join(', ');
        const insertSql = `INSERT INTO ${qualifiedTableName} (${columns}) VALUES (${values})`;

        console.log(`Inserting sample data SQL: ${insertSql}`);
        const { data: insertData, error: insertError } = await supabaseAdmin.rpc('execute_sql', { sql_text: insertSql });
        if (insertError || (insertData && insertData.error)) {
            console.error(`Failed to insert sample data into ${qualifiedTableName}:`, insertError?.message || insertData.error);
        } else {
            console.log(`Sample data inserted into ${qualifiedTableName} successfully.`);
        }
    }


    // --- Verify Permissions (kept as is) ---
    console.log('Verifying schema permissions');
    const { data: usagePerms, error: usagePermsError } = await supabaseAdmin
        .rpc('execute_sql', { sql_text: `SELECT grantee, privilege_type FROM information_schema.usage_privileges WHERE grantee = 'authenticated' AND object_schema = '${serviceSchema}'` });
    console.log('Schema USAGE permissions for authenticated:', usagePerms, usagePermsError);

    console.log('Verifying table permissions');
    const { data: tablePerms, error: verifyTablePermsError } = await supabaseAdmin
        .rpc('execute_sql', { sql_text: `SELECT table_name, privilege_type FROM information_schema.table_privileges WHERE grantee = 'authenticated' AND table_schema = '${serviceSchema}'` });
    console.log('Table permissions for authenticated:', tablePerms, verifyTablePermsError);

    console.log('Verifying RLS policies');
    const { data: policies, error: policiesError } = await supabaseAdmin
        .rpc('execute_sql', { sql_text: `SELECT policyname, tablename, cmd, permissive, roles FROM pg_policies WHERE schemaname = '${serviceSchema}'` });
    console.log('RLS policies:', policies, policiesError);

    // --- Return refined schema structure ---
    // console.log('Refined schema preview:', JSON.stringify(tableColumns, null, 2));
     return tableColumns; // Return the structure for potential use
}
// --- End of createTableFromModel ---


export async function POST({ request, locals }) {
  const supabase = locals.supabase;
  let sessionResult = locals.session;

  console.log('POST /api/osp/service: Received request.');

  if (sessionResult?.error) {
    console.error('POST /api/osp/service: Session retrieval error from hook:', sessionResult.error);
    throw error(500, `Session error: ${sessionResult.error.message}`);
  }

  const session = sessionResult?.data?.session;
  if (!session) {
    console.warn('POST /api/osp/service: No valid session found via hook/cookies.');
    throw error(401, 'Unauthorized - No active session detected via cookies.');
  }

  console.log(`POST /api/osp/service: Authenticated as ${session.user.email}`);

  const serviceDraft = await request.json();
  console.log('Received service draft:', serviceDraft);

  let blendedModel = { service_type: 'Unknown', entities: [] };
  let spec = '';

  try {
    console.log('Starting OpenAI blend request');
    const blendResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        {
          role: 'system',
          content: `
            You are an expert in blending service models using TMForumSID and ARTS frameworks.
            Given a problem statement, requirements, and selected frameworks, create a blended model
            with entities, their attributes, and relationships. Each entity should have a "provider"
            field set to "Provider". Return **ONLY a valid JSON object** with a "service_type" field
            and an "entities" object containing the entity definitions. Ensure relationships are provided
            within each entity under a "relationships" key in the format { "relationshipName": { "type": "relationshipType", "target": "EntityName" } }.
            Do not include any introductory text, explanations, or markdown formatting outside the JSON object itself.
          `
        },
        {
          role: 'user',
          content: `Problem: ${serviceDraft.problem}\nRequirements: ${serviceDraft.requirements}\nFrameworks: ${serviceDraft.frameworks.join(', ')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    console.log('OpenAI blend response received');
    const rawBlend = blendResponse.choices[0].message.content;
    if (!rawBlend) throw new Error("OpenAI returned empty content for model blend.");
    console.log('Raw blend response:', rawBlend);

    try {
      blendedModel = JSON.parse(rawBlend);
      console.log('Parsed Blended model:', blendedModel);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Raw content received:', rawBlend);
      throw new Error(`Failed to parse AI model response: ${parseError.message}`);
    }
  } catch (err) {
    console.error('Error blending models with OpenAI:', err);
    throw error(503, 'Failed to generate service model via AI. Please try again later.');
  }

  try {
    console.log('Starting spec generation');
    const specResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert in generating detailed service specifications. Generate a specification based on the problem, requirements, and blended model provided.`
        },
        {
          role: 'user',
          content: `Problem: ${serviceDraft.problem}\nRequirements: ${serviceDraft.requirements}\nBlended Model: ${JSON.stringify(blendedModel, null, 2)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });
    console.log('Spec response received');
    spec = specResponse.choices[0].message.content || '';
    if (!spec) console.warn("OpenAI returned empty content for specification.");
    console.log('Generated spec length:', spec.length);
  } catch (err) {
    console.error('Error generating spec with OpenAI:', err);
    spec = 'Failed to generate specification text due to an AI error.';
  }

  const prompt = `${serviceDraft.problem} - ${serviceDraft.requirements}`;
  const serviceSchema = 'smb_inventory';

  console.log('Checking existing service version with prompt:', prompt);
  const { data: existingService, error: fetchServiceError } = await supabase
    .from('services')
    .select('version')
    .eq('prompt', prompt)
    .eq('user_id', session.user.id)
    .order('version', { ascending: false })
    .limit(1);

  if (fetchServiceError) {
    console.error('Error fetching existing service version:', fetchServiceError);
    throw error(500, `Database error checking service: ${fetchServiceError.message}`);
  }

  const newVersion = (existingService?.[0]?.version ?? 0) + 1;
  console.log(`Determined new version: ${newVersion}`);

  try {
    console.log(`Calling createTableFromModel for version ${newVersion}...`);
    await createTableFromModel(blendedModel, serviceDraft, serviceSchema);
    console.log(`createTableFromModel completed for version ${newVersion}.`);
  } catch (err) {
    console.error('Error during createTableFromModel:', err);
    throw error(500, `Failed to update database schema: ${err.message}`);
  }

  console.log('Inserting service metadata into services table...');
  const { error: insertServiceError } = await supabase.from('services').insert({
    user_id: session.user.id,
    prompt: prompt,
    spec: spec,
    version: newVersion,
    service_schema: serviceSchema,
    blended_model: blendedModel,
    created_at: new Date().toISOString(),
    frameworks: serviceDraft.frameworks // Already an array, matches text[]
    // Removed: problem, requirements (not in schema)
    // Optional: Add defaults for other columns if needed (e.g., framework, provider)
  });

  if (insertServiceError) {
    console.error('Error inserting into services table:', insertServiceError);
    throw error(500, `Failed to save service metadata: ${insertServiceError.message}`);
  }

  console.log(`Service version ${newVersion} metadata saved successfully.`);
  console.log('Returning spec and model result to client.');

  return json({
    spec,
    blendedModel,
    version: newVersion,
    message: `Service version ${newVersion} generated successfully.`
  });
}