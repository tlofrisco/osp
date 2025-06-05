<!-- 🔄 Workflow Triggers Component -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  export let config: any;
  export let metadata: any = {};
  export let serviceSchema: string = '';
  export let serviceName: string = '';
  
  // Workflows will be loaded from service metadata
  let manualWorkflows = [];
  let allWorkflows = [];
  let loading = true;
  
  let executingWorkflows = new Set();
  let showToast = false;
  let toastMessage = '';
  let toastType = 'success'; // 'success' or 'error'
  
  onMount(async () => {
    await loadWorkflows();
  });
  
  async function loadWorkflows() {
    try {
      const response = await fetch(`/api/services/${serviceSchema}/metadata`);
      if (response.ok) {
        const data = await response.json();
        allWorkflows = data.metadata?.workflows || [];
        
        // Filter manual workflows (those with UI triggers)
        manualWorkflows = allWorkflows.filter((w: any) => 
          w.trigger?.type === 'ui_action' || 
          w.trigger?.type === 'manual' ||
          w.trigger?.type === 'form_submit'
        );
        
        console.log('Loaded workflows:', { total: allWorkflows.length, manual: manualWorkflows.length });
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
      toastMessage = 'Failed to load workflows';
      toastType = 'error';
      showToast = true;
    } finally {
      loading = false;
    }
  }
  
  async function triggerWorkflow(workflow: any) {
    if (executingWorkflows.has(workflow.id)) return;
    
    executingWorkflows.add(workflow.id);
    executingWorkflows = new Set(executingWorkflows); // Trigger reactivity
    
    try {
      console.log(`🚀 Triggering workflow: ${workflow.id}`, workflow);
      
      // Call the workflow execution API
      const response = await fetch('/api/workflows/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflowId: workflow.id,
          serviceSchema,
          workflowDefinition: workflow, // Pass the full workflow definition
          input: {} // Can be extended with form data if needed
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to trigger workflow');
      }

      const result = await response.json();
      
      // Show success message
      toastMessage = result.message || `${workflow.name} started successfully!`;
      toastType = 'success';
      showToast = true;
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        showToast = false;
      }, 3000);
      
    } catch (error) {
      console.error('Failed to trigger workflow:', error);
      toastMessage = error instanceof Error ? error.message : 'Failed to trigger workflow';
      toastType = 'error';
      showToast = true;
      setTimeout(() => {
        showToast = false;
      }, 5000);
    } finally {
      executingWorkflows.delete(workflow.id);
      executingWorkflows = new Set(executingWorkflows);
    }
  }

  function getTriggerIcon(triggerType: string): string {
    switch (triggerType) {
      case 'manual': return '👤';
      case 'ui_action': return '🖱️';
      case 'form_submit': return '📝';
      case 'entity_change': return '🔄';
      case 'entity_insert': return '➕';
      case 'schedule': return '⏰';
      default: return '⚡';
    }
  }

  function getWorkflowIcon(workflowName: string): string {
    const name = workflowName.toLowerCase();
    if (name.includes('reservation') || name.includes('booking')) return '📅';
    if (name.includes('order')) return '📋';
    if (name.includes('inventory')) return '📦';
    if (name.includes('payment')) return '💳';
    if (name.includes('notification')) return '🔔';
    if (name.includes('report')) return '📊';
    if (name.includes('update')) return '✏️';
    if (name.includes('create') || name.includes('add')) return '➕';
    if (name.includes('delete') || name.includes('remove')) return '🗑️';
    if (name.includes('check') || name.includes('validate')) return '✅';
    return '⚙️';
  }
</script>

<div class="workflow-triggers-card">
  <div class="card-header">
    <h4>{metadata.title || 'Workflow Triggers'}</h4>
    <span class="trigger-count">
      {#if loading}
        <span class="spinner-small"></span>
      {:else}
        {manualWorkflows.length} available
      {/if}
    </span>
  </div>
  
  <div class="card-content">
    {#if loading}
      <div class="loading-state">
        <span class="spinner"></span>
        <p>Loading workflows...</p>
      </div>
    {:else if manualWorkflows.length > 0}
      <div class="triggers-grid">
        {#each manualWorkflows as workflow (workflow.id)}
          <div class="trigger-item">
            <div class="trigger-icon">
              {getWorkflowIcon(workflow.name)}
            </div>
            <div class="trigger-info">
              <h5 class="trigger-name">{workflow.name}</h5>
              <p class="trigger-description">{workflow.description || 'No description available'}</p>
              <div class="trigger-meta">
                <span class="trigger-type">
                  {getTriggerIcon(workflow.trigger?.type || 'manual')}
                  {workflow.trigger?.type || 'manual'}
                </span>
                {#if workflow.steps}
                  <span class="step-count">{workflow.steps.length} steps</span>
                {/if}
              </div>
            </div>
            
            <button 
              class="trigger-button"
              class:executing={executingWorkflows.has(workflow.id)}
              disabled={executingWorkflows.has(workflow.id)}
              on:click={() => triggerWorkflow(workflow)}
            >
              {#if executingWorkflows.has(workflow.id)}
                <span class="spinner"></span>
                Running...
              {:else}
                ▶️ Run Now
              {/if}
            </button>
          </div>
        {/each}
      </div>
    {:else}
      <div class="empty-state">
        <p>No manual triggers available</p>
        <small>Workflows with UI triggers will appear here when defined</small>
        <button class="refresh-button" on:click={loadWorkflows}>
          🔄 Refresh
        </button>
      </div>
    {/if}
  </div>
</div>

<!-- Toast notification -->
{#if showToast}
  <div class="toast {toastType}">
    <span class="toast-icon">
      {toastType === 'success' ? '✅' : '❌'}
    </span>
    {toastMessage}
  </div>
{/if}

<style>
  .workflow-triggers-card {
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }
  
  .card-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-header h4 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .trigger-count {
    font-size: 0.875rem;
    color: #6b7280;
    background: #e5e7eb;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .card-content {
    padding: 1.5rem;
  }
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    gap: 1rem;
  }
  
  .triggers-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .trigger-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: all 0.2s ease;
  }
  
  .trigger-item:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .trigger-icon {
    font-size: 2rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 8px;
    flex-shrink: 0;
  }
  
  .trigger-info {
    flex: 1;
  }
  
  .trigger-name {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .trigger-description {
    margin: 0 0 0.5rem 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }
  
  .trigger-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: #9ca3af;
  }
  
  .trigger-type {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .step-count {
    background: #e5e7eb;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
  }
  
  .trigger-button {
    background: #16a34a;
    color: white;
    border: none;
    padding: 0.625rem 1.25rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 120px;
    justify-content: center;
  }
  
  .trigger-button:hover:not(:disabled) {
    background: #15803d;
  }
  
  .trigger-button.executing {
    background: #6b7280;
    cursor: not-allowed;
  }
  
  .trigger-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .spinner, .spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .spinner-small {
    width: 12px;
    height: 12px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }
  
  .empty-state p {
    margin: 0 0 0.5rem 0;
    font-weight: 500;
  }
  
  .empty-state small {
    font-size: 0.875rem;
  }
  
  .refresh-button {
    margin-top: 1rem;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .refresh-button:hover {
    background: #e5e7eb;
  }
  
  .toast {
    position: fixed;
    top: 1rem;
    right: 1rem;
    background: #16a34a;
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  }
  
  .toast.error {
    background: #dc2626;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .toast-icon {
    font-size: 1rem;
  }
</style> 