/**
 * Transforms a blended model into a contract UI format for manifest storage.
 * This creates the "sentences" from the component "words" for dynamic UI generation.
 */

import { buildWorkflowsFromModel } from './workflowBuilder';
import type { WorkflowManifest } from '$lib/types/workflow';

interface ComponentField {
  field: string;
  type: string;
  widget: string;
  validation?: any;
  required: boolean;
}

interface UIComponent {
  id: string;
  type: string;
  entity?: string;
  fields?: ComponentField[];
  columns?: any[];
  actions?: string[];
  layout?: string;
  metadata?: any;
}

interface UIPage {
  id: string;
  path: string;
  title: string;
  description?: string;
  layout: string;
  components: string[];
}

interface ContractUI {
  service_type: string;
  service_name?: string; // Add service name for data flow
  entities: any[]; // Add entities array for easy component access
  pages: UIPage[];
  components: UIComponent[];
  workflows?: WorkflowManifest; // Add workflows to contract UI
  navigation: {
    type: string;
    items: Array<{ label: string; path: string; icon?: string }>;
  };
  theme: {
    primary_color: string;
    layout: string;
    density: string;
    date_format: string; // Global date formatting
    date_placeholder: string; // Helper text for users
    // ✨ Enhanced theme configuration
    available_themes: Array<{
      id: string;
      name: string;
      description: string;
      css_file: string;
      preview_colors: {
        primary: string;
        background: string;
        text: string;
      };
    }>;
    current_theme: string;
    custom_css?: string; // Allow custom CSS overrides
  };
  // ✨ Layout configuration options
  layout_options: {
    available_layouts: Array<{
      id: string;
      name: string;
      description: string;
      sidebar_width: number;
      header_height: number;
      content_padding: number;
    }>;
    current_layout: string;
  };
  global_settings: {
    success_color: string;
    error_color: string;
    warning_color: string;
    info_color: string;
  };
}

