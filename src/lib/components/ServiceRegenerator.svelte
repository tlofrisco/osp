<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let serviceId: string;
  export let serviceName: string;
  export let currentVersion: number;
  
  const dispatch = createEventDispatcher();
  
  let isRegenerating = false;
  let regenerationResult: any = null;
  let error: string | null = null;
  
  // Regeneration options
  let selectedDimensions = {
    ui: false,
    workflows: false,
    schema: false,
    all: false
  };
  
  let preserveCustomizations = true;
  let targetEntities: string = '';
  
  // Schema changes tracking
  let schemaChanges: Array<{
    type: string;
    entity: string;
    field?: string;
    details?: any;
  }> = [];
  
  function toggleAll(checked: boolean) {
    if (checked) {
      selectedDimensions = { ui: false, workflows: false, schema: false, all: true };
    } else {
      selectedDimensions = { ui: false, workflows: false, schema: false, all: false };
    }
  }
  
  function toggleDimension(dimension: string) {
    if (dimension !== 'all') {
      selectedDimensions.all = false;
    }
  }
  
  async function regenerateService() {
    isRegenerating = true;
    error = null;
    regenerationResult = null;
    
    try {
      // Build dimensions array
      const dimensions = selectedDimensions.all 
        ? ['all'] 
        : Object.entries(selectedDimensions)
            .filter(([_, selected]) => selected)
            .map(([dim]) => dim);
      
      if (dimensions.length === 0) {
        throw new Error('Please select at least one dimension to regenerate');
      }
      
      // Build request payload
      const payload: any = {
        dimensions,
        preserveCustomizations
      };
      
      if (targetEntities.trim()) {
        payload.entities = targetEntities.split(',').map(e => e.trim());
      }
      
      if (schemaChanges.length > 0) {
        payload.changes = schemaChanges;
      }
      
      const response = await fetch(`/api/osp/service/${serviceId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Regeneration failed');
      }
      
      regenerationResult = await response.json();
      dispatch('regenerated', regenerationResult);
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unknown error occurred';
    } finally {
      isRegenerating = false;
    }
  }
  
  function addSchemaChange() {
    schemaChanges = [...schemaChanges, {
      type: 'field_added',
      entity: '',
      field: '',
      details: { type: 'text' }
    }];
  }
  
  function removeSchemaChange(index: number) {
    schemaChanges = schemaChanges.filter((_, i) => i !== index);
  }
</script>

<div class="regenerator-card">
  <div class="card-header">
    <h3 class="card-title">
      <span class="icon">🔄</span>
      Regenerate Service
    </h3>
    <p class="card-description">
      Regenerate specific dimensions of {serviceName} (v{currentVersion})
    </p>
  </div>
  
  <div class="card-content">
    <!-- Dimension Selection -->
    <div class="section">
      <h4>Select Dimensions to Regenerate</h4>
      
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input 
            type="checkbox"
            bind:checked={selectedDimensions.all}
            on:change={(e) => toggleAll(e.currentTarget.checked)}
          />
          <span>All Dimensions (Complete Regeneration)</span>
        </label>
        
        <div class="checkbox-group-nested">
          <label class="checkbox-label">
            <input 
              type="checkbox"
              bind:checked={selectedDimensions.ui}
              disabled={selectedDimensions.all}
              on:change={() => toggleDimension('ui')}
            />
            <span>UI Components</span>
          </label>
          
          <label class="checkbox-label">
            <input 
              type="checkbox"
              bind:checked={selectedDimensions.workflows}
              disabled={selectedDimensions.all}
              on:change={() => toggleDimension('workflows')}
            />
            <span>Workflows</span>
          </label>
          
          <label class="checkbox-label">
            <input 
              type="checkbox"
              bind:checked={selectedDimensions.schema}
              disabled={selectedDimensions.all}
              on:change={() => toggleDimension('schema')}
            />
            <span>Schema</span>
          </label>
        </div>
      </div>
    </div>
    
    <!-- Protected Regions -->
    <div class="section">
      <label class="checkbox-label">
        <input 
          type="checkbox"
          bind:checked={preserveCustomizations}
        />
        <span>
          <span class="icon-inline">🛡️</span>
          Preserve Custom Modifications
        </span>
      </label>
      <p class="help-text">
        Keep any manual changes you've made to UI layouts, custom workflows, or validation rules
      </p>
    </div>
    
    <!-- Target Entities -->
    <div class="section">
      <label for="entities">Target Entities (Optional)</label>
      <input
        id="entities"
        type="text"
        bind:value={targetEntities}
        placeholder="e.g., Order, Customer (comma-separated)"
        class="input-field"
      />
      <p class="help-text">
        Leave empty to regenerate all entities
      </p>
    </div>
    
    <!-- Schema Changes (if schema dimension selected) -->
    {#if selectedDimensions.schema || selectedDimensions.all}
      <div class="section">
        <div class="section-header">
          <label>Schema Changes</label>
          <button class="btn-secondary" on:click={addSchemaChange}>
            Add Change
          </button>
        </div>
        
        {#each schemaChanges as change, index}
          <div class="schema-change-row">
            <select 
              bind:value={change.type}
              class="select-field"
            >
              <option value="field_added">Add Field</option>
              <option value="field_removed">Remove Field</option>
              <option value="entity_added">Add Entity</option>
              <option value="entity_removed">Remove Entity</option>
            </select>
            
            <input
              type="text"
              bind:value={change.entity}
              placeholder="Entity"
              class="input-field"
            />
            
            {#if change.type.includes('field')}
              <input
                type="text"
                bind:value={change.field}
                placeholder="Field"
                class="input-field"
              />
            {/if}
            
            <button 
              class="btn-ghost"
              on:click={() => removeSchemaChange(index)}
            >
              ✕
            </button>
          </div>
        {/each}
      </div>
    {/if}
    
    <!-- Error Display -->
    {#if error}
      <div class="alert alert-error">
        <span class="icon-inline">⚠️</span>
        {error}
      </div>
    {/if}
    
    <!-- Success Display -->
    {#if regenerationResult}
      <div class="alert alert-success">
        <strong>Success!</strong> Regenerated {regenerationResult.dimensions_regenerated.join(', ')} 
        for version {regenerationResult.version}
      </div>
    {/if}
    
    <!-- Action Button -->
    <button 
      class="btn-primary"
      on:click={regenerateService}
      disabled={isRegenerating}
    >
      {#if isRegenerating}
        <span class="spinner">⟳</span>
        Regenerating...
      {:else}
        <span class="icon-inline">🔄</span>
        Regenerate Service
      {/if}
    </button>
  </div>
</div>

<style>
  .regenerator-card {
    background: var(--surface-color, #ffffff);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--border-radius, 8px);
    box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    width: 100%;
  }
  
  .card-header {
    padding: var(--spacing-lg, 24px);
    border-bottom: 1px solid var(--border-color, #e5e7eb);
  }
  
  .card-title {
    font-size: var(--font-size-lg, 18px);
    font-weight: 600;
    color: var(--text-primary, #1f2937);
    margin: 0 0 var(--spacing-sm, 8px) 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
  }
  
  .card-description {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-secondary, #6b7280);
    margin: 0;
  }
  
  .card-content {
    padding: var(--spacing-lg, 24px);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg, 24px);
  }
  
  .section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm, 8px);
  }
  
  .section h4 {
    font-size: var(--font-size-sm, 14px);
    font-weight: 500;
    color: var(--text-primary, #1f2937);
    margin: 0;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm, 8px);
  }
  
  .checkbox-group-nested {
    margin-left: var(--spacing-lg, 24px);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm, 8px);
  }
  
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
    cursor: pointer;
    font-size: var(--font-size-sm, 14px);
    color: var(--text-primary, #1f2937);
  }
  
  .checkbox-label input[type="checkbox"] {
    cursor: pointer;
  }
  
  .checkbox-label input[type="checkbox"]:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  .checkbox-label input[type="checkbox"]:disabled + span {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .help-text {
    font-size: var(--font-size-sm, 14px);
    color: var(--text-secondary, #6b7280);
    margin: 0;
    margin-left: var(--spacing-lg, 24px);
  }
  
  .input-field, .select-field {
    width: 100%;
    padding: var(--spacing-sm, 8px) var(--spacing-md, 12px);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--border-radius-sm, 6px);
    font-size: var(--font-size-sm, 14px);
    background: var(--bg-primary, #ffffff);
    color: var(--text-primary, #1f2937);
    transition: border-color 0.2s ease;
  }
  
  .input-field:focus, .select-field:focus {
    outline: none;
    border-color: var(--primary-color, #3b82f6);
  }
  
  .schema-change-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
    padding: var(--spacing-sm, 8px);
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: var(--border-radius-sm, 6px);
  }
  
  .schema-change-row .input-field,
  .schema-change-row .select-field {
    flex: 1;
  }
  
  .btn-primary, .btn-secondary, .btn-ghost {
    padding: var(--spacing-sm, 8px) var(--spacing-md, 16px);
    border-radius: var(--border-radius-sm, 6px);
    font-size: var(--font-size-sm, 14px);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm, 8px);
  }
  
  .btn-primary {
    background: var(--primary-color, #3b82f6);
    color: white;
    width: 100%;
  }
  
  .btn-primary:hover:not(:disabled) {
    background: var(--primary-hover, #2563eb);
  }
  
  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    background: var(--bg-secondary, #f3f4f6);
    color: var(--text-primary, #1f2937);
    border: 1px solid var(--border-color, #e5e7eb);
  }
  
  .btn-secondary:hover {
    background: var(--bg-tertiary, #e5e7eb);
  }
  
  .btn-ghost {
    background: transparent;
    color: var(--text-secondary, #6b7280);
    padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
  }
  
  .btn-ghost:hover {
    background: var(--bg-secondary, #f3f4f6);
    color: var(--text-primary, #1f2937);
  }
  
  .alert {
    padding: var(--spacing-md, 12px) var(--spacing-md, 16px);
    border-radius: var(--border-radius-sm, 6px);
    font-size: var(--font-size-sm, 14px);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm, 8px);
  }
  
  .alert-error {
    background: #fee;
    color: #dc2626;
    border: 1px solid #fecaca;
  }
  
  .alert-success {
    background: #f0fdf4;
    color: #16a34a;
    border: 1px solid #bbf7d0;
  }
  
  .icon {
    font-size: var(--font-size-lg, 20px);
  }
  
  .icon-inline {
    font-size: var(--font-size-base, 16px);
  }
  
  .spinner {
    display: inline-block;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  label {
    font-size: var(--font-size-sm, 14px);
    font-weight: 500;
    color: var(--text-primary, #1f2937);
  }
</style> 