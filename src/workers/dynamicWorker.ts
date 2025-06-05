/**
 * 🤖 Dynamic OSP Worker - Executes AI-Generated Workflows
 * 
 * This worker dynamically creates activities based on OpenAI-generated workflow definitions.
 * No hard-coded workflows - everything is driven by the service definition.
 */

import { Worker, NativeConnection } from '@temporalio/worker';
import { createTemporalConnection, generateTaskQueue } from '$lib/temporal/client';
import { supabaseAdmin } from '$lib/supabaseAdmin';
import type { WorkflowDefinition, WorkflowStep } from '$lib/types/workflow';

/**
 * Dynamic Activity Factory - Creates activities based on workflow definitions
 */
class DynamicActivityFactory {
  /**
   * Creates a generic activity executor that can handle any workflow step
   */
  static createActivity(stepDefinition: WorkflowStep) {
    return async (input: any) => {
      console.log(`🔄 Executing step: ${stepDefinition.name}`);
      
      try {
        // Based on step type, execute different logic
        switch (stepDefinition.type) {
          case 'create_entity':
            return await this.createEntity(stepDefinition, input);
          
          case 'update_entity':
            return await this.updateEntity(stepDefinition, input);
          
          case 'validate':
            return await this.validateData(stepDefinition, input);
          
          case 'notify':
            return await this.sendNotification(stepDefinition, input);
          
          case 'calculate':
            return await this.performCalculation(stepDefinition, input);
          
          case 'check_availability':
            return await this.checkAvailability(stepDefinition, input);
          
          case 'activity':
          default:
            // Generic activity execution
            return await this.executeGenericActivity(stepDefinition, input);
        }
      } catch (error) {
        console.error(`❌ Step ${stepDefinition.name} failed:`, error);
        throw error;
      }
    };
  }

