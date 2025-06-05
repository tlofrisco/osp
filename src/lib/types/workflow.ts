/**
 * 🔄 Temporal Workflow Types for OSP Service Manifests
 * 
 * These interfaces define the DSL for declarative workflows that emerge from blended models.
 * Each service can define workflows that are traced back to industry standards.
 */

export type WorkflowTriggerType = 
  | 'manual'           // Manual invocation via UI/API
  | 'form_submit'      // Triggered by UI form submission
  | 'entity_insert'    // Database entity insertion
  | 'entity_update'    // Database entity update
  | 'entity_delete'    // Database entity deletion
  | 'schedule'         // Time-based trigger
  | 'signal'           // External signal/event
  | 'api_call'         // Direct API invocation
  | 'service_create'   // Service creation
  | 'service_update';  // Service update

export type WorkflowStepType =
  | 'activity'         // Execute an activity (API call, DB update, etc.)
  | 'condition'        // If/else branching
  | 'parallel'         // Execute steps in parallel
  | 'loop'             // Iterate over collection
  | 'wait_signal'      // Wait for external signal
  | 'wait_timer'       // Wait for duration
  | 'human_task'       // Wait for human input/approval
  | 'child_workflow'   // Spawn child workflow
  | 'terminate';       // End workflow

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  name?: string;
  description?: string;
  config?: {
    entity?: string;
    form?: string;
    schedule?: string;
    runAfterOperations?: string[];
    [key: string]: any;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'activity' | 'create_entity' | 'update_entity' | 'validate' | 'notify' | 'calculate' | 'check_availability';
  uses_fields?: string[];
  updates_fields?: string[];
  target_entity?: string;
  field_values?: Record<string, any>;
  validation_rules?: ValidationRule[];
  notification_type?: string;
  calculation_type?: 'sum' | 'multiply';
  calculation_fields?: string[];
  availability_filters?: Record<string, any>;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'min_value' | 'max_value' | 'pattern';
  value?: any;
  message?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  ui_components: string[];
  timeout_seconds?: number;
  retry_policy?: {
    max_attempts: number;
    backoff_coefficient: number;
  };
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  started_at: string;
  completed_at?: string;
}

export interface WorkflowManifest {
  version: string;
  service_id: string;
  service_name: string;
  namespace: string;          // Temporal namespace for this service
  
  workflows: WorkflowDefinition[];
  
  // Shared activity configurations
  activities?: {
    [key: string]: {
      type: string;
      default_timeout?: number;
      default_retry_policy?: any;
    };
  };
  
  // Global settings
  settings?: {
    default_task_queue?: string;
    default_timeout?: string;
    monitoring_enabled?: boolean;
  };
}

// Standard activity types that map to OSP capabilities
export const STANDARD_ACTIVITIES = {
  // Database operations
  'update_entity': 'Update database record',
  'create_entity': 'Create database record', 
  'delete_entity': 'Delete database record',
  'query_entity': 'Query database records',
  
  // Communication
  'send_email': 'Send email notification',
  'send_sms': 'Send SMS notification',
  'post_webhook': 'POST to webhook URL',
  
  // External APIs
  'call_api': 'Call external HTTP API',
  'call_stripe': 'Stripe payment operation',
  'call_openai': 'OpenAI API call',
  
  // OSP Integration  
  'update_manifest': 'Update service manifest',
  'trigger_agent': 'Trigger OSP agent',
  'log_event': 'Log event to OSP',
  
  // Utilities
  'delay': 'Wait for specified duration',
  'transform_data': 'Transform data structure',
  'validate_data': 'Validate data against schema'
} as const;

export type StandardActivityType = keyof typeof STANDARD_ACTIVITIES;

export interface WorkflowContext {
  workflowId: string;
  input: Record<string, any>;
  variables: Record<string, any>;
  entityId?: string;
  userId?: string;
  traceability?: {
    sourceFramework?: string;
    sourceProcess?: string;
    sourceStandard?: string;
  };
}

export interface ActivityStep extends WorkflowStep {
  type: 'activity';
  activityType: string;
  config: any;
}

export interface ConditionStep extends WorkflowStep {
  type: 'condition';
  condition: string;
  trueBranch?: WorkflowStep[];
  falseBranch?: WorkflowStep[];
}

export interface ParallelStep extends WorkflowStep {
  type: 'parallel';
  parallelSteps: WorkflowStep[];
}

export interface WaitSignalStep extends WorkflowStep {
  type: 'wait_signal';
  signalName: string;
  timeout?: number;
}

export interface HumanTaskStep extends WorkflowStep {
  type: 'human_task';
  taskType: string;
  description: string;
  assignedTo?: string;
} 