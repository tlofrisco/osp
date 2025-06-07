<script lang="ts">
  export let config: any;
  export let metadata: any = {};
  export let serviceSchema: string = '';
  
  // Additional props for compatibility (to avoid warnings)
  export let serviceName: string = '';
  export let currentRole: string = 'waitress';
  
  // Mock activity data - replace with real API call
  const activities = [
    {
      id: 1,
      type: 'create',
      entity: 'customer',
      description: 'New customer registered',
      user: 'System',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      icon: '👤'
    },
    {
      id: 2,
      type: 'update',
      entity: 'product',
      description: 'Product inventory updated',
      user: 'Admin',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      icon: '📦'
    },
    {
      id: 3,
      type: 'create',
      entity: 'order',
      description: 'New order received',
      user: 'Customer',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      icon: '🛒'
    },
    {
      id: 4,
      type: 'delete',
      entity: 'item',
      description: 'Item removed from catalog',
      user: 'Admin',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      icon: '🗑️'
    }
  ];
  
  function formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }
  
  function getActionColor(type: string): string {
    const colorMap: Record<string, string> = {
      'create': 'green',
      'update': 'blue',
      'delete': 'red',
      'view': 'gray'
    };
    return colorMap[type] || 'gray';
  }
  
  function handleActivityClick(activity: any) {
    console.log('📋 Activity clicked:', activity);
    // TODO: Navigate to specific record or show details
  }
  
  function handleViewAll() {
    console.log('📋 View All Activity clicked');
    // TODO: Navigate to full activity log
  }
</script>

<div class="activity-feed">
  <div class="feed-header">
    <h4>{metadata.title || 'Recent Activity'}</h4>
    <span class="activity-count">{activities.length} activities</span>
  </div>
  
  <div class="activity-list">
    {#each activities as activity (activity.id)}
      <div class="activity-item" on:click={() => handleActivityClick(activity)}>
        <div class="activity-icon" data-type={activity.type}>
          {activity.icon}
        </div>
        
        <div class="activity-content">
          <div class="activity-description">
            {activity.description}
          </div>
          
          <div class="activity-meta">
            <span class="activity-entity">{activity.entity}</span>
            <span class="activity-separator">•</span>
            <span class="activity-user">{activity.user}</span>
            <span class="activity-separator">•</span>
            <span class="activity-time">{formatTimestamp(activity.timestamp)}</span>
          </div>
        </div>
        
        <div class="activity-badge" data-color={getActionColor(activity.type)}>
          {activity.type}
        </div>
      </div>
    {/each}
    
    {#if activities.length === 0}
      <div class="empty-feed">
        <div class="empty-icon">📋</div>
        <p>No recent activity</p>
      </div>
    {/if}
  </div>
  
  <div class="feed-footer">
    <button class="view-all-btn" on:click={handleViewAll}>
      View All Activity →
    </button>
  </div>
</div>

<style>
  .activity-feed {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
  }
  
  .feed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 0.75rem;
  }
  
  .feed-header h4 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .activity-count {
    font-size: 0.75rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: 500;
  }
  
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .activity-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 6px;
    border: 1px solid #f3f4f6;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }
  
  .activity-item:hover {
    background: #f3f4f6;
    border-color: #e5e7eb;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .activity-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    font-size: 1rem;
    flex-shrink: 0;
  }
  
  .activity-icon[data-type="create"] {
    background: #d1fae5;
    border-color: #a7f3d0;
  }
  
  .activity-icon[data-type="update"] {
    background: #dbeafe;
    border-color: #93c5fd;
  }
  
  .activity-icon[data-type="delete"] {
    background: #fee2e2;
    border-color: #fca5a5;
  }
  
  .activity-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .activity-description {
    font-size: 0.875rem;
    color: #1f2937;
    font-weight: 500;
    line-height: 1.4;
  }
  
  .activity-meta {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
  }
  
  .activity-entity {
    background: #e5e7eb;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-weight: 500;
  }
  
  .activity-separator {
    color: #d1d5db;
  }
  
  .activity-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    flex-shrink: 0;
  }
  
  .activity-badge[data-color="green"] {
    background: #d1fae5;
    color: #065f46;
  }
  
  .activity-badge[data-color="blue"] {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .activity-badge[data-color="red"] {
    background: #fee2e2;
    color: #b91c1c;
  }
  
  .activity-badge[data-color="gray"] {
    background: #f3f4f6;
    color: #374151;
  }
  
  .empty-feed {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }
  
  .empty-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .feed-footer {
    margin-top: 1rem;
    border-top: 1px solid #f3f4f6;
    padding-top: 0.75rem;
  }
  
  .view-all-btn {
    width: 100%;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
  }
  
  .view-all-btn:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
  
  /* Scrollbar styling */
  .activity-list::-webkit-scrollbar {
    width: 4px;
  }
  
  .activity-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }
  
  .activity-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  
  .activity-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style> 