  /**
   * Creates a new entity in the database
   */
  private static async createEntity(step: WorkflowStep, input: any) {
    const [schemaName, entityName] = step.target_entity?.split('.') || [];
    if (!schemaName || !entityName) {
      throw new Error(`Invalid target entity: ${step.target_entity}`);
    }

    // Build insert data from input based on step configuration
    const insertData: any = {};
    step.uses_fields?.forEach(field => {
      const fieldName = field.split('.').pop();
      if (fieldName && input[fieldName] !== undefined) {
        insertData[fieldName] = input[fieldName];
      }
    });

    // Add workflow state tracking
    insertData.workflow_state = 'created';
    insertData.created_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from(`${schemaName}.${entityName}`)
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Created ${entityName}:`, data.id);
    return { success: true, entityId: data.id, data };
  }

  /**
   * Updates an existing entity
   */
  private static async updateEntity(step: WorkflowStep, input: any) {
    const [schemaName, entityName] = step.target_entity?.split('.') || [];
    if (!schemaName || !entityName) {
      throw new Error(`Invalid target entity: ${step.target_entity}`);
    }

    const updateData: any = {};
    step.updates_fields?.forEach(field => {
      const fieldName = field.split('.').pop();
      if (fieldName) {
        // Use step configuration to determine value
        if (step.field_values && step.field_values[fieldName]) {
          updateData[fieldName] = step.field_values[fieldName];
        } else if (input[fieldName] !== undefined) {
          updateData[fieldName] = input[fieldName];
        }
      }
    });

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from(`${schemaName}.${entityName}`)
      .update(updateData)
      .eq('id', input.entityId)
      .select()
      .single();

    if (error) throw error;
    
    console.log(`✅ Updated ${entityName}:`, input.entityId);
    return { success: true, data };
  }

  /**
   * Validates data according to step rules
   */
  private static async validateData(step: WorkflowStep, input: any) {
    const validationResults: any = { valid: true, errors: [] };

    // Execute validation rules from step definition
    if (step.validation_rules) {
      for (const rule of step.validation_rules) {
        const fieldValue = input[rule.field];
        
        switch (rule.type) {
          case 'required':
            if (!fieldValue) {
              validationResults.valid = false;
              validationResults.errors.push(`${rule.field} is required`);
            }
            break;
          
          case 'min_value':
            if (fieldValue < rule.value) {
              validationResults.valid = false;
              validationResults.errors.push(`${rule.field} must be at least ${rule.value}`);
            }
            break;
          
          case 'pattern':
            if (!new RegExp(rule.value).test(fieldValue)) {
              validationResults.valid = false;
              validationResults.errors.push(`${rule.field} format is invalid`);
            }
            break;
        }
      }
    }

    if (!validationResults.valid) {
      throw new Error(`Validation failed: ${validationResults.errors.join(', ')}`);
    }

    return validationResults;
  }

  /**
   * Sends notifications (placeholder for future implementation)
   */
  private static async sendNotification(step: WorkflowStep, input: any) {
    console.log(`📧 Sending notification: ${step.notification_type} to ${input.recipient}`);
    // In a real implementation, this would integrate with email/SMS services
    return { success: true, notificationId: `notif_${Date.now()}` };
  }

  /**
   * Performs calculations based on step configuration
   */
  private static async performCalculation(step: WorkflowStep, input: any) {
    let result = 0;
    
    if (step.calculation_type === 'sum') {
      result = step.calculation_fields?.reduce((sum, field) => {
        return sum + (input[field] || 0);
      }, 0) || 0;
    } else if (step.calculation_type === 'multiply') {
      result = step.calculation_fields?.reduce((product, field) => {
        return product * (input[field] || 1);
      }, 1) || 0;
    }

    return { result, calculation_type: step.calculation_type };
  }

  /**
   * Checks availability (e.g., for reservations, inventory)
   */
  private static async checkAvailability(step: WorkflowStep, input: any) {
    const [schemaName, entityName] = step.target_entity?.split('.') || [];
    if (!schemaName || !entityName) {
      throw new Error(`Invalid target entity: ${step.target_entity}`);
    }

    // Query for conflicts
    const query = supabaseAdmin.from(`${schemaName}.${entityName}`).select('*');
    
    // Add filters based on step configuration
    if (step.availability_filters) {
      Object.entries(step.availability_filters).forEach(([field, value]) => {
        query.eq(field, value || input[field]);
      });
    }

    const { data, error } = await query;
    if (error) throw error;

    const isAvailable = data.length === 0;
    return { 
      available: isAvailable, 
      conflicts: data,
      message: isAvailable ? 'Available' : `${data.length} conflicts found`
    };
  }

  /**
   * Generic activity execution for custom logic
   */
  private static async executeGenericActivity(step: WorkflowStep, input: any) {
    console.log(`🔧 Executing generic activity: ${step.name}`);
    
    // Log what fields are being used
    if (step.uses_fields?.length) {
      console.log(`  Using fields: ${step.uses_fields.join(', ')}`);
    }
    
    // Log what fields are being updated
    if (step.updates_fields?.length) {
      console.log(`  Updating fields: ${step.updates_fields.join(', ')}`);
    }

    // Return success with input data passed through
    return {
      success: true,
      step: step.name,
      input_data: input,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Creates a dynamic workflow function from a workflow definition
 */
function createDynamicWorkflow(workflowDef: WorkflowDefinition) {
  return async function dynamicWorkflow(input: any) {
    console.log(`🚀 Starting workflow: ${workflowDef.name}`);
    
    const results: any[] = [];
    let workflowState = 'in_progress';
    
    try {
      // Execute each step in sequence
      for (const step of workflowDef.steps) {
        console.log(`  📍 Step ${step.id}: ${step.name}`);
        
        // Create and execute the activity for this step
        const activity = DynamicActivityFactory.createActivity(step);
        const stepResult = await activity(input);
        
        results.push({
          stepId: step.id,
          stepName: step.name,
          result: stepResult
        });
        
        // Pass results to next step if needed
        if (stepResult.entityId) {
          input.entityId = stepResult.entityId;
        }
        if (stepResult.data) {
          input = { ...input, ...stepResult.data };
        }
      }
      
      workflowState = 'completed';
      console.log(`✅ Workflow completed: ${workflowDef.name}`);
      
    } catch (error) {
      workflowState = 'failed';
      console.error(`❌ Workflow failed: ${workflowDef.name}`, error);
      throw error;
    }
    
    return {
      workflowId: workflowDef.id,
      workflowName: workflowDef.name,
      state: workflowState,
      results,
      completedAt: new Date().toISOString()
    };
  };
}

/**
 * Main worker startup
 */
export async function startDynamicWorker(serviceSchema: string) {
  console.log(`🤖 Starting Dynamic Worker for service: ${serviceSchema}`);
  
  try {
    // Get service manifest with workflows
    const { data: manifest, error } = await supabaseAdmin
      .from('service_manifests')
      .select('*')
      .eq('schema_name', serviceSchema)
      .single();
    
    if (error || !manifest) {
      throw new Error(`Failed to load service manifest: ${error?.message}`);
    }
    
    const workflows = manifest.workflows || [];
    console.log(`📋 Found ${workflows.length} workflows to register`);
    
    // Create activities object with all workflow activities
    const activities: Record<string, any> = {};
    
    workflows.forEach((workflow: WorkflowDefinition) => {
      // Register the workflow itself
      activities[workflow.id] = createDynamicWorkflow(workflow);
      
      // Register each step as an activity
      workflow.steps.forEach(step => {
        activities[`${workflow.id}_${step.id}`] = DynamicActivityFactory.createActivity(step);
      });
    });
    
    // Create Temporal connection
    const connection = await NativeConnection.connect({
      address: 'your-namespace.tmprl.cloud:7233',
      tls: {
        clientCertPair: {
          crt: Buffer.from(process.env.TEMPORAL_CLOUD_CERT || ''),
          key: Buffer.from(process.env.TEMPORAL_CLOUD_KEY || '')
        }
      }
    });
    
    // Create and start worker
    const worker = await Worker.create({
      connection,
      namespace: 'your-namespace',
      taskQueue: generateTaskQueue(serviceSchema),
      workflowsPath: require.resolve('./workflows'),
      activities
    });
    
    console.log(`✅ Worker started for task queue: ${generateTaskQueue(serviceSchema)}`);
    await worker.run();
    
  } catch (error) {
    console.error('❌ Worker startup failed:', error);
    throw error;
  }
}

// Start worker if run directly
if (require.main === module) {
  const serviceSchema = process.argv[2];
  if (!serviceSchema) {
    console.error('Usage: node dynamicWorker.js <service_schema>');
    process.exit(1);
  }
  
  startDynamicWorker(serviceSchema).catch(err => {
    console.error('Worker error:', err);
    process.exit(1);
  });
} 