export function buildContractUIFromModel(blendedModel: any, serviceName?: string): ContractUI {
  if (!blendedModel?.entities) {
    return {
      service_type: 'unknown',
      service_name: serviceName || 'Unnamed Service',
      entities: [],
      pages: [],
      components: [],
      workflows: undefined,
      navigation: { type: 'sidebar', items: [] },
      theme: { 
        primary_color: '#2563eb', 
        layout: 'modern', 
        density: 'comfortable',
        date_format: 'MM/DD/YYYY', // Global default - US format for now
        date_placeholder: 'Enter date (MM/DD/YYYY)',
        // ✨ Enhanced theme configuration
        available_themes: [],
        current_theme: 'professional',
        custom_css: ''
      },
      layout_options: {
        available_layouts: [],
        current_layout: 'default'
      },
      global_settings: {
        success_color: '#16a34a', // Green for success
        error_color: '#dc2626',   // Red for errors  
        warning_color: '#d97706', // Orange for warnings
        info_color: '#2563eb'     // Blue for info
      }
    };
  }

  // ✨ Generate workflows from blended model
  const workflows = buildWorkflowsFromModel(blendedModel, serviceName || 'unknown');

  // Generate pages
  const pages = [
    // Dashboard page
    {
      id: 'dashboard',
      path: '/dashboard',
      title: 'Dashboard',
      description: `Dashboard and quick actions for your ${serviceName || 'service'}`,
      layout: 'dashboard',
      components: ['service_overview', 'quick_stats', 'recent_activity', 'workflow_summary']
    },
    // Workflows overview page
    {
      id: 'workflows',
      path: '/workflows',
      title: 'Workflows',
      description: 'Manage and monitor automated workflows',
      layout: 'entity_manager',
      components: ['workflow_list', 'workflow_triggers']
    },
    // Entity-specific pages
    ...blendedModel.entities.map((entity: any) => {
      const entityDisplayName = entity.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      
      return {
        id: `${entity.name}_page`,
        path: `/${entity.name.toLowerCase()}`,
        title: entityDisplayName,
        description: `Manage ${entityDisplayName.toLowerCase()} records`,
        layout: 'entity_manager',
        components: [`${entity.name}_form`, `${entity.name}_table`, `${entity.name}_filters`]
      };
    })
  ];

  // Generate reusable UI components (the "words")
  const components: UIComponent[] = [
    // Dashboard components
    {
      id: 'service_overview',
      type: 'service_info_card',
      layout: 'horizontal',
      metadata: {
        title: 'Service Information',
        service_type: blendedModel.service_type || 'Custom',
        service_name: serviceName || 'Unnamed Service',
        show_service_name: true,
        show_schema: true,
        show_type: true
      }
    },
    {
      id: 'quick_stats',
      type: 'stats_grid',
      layout: 'grid',
      metadata: {
        title: 'Entity Statistics',
        stats: blendedModel.entities.map((entity: any) => ({
          label: entity.name.replace(/_/g, ' '),
          entity: entity.name,
          icon: getEntityIcon(entity.name)
        })),
        error_fallback: {
          message: 'Unable to load statistics',
          show_placeholder: true,
          placeholder_text: 'Statistics will appear here once data is available'
        }
      }
    },
    {
      id: 'recent_activity',
      type: 'activity_feed',
      layout: 'vertical',
      metadata: {
        title: 'Recent Activity',
        limit: 10,
        mock_data: false, // Skip mock data per user feedback
        empty_state: {
          message: 'No recent activity',
          show_placeholder: true
        }
      }
    },
    // ✨ Workflow components
    {
      id: 'workflow_summary',
      type: 'workflow_status',
      layout: 'horizontal',
      metadata: {
        title: 'Active Workflows',
        show_count: true,
        show_recent: true,
        limit: 5
      }
    },
    {
      id: 'workflow_list',
      type: 'workflow_list',
      layout: 'vertical',
      metadata: {
        title: 'Available Workflows',
        workflows: workflows.workflows.map((w: any) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          trigger_type: w.triggers?.[0]?.type || 'manual',
          industry_source: w.industry?.framework || 'unknown'
        })),
        show_triggers: true,
        show_status: true
      }
    },
    {
      id: 'workflow_status_grid',
      type: 'workflow_status_grid',
      layout: 'grid',
      metadata: {
        title: 'Workflow Executions',
        show_recent: true,
        limit: 20,
        columns: ['workflow', 'status', 'started', 'duration']
      }
    },
    {
      id: 'workflow_triggers',
      type: 'workflow_triggers',
      layout: 'vertical',
      metadata: {
        title: 'Manual Triggers',
        workflows: workflows.workflows.filter((w: any) => w.triggers?.[0]?.type === 'manual'),
        show_descriptions: true
      }
    },
    // Entity-specific components
    ...blendedModel.entities.flatMap((entity: any) => {
      const fields = Object.entries(entity.attributes || {}).map(([key, type]) => ({
        field: key,
        type: String(type),
        widget: mapTypeToWidget(String(type)),
        validation: inferValidation(String(type)),
        required: isFieldRequired(key, String(type))
      }));

      return [
        // Form component for creating/editing
        {
          id: `${entity.name}_form`,
          type: 'dynamic_form',
          entity: entity.name,
          fields,
          actions: ['create', 'update', 'cancel'],
          layout: 'vertical',
          metadata: {
            title: `Add New ${entity.name.replace(/_/g, ' ')}`,
            submitText: 'Save',
            resetOnSubmit: true,
            success_message: 'Record saved successfully',
            error_fallback: {
              message: 'Unable to save record',
              show_details: true
            },
            // ✨ Link to workflows that can be triggered by this form
            workflow_triggers: workflows.workflows
              .filter((w: any) => w.triggers?.[0]?.type === 'form_submit' && w.triggers?.[0]?.form_id === `${entity.name}_form`)
              .map((w: any) => ({ id: w.id, name: w.name }))
          }
        },
        // Table component for listing
        {
          id: `${entity.name}_table`,
          type: 'data_table',
          entity: entity.name,
          columns: fields.map(f => ({
            key: f.field,
            label: f.field.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            sortable: true,
            filterable: f.type !== 'boolean',
            type: f.type
          })),
          actions: ['view', 'edit', 'delete'],
          layout: 'full_width',
          metadata: {
            pageSize: 25,
            exportable: true,
            searchable: true,
            empty_state: {
              message: `No ${entity.name.replace(/_/g, ' ')} records found`,
              show_add_button: true,
              add_button_text: `Add First ${entity.name.replace(/_/g, ' ')}`
            },
            error_fallback: {
              message: 'Unable to load records',
              show_retry: true,
              retry_text: 'Try Again'
            }
          }
        },
        // Filter component
        {
          id: `${entity.name}_filters`,
          type: 'filter_panel',
          entity: entity.name,
          fields: fields.filter(f => ['text', 'numeric', 'date', 'boolean'].includes(f.type)),
          layout: 'compact',
          metadata: {
            collapsible: true,
            defaultExpanded: false
          }
        }
      ];
    })
  ];

  // Generate navigation (including workflows)
  const navigation = {
    type: 'sidebar',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { label: 'Workflows', path: '/workflows', icon: 'workflow' },
      ...blendedModel.entities.map((entity: any) => ({
        label: entity.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        path: `/${entity.name.toLowerCase()}`,
        icon: getEntityIcon(entity.name)
      }))
    ]
  };

  return {
    service_type: blendedModel.service_type || 'custom',
    service_name: serviceName || 'Unnamed Service',
    entities: blendedModel.entities,
    pages,
    components,
    workflows, // ✨ Include generated workflows
    navigation,
    theme: {
      primary_color: '#2563eb',
      layout: 'modern',
      density: 'comfortable',
      date_format: 'MM/DD/YYYY', // Global default - US format for now
      date_placeholder: 'Enter date (MM/DD/YYYY)',
      // ✨ Enhanced theme configuration
      available_themes: [
        {
          id: 'professional',
          name: 'Professional',
          description: 'Clean, enterprise-ready styling for business applications',
          css_file: '/themes/professional.css',
          preview_colors: {
            primary: '#1e40af',
            background: '#f8fafc',
            text: '#0f172a'
          }
        },
        {
          id: 'dark',
          name: 'Dark',
          description: 'Professional dark mode for comfortable viewing',
          css_file: '/themes/dark.css',
          preview_colors: {
            primary: '#3b82f6',
            background: '#0f172a',
            text: '#f1f5f9'
          }
        },
        {
          id: 'minimal',
          name: 'Minimal',
          description: 'Clean, simplified design for focus and clarity',
          css_file: '/themes/minimal.css',
          preview_colors: {
            primary: '#374151',
            background: '#ffffff',
            text: '#111827'
          }
        }
      ],
      current_theme: 'professional',
      custom_css: ''
    },
    layout_options: {
      available_layouts: [
        {
          id: 'standard',
          name: 'Standard',
          description: 'Balanced layout with comfortable spacing',
          sidebar_width: 280,
          header_height: 60,
          content_padding: 24
        },
        {
          id: 'compact',
          name: 'Compact',
          description: 'Space-efficient layout for smaller screens',
          sidebar_width: 240,
          header_height: 60,
          content_padding: 16
        }
      ],
      current_layout: 'standard'
    },
    global_settings: {
      success_color: '#16a34a', // Green for success
      error_color: '#dc2626',   // Red for errors
      warning_color: '#d97706', // Orange for warnings  
      info_color: '#2563eb'     // Blue for info
    }
  };
}

