// 📁 File: src/routes/api/osp/service/+server.ts
import type { RequestEvent } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { sanitizeBlendedModel, validateBlendedModel } from '$lib/osp/modelValidation';
import { buildContractUIFromModel } from '$lib/osp/contractUIBuilder';
//import fetch from 'node-fetch';

// --- Utilities ---

// 🔵 Generate a unique, valid schema name
async function generateUniqueSchemaName(baseName: string): Promise<string> {
  let schemaName = baseName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 40);

  let suffix = 1;
  while (true) {
    const { data, error: rpcError } = await supabaseAdmin.rpc('schema_exists', {
      schema_name_input: schemaName
    });
    if (rpcError) {
      console.error('Schema existence check failed:', rpcError.message);
      throw new Error('Failed to check existing schemas');
    }
    if (!data) break;

    schemaName = `${baseName}_${suffix}`
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    suffix++;
  }

  return schemaName;
}

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

  // Drop existing schema to ensure clean slate (optional, consider removing if risky)
  console.log(`Dropping schema ${serviceSchema} if it exists`);
  const dropSchemaSql = `DROP SCHEMA IF EXISTS ${serviceSchema} CASCADE`;
  const { error: dropSchemaError } = await supabaseAdmin.rpc('execute_sql', { sql_text: dropSchemaSql });
  if (dropSchemaError) {
    console.error('Failed to drop schema:', dropSchemaError?.message);
    throw new Error(`Failed to drop schema ${serviceSchema}: ${dropSchemaError.message}`);
  }

  // Create schema
  console.log(`🔨 Calling create_service_schema with: ${serviceSchema}`);
  const { data: schemaCreated, error: schemaCreateError } = await supabaseAdmin
    .rpc('create_service_schema', { service_schema_name: serviceSchema });

  if (schemaCreateError) {
    console.error('❌ Failed to create service schema:', schemaCreateError);
    throw error(500, `Schema creation RPC failed for: ${serviceSchema}`);
  }

  console.log('✅ Schema created successfully:', serviceSchema);

  // Define table columns
  const tableColumns: Record<string, { name: string; type: string; constraints?: string }[]> = {};
  for (const entity of entities) {
    const entityName = entity.name;
    if (!entityName) {
      console.error('Entity missing name:', entity);
      throw new Error('All entities must have a name');
    }
    const normalizedEntityName = entityName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const columns: { name: string; type: string; constraints?: string }[] = [];

    columns.push({ name: 'id', type: 'text', constraints: 'PRIMARY KEY' });

    const attributes = entity.attributes || {};
    const attributesArray = typeof attributes === 'object' && !Array.isArray(attributes)
      ? Object.entries(attributes).map(([name, type]) => ({ name, type }))
      : attributes;

    for (const attr of attributesArray) {
      const columnName = attr.name.toLowerCase(); // Already validated as valid
      const sqlType = attr.type === 'string' ? 'text' :
                      attr.type === 'int' || attr.type === 'integer' || attr.type === 'number' ? 'numeric' :
                      attr.type === 'float' || attr.type === 'decimal' ? 'numeric' :
                      attr.type === 'date' || attr.type === 'datetime' ? 'timestamptz' :
                      'text';
      columns.push({ name: columnName, type: sqlType });
    }
    tableColumns[normalizedEntityName] = columns;
  }

  // Create tables
  for (const [tableName, columns] of Object.entries(tableColumns)) {
    const qualifiedTableName = `${serviceSchema}.${tableName}`;
    const sql = `CREATE TABLE ${qualifiedTableName} (${columns.map(c => `"${c.name}" ${c.type}${c.constraints ? ' ' + c.constraints : ''}`).join(', ')})`;
    console.log('Creating table with SQL:', sql);
    const { data, error: createError } = await supabaseAdmin.rpc('execute_sql', { sql_text: sql });
    if (createError) {
      console.error('SQL execution failed:', createError?.message);
      throw new Error(`Table creation failed for ${qualifiedTableName}`);
    }
    console.log(`Table ${qualifiedTableName} created`);
  }

  // 🛡️ After creating all tables, fix RLS policies for all tables in the schema
  const fixRlsSql = `
  DO $$
  DECLARE
      r RECORD;
  BEGIN
      FOR r IN (SELECT table_name FROM information_schema.tables WHERE table_schema = '${serviceSchema}') LOOP
          EXECUTE 'ALTER TABLE ${serviceSchema}.' || quote_ident(r.table_name) || ' ENABLE ROW LEVEL SECURITY';

          EXECUTE 'DROP POLICY IF EXISTS service_creator_access ON ${serviceSchema}.' || quote_ident(r.table_name);
          EXECUTE '
              CREATE POLICY service_creator_access ON ${serviceSchema}.' || quote_ident(r.table_name) || '
              FOR ALL TO authenticated USING (true) WITH CHECK (true);
          ';

          EXECUTE 'DROP POLICY IF EXISTS service_role_bypass ON ${serviceSchema}.' || quote_ident(r.table_name);
          EXECUTE '
              CREATE POLICY service_role_bypass ON ${serviceSchema}.' || quote_ident(r.table_name) || '
              FOR ALL TO service_role USING (true) WITH CHECK (true);
          ';
      END LOOP;
  END $$;
  `;

  const { error: rlsFixError } = await supabaseAdmin.rpc('execute_sql', { sql_text: fixRlsSql });
  if (rlsFixError) {
    console.error('Failed to fix RLS policies:', rlsFixError?.message);
    throw new Error('Failed to apply RLS policies to all tables');
  }

  // Handle relationships
  for (const entity of entities) {
    const entityName = entity.name;
    const normalizedEntityName = entityName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const qualifiedTableName = `${serviceSchema}.${normalizedEntityName}`;
    const relationships = entity.relationships || {};

    for (const [relName, relTarget] of Object.entries(relationships)) {
      const cleanRelName = relName.toLowerCase(); // Already validated
      let targetEntity: string | null = null;
      if (typeof relTarget === 'object' && relTarget !== null) {
        targetEntity = relTarget.target;
      } else if (typeof relTarget === 'string') {
        targetEntity = relTarget;
      }

      if (!targetEntity) {
        console.warn(`Invalid relationship ${cleanRelName} in ${entityName}. Skipping.`);
        continue;
      }

      targetEntity = targetEntity.replace(/\[\]$/, '');
      const targetName = targetEntity.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      if (!tableColumns[targetName]) {
        console.warn(`Target entity '${targetName}' for relationship '${cleanRelName}' not found. Skipping.`);
        continue;
      }

      const qualifiedTargetName = `${serviceSchema}.${targetName}`;
      const fkSql = `ALTER TABLE ${qualifiedTableName} ADD COLUMN "${cleanRelName}" text REFERENCES ${qualifiedTargetName}(id)`;
      console.log(`Adding foreign key with SQL: ${fkSql}`);
      const { error: fkError } = await supabaseAdmin.rpc('execute_sql', { sql_text: fkSql });
      if (fkError) {
        console.error(`Failed to add foreign key "${cleanRelName}" to ${qualifiedTableName}:`, fkError?.message);
        throw new Error(`Failed to add foreign key for ${qualifiedTableName}`);
      }
      console.log(`Foreign key "${cleanRelName}" added to ${qualifiedTableName}`);
    }
  }

  // Insert sample data
  for (const entity of entities) {
    const entityName = entity.name;
    const normalizedEntityName = entityName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const qualifiedTableName = `${serviceSchema}.${normalizedEntityName}`;
    const attributes = entity.attributes || {};

    const attributesArray = typeof attributes === 'object' && !Array.isArray(attributes)
      ? Object.entries(attributes).map(([name, type]) => ({ name, type }))
      : attributes;

    if (attributesArray.length === 0) continue;

    const sampleRecord: Record<string, any> = {
      id: `${normalizedEntityName}_sample_1`
    };

    for (const attr of attributesArray) {
      const columnName = attr.name.toLowerCase();
      if (columnName === 'id') continue;

      const sqlType = attr.type === 'string' ? 'text' :
                      attr.type === 'int' || attr.type === 'integer' || attr.type === 'number' ? 'numeric' :
                      attr.type === 'float' || attr.type === 'decimal' ? 'numeric' :
                      attr.type === 'date' || attr.type === 'datetime' ? 'timestamptz' :
                      'text';

      if (sqlType === 'text') {
        sampleRecord[columnName] = `${columnName}_sample`;
      } else if (sqlType === 'numeric') {
        sampleRecord[columnName] = (Math.random() * 100).toFixed(2);
      } else if (sqlType === 'timestamptz') {
        sampleRecord[columnName] = new Date().toISOString();
      } else {
        sampleRecord[columnName] = 'sample_text';
      }
    }

    const columns = Object.keys(sampleRecord).map(k => `"${k}"`).join(', ');
    const values = Object.values(sampleRecord)
      .map(val => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        return val;
      })
      .join(', ');
    const insertSql = `INSERT INTO ${qualifiedTableName} (${columns}) VALUES (${values})`;

    console.log(`Inserting sample data SQL: ${insertSql}`);
    const { error: insertError } = await supabaseAdmin.rpc('execute_sql', { sql_text: insertSql });
    if (insertError) {
      console.error(`Failed to insert sample data into ${qualifiedTableName}:`, insertError?.message);
      throw new Error(`Failed to insert sample data for ${qualifiedTableName}`);
    }
    console.log(`Sample data inserted into ${qualifiedTableName}`);
  }

  return tableColumns;
}

