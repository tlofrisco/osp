import { json, error } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';
import { sanitizeBlendedModel, validateBlendedModel } from '$lib/osp/modelValidation';
import { buildContractUIFromModel, buildWorkflowsFromModel } from '$lib/osp';
import type { RequestEvent } from '@sveltejs/kit';

interface RegenerationRequest {
  dimensions: ('schema' | 'ui' | 'workflows' | 'all')[];
  entities?: string[];
  preserveCustomizations?: boolean;
  changes?: SchemaChange[];
}

interface SchemaChange {
  type: 'field_added' | 'field_removed' | 'field_modified' | 'entity_added' | 'entity_removed';
  entity: string;
  field?: string;
  details?: any;
}

interface ProtectedRegions {
  ui?: {
    custom?: any;
    generated?: any;
  };
  workflows?: {
    custom?: any;
    generated?: any;
  };
}

export async function POST({ request, locals, params }: RequestEvent) {
  console.log('🔄 POST /api/osp/service/[id]/regenerate reached!');
  
  const supabase = locals.supabase;
  const sessionResult = locals.session;
  const serviceId = params.id;

  if (!sessionResult) {
    throw error(401, 'Unauthorized - No active session detected.');
  }

  const session = sessionResult.data?.session;
  const user = sessionResult.data?.user || session?.user;

  if (!user?.id) {
    throw error(401, 'Unauthorized - Session missing user information.');
  }

  // Parse regeneration request
  let regenerationRequest: RegenerationRequest;
  try {
    regenerationRequest = await request.json();
    console.log('📋 Regeneration request:', regenerationRequest);
  } catch (err) {
    throw error(400, 'Invalid JSON payload');
  }

  // Fetch existing service
  const { data: service, error: fetchError } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !service) {
    throw error(404, 'Service not found');
  }

  console.log('📦 Found service:', service.service_schema);

  // Extract current state
  const currentBlendedModel = service.blended_model;
  const currentManifest = service.metadata;
  const currentContractUI = currentManifest?.contract_ui;
  
  // Load any existing customizations
  const { data: customizations } = await supabaseAdmin
    .from('service_customizations')
    .select('*')
    .eq('service_id', serviceId)
    .single();

  const protectedRegions: ProtectedRegions = customizations?.protected_regions || {};

  try {
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      timeout: 60000,
      maxRetries: 3
    });

    let updatedBlendedModel = { ...currentBlendedModel };
    let updatedContractUI = currentContractUI ? { ...currentContractUI } : null;

    // Handle different regeneration scenarios
    if (regenerationRequest.dimensions.includes('all')) {
      // Full regeneration with protected regions
      console.log('🔄 Performing full regeneration with protected regions...');
      
      const regenerationResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: `You are updating an existing service while preserving customizations.
            
RULES:
1. Maintain the THREE-LEGGED STOOL principle
2. Preserve any custom fields, workflows, or UI components marked as custom
3. Update only the generated portions
4. Ensure new changes integrate smoothly with existing customizations
5. If schema changes are provided, propagate them to workflows and UI

Current protected customizations:
${JSON.stringify(protectedRegions, null, 2)}

Return the updated service definition in the same format as before.`
          },
          {
            role: 'user',
            content: `Update the service based on these changes:
${JSON.stringify(regenerationRequest.changes || [], null, 2)}

Current service definition:
${JSON.stringify(currentBlendedModel, null, 2)}

Preserve all customizations and update only generated portions.`
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
      });

      const regeneratedService = JSON.parse(regenerationResponse.choices[0].message.content || '{}');
      updatedBlendedModel = mergeWithProtectedRegions(regeneratedService, protectedRegions, currentBlendedModel);
      
    } else {
      // Targeted dimension regeneration
      for (const dimension of regenerationRequest.dimensions) {
        console.log(`🔄 Regenerating dimension: ${dimension}`);
        
        switch (dimension) {
          case 'ui':
            updatedContractUI = await regenerateUI(
              currentBlendedModel, 
              protectedRegions.ui,
              regenerationRequest.entities,
              openai
            );
            break;
            
          case 'workflows':
            updatedBlendedModel.workflows = await regenerateWorkflows(
              currentBlendedModel,
              protectedRegions.workflows,
              regenerationRequest.entities,
              openai
            );
            break;
            
          case 'schema':
            // Schema changes require more careful handling
            if (regenerationRequest.changes) {
              updatedBlendedModel = await applySchemaChanges(
                currentBlendedModel,
                regenerationRequest.changes,
                openai
              );
            }
            break;
        }
      }
    }

    // Validate the updated model
    updatedBlendedModel = sanitizeBlendedModel(updatedBlendedModel);
    validateBlendedModel(updatedBlendedModel);

    // Update contract UI if needed
    if (!updatedContractUI && (regenerationRequest.dimensions.includes('ui') || regenerationRequest.dimensions.includes('all'))) {
      updatedContractUI = buildContractUIFromModel(updatedBlendedModel, service.service_schema);
    }

    // Create new version
    const newVersion = service.version + 1;
    
    // Update the manifest
    const updatedManifest = {
      ...currentManifest,
      contract_ui: updatedContractUI,
      data_model: {
        blended_model: updatedBlendedModel
      },
      workflows: updatedBlendedModel.workflows,
      regeneration_history: [
        ...(currentManifest.regeneration_history || []),
        {
          timestamp: new Date().toISOString(),
          dimensions: regenerationRequest.dimensions,
          changes: regenerationRequest.changes,
          version: newVersion
        }
      ]
    };

    // Save updated service
    const { data: updatedService, error: updateError } = await supabaseAdmin
      .from('services')
      .update({
        blended_model: updatedBlendedModel,
        metadata: updatedManifest,
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .select()
      .single();

    if (updateError) {
      throw error(500, 'Failed to update service');
    }

    // Save protected regions if preserving customizations
    if (regenerationRequest.preserveCustomizations) {
      await supabaseAdmin
        .from('service_customizations')
        .upsert({
          service_id: serviceId,
          protected_regions: protectedRegions,
          updated_at: new Date().toISOString()
        });
    }

    // Track schema evolution
    if (regenerationRequest.changes && regenerationRequest.changes.length > 0) {
      await supabaseAdmin
        .from('schema_evolution')
        .insert({
          service_id: serviceId,
          version: newVersion,
          changes: regenerationRequest.changes,
          created_at: new Date().toISOString()
        });
    }

    return json({
      success: true,
      service: updatedService,
      changes_applied: regenerationRequest.changes?.length || 0,
      dimensions_regenerated: regenerationRequest.dimensions,
      version: newVersion,
      message: `Successfully regenerated ${regenerationRequest.dimensions.join(', ')} for service ${service.service_schema}`
    });

  } catch (err) {
    console.error('❌ Regeneration failed:', err);
    throw error(500, `Regeneration failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

// Helper function to merge regenerated content with protected regions
function mergeWithProtectedRegions(
  regenerated: any, 
  protectedRegions: ProtectedRegions, 
  current: any
): any {
  const merged = { ...regenerated };
  
  // Preserve custom UI components
  if (protectedRegions.ui?.custom) {
    merged.ui_components = [
      ...(regenerated.ui_components || []),
      ...Object.values(protectedRegions.ui.custom)
    ];
  }
  
  // Preserve custom workflows
  if (protectedRegions.workflows?.custom) {
    merged.workflows = [
      ...(regenerated.workflows || []),
      ...Object.values(protectedRegions.workflows.custom)
    ];
  }
  
  return merged;
}

// Helper to regenerate just UI components
async function regenerateUI(
  blendedModel: any,
  uiProtectedRegions: any,
  targetEntities: string[] | undefined,
  openai: OpenAI
): Promise<any> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: "json_object" },
    messages: [
      {
        role: 'system',
        content: `Generate UI components for the given schema.
Focus only on UI generation. Return contract UI structure.`
      },
      {
        role: 'user',
        content: `Generate UI for this schema:
${JSON.stringify(blendedModel.entities, null, 2)}

${targetEntities ? `Focus on these entities: ${targetEntities.join(', ')}` : 'Generate UI for all entities'}`
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });

  const generatedUI = JSON.parse(response.choices[0].message.content || '{}');
  
  // Merge with protected regions
  if (uiProtectedRegions?.custom) {
    // Add custom components back
    Object.values(uiProtectedRegions.custom).forEach((customComponent: any) => {
      const existingIndex = generatedUI.pages?.findIndex((p: any) => p.id === customComponent.id);
      if (existingIndex === -1) {
        generatedUI.pages.push(customComponent);
      }
    });
  }
  
  return generatedUI;
}

// Helper to regenerate workflows
async function regenerateWorkflows(
  blendedModel: any,
  workflowProtectedRegions: any,
  targetEntities: string[] | undefined,
  openai: OpenAI
): Promise<any[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: "json_object" },
    messages: [
      {
        role: 'system',
        content: `Generate workflows for the given schema.
Focus only on workflow generation. Return array of workflow definitions.`
      },
      {
        role: 'user',
        content: `Generate workflows for this schema:
${JSON.stringify(blendedModel.entities, null, 2)}

${targetEntities ? `Focus on these entities: ${targetEntities.join(', ')}` : 'Generate workflows for all entities'}`
      }
    ],
    temperature: 0.7,
    max_tokens: 4000
  });

  const generatedWorkflows = JSON.parse(response.choices[0].message.content || '{"workflows": []}').workflows || [];
  
  // Merge with protected custom workflows
  if (workflowProtectedRegions?.custom) {
    Object.values(workflowProtectedRegions.custom).forEach((customWorkflow: any) => {
      const existingIndex = generatedWorkflows.findIndex((w: any) => w.id === customWorkflow.id);
      if (existingIndex === -1) {
        generatedWorkflows.push(customWorkflow);
      }
    });
  }
  
  return generatedWorkflows;
}

// Helper to apply schema changes
async function applySchemaChanges(
  currentModel: any,
  changes: SchemaChange[],
  openai: OpenAI
): Promise<any> {
  let updatedModel = { ...currentModel };
  
  for (const change of changes) {
    switch (change.type) {
      case 'field_added':
        const entity = updatedModel.entities.find((e: any) => e.name === change.entity);
        if (entity) {
          entity.attributes[change.field!] = change.details?.type || 'text';
        }
        break;
        
      case 'field_removed':
        const entityToUpdate = updatedModel.entities.find((e: any) => e.name === change.entity);
        if (entityToUpdate && change.field) {
          delete entityToUpdate.attributes[change.field];
        }
        break;
        
      case 'entity_added':
        updatedModel.entities.push({
          name: change.entity,
          attributes: change.details?.attributes || {},
          relationships: change.details?.relationships || {}
        });
        break;
        
      case 'entity_removed':
        updatedModel.entities = updatedModel.entities.filter((e: any) => e.name !== change.entity);
        break;
    }
  }
  
  return updatedModel;
} 