/**
 * Transforms a blended model into a contract UI format for manifest storage.
 * This creates the "sentences" from the component "words" for dynamic UI generation.
 */

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
  path: string;
  layout: string;
  entity?: string;
  components: string[];
  title: string;
  description?: string;
}

interface ContractUI {
  service_type: string;
  pages: UIPage[];
  components: UIComponent[];
  navigation: {
    type: string;
    items: Array<{ label: string; path: string; icon?: string }>;
  };
  theme: {
    primary_color: string;
    layout: string;
    density: string;
  };
}

export function buildContractUIFromModel(blendedModel: any): ContractUI {
  if (!blendedModel?.entities) {
    return {
      service_type: 'unknown',
      pages: [],
      components: [],
      navigation: { type: 'sidebar', items: [] },
      theme: { primary_color: '#2563eb', layout: 'modern', density: 'comfortable' }
    };
  }

  // Generate pages: Dashboard + one page per entity
  const pages: UIPage[] = [
    {
      path: '/dashboard',
      layout: 'dashboard',
      title: 'Service Overview',
      description: 'Dashboard and quick actions for your service',
      components: ['service_overview', 'quick_stats', 'recent_activity']
    },
    ...blendedModel.entities.map((entity: any) => ({
      path: `/${entity.name.toLowerCase()}`,
      layout: 'entity_manager',
      entity: entity.name,
      title: entity.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      description: `Manage ${entity.name} records`,
      components: [`${entity.name}_form`, `${entity.name}_table`, `${entity.name}_filters`]
    }))
  ];

  // Generate reusable UI components (the "words")
  const components: UIComponent[] = [
    // Dashboard components
    {
      id: 'service_overview',
      type: 'info_card',
      layout: 'horizontal',
      metadata: {
        title: 'Service Information',
        content: `${blendedModel.service_type || 'Custom'} Service`
      }
    },
    {
      id: 'quick_stats',
      type: 'stats_grid',
      layout: 'grid',
      metadata: {
        stats: blendedModel.entities.map((entity: any) => ({
          label: entity.name.replace(/_/g, ' '),
          entity: entity.name,
          icon: getEntityIcon(entity.name)
        }))
      }
    },
    {
      id: 'recent_activity',
      type: 'activity_feed',
      layout: 'vertical',
      metadata: {
        title: 'Recent Activity',
        limit: 10
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
            resetOnSubmit: true
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
            searchable: true
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

  // Generate navigation
  const navigation = {
    type: 'sidebar',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      ...blendedModel.entities.map((entity: any) => ({
        label: entity.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        path: `/${entity.name.toLowerCase()}`,
        icon: getEntityIcon(entity.name)
      }))
    ]
  };

  return {
    service_type: blendedModel.service_type || 'custom',
    pages,
    components,
    navigation,
    theme: {
      primary_color: '#2563eb',
      layout: 'modern',
      density: 'comfortable'
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
    'user': 'person',
    'customer': 'person',
    'product': 'inventory',
    'item': 'inventory',
    'inventory': 'inventory',
    'order': 'shopping_cart',
    'purchase': 'shopping_cart',
    'sale': 'point_of_sale',
    'invoice': 'receipt',
    'payment': 'payment',
    'category': 'category',
    'tag': 'label',
    'store': 'store',
    'location': 'place',
    'address': 'place',
    'contact': 'contact_phone',
    'message': 'message',
    'notification': 'notifications',
    'report': 'assessment',
    'setting': 'settings',
    'config': 'settings'
  };
  
  const entityLower = entityName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMapping)) {
    if (entityLower.includes(key)) {
      return icon;
    }
  }
  
  return 'table_view'; // default icon
} 