export async function POST({ request, locals, params }) {
  console.log('🟢 POST /api/osp/service reached!');
  const supabase = locals.supabase;
  let sessionResult = locals.session;

  let serviceDraft;
  try {
    serviceDraft = await request.json();
    console.log('✅ Parsed service draft:', serviceDraft);
  } catch (err) {
    console.error('❌ Failed to parse JSON payload:', err.message);
    throw error(400, 'Invalid JSON payload');
  }

  if (sessionResult?.error) {
    throw error(500, `Session error: ${sessionResult.error.message}`);
  }

  const session = sessionResult?.data?.session;
  if (!session) {
    throw error(401, 'Unauthorized - No active session detected.');
  }

  const prompt = `${serviceDraft.problem} - ${serviceDraft.requirements}`;
  const serviceSchema = serviceDraft.service_schema || serviceDraft.schema_name || await generateUniqueSchemaName(serviceDraft.problem);
  console.log(`📦 Using schema name: ${serviceSchema}`);

  // Generate blended model
  let blendedModel = { service_type: 'Unknown', entities: [] };
  let spec = '';
  let contractUI: any = null;
  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      timeout: 60000,
      maxRetries: 3
    });
    const blendResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: "json_object" },
      messages: [
        {
          role: 'system',
          content: `You are an expert in blending service models using TMForumSID and ARTS frameworks. Given a problem statement, requirements, and selected frameworks, create a blended model with entities, their attributes, and relationships.
          
Rules:
- Each entity must include a "provider" attribute of type "text" ONLY IF a relationship named "provider" does NOT already exist in that entity.
- If a "provider" relationship OR a "provider" attribute already exists, DO NOT add another.
- NEVER allow an attribute and a relationship to have the same name inside an entity.

Output Structure:
- Return ONLY a valid JSON object with a "service_type" string and an "entities" array.
- Each entity must have:
  - a "name" (string)
  - an "attributes" object (key-value pairs: attribute_name -> type)
  - a "relationships" object (key-value pairs: relationship_name -> { "type": "relationshipType", "target": "EntityName" })

Field Naming Rules:
- All attribute and relationship names must be:
  - lowercase
  - use underscores
  - valid PostgreSQL identifiers (not reserved words or purely numeric)

Important:
- No duplicate attribute names within an entity.
- No attribute and relationship sharing the same name in the same entity.
- No extra explanations, markdown, or text outside the JSON object.`
        },
        {
          role: 'user',
          content: `Problem: ${serviceDraft.problem}
Requirements: ${serviceDraft.requirements}
Frameworks: ${serviceDraft.frameworks.join(', ')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const rawBlend = blendResponse.choices[0].message.content;
    if (!rawBlend) throw new Error("Empty model response.");
    blendedModel = JSON.parse(rawBlend);

    // ✨ Fix potential conflicts BEFORE validating
    blendedModel = sanitizeBlendedModel(blendedModel);

    // Now validate after fixing
    validateBlendedModel(blendedModel);

    // ✅ Generate contract UI from the validated blended model
    contractUI = buildContractUIFromModel(blendedModel);

  } catch (e) {
    console.error('AI Blend failed:', e);
    throw error(503, `AI model failed to generate service: ${e.message}`);
  }

  // ✅ Ensure contractUI has a fallback if generation failed
  if (!contractUI) {
    contractUI = buildContractUIFromModel(blendedModel);
  }

  // Generate service spec
  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      timeout: 60000,
      maxRetries: 3
    });
    const specResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert in generating detailed service specifications. Your job is to write a rich, thorough, professional-grade specification based on the provided problem, requirements, and blended model.
          
Rules:
- Use exactly and only the table names, field names, and relationships provided in the blended model.
- Never invent new fields, tables, or relationships.
- Create detailed, human-readable descriptions explaining how each table and field is used.
- Include entity descriptions, typical workflows, use cases, and example scenarios.
- Write the specification in Markdown format.`
        },
        {
          role: 'user',
          content: `Problem: ${serviceDraft.problem}\nRequirements: ${serviceDraft.requirements}\nBlended Model: ${JSON.stringify(blendedModel)}`
        }
      ]
    });
    spec = specResponse.choices[0].message.content || '';
  } catch (err) {
    spec = 'Spec generation failed.';
    console.warn('OpenAI spec generation warning:', err);
  }

  // 🛠️ Create tables, relationships, sample data, and RLS
  await createTableFromModel(blendedModel, serviceDraft, serviceSchema);

  // Insert metadata
  const { data: existing, error: fetchError } = await supabase
    .from('services')
    .select('version')
    .eq('prompt', prompt)
    .eq('user_id', session.user.id)
    .order('version', { ascending: false })
    .limit(1);

  const newVersion = (existing?.[0]?.version ?? 0) + 1;

  const { data: serviceInsert, error: insertError } = await supabase
  .from('services')
  .insert({
    user_id: session.user.id,
    prompt,
    spec,
    version: newVersion,
    service_schema: serviceSchema,
    blended_model: blendedModel,
    created_at: new Date().toISOString(),
    frameworks: serviceDraft.frameworks
  })
  .select('id') // 👈 needed to get service_id (bigint)
  .single();

