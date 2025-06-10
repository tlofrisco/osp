/**
 * 🔐 OSP Manifest Audit & Governance System
 * 
 * Provides tools for manifest lifecycle management, field locking,
 * version comparison, and audit trail generation.
 * 
 * Part of OSP Refactor Sets 04 + 05 + 07
 */

import { supabaseAdmin } from '$lib/supabaseAdmin';
import { getManifestById } from '$lib/manifestResolver';

export type ManifestStatus = 'draft' | 'active' | 'deprecated' | 'locked';

export interface ManifestDiff {
  [key: string]: {
    before: any;
    after: any;
    changeType: 'added' | 'modified' | 'removed';
  };
}

export interface AuditLogEntry {
  action: 'create' | 'update' | 'lock' | 'deprecate' | 'activate';
  manifest_id: string;
  previous_version?: string;
  changed_by: string;
  changed_at: string;
  changes: ManifestDiff;
  reason?: string;
}

/**
 * 🧪 Compare Manifest Versions (Snapshot Diffing)
 * 
 * Generates detailed diff between two manifest versions for AI auditing
 * and human review.
 */
export async function compareManifestVersions(oldId: string, newId: string): Promise<ManifestDiff> {
  console.log(`🔍 Comparing manifests: ${oldId} → ${newId}`);
  
  const [oldManifest, newManifest] = await Promise.all([
    getManifestById(oldId),
    getManifestById(newId)
  ]);

  if (!oldManifest || !newManifest) {
    throw new Error(`One or both manifests not found: ${oldId}, ${newId}`);
  }

  const diffs: ManifestDiff = {};
  
  // Compare manifest content
  const oldContent = oldManifest.manifest || {};
  const newContent = newManifest.manifest || {};
  
  // Find all unique keys
  const allKeys = new Set([
    ...Object.keys(oldContent),
    ...Object.keys(newContent)
  ]);

  for (const key of allKeys) {
    const oldValue = oldContent[key];
    const newValue = newContent[key];
    
    if (oldValue === undefined && newValue !== undefined) {
      // Field was added
      diffs[key] = {
        before: undefined,
        after: newValue,
        changeType: 'added'
      };
    } else if (oldValue !== undefined && newValue === undefined) {
      // Field was removed
      diffs[key] = {
        before: oldValue,
        after: undefined,
        changeType: 'removed'
      };
    } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      // Field was modified
      diffs[key] = {
        before: oldValue,
        after: newValue,
        changeType: 'modified'
      };
    }
  }

  // Compare metadata fields
  const metadataFields = ['version', 'status', 'service_id', 'service_name'];
  for (const field of metadataFields) {
    if (oldManifest[field] !== newManifest[field]) {
      diffs[`_metadata.${field}`] = {
        before: oldManifest[field],
        after: newManifest[field],
        changeType: 'modified'
      };
    }
  }

  console.log(`📊 Found ${Object.keys(diffs).length} differences between manifests`);
  console.log('📋 Manifest diff summary:', Object.keys(diffs));
  
  return diffs;
}

/**
 * 🔐 Validate Manifest Status Transition
 * 
 * Ensures safe lifecycle transitions between manifest statuses.
 */
