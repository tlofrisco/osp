<!-- 🔄 Workflow Status Component -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  export let config: any;
  export let metadata: any = {};
  export let serviceSchema: string = '';
  export let serviceName: string = '';
  
  // Additional props for compatibility (to avoid warnings)
  export let currentRole: string = 'waitress';

  const {
    title = 'Workflow Status',
    show_count = true,
    show_recent = true,
    limit = 5
  } = metadata;

  // Get actual workflow count from service metadata
  let workflowStats = {
    total: 0,
    active: 0,
    completed_today: 0,
    avg_duration: '0min'
  };
  
  // Recent workflow executions (will be populated from database)
  let recentWorkflows = [];
  
  onMount(async () => {
    // Fetch service metadata to get actual workflow count
    try {
      const response = await fetch(`/api/services/${serviceSchema}/metadata`);
      if (response.ok) {
        const data = await response.json();
        const workflows = data.metadata?.workflows || [];
        workflowStats.total = workflows.length;
        
        // TODO: Fetch actual execution stats from workflow_executions table
        // For now, just show the total count
      }
    } catch (error) {
      console.error('Failed to fetch workflow stats:', error);
    }
  });

  function getStatusColor(status: string): string {
    switch (status) {
      case 'running': return '#2563eb';
      case 'completed': return '#16a34a';
      case 'failed': return '#dc2626';
      case 'scheduled': return '#d97706';
      default: return '#6b7280';
    }
  }

  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }
</script>

<div class="workflow-status-card">
  <div class="card-header">
    <h4>{metadata.title || 'Workflow Status'}</h4>
  </div>
  
  <div class="card-content">
    <div class="status-grid">
      <div class="status-item">
        <span class="status-value">{workflowStats.total}</span>
        <span class="status-label">Total Workflows</span>
      </div>
      
      <div class="status-item">
        <span class="status-value">{workflowStats.active}</span>
        <span class="status-label">Currently Active</span>
      </div>
      
      <div class="status-item">
        <span class="status-value">{workflowStats.completed_today}</span>
        <span class="status-label">Completed Today</span>
      </div>
      
      <div class="status-item">
        <span class="status-value">{workflowStats.avg_duration}</span>
        <span class="status-label">Avg Duration</span>
      </div>
    </div>
    
    {#if recentWorkflows.length > 0}
      <div class="recent-workflows">
        <h5>Recent Executions</h5>
        {#each recentWorkflows as workflow}
          <div class="workflow-item">
            <span class="workflow-name">{workflow.name}</span>
            <span class="workflow-status" style="color: {getStatusColor(workflow.status)}">
              {workflow.status}
            </span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .workflow-status-card {
    background: white;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }
  
  .card-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }
  
  .card-header h4 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .card-content {
    padding: 1.5rem;
  }
  
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
  }
  
  .status-item {
    text-align: center;
    padding: 1rem;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
  }
  
  .status-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #3b82f6;
    margin-bottom: 0.25rem;
  }
  
  .status-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .recent-workflows {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .recent-workflows h5 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }
  
  .workflow-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .workflow-item:last-child {
    border-bottom: none;
  }
  
  .workflow-name {
    font-size: 0.875rem;
    color: #374151;
  }
  
  .workflow-status {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }
</style> 