if (insertError || !serviceInsert) {
  console.error('❌ Metadata insert failed:', insertError);
  throw error(500, 'Service metadata save failed.');
}

// ✅ Create the default manifest
const defaultManifest = {
  name: serviceDraft.servicename || serviceSchema,
  type: 'module',
  version: '0.1.0',
  created_by: session.user.email,
  origin_prompt: prompt,
  contract_ui: contractUI,
  data_model: {
    blended_model: blendedModel
  },
  provenance: {
    created_at: new Date().toISOString(),
    created_via: 'AI_ASSISTED',
    source_prompt: prompt,
    derived_from: null
  },
  api: {
    openapi_spec: null,
    endpoints: []
  },
  rules: {
    global_policies: [],
    service_constraints: {}
  },
  dependencies: {
    uses_services: [],
    external_apis: [],
    publishes_events: [],
    subscribes_events: []
  },
  permissions: {
    editable_by: ['Service Creator'],
    deployable_by: ['Service Creator'],
    access_roles: ['Consumer']
  },
  validation: {
    last_validated: null,
    validated_by: null,
    issues_found: 0,
    suggestions: []
  },
  inherits_from: [],
  overrides: {}
};

// ✅ Insert manifest via RPC
const { error: manifestInsertError } = await supabaseAdmin.rpc('insert_manifest', {
  in_service_id: serviceInsert.id,
  in_manifest: defaultManifest
});