export function validateStatusTransition(
  currentStatus: ManifestStatus,
  newStatus: ManifestStatus
): { valid: boolean; error?: string } {
  const validTransitions: Record<ManifestStatus, ManifestStatus[]> = {
    'draft': ['active', 'deprecated'],
    'active': ['deprecated', 'locked'],
    'deprecated': ['active'], // Can be reactivated
    'locked': [] // Locked manifests cannot change status
  };

  if (!validTransitions[currentStatus].includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid status transition: ${currentStatus} → ${newStatus}`
    };
  }

  return { valid: true };
}

/**
 * 🔒 Validate Locked Fields
 * 
 * Prevents modification of locked fields in manifest updates.
 */
export function validateLockedFields(
  oldManifest: any,
  newManifest: any,
  lockedFields: string[] = []
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  // Default locked fields
  const defaultLockedFields = ['service_id', 'schema_name'];
  const allLockedFields = [...defaultLockedFields, ...lockedFields];
  
  for (const field of allLockedFields) {
    const oldValue = getNestedValue(oldManifest, field);
    const newValue = getNestedValue(newManifest, field);
    
    if (oldValue !== undefined && oldValue !== newValue) {
      violations.push(field);
    }
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * 🔐 Enforce Manifest Governance Rules
 * 
 * Comprehensive validation for manifest operations.
 */
export async function enforceManifestGovernance(
  operation: 'create' | 'update' | 'status_change',
  manifestData: any,
  options: {
    oldManifest?: any;
    newStatus?: ManifestStatus;
    userId?: string;
    reason?: string;
  } = {}
): Promise<{ allowed: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // 1. Status validation
    if (manifestData.status === 'locked') {
      errors.push('Cannot modify locked manifests. Create a new version instead.');
    }
    
    // 2. Status transition validation
    if (operation === 'status_change' && options.oldManifest && options.newStatus) {
      const transition = validateStatusTransition(options.oldManifest.status, options.newStatus);
      if (!transition.valid) {
        errors.push(transition.error!);
      }
    }
    
    // 3. Locked fields validation
    if (operation === 'update' && options.oldManifest) {
      const lockedFieldsCheck = validateLockedFields(
        options.oldManifest,
        manifestData,
        options.oldManifest.locked_fields || []
      );
      
      if (!lockedFieldsCheck.valid) {
        errors.push(`Cannot modify locked fields: ${lockedFieldsCheck.violations.join(', ')}`);
      }
    }
    
    // 4. Version validation
    if (operation === 'update' && options.oldManifest) {
      if (!manifestData.version || manifestData.version === options.oldManifest.version) {
        warnings.push('Version should be incremented for manifest updates');
      }
    }
    
    // 5. Active manifest validation for deployment
    if (manifestData.status && manifestData.status !== 'active') {
      warnings.push(`Manifest status '${manifestData.status}' may not be suitable for live deployment`);
    }
    
    return {
      allowed: errors.length === 0,
      errors,
      warnings
    };
    
  } catch (error) {
    return {
      allowed: false,
      errors: [`Governance validation failed: ${error.message}`],
      warnings
    };
  }
}

/**
 * 📝 Log Audit Entry
 * 
 * Records manifest changes for compliance and debugging.
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  try {
    console.log(`📝 Logging audit entry: ${entry.action} on ${entry.manifest_id}`);
    
    // Store in audit log table (create if doesn't exist)
    const { error } = await supabaseAdmin
      .schema('osp_metadata')
      .from('manifest_audit_log')
      .insert({
        action: entry.action,
        manifest_id: entry.manifest_id,
        previous_version: entry.previous_version,
        changed_by: entry.changed_by,
        changed_at: entry.changed_at,
        changes: entry.changes,
        reason: entry.reason
      });
    
    if (error) {
      console.error('⚠️ Failed to log audit entry:', error);
      // Don't throw - audit logging failure shouldn't break operations
    } else {
      console.log(`✅ Audit entry logged for ${entry.action}`);
    }
  } catch (error) {
    console.error('⚠️ Audit logging error:', error);
  }
}

/**
 * 🔍 Get Audit Trail for Manifest
 * 
 * Retrieves complete history of changes for a manifest.
 */
export async function getManifestAuditTrail(manifestId: string): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabaseAdmin
      .schema('osp_metadata')
      .from('manifest_audit_log')
      .select('*')
      .eq('manifest_id', manifestId)
      .order('changed_at', { ascending: false });
    
    if (error) {
      console.error('❌ Failed to fetch audit trail:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching audit trail:', error);
    return [];
  }
}

/**
 * 🔧 Helper function to get nested values
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * 📊 Generate Governance Report
 * 
 * Provides summary of manifest governance status across services.
 */
export async function generateGovernanceReport(): Promise<{
  totalManifests: number;
  statusCounts: Record<ManifestStatus, number>;
  lockedManifests: number;
  recentChanges: number;
}> {
  try {
    const { data: manifests, error } = await supabaseAdmin
      .schema('osp_metadata')
      .from('service_manifests')
      .select('status, locked_fields, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    const report = {
      totalManifests: manifests.length,
      statusCounts: {
        draft: 0,
        active: 0,
        deprecated: 0,
        locked: 0
      } as Record<ManifestStatus, number>,
      lockedManifests: 0,
      recentChanges: 0
    };
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    for (const manifest of manifests) {
      const status = (manifest.status as ManifestStatus) || 'draft';
      report.statusCounts[status]++;
      
      if (manifest.locked_fields && manifest.locked_fields.length > 0) {
        report.lockedManifests++;
      }
      
      if (new Date(manifest.created_at) > oneWeekAgo) {
        report.recentChanges++;
      }
    }
    
    return report;
  } catch (error) {
    console.error('❌ Error generating governance report:', error);
    throw error;
  }
} 