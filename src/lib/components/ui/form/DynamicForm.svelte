<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let config: any;
  export let serviceSchema: string;
  export let serviceName: string = '';
  export let entityName: string;
  export let fields: any[] = [];
  export let metadata: any = {};
  export let theme: any = {};
  export let globalSettings: any = {};
  
  const dispatch = createEventDispatcher();
  
  let formData: Record<string, any> = {};
  let saving = false;
  let error = '';
  let validationErrors: Record<string, string> = {};
  let success = '';
  
  // Extract theme settings with fallbacks
  const dateFormat = theme.date_format || 'MM/DD/YYYY';
  const datePlaceholder = theme.date_placeholder || `Enter date (${dateFormat})`;
  const successColor = globalSettings.success_color || '#16a34a';
  const errorColor = globalSettings.error_color || '#dc2626';
  
  // Initialize form data
  $: {
    if (fields?.length > 0) {
      initializeFormData();
    }
  }
  
  function initializeFormData() {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      if (field.type === 'boolean') {
        initialData[field.field] = false;
      } else if (field.type === 'numeric' || field.type === 'integer') {
        initialData[field.field] = '';
      } else {
        initialData[field.field] = '';
      }
    });
    
    // Only set if formData is empty to avoid overwriting user input
    if (Object.keys(formData).length === 0) {
      formData = initialData;
    }
  }
  
  function validateField(field: any, value: any): string {
    if (field.required && (!value || value === '')) {
      return `${field.field} is required`;
    }
    
    if (field.validation && value) {
      if (field.validation.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          return field.validation.message || 'Invalid format';
        }
      }
      
      if (field.validation.min !== undefined && parseFloat(value) < field.validation.min) {
        return field.validation.message || `Must be at least ${field.validation.min}`;
      }
    }
    
    return '';
  }
  
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    fields.forEach(field => {
      const error = validateField(field, formData[field.field]);
      if (error) {
        errors[field.field] = error;
      }
    });
    
    validationErrors = errors;
    return Object.keys(errors).length === 0;
  }
  
  async function handleSubmit() {
    if (!validateForm()) return;
    
    saving = true;
    error = '';
    success = '';
    
    try {
      console.log('🚀 Submitting form data:', formData);
      
      // Build the API endpoint URL
      const apiUrl = `/api/services/${serviceSchema}/${entityName}`;
      console.log(`📡 Posting to: ${apiUrl}`);
      
      // Submit to real API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ Form submitted successfully:', result);
      success = result.message || `${entityName} created successfully!`;
      
      // Clear form on success
      formData = {};
      validationErrors = {};
      
      // Dispatch success event for parent components
      dispatch('submit', {
        success: true,
        data: result.data,
        message: success
      });
      
    } catch (err: any) {
      console.error('Form submission error:', err);
      error = err?.message || 'An unexpected error occurred';
      
      // Dispatch error event
      dispatch('submit', {
        success: false,
        error: error
      });
    } finally {
      saving = false;
    }
  }
  
  // Helper function to format field labels
  function formatFieldLabel(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .replace(/Id$/, 'ID');
  }
  
  // Helper function to get user-friendly field description
  function getFieldDescription(field: any): string | null {
    const fieldType = field.type?.toLowerCase() || '';
    
    switch (fieldType) {
      case 'date':
        return 'Select or enter date';
      case 'datetime':
      case 'timestamptz':
      case 'timestamp':
        return 'Select date and time';
      case 'email':
        return 'Email address format required';
      case 'phone':
        return 'Phone number format';
      case 'url':
        return 'Website URL format';
      case 'numeric':
      case 'integer':
      case 'number':
        return 'Numbers only';
      case 'boolean':
        return 'Toggle on/off';
      default:
        return null; // Don't show description for basic text fields
    }
  }
  
  // Helper function to get field placeholder
  function getFieldPlaceholder(field: any): string {
    const fieldType = field.type?.toLowerCase() || '';
    const fieldName = formatFieldLabel(field.field);
    
    switch (fieldType) {
      case 'date':
      case 'datetime':
      case 'timestamptz':
        return 'MM/DD/YYYY or select date';
      case 'email':
        return 'Enter email address';
      case 'phone':
        return 'Enter phone number';
      case 'url':
        return 'Enter website URL';
      case 'numeric':
      case 'integer':
      case 'number':
        return `Enter ${fieldName.toLowerCase()} (numbers only)`;
      case 'text':
      default:
        return `Enter ${fieldName.toLowerCase()}`;
    }
  }
  
  // Helper function to get field input type
  function getInputType(field: any): string {
    const fieldType = field.type?.toLowerCase() || '';
    
    switch (fieldType) {
      case 'email':
        return 'email';
      case 'phone':
        return 'tel';
      case 'url':
        return 'url';
      case 'date':
      case 'datetime':
      case 'timestamptz':
        return 'datetime-local';
      case 'numeric':
      case 'integer':
      case 'number':
        return 'number';
      case 'password':
        return 'password';
      default:
        return 'text';
    }
  }
</script>

