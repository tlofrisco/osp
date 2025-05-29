<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let config: any;
  export let serviceSchema: string;
  export let entityName: string;
  export let fields: any[] = [];
  export let metadata: any = {};
  
  const dispatch = createEventDispatcher();
  
  let formData: Record<string, any> = {};
  let saving = false;
  let error = '';
  let validationErrors: Record<string, string> = {};
  let success = '';
  
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
  
  function getInputType(field: any): string {
    switch (field.widget || field.type) {
      case 'number_input':
      case 'numeric':
      case 'integer':
        return 'number';
      case 'email_input':
      case 'email':
        return 'email';
      case 'date_picker':
      case 'date':
        return 'date';
      case 'datetime_picker':
      case 'timestamp':
        return 'datetime-local';
      case 'time_picker':
      case 'time':
        return 'time';
      case 'url_input':
      case 'url':
        return 'url';
      case 'phone_input':
      case 'phone':
        return 'tel';
      default:
        return 'text';
    }
  }
  
  function formatFieldLabel(fieldName: string): string {
    return fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
</script>

<div class="dynamic-form">
  <header class="form-header">
    <h3>{metadata.title || `Add ${entityName}`}</h3>
    {#if metadata.description}
      <p class="form-description">{metadata.description}</p>
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
          {#if field.type && field.type !== field.field}
            <span class="field-type">({field.type})</span>
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
          <input
            id={field.field}
            type="text"
            bind:value={formData[field.field]}
            class="field-input"
            class:error={validationErrors[field.field]}
            placeholder={field.placeholder || `Enter ${formatFieldLabel(field.field).toLowerCase()}`}
            required={field.required}
            step={field.validation?.step || (field.type === 'numeric' ? 'any' : undefined)}
            min={field.validation?.min}
            max={field.validation?.max}
          />
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
    color: #dc2626;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 0.9em;
  }
  
  .success-message {
    background: #dcfce7;
    border: 1px solid #bbf7d0;
    color: #16a34a;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 0.9em;
  }
</style> 