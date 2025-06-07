<script lang="ts">
  import { markAsProtected } from '$lib/osp/protectedRegions';
  import { Button } from '$lib/components/ui/button';
  import { Shield } from 'lucide-svelte';
  
  export let component: any;
  export let onProtect: (protectedComponent: any) => void;
  
  function protectComponent() {
    const protectedComponent = markAsProtected(component, {
      protectedBy: 'user',
      reason: 'Custom modifications should be preserved'
    });
    
    onProtect(protectedComponent);
  }
</script>

<div class="protect-wrapper">
  <Button 
    variant="outline" 
    size="sm"
    on:click={protectComponent}
    class="protect-button"
  >
    <Shield class="h-4 w-4 mr-2" />
    Protect This Component
  </Button>
  
  <p class="protect-hint">
    Mark this component as protected to preserve your customizations during regeneration
  </p>
</div>

<style>
  .protect-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-top: 16px;
  }
  
  .protect-hint {
    font-size: 12px;
    color: #6b7280;
    margin: 0;
  }
</style> 