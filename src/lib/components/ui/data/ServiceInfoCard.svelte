<script lang="ts">
  export let config: any;
  export let metadata: any = {};
  export let serviceSchema: string = '';
  
  // Additional props for compatibility (to avoid warnings)
  export let serviceName: string = '';
  export let currentRole: string = 'waitress';
  
  // Extract service information from metadata with fallbacks
  const displayServiceName = metadata.service_name || serviceName || 'Unnamed Service';
  const displayServiceType = metadata.service_type || 'Custom Service';
  const displaySchema = serviceSchema || 'unknown';
  
  console.log('ServiceInfoCard props:', {
    metadata,
    displayServiceName,
    displayServiceType,
    displaySchema
  });
</script>

<div class="service-info-card" data-layout={config.layout || 'vertical'}>
  <div class="card-header">
    <h4>{metadata.title || 'Service Information'}</h4>
  </div>
  
  <div class="card-content">
    <div class="info-grid">
      {#if metadata.show_service_name !== false}
        <div class="info-item">
          <span class="label">Service Name:</span>
          <span class="value">{displayServiceName}</span>
        </div>
      {/if}
      
      {#if metadata.show_schema !== false}
        <div class="info-item">
          <span class="label">Schema:</span>
          <span class="value">{displaySchema}</span>
        </div>
      {/if}
      
      {#if metadata.show_type !== false}
        <div class="info-item">
          <span class="label">Type:</span>
          <span class="value">{displayServiceType}</span>
        </div>
      {/if}
      
      <div class="info-item">
        <span class="label">Status:</span>
        <span class="value status active">Active</span>
      </div>
    </div>
  </div>
</div>

<style>
  .service-info-card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid #e5e7eb;
  }
  
  .card-header {
    margin-bottom: 1rem;
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 0.75rem;
  }
  
  .card-header h4 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
  }
  
  .info-grid {
    display: grid;
    gap: 0.75rem;
  }
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #f9fafb;
  }
  
  .info-item:last-child {
    border-bottom: none;
  }
  
  .label {
    font-weight: 500;
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .value {
    color: #1f2937;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .status {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .status.active {
    background: #d1fae5;
    color: #065f46;
  }
  
  /* Layout variations */
  .service-info-card[data-layout="horizontal"] .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .service-info-card[data-layout="horizontal"] .info-item {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    background: #f9fafb;
    padding: 1rem;
    border-radius: 6px;
    border-bottom: none;
  }
  
  .service-info-card[data-layout="horizontal"] .label {
    margin-bottom: 0.25rem;
  }
</style> 