/**
 * 🎨 Dynamic UI Component Registry for OSP
 * 
 * Central registry for all UI components that can be dynamically loaded.
 * Components are organized by category for better maintainability.
 */

export interface ComponentConfig {
  id: string;
  type: string;
  entity?: string;
  fields?: any[];
  columns?: any[];
  actions?: string[];
  layout?: string;
  metadata?: any;
}

// Core UI Components
const UI_COMPONENTS: Record<string, () => Promise<any>> = {
  // Form Components
  'dynamic_form': () => import('./form/DynamicForm.svelte'),
  
  // Data Display Components  
  'info_card': () => import('./data/InfoCard.svelte'),
  'data_table': () => import('./data/DataTable.svelte'),
  'stats_grid': () => import('./data/StatsGrid.svelte'),
  'activity_feed': () => import('./data/ActivityFeed.svelte'),
  
  // Layout Components
  'service_info_card': () => import('./data/ServiceInfoCard.svelte'),
  
  // Workflow Components
  'workflow_status': () => import('./workflow/WorkflowStatus.svelte'),
  'workflow_list': () => import('./workflow/WorkflowList.svelte'),
  'workflow_status_grid': () => import('./workflow/WorkflowStatusGrid.svelte'),
  'workflow_triggers': () => import('./workflow/WorkflowTriggers.svelte'),
  
  // Fallback Components
  'unknown_component': () => import('./fallback/UnknownComponent.svelte'),
  'error_component': () => import('./fallback/ErrorComponent.svelte')
};

// Components that will use fallbacks until implemented
const FALLBACK_MAPPINGS: Record<string, string> = {
  // Form components -> use DynamicForm as fallback
  'text_input': 'dynamic_form',
  'number_input': 'dynamic_form',
  'date_picker': 'dynamic_form',
  'datetime_picker': 'dynamic_form',
  'time_picker': 'dynamic_form',
  'email_input': 'dynamic_form',
  'phone_input': 'dynamic_form',
  'url_input': 'dynamic_form',
  'toggle': 'dynamic_form',
  'dropdown': 'dynamic_form',
  'json_editor': 'dynamic_form',
  
  // Data components -> use InfoCard as fallback
  'filter_panel': 'info_card',
  'chart': 'info_card',
  
  // Layout components -> use InfoCard as fallback
  'dashboard_layout': 'info_card',
  'entity_layout': 'info_card',
  'sidebar_nav': 'info_card',
  'page_header': 'info_card',
  
  // Workflow components -> use workflow fallbacks
  'process_timeline': 'workflow_status',
  'task_queue': 'workflow_list',
  'approval_flow': 'workflow_triggers'
};

/**
 * Dynamically load a UI component by type
 */
export async function loadComponent(componentType: string): Promise<any> {
  // First, try to load the exact component
  let loader = UI_COMPONENTS[componentType];
  
  if (!loader) {
    // Check if there's a fallback mapping
    const fallbackType = FALLBACK_MAPPINGS[componentType];
    if (fallbackType) {
      console.log(`🔄 Using fallback component '${fallbackType}' for '${componentType}'`);
      loader = UI_COMPONENTS[fallbackType];
    }
  }
  
  if (!loader) {
    console.warn(`Component type '${componentType}' not found in registry. Available types:`, Object.keys(UI_COMPONENTS));
    // Return UnknownComponent fallback
    return import('./fallback/UnknownComponent.svelte');
  }
  
  try {
    return await loader();
  } catch (error) {
    console.error(`Failed to load component '${componentType}':`, error);
    return import('./fallback/ErrorComponent.svelte');
  }
}

/**
 * Get all available component types
 */
export function getAvailableComponents(): string[] {
  return Object.keys(UI_COMPONENTS);
}

/**
 * Check if a component type is available
 */
export function isComponentAvailable(componentType: string): boolean {
  return componentType in UI_COMPONENTS || componentType in FALLBACK_MAPPINGS;
}

/**
 * Component type categories for organization
 */
export const COMPONENT_CATEGORIES = {
  form: ['dynamic_form'],
  data: ['info_card', 'stats_grid', 'activity_feed'],
  fallback: ['error_component', 'unknown_component']
} as const; 