if (manifestInsertError) {
  console.error('❌ Manifest insert failed via RPC:', manifestInsertError);
  throw error(500, 'Manifest creation via RPC failed.');
}

return json({
  spec,
  blendedModel,
  version: newVersion,
  service_schema: serviceSchema,
  message: `Service version ${newVersion} generated and saved.`,
  service: {
    id: serviceInsert.id,
    user_id: session.user.id,
    prompt,
    spec,
    version: newVersion,
    service_schema: serviceSchema,
    blended_model: blendedModel,
    created_at: new Date().toISOString(),
    frameworks: serviceDraft.frameworks
  }
});
}

export async function GET({ locals }) {
  console.log('🟢 GET /api/osp/service reached!');
  const supabase = locals.supabase;
  let sessionResult = locals.session;

  if (sessionResult?.error) {
    throw error(500, `Session error: ${sessionResult.error.message}`);
  }

  const session = sessionResult?.data?.session;
  if (!session) {
    throw error(401, 'Unauthorized - No active session detected.');
  }

  // Get the latest service for this user
  const { data: service, error: fetchError } = await supabase
    .from('services')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError) {
    console.error('❌ Failed to fetch latest service:', fetchError);
    throw error(500, 'Failed to fetch latest service');
  }

  if (!service) {
    return json({ serviceDraft: null });
  }

  // Now also get the latest corresponding manifest
  const { data: manifestRow, error: manifestError } = await supabaseAdmin
    .schema('osp_metadata')
    .from('service_manifests')
    .select('id')
    .eq('service_id', service.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle(); // ✅ SAFER

  if (manifestError) {
    console.error('❌ Failed to fetch latest manifest for service:', manifestError);
  }

  return json({
    serviceDraft: {
      ...service,
      manifest_id: manifestRow?.id || null
    }
  });
}
