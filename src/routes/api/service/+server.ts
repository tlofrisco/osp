import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import 'dotenv/config';
import { supabase } from '$lib/supabase';
import { supabaseAdmin } from '$lib/supabaseAdmin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 8000
});

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

  for (const [entityName, entity] of Object.entries(entities)) {
    const normalizedEntityName = entityName.replace(/-/g, '_');
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
      let cleanName = attrName.replace(/^(sid_|arts_)/, '').replace(/-/g, '_');
      if (/^\d+$/.test(cleanName) || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanName)) {
        cleanName = `attr_${cleanName.replace(/[^a-zA-Z0-9_]/g, '') || 'unknown'}`;
        console.warn(`Invalid attribute name "${attrName}" for ${normalizedEntityName}, renamed to "${cleanName}"`);
      }
      const sqlType = attrType === 'string' ? 'text' : attrType === 'date' ? 'date' : attrType === 'float' ? 'numeric' : attrType === 'int' ? 'integer' : attrType === 'list' ? 'text[]' : 'text';
      if (!seenColumns.has(cleanName)) {
        columns.push({ name: cleanName, type: sqlType });
        seenColumns.add(cleanName);
      }
    }

    refinedTables[normalizedEntityName] = columns;
  }

  for (const [entityName, entity] of Object.entries(entities)) {
    const normalizedEntityName = entityName.replace(/-/g, '_');
    const columns = refinedTables[normalizedEntityName];
    const seenColumns = new Set(columns.map(c => c.name));

    if (entity.relationships) {
      for (const [relName, relTarget] of Object.entries(entity.relationships)) {
        const cleanRelName = relName.replace(/^(sid_|arts_)/, '').replace(/-/g, '_');
        let targetName;

        if (typeof relTarget === 'string') {
          targetName = relTarget;
          if (targetName.includes('(')) {
            targetName = targetName.match(/\(([^)]+)\)/)?.[1] || targetName;
          }
        } else {
          console.warn(`Invalid relTarget for ${cleanRelName}: ${JSON.stringify(relTarget)}. Defaulting to generic_target.`);
          targetName = 'generic_target';
        }

        targetName = String(targetName).replace(/-/g, '_');

        if (targetName && !seenColumns.has(cleanRelName)) {
          columns.push({ name: cleanRelName, type: 'text', constraints: `REFERENCES ${targetName}(id)` });
          seenColumns.add(cleanRelName);
        }

        if (targetName && !refinedTables[targetName]) {
          refinedTables[targetName] = [
            { name: 'id', type: 'text', constraints: 'PRIMARY KEY' },
            { name: 'name', type: 'text' }
          ];
        }
      }
    }
  }

  for (const [entityName, columns] of Object.entries(refinedTables)) {
    let version = 0;
    let created = false;
    const maxAttempts = 5;

    while (!created && version < maxAttempts) {
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

    if (!created) {
      console.error(`Failed to create table ${entityName} after ${maxAttempts} attempts`);
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
      console.error('JSON parse error:', parseError.message, 'Raw content:', rawBlendContent);
      console.error('Attempting to fix JSON...');
      const jsonMatch = rawBlendContent.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || rawBlendContent;
      const fixedContent = jsonMatch
        .replace(/(\w+)\s+(\w+)/g, '"$1": "$2"')
        .replace(/'/g, '"')
        .trim();
      try {
        blendedModel = JSON.parse(fixedContent);
      } catch (secondError) {
        console.error('Second parse attempt failed:', secondError.message);
        blendedModel = { service_type: 'Unknown', entities: {} };
      }
    }
    console.log('Blended model:', blendedModel);

    const normalizedModel = {
      ...blendedModel,
      service_type: blendedModel.service_type || 'Unknown',
      entities: Object.fromEntries(
        Object.entries(blendedModel.entities || {}).map(([key, value]) => {
          const newKey = key.replace(/-/g, '_');
          return [
            newKey,
            {
              ...value,
              attributes: Object.fromEntries(
                Object.entries(value.attributes || {}).map(([attrKey, attrValue]) => [
                  attrKey.replace(/-/g, '_'),
                  attrValue
                ])
              ),
              relationships: Object.fromEntries(
                Object.entries(value.relationships || {}).map(([relKey, relValue]) => {
                  const newRelKey = relKey.replace(/-/g, '_');
                  const newRelValue = typeof relValue === 'string' ? relValue.replace(/-/g, '_') : relValue;
                  return [newRelKey, newRelValue];
                })
              ),
              provider: value.provider ? value.provider.replace(/-/g, '_') : value.provider,
              suppliers: Array.isArray(value.suppliers) ? value.suppliers.map(s => s.replace(/-/g, '_')) : value.suppliers,
              consumers: Array.isArray(value.consumers) ? value.consumers.map(c => c.replace(/-/g, '_')) : value.consumers,
            },
          ];
        })
      ),
      provider: blendedModel.provider ? blendedModel.provider.replace(/-/g, '_') : blendedModel.provider,
      suppliers: Array.isArray(blendedModel.suppliers) ? blendedModel.suppliers.map(s => s.replace(/-/g, '_')) : blendedModel.suppliers,
      consumers: Array.isArray(blendedModel.consumers) ? blendedModel.consumers.map(c => c.replace(/-/g, '_')) : blendedModel.consumers,
    };

    const serviceType = normalizedModel.service_type;
    const entities = normalizedModel.entities;

    const specPrompt = `Generate a detailed spec for "${prompt}" based on this blended model: ${JSON.stringify(normalizedModel)}.`;
    const specResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: specPrompt }],
      max_tokens: 1000
    });
    const spec = specResponse.choices[0].message.content;
    console.log('Generated spec:', spec);

    const { data: existingService } = await supabase.from('services').select('version').eq('prompt', prompt).order('version', { ascending: false }).limit(1);
    const version = (existingService?.[0]?.version || 0) + 1;

    await createTableFromModel(normalizedModel, prompt);

    const { error } = await supabase.from('services').insert({
      prompt,
      spec,
      framework: 'Blended (TMForumSID+ARTS)',
      provider: normalizedModel.provider || 'OSP_Inc',
      suppliers: normalizedModel.suppliers || ['generic_supplier'],
      consumers: normalizedModel.consumers || ['generic_consumer'],
      version,
      blended_model: normalizedModel,
      metadata: normalizedModel.metadata || {}
    });
    if (error) console.error('Supabase insert error:', error);
    else console.log('Inserted into services successfully');

    return json({ result: spec });
  } catch (error) {
    console.error('Error:', error.message);
    return json({ error: error.message, details: error.stack }, { status: 500 });
  }
}