# 🏗️ OSP Manifest Integration: Diagnosis & Architecture

**Date:** 2025-06-08  
**Issue:** Service creation succeeds but manifest storage fails  
**Impact:** New services can't deploy workers or use governance features  

---

## 🚨 **Problem Summary**

### **Working Flow:**
```
User Creates Service → ✅ Service stored in `services` table → ✅ Database schema created → ✅ Temporal workflow triggered
```

### **Broken Flow:**
```
Service Creation → ❌ Manifest storage fails → ❌ No worker deployment → ❌ No governance tracking
```

---

## 🔍 **Root Cause Analysis**

### **Error Message:**
```
💥 Worker integration failed: Error: Failed to store manifest in Supabase: 
Could not find the 'manifest_content' column of 'service_manifests' in the schema cache
```

### **Technical Diagnosis:**
1. **✅ Integration code is properly implemented** - `deployWorkerForService()` is called correctly
2. **✅ Governance table exists** - `osp_metadata.service_manifests` table is present with 43 existing manifests
3. **❌ Schema cache mismatch** - Supabase client doesn't recognize the `manifest_content` column
4. **✅ Service creation works** - Stored in legacy `services.metadata` column as fallback

---

## 🎯 **Current State**

### **What's Working:**
- Service creation and storage in `services` table
- Database schema generation for service data
- Temporal workflow execution
- UI rendering from legacy manifest location

### **What's Broken:**
- Governance-compliant manifest storage in `osp_metadata.service_manifests`
- Worker deployment automation via manifest UUID
- Audit trail and versioning for manifests
- Status-based deployment controls (draft/active/locked)

---

## 🛠️ **Solution Architecture**

### **Option A: Schema Cache Refresh (Recommended)**
Create a Supabase RPC function to bypass schema cache issues:

```sql
-- Deploy this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION insert_service_manifest(
  p_service_id TEXT,
  p_service_name TEXT,
  p_version TEXT,
  p_manifest_content JSONB,
  p_status TEXT DEFAULT 'active',
  p_locked_fields TEXT[] DEFAULT ARRAY['service_id', 'schema_name']
)
RETURNS TABLE(manifest_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO osp_metadata.service_manifests (
    service_id, service_name, version, manifest_content,
    status, locked_fields, created_at, updated_at
  ) VALUES (
    p_service_id, p_service_name, p_version, p_manifest_content,
    p_status::osp_metadata.manifest_status, p_locked_fields, NOW(), NOW()
  )
  RETURNING id INTO new_id;
  
  RETURN QUERY SELECT new_id;
END;
$$;
```

### **Option B: Direct TypeScript Fix**
Update `src/lib/osp/workerIntegration.ts` to use RPC with fallback:

```typescript
// Replace the insert section in generateServiceManifest()
try {
  // Try RPC first (bypasses schema cache)
  const { data, error } = await supabaseAdmin.rpc('insert_service_manifest', {
    p_service_id: manifestData.service_id,
    p_service_name: manifestData.service_name,
    p_version: manifestData.version,
    p_manifest_content: manifestData.manifest_content,
    p_status: manifestData.status,
    p_locked_fields: manifestData.locked_fields
  });
  
  if (error) {
    // Fallback to direct insert
    const insertResult = await supabaseAdmin
      .schema('osp_metadata')
      .from('service_manifests')
      .insert(manifestData)
      .select('id')
      .single();
    
    if (insertResult.error) {
      throw new Error(`Failed to store manifest: ${insertResult.error.message}`);
    }
    return insertResult.data.id;
  }
  
  return data.manifest_id;
} catch (error) {
  throw new Error(`Manifest storage failed: ${error.message}`);
}
```

---

## 📋 **Implementation Plan**

### **Phase 1: Immediate Fix (5 minutes)**
1. ✅ **COMPLETED** - Fixed excessive `hooks.server.ts` logging
2. **Deploy SQL function** in Supabase SQL Editor (copy from Option A above)
3. **Update TypeScript code** with RPC fallback (copy from Option B above)

### **Phase 2: Verification (10 minutes)**
1. **Test service creation** - verify manifest appears in `osp_metadata.service_manifests`
2. **Check governance integration** - confirm status/version/locked_fields are set
3. **Verify worker deployment** - ensure worker builds trigger correctly

### **Phase 3: Monitoring (Ongoing)**
1. **Watch console logs** for successful manifest storage messages
2. **Query governance table** to confirm new manifests appear
3. **Monitor worker deployment** success rates

---

## 🎯 **Success Criteria**

### **Before Fix:**
- ❌ Manifests only in `services.metadata` (legacy)
- ❌ No governance tracking
- ❌ No worker automation

### **After Fix:**
- ✅ Manifests in both `services.metadata` AND `osp_metadata.service_manifests`
- ✅ Full governance: status=active, version=v1.0.0, locked_fields protection
- ✅ Automated worker deployment with manifest UUID linkage
- ✅ Audit trail for all manifest changes

---

## 📞 **Next Actions**

1. **SQL Admin** - Deploy the RPC function in Supabase
2. **TypeScript Update** - Apply the RPC fallback code
3. **Test Creation** - Create new service to verify end-to-end flow
4. **Architecture Review** - Confirm governance integration meets requirements

**Estimated Fix Time:** 15 minutes  
**Risk Level:** Low (fallback preserves existing functionality)  
**Impact:** High (enables full governance and automation features) 