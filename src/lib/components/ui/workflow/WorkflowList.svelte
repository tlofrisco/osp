<!-- 🔄 Workflow List Component -->
<script lang="ts">
  export let config: any;
  export let metadata: any = {};
  export let serviceSchema: string = '';
  export let serviceName: string = '';
  
  // Mock workflow data from contract UI metadata
  const workflows = metadata.workflows || [
    { id: 'order_creation', name: 'Order Creation Process', description: 'Handle new customer orders', trigger_type: 'manual' },
    { id: 'table_reservation', name: 'Table Reservation', description: 'Manage table bookings', trigger_type: 'manual' },
    { id: 'staff_scheduling', name: 'Staff Scheduling', description: 'Coordinate staff shifts', trigger_type: 'scheduled' },
    { id: 'inventory_update', name: 'Inventory Update', description: 'Update stock levels', trigger_type: 'automatic' },
    { id: 'payment_processing', name: 'Payment Processing', description: 'Handle customer payments', trigger_type: 'manual' },
    { id: 'customer_feedback', name: 'Customer Feedback', description: 'Collect and process feedback', trigger_type: 'manual' },
    { id: 'kitchen_workflow', name: 'Kitchen Workflow', description: 'Manage food preparation', trigger_type: 'automatic' },
    { id: 'menu_management', name: 'Menu Management', description: 'Update menu items and pricing', trigger_type: 'manual' },
    { id: 'supplier_ordering', name: 'Supplier Ordering', description: 'Automated supplier orders', trigger_type: 'scheduled' },
    { id: 'order_update', name: 'Order Update Process', description: 'Update existing orders', trigger_type: 'manual' },
    { id: 'daily_reporting', name: 'Daily Reporting', description: 'Generate daily business reports', trigger_type: 'scheduled' }
  ];
  
  function handleWorkflowAction(workflowId: string, action: string) {
    console.log(`📋 Workflow action: ${action} on ${workflowId}`);
    // TODO: Implement actual workflow actions
  }
  
  function getTriggerIcon(triggerType: string): string {
    switch (triggerType) {
      case 'manual': return '👆';
      case 'automatic': return '⚡';
      case 'scheduled': return '⏰';
      default: return '📋';
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

  function formatTriggerType(triggerType: string): string {
    return triggerType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
</script>

<div class="workflow-list-card">
  <div class="card-header">
    <h4>{metadata.title || 'Available Workflows'}</h4>
    <span class="workflow-count">{workflows.length} workflows</span>
  </div>
  
  <div class="card-content">
    <div class="workflows-grid">
      {#each workflows as workflow (workflow.id)}
        <div class="workflow-item">
          <div class="workflow-info">
            <div class="workflow-header">
              <span class="workflow-icon">{getTriggerIcon(workflow.trigger_type)}</span>
              <h5 class="workflow-name">{workflow.name}</h5>
              <span class="trigger-type">{workflow.trigger_type}</span>
            </div>
            <p class="workflow-description">{workflow.description}</p>
          </div>
          
          <div class="workflow-actions">
            <button 
              class="action-button secondary"
              on:click={() => handleWorkflowAction(workflow.id, 'view')}
            >
              View Details
            </button>
            
            {#if workflow.trigger_type === 'manual'}
              <button 
                class="action-button primary"
                on:click={() => handleWorkflowAction(workflow.id, 'trigger')}
              >
                Trigger Workflow
              </button>
            {:else}
              <button 
                class="action-button secondary"
                on:click={() => handleWorkflowAction(workflow.id, 'submit')}
              >
                Form Submit
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .workflow-list-card {
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
  
  .workflow-count {
    font-size: 0.875rem;
    color: #6b7280;
    background: #e5e7eb;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .card-content {
    padding: 1.5rem;
  }
  
  .workflows-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .workflow-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    transition: all 0.2s ease;
  }
  
  .workflow-item:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .workflow-info {
    flex: 1;
  }
  
  .workflow-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .workflow-icon {
    font-size: 1.25rem;
  }
  
  .workflow-name {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    flex: 1;
  }
  
  .trigger-type {
    font-size: 0.75rem;
    color: #6b7280;
    background: #e5e7eb;
    padding: 0.125rem 0.5rem;
    border-radius: 12px;
    text-transform: capitalize;
  }
  
  .workflow-description {
    margin: 0;
    font-size: 0.875rem;
    color: #6b7280;
    line-height: 1.4;
  }
  
  .workflow-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  
  .action-button {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  
  .action-button.primary {
    background: #3b82f6;
    color: white;
  }
  
  .action-button.primary:hover {
    background: #2563eb;
  }
  
  .action-button.secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  .action-button.secondary:hover {
    background: #e5e7eb;
    border-color: #9ca3af;
  }
</style> 