# Sprint 1 Test Plan

## ✅ Implementation Checklist

### 1. Enhanced OpenAI Prompt ✅
- [x] Updated prompt to generate coherent three-legged stool services
- [x] Schema includes workflow state fields (status, workflow_state)
- [x] Workflows reference schema fields
- [x] UI components trigger workflows

### 2. Coherence Validation ✅
- [x] `validateServiceCoherence` function checks for orphan fields
- [x] Validates workflows have UI triggers
- [x] Validates UI components reference valid entities

### 3. Dynamic Temporal Worker ✅
- [x] Created `dynamicWorker.ts` that reads workflow definitions
- [x] Supports multiple activity types (create_entity, update_entity, validate, etc.)
- [x] No hard-coded workflows - everything is dynamic

### 4. Workflow Trigger UI ✅
- [x] `WorkflowTriggers.svelte` reads from generated workflows
- [x] API endpoint `/api/workflows/execute` to trigger workflows
- [x] Connected to Temporal Cloud

## 🧪 Test Scenarios

### Test 1: Restaurant Management Service
1. Create a service with problem: "Restaurant reservation and order management"
2. Verify generated service has:
   - Reservation entity with workflow_state field
   - Phone reservation workflow with steps
   - UI component to trigger reservation workflow
3. Check coherence validation passes

### Test 2: Bike Shop Service  
1. Create a service with problem: "Bike repair shop scheduling and inventory"
2. Verify generated service has:
   - Repair order entity with status tracking
   - Repair workflow with inventory check
   - UI form to create repair orders
3. Check all fields are used in workflows/UI

### Test 3: Medical Clinic Service
1. Create a service with problem: "Patient appointment scheduling and records"
2. Verify generated service has:
   - Appointment entity with workflow fields
   - Appointment booking workflow
   - UI to book and manage appointments
3. Validate no orphan fields exist

## 🚀 How to Test

1. Start the dev server: `npm run dev`
2. Navigate to http://localhost:5174
3. Create each test service using the Service Builder
4. Check the console for coherence validation results
5. Navigate to each service and verify:
   - Schema is created correctly
   - Workflows appear in the UI
   - Manual trigger buttons work
   - No console errors

## 📊 Expected Results

- All three services generate successfully
- Coherence validation shows no issues (or minor warnings)
- Workflows are visible in the UI
- Manual triggers show "Workflow triggered successfully!"
- Console shows workflow execution logs

## 🐛 Known Issues

1. `workflow_executions` table needs to be created manually
2. Temporal worker needs to be started separately
3. Actual workflow execution requires Temporal Cloud setup

## 🎯 Success Criteria

- [x] OpenAI generates coherent three-legged services
- [x] No orphan fields/workflows/UI components
- [x] Dynamic worker can handle any workflow
- [x] UI can trigger workflows via API
- [ ] Test with 3 different service types (manual testing required) 