// Helper functions
function mapTypeToWidget(type: string): string {
  const typeMapping: Record<string, string> = {
    'text': 'text_input',
    'varchar': 'text_input',
    'char': 'text_input',
    'numeric': 'number_input',
    'integer': 'number_input',
    'int': 'number_input',
    'float': 'number_input',
    'decimal': 'number_input',
    'boolean': 'toggle',
    'date': 'date_picker',
    'timestamp': 'datetime_picker',
    'timestamptz': 'datetime_picker',
    'time': 'time_picker',
    'email': 'email_input',
    'phone': 'phone_input',
    'url': 'url_input',
    'json': 'json_editor',
    'jsonb': 'json_editor'
  };
  return typeMapping[type.toLowerCase()] || 'text_input';
}

function inferValidation(type: string): any {
  const validations: Record<string, any> = {
    'email': { pattern: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', message: 'Please enter a valid email' },
    'phone': { pattern: '^[\\+]?[1-9][\\d]{0,15}$', message: 'Please enter a valid phone number' },
    'url': { pattern: '^https?://.+', message: 'Please enter a valid URL' },
    'numeric': { min: 0, message: 'Must be a positive number' },
    'integer': { min: 0, step: 1, message: 'Must be a positive integer' }
  };
  return validations[type.toLowerCase()] || {};
}

function isFieldRequired(fieldName: string, type: string): boolean {
  // Common required fields
  const requiredFields = ['id', 'name', 'title', 'email'];
  const alwaysOptional = ['description', 'notes', 'comments', 'created_at', 'updated_at'];
  
  if (alwaysOptional.some(field => fieldName.toLowerCase().includes(field))) {
    return false;
  }
  
  return requiredFields.some(field => fieldName.toLowerCase().includes(field));
}

function getEntityIcon(entityName: string): string {
  const iconMapping: Record<string, string> = {
    // Restaurant-specific entities
    'order': 'shopping_cart',
    'table': 'table_view',
    'reservation': 'event',
    'inventory': 'inventory',
    'inventory_item': 'inventory',
    'customer': 'person',
    'staff': 'group',
    'menu_item': 'restaurant_menu',
    'menu_category': 'category',
    'payment': 'payment',
    'kitchen_workflow': 'kitchen',
    'customer_feedback': 'star',
    
    // Generic business entities
    'user': 'person',
    'product': 'shopping_bag',
    'item': 'shopping_bag',
    'sale': 'attach_money',
    'purchase': 'shopping_cart',
    'invoice': 'receipt',
    'category': 'folder',
    'tag': 'label',
    'store': 'store',
    'location': 'place',
    'address': 'location_on',
    'contact': 'contact_phone',
    'message': 'message',
    'notification': 'notifications',
    'report': 'analytics',
    'setting': 'settings',
    'config': 'tune',
    'workflow': 'workflow',
    'process': 'process',
    'task': 'task_alt',
    'project': 'work',
    
    // Fallback
    'default': 'description'
  };
  
  const entityLower = entityName.toLowerCase();
  
  // Direct match first
  if (iconMapping[entityLower]) {
    return iconMapping[entityLower];
  }
  
  // Pattern matching for compound names
  for (const [key, icon] of Object.entries(iconMapping)) {
    if (entityLower.includes(key)) {
      return icon;
    }
  }
  
  return iconMapping.default;
}

function getDefaultTheme(serviceType: string): string {
  // Always default to professional theme for enterprise confidence
  return 'professional';
} 