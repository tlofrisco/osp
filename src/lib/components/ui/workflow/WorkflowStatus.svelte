<!-- 🔄 Workflow Status Component -->
<script lang="ts">
  export let config: any;
  export let metadata: any = {};
  export let serviceSchema: string = '';
  export let serviceName: string = '';
  
  const {
    title = 'Workflow Status',
    show_count = true,
    show_recent = true,
    limit = 5
  } = metadata;

  // Mock data for now - will be replaced with real Temporal data
  const mockWorkflows = [
    {
      id: 'inventory_creation_001',
      name: 'Inventory Creation Process',
      status: 'running',
      started: '2024-01-15T10:30:00Z',
      progress: 60
    },
    {
      id: 'order_fulfillment_002', 
      name: 'Order Fulfillment Process',
      status: 'completed',
      started: '2024-01-15T09:15:00Z',
      completed: '2024-01-15T09:45:00Z'
    },
    {
      id: 'data_consistency_003',
      name: 'Data Consistency Check',
      status: 'scheduled',
      scheduled: '2024-01-16T02:00:00Z'
    }
  ];

  // Mock workflow data for now
  const workflowStats = {
    total: 11,
    active: 3,
    completed_today: 15,
    avg_duration: '2.3min'
  };

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
</style> 