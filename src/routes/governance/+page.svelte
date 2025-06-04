<!-- 📁 src/routes/governance/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  // 🏛️ Type Definitions
  interface GovernanceLayer {
    id: string;
    layer_name: string;
    layer_type: 'osp_global' | 'creator_portfolio' | 'team' | 'division' | 'custom';
    scope_identifier?: string;
    version: string;
    active: boolean;
    created_at: string;
    updated_at: string;
  }

  interface ManifestTemplate {
    id: string;
    template_name: string;
    template_type: string;
    category?: string;
    description: string;
    status: 'active' | 'draft' | 'deprecated' | 'archived';
    usage_count?: number;
    version: string;
    created_at: string;
    updated_at: string;
  }

  interface ComplianceCheck {
    id: string;
    compliance_status: 'compliant' | 'violations' | 'warnings' | 'error';
    check_type: string;
    manifest_id?: string;
    violations?: any[];
    created_at: string;
  }

  interface GovernanceData {
    governance_layers: GovernanceLayer[];
    manifest_templates: ManifestTemplate[];
    recent_compliance_checks: ComplianceCheck[];
    summary: {
      total_layers: number;
      total_templates: number;
      recent_violations: number;
    };
  }

  // 🏛️ Governance Data
  let governanceData: GovernanceData = {
    governance_layers: [],
    manifest_templates: [],
    recent_compliance_checks: [],
    summary: {
      total_layers: 0,
      total_templates: 0,
      recent_violations: 0
    }
  };

  let loading = true;
  let selectedTab = 'overview';
  let selectedLayer: GovernanceLayer | null = null;
  let selectedTemplate: ManifestTemplate | null = null;

  // 🔄 Load governance data
  onMount(async () => {
    await loadGovernanceData();
  });

  async function loadGovernanceData() {
    try {
      loading = true;
      const response = await fetch('/api/manifest/governance');
      const result = await response.json();
      
      if (result.success) {
        governanceData = result.data;
      } else {
        console.error('Failed to load governance data:', result.error);
      }
    } catch (error) {
      console.error('Error loading governance data:', error);
    } finally {
      loading = false;
    }
  }

  // 🎨 Get layer color based on type
  function getLayerColor(layerType: string): string {
    const colors: Record<string, string> = {
      'osp_global': 'bg-red-100 text-red-800 border-red-200',
      'creator_portfolio': 'bg-blue-100 text-blue-800 border-blue-200',
      'team': 'bg-green-100 text-green-800 border-green-200',
      'division': 'bg-purple-100 text-purple-800 border-purple-200',
      'custom': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[layerType] || colors['custom'];
  }

  // 🎯 Get template status color
  function getTemplateStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'deprecated': 'bg-orange-100 text-orange-800',
      'archived': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors['draft'];
  }

  // 📊 Get compliance status color
  function getComplianceColor(status: string): string {
    const colors: Record<string, string> = {
      'compliant': 'bg-green-100 text-green-800',
      'violations': 'bg-red-100 text-red-800',
      'warnings': 'bg-yellow-100 text-yellow-800',
      'error': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors['error'];
  }

  // 🔗 Format governance layer hierarchy
  function getLayerHierarchy(layer: GovernanceLayer): string {
    const hierarchy: Record<string, string> = {
      'osp_global': '🌍 Global OSP',
      'creator_portfolio': '👤 Creator Portfolio',
      'team': '👥 Team',
      'division': '🏢 Division',
      'custom': '⚙️ Custom'
    };
    return hierarchy[layer.layer_type] || '⚙️ Custom';
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- 🏛️ Header -->
  <div class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">🏛️ Governance Dashboard</h1>
            <p class="mt-1 text-sm text-gray-500">
              Hierarchical Manifest System - Managing Global Laws, Defaults, Regional Laws & Service Freedoms
            </p>
          </div>
          <div class="flex space-x-3">
            <button 
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              on:click={() => loadGovernanceData()}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 📊 Overview Cards -->
  {#if !loading}
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Governance Layers Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span class="text-white text-lg">🏛️</span>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Governance Layers</h3>
              <p class="text-2xl font-bold text-blue-600">{governanceData.summary.total_layers}</p>
              <p class="text-sm text-gray-500">Active policy layers</p>
            </div>
          </div>
        </div>

        <!-- Manifest Templates Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span class="text-white text-lg">📋</span>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Manifest Templates</h3>
              <p class="text-2xl font-bold text-green-600">{governanceData.summary.total_templates}</p>
              <p class="text-sm text-gray-500">Reusable templates</p>
            </div>
          </div>
        </div>

        <!-- Compliance Status Card -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span class="text-white text-lg">⚠️</span>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-medium text-gray-900">Recent Violations</h3>
              <p class="text-2xl font-bold text-red-600">{governanceData.summary.recent_violations}</p>
              <p class="text-sm text-gray-500">Need attention</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 📑 Tabs Navigation -->
      <div class="bg-white rounded-lg shadow">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8 px-6">
            {#each [
              { id: 'overview', label: '📊 Overview', icon: '📊' },
              { id: 'layers', label: '🏛️ Governance Layers', icon: '🏛️' },
              { id: 'templates', label: '📋 Templates', icon: '📋' },
              { id: 'compliance', label: '✅ Compliance', icon: '✅' },
              { id: 'hierarchy', label: '🌳 Inheritance Tree', icon: '🌳' }
            ] as tab}
              <button
                class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {
                  selectedTab === tab.id 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }"
                on:click={() => selectedTab = tab.id}
              >
                {tab.label}
              </button>
            {/each}
          </nav>
        </div>

        <!-- 📑 Tab Content -->
        <div class="p-6">
          {#if selectedTab === 'overview'}
            <!-- 📊 Overview Tab -->
            <div class="space-y-6">
              <h2 class="text-xl font-semibold text-gray-900">🎯 Hierarchical Governance Overview</h2>
              
              <!-- Governance Hierarchy Explanation -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 class="text-lg font-medium text-blue-900 mb-4">🏗️ Four-Tier Governance Architecture</h3>
                <div class="space-y-3">
                  <div class="flex items-start space-x-3">
                    <span class="text-red-600 text-xl">🌍</span>
                    <div>
                      <h4 class="font-medium text-red-800">Global Laws (Immutable)</h4>
                      <p class="text-sm text-red-700">OSP-level non-overridable settings that all services must follow (e.g., accessibility, security basics)</p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <span class="text-blue-600 text-xl">🔧</span>
                    <div>
                      <h4 class="font-medium text-blue-800">Global Defaults (Overridable)</h4>
                      <p class="text-sm text-blue-700">OSP-level default settings that can be customized (e.g., theme, branding, performance limits)</p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <span class="text-green-600 text-xl">👤</span>
                    <div>
                      <h4 class="font-medium text-green-800">Regional Laws (Portfolio-wide)</h4>
                      <p class="text-sm text-green-700">Service creator portfolio-wide settings that apply to all their services (e.g., brand fonts, workflow rules)</p>
                    </div>
                  </div>
                  <div class="flex items-start space-x-3">
                    <span class="text-purple-600 text-xl">⚙️</span>
                    <div>
                      <h4 class="font-medium text-purple-800">Service Freedoms (Local)</h4>
                      <p class="text-sm text-purple-700">Individual service-specific settings within the constraints of higher governance layers</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recent Activity -->
              <div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">📈 Recent Compliance Checks</h3>
                <div class="space-y-3">
                  {#each governanceData.recent_compliance_checks.slice(0, 5) as check}
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div class="flex items-center space-x-3">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getComplianceColor(check.compliance_status)}">
                          {check.compliance_status}
                        </span>
                        <span class="text-sm font-medium text-gray-900">Check #{check.id.slice(0, 8)}</span>
                        <span class="text-sm text-gray-500">{check.check_type}</span>
                      </div>
                      <span class="text-sm text-gray-500">
                        {new Date(check.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>

          {:else if selectedTab === 'layers'}
            <!-- 🏛️ Governance Layers Tab -->
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-900">🏛️ Governance Layers</h2>
                <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  + Create Layer
                </button>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {#each governanceData.governance_layers as layer}
                  <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                          <h3 class="text-lg font-medium text-gray-900">{layer.layer_name}</h3>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getLayerColor(layer.layer_type)}">
                            {getLayerHierarchy(layer)}
                          </span>
                        </div>
                        <p class="text-sm text-gray-600 mb-3">
                          Scope: {layer.scope_identifier || 'Global'}
                        </p>
                        <div class="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Version: {layer.version}</span>
                          <span>•</span>
                          <span>Status: {layer.active ? '✅ Active' : '⏸️ Inactive'}</span>
                        </div>
                      </div>
                      <button 
                        class="text-gray-400 hover:text-gray-600"
                        on:click={() => selectedLayer = layer}
                      >
                        ⚙️
                      </button>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

          {:else if selectedTab === 'templates'}
            <!-- 📋 Templates Tab -->
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold text-gray-900">📋 Manifest Templates</h2>
                <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  + Create Template
                </button>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {#each governanceData.manifest_templates as template}
                  <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between mb-3">
                      <h3 class="text-lg font-medium text-gray-900">{template.template_name}</h3>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getTemplateStatusColor(template.status)}">
                        {template.status}
                      </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between">
                        <span class="text-gray-500">Type:</span>
                        <span class="font-medium">{template.template_type}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500">Category:</span>
                        <span class="font-medium">{template.category || 'General'}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500">Usage:</span>
                        <span class="font-medium">{template.usage_count || 0} times</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-500">Version:</span>
                        <span class="font-medium">{template.version}</span>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>

          {:else if selectedTab === 'compliance'}
            <!-- ✅ Compliance Tab -->
            <div class="space-y-6">
              <h2 class="text-xl font-semibold text-gray-900">✅ Policy Compliance Status</h2>
              
              <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 class="text-lg font-medium text-gray-900">Recent Compliance Checks</h3>
                </div>
                <div class="divide-y divide-gray-200">
                  {#each governanceData.recent_compliance_checks as check}
                    <div class="px-6 py-4 hover:bg-gray-50">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {getComplianceColor(check.compliance_status)}">
                            {check.compliance_status}
                          </span>
                          <div>
                            <p class="text-sm font-medium text-gray-900">
                              {check.check_type} Check
                            </p>
                            <p class="text-sm text-gray-500">
                              Manifest: {check.manifest_id?.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div class="text-right">
                          <p class="text-sm text-gray-900">
                            {new Date(check.created_at).toLocaleDateString()}
                          </p>
                          <p class="text-sm text-gray-500">
                            {new Date(check.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      {#if check.violations && check.violations.length > 0}
                        <div class="mt-3 text-sm text-red-600">
                          ⚠️ {check.violations.length} violation(s) found
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            </div>

          {:else if selectedTab === 'hierarchy'}
            <!-- 🌳 Inheritance Tree Tab -->
            <div class="space-y-6">
              <h2 class="text-xl font-semibold text-gray-900">🌳 Manifest Inheritance Hierarchy</h2>
              
              <div class="bg-white border border-gray-200 rounded-lg p-6">
                <div class="text-center text-gray-500 py-8">
                  <div class="text-4xl mb-4">🌳</div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Inheritance Tree Visualization</h3>
                  <p class="text-sm">
                    Interactive inheritance tree showing how policies flow from Global Laws → Global Defaults → Regional Laws → Service Freedoms
                  </p>
                  <button class="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    🚧 Coming Soon
                  </button>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <!-- Loading State -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading governance data...</p>
      </div>
    </div>
  {/if}
</div>

<style>
  /* Custom animations */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style> 