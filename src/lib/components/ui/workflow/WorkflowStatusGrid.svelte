<!-- 🔄 Workflow Status Grid Component -->
<script lang="ts">
  export let metadata: any = {};
  
  const {
    title = 'Workflow Executions',
    show_recent = true,
    limit = 20,
    columns = ['workflow', 'status', 'started', 'duration']
  } = metadata;

  // Mock execution data - will be replaced with real Temporal data
  const mockExecutions = [
    {
      id: 'wf_001',
      workflow: 'Inventory Creation Process',
      status: 'completed',
      started: '2024-01-15T10:30:00Z',
      completed: '2024-01-15T10:32:15Z',
      duration: '2m 15s'
    },
    {
      id: 'wf_002',
      workflow: 'Order Fulfillment Process',
      status: 'running',
      started: '2024-01-15T11:15:00Z',
      duration: '45m 12s'
    },
    {
      id: 'wf_003',
      workflow: 'Data Consistency Check',
      status: 'failed',
      started: '2024-01-15T09:00:00Z',
      completed: '2024-01-15T09:05:30Z',
      duration: '5m 30s',
      error: 'Connection timeout'
    },
    {
      id: 'wf_004',
      workflow: 'Inventory Creation Process',
      status: 'completed',
      started: '2024-01-15T08:45:00Z',
      completed: '2024-01-15T08:47:22Z',
      duration: '2m 22s'
    }
  ];

  function getStatusColor(status: string): string {
    switch (status) {
      case 'running': return '#2563eb';
      case 'completed': return '#16a34a';
      case 'failed': return '#dc2626';
      case 'scheduled': return '#d97706';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  }

  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'scheduled': return '⏰';
      case 'cancelled': return '⏹️';
      default: return '❓';
    }
  }
</script>

<div class="workflow-grid-card">
  <div class="header">
    <h3>{title}</h3>
    <div class="header-actions">
      <span class="count">{mockExecutions.length} executions</span>
      <button class="refresh-btn">🔄 Refresh</button>
    </div>
  </div>

  <div class="grid-container">
    <table class="execution-table">
      <thead>
        <tr>
          {#if columns.includes('workflow')}
            <th>Workflow</th>
          {/if}
          {#if columns.includes('status')}
            <th>Status</th>
          {/if}
          {#if columns.includes('started')}
            <th>Started</th>
          {/if}
          {#if columns.includes('duration')}
            <th>Duration</th>
          {/if}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each mockExecutions.slice(0, limit) as execution (execution.id)}
          <tr class="execution-row">
            {#if columns.includes('workflow')}
              <td class="workflow-cell">
                <div class="workflow-name">{execution.workflow}</div>
                <div class="execution-id">{execution.id}</div>
              </td>
            {/if}
            
            {#if columns.includes('status')}
              <td class="status-cell">
                <span 
                  class="status-badge"
                  style="background-color: {getStatusColor(execution.status)};"
                >
                  {getStatusIcon(execution.status)}
                  {execution.status}
                </span>
                {#if execution.error}
                  <div class="error-message">{execution.error}</div>
                {/if}
              </td>
            {/if}
            
            {#if columns.includes('started')}
              <td class="time-cell">
                {formatTime(execution.started)}
              </td>
            {/if}
            
            {#if columns.includes('duration')}
              <td class="duration-cell">
                {execution.duration}
              </td>
            {/if}
            
            <td class="actions-cell">
              <button class="action-btn view-btn" title="View Details">👁️</button>
              {#if execution.status === 'running'}
                <button class="action-btn cancel-btn" title="Cancel">⏹️</button>
              {:else if execution.status === 'failed'}
                <button class="action-btn retry-btn" title="Retry">🔄</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if mockExecutions.length === 0}
    <div class="empty-state">
      <p>No workflow executions</p>
      <small>Executions will appear here when workflows are triggered</small>
    </div>
  {/if}
</div>

<style>
  .workflow-grid-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #f3f4f6;
  }

  .header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .count {
    font-size: 0.875rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .refresh-btn {
    background: transparent;
    border: 1px solid #d1d5db;
    color: #6b7280;
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .refresh-btn:hover {
    color: #2563eb;
    border-color: #2563eb;
  }

  .grid-container {
    overflow-x: auto;
  }

  .execution-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .execution-table th {
    text-align: left;
    padding: 0.75rem 0.5rem;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    font-weight: 600;
    color: #374151;
  }

  .execution-row {
    border-bottom: 1px solid #f3f4f6;
    transition: background-color 0.2s ease;
  }

  .execution-row:hover {
    background: #f9fafb;
  }

  .execution-table td {
    padding: 0.75rem 0.5rem;
    vertical-align: top;
  }

  .workflow-cell {
    min-width: 200px;
  }

  .workflow-name {
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 0.125rem;
  }

  .execution-id {
    font-size: 0.75rem;
    color: #6b7280;
    font-family: monospace;
  }

  .status-cell {
    min-width: 120px;
  }

  .status-badge {
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    text-transform: uppercase;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .error-message {
    font-size: 0.75rem;
    color: #dc2626;
    margin-top: 0.25rem;
    font-style: italic;
  }

  .time-cell {
    min-width: 150px;
    color: #6b7280;
  }

  .duration-cell {
    min-width: 100px;
    color: #6b7280;
    font-family: monospace;
  }

  .actions-cell {
    min-width: 100px;
  }

  .action-btn {
    background: transparent;
    border: 1px solid #d1d5db;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 0.25rem;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }

  .view-btn:hover {
    color: #2563eb;
    border-color: #2563eb;
  }

  .cancel-btn:hover {
    color: #dc2626;
    border-color: #dc2626;
  }

  .retry-btn:hover {
    color: #16a34a;
    border-color: #16a34a;
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
</style> 