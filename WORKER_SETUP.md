# 🚀 OSP Manifest-Driven Workers

## **Cloud-Only Architecture** ☁️

This worker system is designed for **production cloud deployment only**. No local runtime required!

### **Deployment Options:**
- **Railway** (Recommended) - Simple, fast deployment
- **Fly.io** - Global edge deployment
- **Any Node.js PaaS** - Heroku, Render, etc.

## **Quick Start**

### 1. Deploy to Railway
```bash
cd workers
railway up
```

### 2. Set Environment Variables
In Railway dashboard or CLI:
```bash
TEMPORAL_CLOUD_NAMESPACE=your-namespace
TEMPORAL_CLOUD_ADDRESS=your-endpoint:7233
TEMPORAL_API_KEY=your-api-key
PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NODE_ENV=production
```

### 3. Monitor Deployment
```bash
railway logs
```

See `workers/DEPLOY.md` for detailed deployment instructions.

## **Expected Output**
When working correctly, you should see:
```
🍽️  Starting Restaurant Management Worker...
📋 Using manifest: /path/to/manifests/a_restaurant_reservation_syste_1749301938153.json

🔄 Loading service manifest: ../manifests/a_restaurant_reservation_syste_1749301938153.json
🔁 Spawning worker for service schema: a_restaurant_reservation_syste_1749301938153
📌 Task Queue: a_restaurant_reservation_syste_1749301938153-tasks
⚙️ Workflows to load: createReservation,cancelReservation,processPayment
🌐 Connecting to Temporal Cloud...
✅ Connected to Temporal Cloud
📦 Loading activities from: ./workers/generated/restaurant/activities.js
✅ Loaded 5 activities: insertReservation,updateReservationStatus,sendNotification,chargeCustomer,logTransaction
🔄 Loading workflows...
  📥 Loading workflow: createReservation from ./workflows/restaurant/createReservation.js
  ✅ Loaded workflow: createReservation
  📥 Loading workflow: cancelReservation from ./workflows/restaurant/cancelReservation.js
  ✅ Loaded workflow: cancelReservation
  📥 Loading workflow: processPayment from ./workflows/restaurant/processPayment.js
  ✅ Loaded workflow: processPayment
⚙️ Creating Temporal worker...
🚀 Worker ready for service: a_restaurant_reservation_syste_1749301938153
📋 Registered workflows: createReservation,cancelReservation,processPayment
⚙️ Registered activities: insertReservation,updateReservationStatus,sendNotification,chargeCustomer,logTransaction
🔥 Worker is now listening on task queue: a_restaurant_reservation_syste_1749301938153-tasks
```

## **Testing Workflow Execution**

1. **Start the Worker** (in one terminal)
2. **Submit a Form** via the OSP UI
3. **Check Temporal Cloud** for workflow executions
4. **Monitor Worker Logs** for activity execution

## **Adding New Services**

### 1. Create Activities File
```javascript
// workers/generated/[service]/activities.js
export async function myActivity(input) {
  // Implementation
}

export default { myActivity };
```

### 2. Create Workflow Files
```javascript
// workflows/[service]/myWorkflow.js
import { proxyActivities } from '@temporalio/workflow';

const { myActivity } = proxyActivities({
  startToCloseTimeout: '2 minutes'
});

export async function myWorkflow(input) {
  return await myActivity(input);
}

export default myWorkflow;
```

### 3. Create Service Manifest
```json
{
  "service_schema": "my_service_1234567890",
  "activities_path": "./workers/generated/myservice/activities.js",
  "workflows": [{
    "name": "myWorkflow",
    "task_queue": "my_service_1234567890-tasks",
    "workflows_path": "./workflows/myservice/myWorkflow.js",
    "activities": ["myActivity"]
  }]
}
```

### 4. Launch Worker
```bash
node --loader ts-node/esm workers/generator/createWorkerFromManifest.ts manifests/my_service_1234567890.json
```

## **Architecture Benefits**

✅ **One Worker Per Service** - Clean isolation and resource management  
✅ **Shared Activity Pool** - Efficient reuse across workflows  
✅ **Dynamic Loading** - No code changes needed for new services  
✅ **Manifest-Driven** - Consistent with OSP's schema and UI generation  
✅ **Production Ready** - Proper Temporal SDK integration  
✅ **Scalable** - Works with any service type (healthcare, telecom, finance, etc.)  

## **Next Steps**

1. **Test Current Restaurant Service** ✓
2. **Deploy to Railway/Fly.io** 
3. **Generate Manifests Automatically** from service schemas
4. **Add Health Monitoring** and auto-restart capabilities
5. **Scale to Multiple Services** as needed 