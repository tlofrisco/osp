<!-- 🔄 Workflow Triggers Component -->
<script lang="ts">
  export let config: any;
  export let metadata: any = {};
  export let serviceSchema: string = '';
  export let serviceName: string = '';
  
  // Extract manual workflows from metadata
  const manualWorkflows = metadata.workflows?.filter((w: any) => w.trigger_type === 'manual') || [
    { id: 'order_update', name: 'Order Update Process', description: 'Update existing orders' }
  ];
  
  let executingWorkflows = new Set();
  let showToast = false;
  let toastMessage = '';
  
  async function triggerWorkflow(workflowId: string) {
    if (executingWorkflows.has(workflowId)) return;
    
    executingWorkflows.add(workflowId);
    executingWorkflows = new Set(executingWorkflows); // Trigger reactivity
    
    try {
      console.log(`🚀 Triggering workflow: ${workflowId}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      toastMessage = 'Workflow triggered successfully!';
      showToast = true;
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        showToast = false;
      }, 3000);
      
    } catch (error) {
      console.error('Failed to trigger workflow:', error);
      toastMessage = 'Failed to trigger workflow';
      showToast = true;
      setTimeout(() => {
        showToast = false;
      }, 3000);
    } finally {
      executingWorkflows.delete(workflowId);
      executingWorkflows = new Set(executingWorkflows);
    }
  }

  function getTriggerIcon(triggerType: string): string {
    switch (triggerType) {
      case 'manual': return '👤';
      case 'form_submit': return '📝';
      case 'entity_insert': return '➕';
      case 'schedule': return '⏰';
      default: return '⚡';
    }
  }

  function getIndustryIcon(framework: string): string {
    switch (framework) {
      case 'TMForumSID': return '📡';
      case 'ARTS': return '🛒';
      case 'ITIL': return '🔧';
      default: return '🏢';
    }
  }
</script>

<div class="workflow-triggers-card">
  <div class="card-header">
    <h4>{metadata.title || 'Manual Triggers'}</h4>
    <span class="trigger-count">{manualWorkflows.length} available</span>
  </div>
  
  <div class="card-content">
    {#if manualWorkflows.length > 0}
      <div class="triggers-grid">
        {#each manualWorkflows as workflow (workflow.id)}
          <div class="trigger-item">
            <div class="trigger-info">
              <h5 class="trigger-name">{workflow.name}</h5>
              <p class="trigger-description">{workflow.description}</p>
            </div>
            
            <button 
              class="trigger-button"
              class:executing={executingWorkflows.has(workflow.id)}
              disabled={executingWorkflows.has(workflow.id)}
              on:click={() => triggerWorkflow(workflow.id)}
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
        <small>Manual workflows will appear here when available</small>
      </div>
    {/if}
  </div>
</div>

<!-- Toast notification -->
{#if showToast}
  <div class="toast">
    <span class="toast-icon">✅</span>
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
  }
  
  .card-content {
    padding: 1.5rem;
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
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    transition: all 0.2s ease;
  }
  
  .trigger-item:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
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
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
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