<div class="dynamic-form" style="--success-color: {successColor}; --error-color: {errorColor};">
  <header class="form-header">
    <h3>{metadata.title || `Add ${entityName}`}</h3>
    {#if metadata.description}
      <p class="form-description">{metadata.description}</p>
    {/if}
    
    <!-- Required fields explanation -->
    {#if fields.some(f => f.required)}
      <div class="required-fields-note">
        <span class="required-indicator">*</span>
        <span class="required-text">Required fields</span>
      </div>
    {/if}
  </header>
  
  <form on:submit|preventDefault={handleSubmit} class="form-content">
    {#each fields as field (field.field)}
      <div class="field-group">
        <label for={field.field} class="field-label">
          {formatFieldLabel(field.field)}
          {#if field.required}
            <span class="required">*</span>
          {/if}
          {#if getFieldDescription(field)}
            {@const description = getFieldDescription(field)}
            <span class="field-description">{description}</span>
          {/if}
        </label>
        
        {#if field.widget === 'toggle' || field.type === 'boolean'}
          <label class="toggle-wrapper">
            <input
              type="checkbox"
              id={field.field}
              bind:checked={formData[field.field]}
              class="toggle-input"
            />
            <span class="toggle-slider"></span>
          </label>
        {:else}
          {@const inputType = getInputType(field)}
          {#if inputType === 'number'}
            <input
              id={field.field}
              type="number"
              bind:value={formData[field.field]}
              class="field-input"
              class:error={validationErrors[field.field]}
              placeholder={field.placeholder || getFieldPlaceholder(field)}
              required={field.required}
              step={field.validation?.step || (field.type === 'numeric' ? 'any' : undefined)}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          {:else if inputType === 'email'}
            <input
              id={field.field}
              type="email"
              bind:value={formData[field.field]}
              class="field-input"
              class:error={validationErrors[field.field]}
              placeholder={field.placeholder || getFieldPlaceholder(field)}
              required={field.required}
            />
          {:else if inputType === 'date'}
            <input
              id={field.field}
              type="date"
              bind:value={formData[field.field]}
              class="field-input"
              class:error={validationErrors[field.field]}
              placeholder={field.placeholder || getFieldPlaceholder(field)}
              required={field.required}
            />
          {:else if inputType === 'datetime-local'}
            <input
              id={field.field}
              type="datetime-local"
              bind:value={formData[field.field]}
              class="field-input"
              class:error={validationErrors[field.field]}
              placeholder={field.placeholder || getFieldPlaceholder(field)}
              required={field.required}
            />
          {:else if inputType === 'time'}
            <input
              id={field.field}
              type="time"
              bind:value={formData[field.field]}
              class="field-input"
              class:error={validationErrors[field.field]}
              placeholder={field.placeholder || getFieldPlaceholder(field)}
              required={field.required}
            />
          {:else if inputType === 'url'}
            <input
              id={field.field}
              type="url"
              bind:value={formData[field.field]}
              class="field-input"
              class:error={validationErrors[field.field]}
              placeholder={field.placeholder || getFieldPlaceholder(field)}
              required={field.required}
            />
          {:else if inputType === 'tel'}
            <input
              id={field.field}
              type="tel"
              bind:value={formData[field.field]}
              class="field-input"
              class:error={validationErrors[field.field]}
              placeholder={field.placeholder || getFieldPlaceholder(field)}
              required={field.required}
            />
          {:else}
            <input
              id={field.field}
              type="text"
              bind:value={formData[field.field]}
              class="field-input"
              class:error={validationErrors[field.field]}
              placeholder={field.placeholder || getFieldPlaceholder(field)}
              required={field.required}
            />
          {/if}
        {/if}
        
        {#if validationErrors[field.field]}
          <span class="field-error">{validationErrors[field.field]}</span>
        {/if}
      </div>
    {/each}
    
    {#if error}
      <div class="error-message">
        ⚠️ {error}
      </div>
    {/if}
    
    {#if success}
      <div class="success-message">
        ✅ {success}
      </div>
    {/if}
    
    <div class="form-actions">
      {#if config.actions?.includes('cancel')}
        <button type="button" class="btn btn-secondary" on:click={() => dispatch('cancel')}>
          Cancel
        </button>
      {/if}
      <button type="submit" class="btn btn-primary" disabled={saving}>
        {#if saving}
          <span class="spinner"></span>
          Saving...
        {:else}
          {metadata.submitText || 'Save'}
        {/if}
      </button>
    </div>
  </form>
</div>

<style>
  .dynamic-form {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .form-header {
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
  }
  
  .form-header h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .form-description {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .required-fields-note {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: #fef3c7;
    border: 1px solid #fde68a;
    border-radius: 4px;
    font-size: 0.75rem;
  }
  
  .required-indicator {
    color: #dc2626;
    font-weight: bold;
    font-size: 0.875rem;
  }
  
  .required-text {
    color: #92400e;
    font-weight: 500;
  }
  
  .form-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .field-label {
    font-weight: 500;
    color: #374151;
    font-size: 0.875rem;
  }
  
  .required {
    color: #dc2626;
  }
  
  .field-type {
    color: #6b7280;
    font-weight: normal;
    font-size: 0.75rem;
  }
  
  .field-description {
    color: #6b7280;
    font-weight: normal;
    font-size: 0.75rem;
    margin-left: 0.5rem;
    font-style: italic;
  }
  
  .field-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  
  .field-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .field-input.error {
    border-color: #dc2626;
  }
  
  .field-error {
    color: #dc2626;
    font-size: 0.75rem;
  }
  
  .toggle-wrapper {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }
  
  .toggle-input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.4s;
    border-radius: 24px;
  }
  
  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
  
  .toggle-input:checked + .toggle-slider {
    background-color: #3b82f6;
  }
  
  .toggle-input:checked + .toggle-slider:before {
    transform: translateX(20px);
  }
  
  .form-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 0.75rem;
    color: #dc2626;
    font-size: 0.875rem;
  }
  
  .form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: #2563eb;
    border-color: #2563eb;
  }
  
  .btn-secondary {
    background: white;
    color: #374151;
    border-color: #d1d5db;
  }
  
  .btn-secondary:hover {
    background: #f9fafb;
  }
  
  .spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #ffffff40;
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-message {
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: var(--error-color, #dc2626);
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 0.9em;
  }
  
  .success-message {
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    color: var(--success-color, #16a34a);
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 0.9em;
  }
</style> 