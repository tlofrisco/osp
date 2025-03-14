import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import 'dotenv/config';
import { supabase } from '$lib/supabase';
import { supabaseAdmin } from '$lib/supabaseAdmin';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function createTableFromModel(blendedModel, prompt) {
  let entities = blendedModel.entities || {};
  if (Array.isArray(entities)) {
    console.log('Converting array entities to object');
    entities = entities.reduce((acc, entity) => {
      const entityName = entity.name || `entity_${Object.keys(acc).length}`;
      acc[entityName] = {
        attributes: entity.attributes || {},
        relationships: entity.relationships || {},
        provider: entity.provider || 'generic-provider',
        suppliers: entity.suppliers || 'generic-supplier',
        consumers: entity.consumers || 'generic-consumer'
      };
      return acc;
    }, {});
  }

  const refinedTables = {};

  // First pass: Define main entities
  for (const [entityName, entity] of Object.entries(entities)) {
    const columns = [];
    const attributes = entity.attributes || {};
    const seenColumns = new Set();

    let idField = 'id';
    const attrKeys = Object.keys(attributes);
    const idCandidate = attrKeys.find(k => k.toLowerCase().includes('id')) || 'id';
    if (idCandidate !== 'id') {
      attributes['id'] = attributes[idCandidate];
      delete attributes[idCandidate];
    }
    columns.push({ name: 'id', type: 'text', constraints: 'PRIMARY KEY' });
    seenColumns.add('id');

    for (const [attrName, attrType] of Object.entries(attributes)) {
      const sqlType = attrType === 'string' ? 'text' : attrType === 'date' ? 'date' : attrType === 'float' ? 'numeric' : attrType === 'int' ? 'integer' : attrType === 'list' ? 'text[]' : 'text';
      const cleanName = attrName.replace(/^(sid_|arts_)/, '');
      if (!seenColumns.has(cleanName)) {
        columns.push({ name: cleanName, type: sqlType });
        seenColumns.add(cleanName);
      }
    }

    refinedTables[entityName] = columns;
  }

  // Second pass: Add relationships and referenced tables
  for (const [entityName, entity] of Object.entries(entities)) {
    const columns = refinedTables[entityName];
    const seenColumns = new Set(columns.map(c => c.name));

    if (entity.relationships) {
      for (const [relName, relTarget] of Object.entries(entity.relationships)) {
        const cleanRelName = relName.replace(/^(sid_|arts_)/, '');
        let targetName = relTarget;

        // Extract target from parentheses if present (e.g., "provider (sid_inventoryServiceProvider)")
        if (typeof relTarget === 'string' && relTarget.includes('(')) {
          targetName = relTarget.match(/\(([^)]+)\)/)?.[1] || relTarget;
        }

        if (targetName && !seenColumns.has(cleanRelName)) {
          columns.push({ name: cleanRelName, type: 'text', constraints: `REFERENCES ${targetName}(id)` });
          seenColumns.add(cleanRelName);
        }

        // Create referenced table if not already defined
        if (targetName && !refinedTables[targetName]) {
          refinedTables[targetName] = [
            { name: 'id', type: 'text', constraints: 'PRIMARY KEY' },
            { name: 'name', type: 'text' }
          ];
        }
      }
    }
  }

  // Create tables in Supabase
  for (const [entityName, columns] of Object.entries(refinedTables)) {
    let version = 0;
    let created = false;

    while (!created) {
      const checkName = version === 0 ? entityName : `${entityName}_v${version}`;
      const { data: exists } = await supabaseAdmin.rpc('table_exists', { table_name: checkName });
      console.log(`Does ${checkName} exist?`, exists);

      if (exists === false || exists === null) {
        const sql = `CREATE TABLE ${checkName} (${columns.map(c => `${c.name} ${c.type}${c.constraints ? ' ' + c.constraints : ''}`).join(', ')});`;
        console.log('Creating table with SQL:', sql);
        const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql_text: sql });
        console.log('RPC execute_sql response:', { data, error });
        if (error || (data && data.startsWith('Error'))) {
          console.error('SQL execution failed:', data || error);
          if (data && data.includes('already exists')) {
            version++;
            continue;
          }
          break;
        } else {
          console.log(`Table ${checkName} created successfully with data:`, data);
          created = true;
        }
      } else {
        version++;
      }
    }
  }

  console.log('Refined schema preview:', JSON.stringify(refinedTables, null, 2));
}

export async function POST({ request }) {
  const { prompt } = await request.json();
  console.log('Received prompt:', prompt);

  try {
    const combinedPrompt = `Classify this service into a type: "${prompt}" (e.g., "SMB Inventory", "Managed WiFi"), then synthesize a data model with entities, attributes, relationships, provider, suppliers, consumers based on type and models ["TMForumSID", "ARTS"]. Use prefixes (e.g., sid_, arts_) for clarity. Output as JSON with "service_type" and "entities" keys.`;
    const blendResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: combinedPrompt }],
      max_tokens: 1000
    });
    const rawBlendContent = blendResponse.choices[0].message.content;
    console.log('Raw blend response:', rawBlendContent);

    let blendedModel;
    try {
      blendedModel = JSON.parse(rawBlendContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Attempting to fix JSON...');
      const fixedContent = rawBlendContent.replace(/(\w+)\s+(\w+)/g, '"$1": "$2"').replace(/'/g, '"');
      blendedModel = JSON.parse(fixedContent || '{}');
    }
    console.log('Blended model:', blendedModel);

    const serviceType = blendedModel.service_type || 'Unknown';
    const entities = blendedModel.entities || {};

    const specPrompt = `Generate a detailed spec for "${prompt}" based on this blended model: ${JSON.stringify(blendedModel)}.`;
    const specResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: specPrompt }],
      max_tokens: 1000
    });
    const spec = specResponse.choices[0].message.content;
    console.log('Generated spec:', spec);

    const { data: existingService } = await supabase.from('services').select('version').eq('prompt', prompt).order('version', { ascending: false }).limit(1);
    const version = (existingService?.[0]?.version || 0) + 1;

    await createTableFromModel(blendedModel, prompt);

    const { error } = await supabase.from('services').insert({
      prompt,
      spec,
      framework: 'Blended (TMForumSID+ARTS)',
      provider: blendedModel.provider || 'OSP Inc',
      suppliers: blendedModel.suppliers || ['generic-supplier'],
      consumers: blendedModel.consumers || ['generic-consumer'],
      version,
      blended_model: blendedModel,
      metadata: blendedModel.metadata || {}
    });
    if (error) console.error('Supabase insert error:', error);
    else console.log('Inserted into services successfully');

    return json({ result: spec });
  } catch (error) {
    console.error('Error:', error);
    return json({ error: error.message, details: error.stack }, { status: 500 });
  }
}