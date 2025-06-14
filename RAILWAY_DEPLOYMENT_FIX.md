# 🚀 Railway Worker Deployment Fix Guide

## Problem Analysis

Your `osp-worker` is failing because it's trying to run `queueWorkerBuild.js` which is designed for **creating new Railway services**, not running the actual worker. The `RAILWAY_TOKEN` error occurs because that file imports `railwayService.js` which is meant for programmatic service creation.

## ✅ Solution: Deploy the Unified Worker

### Step 1: Understanding the Architecture

You have **two different types of files**:
1. **Service Creation Tools** (require RAILWAY_TOKEN)
   - `queueWorkerBuild.js` - Creates new Railway services
   - `railwayService.js` - Railway API wrapper
   - These are for automating service deployment, NOT for running workers

2. **Worker Files** (require Temporal/Supabase vars)
   - `unified-worker.js` - The actual Temporal worker ✅ USE THIS
   - `launch-worker.js` - Manifest-based worker launcher
   - These run your business logic and workflows

### Step 2: Correct Environment Variables for Worker

Your unified worker needs these variables (set in Railway dashboard):

```bash
# Required for unified-worker.js
TEMPORAL_CLOUD_ENDPOINT=your-namespace.tmprl.cloud:7233
TEMPORAL_API_KEY=your-temporal-api-key
TEMPORAL_CLOUD_NAMESPACE=your-namespace
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**DO NOT SET** these for the worker (they're only for service creation):
- `RAILWAY_TOKEN` - Not needed for worker execution
- `RAILWAY_PROJECT_ID` - Not needed for worker execution  
- `RAILWAY_ENVIRONMENT_ID` - Not needed for worker execution

### Step 3: Fix Railway Configuration

**Root Configuration is Already Correct:**
- ✅ `package.json` - `"start": "node workers/unified-worker.js"`
- ✅ `railway.json` - Uses `npm start`
- ✅ `Dockerfile` - Uses `unified-worker.js`

**Problem:** Your Railway service might be using the `/workers` directory config instead of root.

### Step 4: Railway Dashboard Steps

1. **Go to Railway Dashboard** → Your Project → `osp-worker` service

2. **Check Build Settings:**
   - Root Directory: `/` (NOT `/workers`)
   - Build Command: (leave default)
   - Start Command: `npm start`

3. **Set Environment Variables** (Variables tab):
   ```
   TEMPORAL_CLOUD_ENDPOINT=your-value
   TEMPORAL_API_KEY=your-value  
   TEMPORAL_CLOUD_NAMESPACE=your-value
   PUBLIC_SUPABASE_URL=your-value
   SUPABASE_SERVICE_ROLE_KEY=your-value
   ```

4. **Remove these variables** if they exist:
   - `RAILWAY_TOKEN`
   - `RAILWAY_PROJECT_ID`
   - `RAILWAY_ENVIRONMENT_ID`

### Step 5: Deploy

1. **Trigger Redeploy** in Railway dashboard
2. **Check Logs** - should see: `🚀 Starting Unified OSP Temporal Worker...`
3. **Verify Connection** - should see Temporal connection success

## 🎯 Expected Result

**Success Logs:**
```
🚀 Starting Unified OSP Temporal Worker...
🔧 Configuring Unified Temporal Worker...
📡 Endpoint: your-namespace.tmprl.cloud:7233
🏢 Namespace: your-namespace
📋 Unified Task Queue: osp-unified-queue
✅ Unified Temporal Worker configured successfully!
🏃 Starting unified worker execution...
📡 Listening for workflows from ALL service types...
```

## 🛠️ Alternative: Create Fresh Service

If the current service is too confused, create a fresh one:

```bash
# Option A: Use Railway CLI
railway service create osp-unified-worker
railway up --service osp-unified-worker

# Option B: Use Dashboard
1. Create new service
2. Connect to your GitHub repo
3. Set root directory to `/`
4. Add environment variables (Temporal + Supabase only)
5. Deploy
```

## 🔍 Debugging Steps

If it still fails:

1. **Check Railway Service Logs** for exact error
2. **Verify Environment Variables** in Railway dashboard
3. **Test Temporal Connection** with your credentials
4. **Check Supabase Access** with your service role key

## ❓ Key Questions Answered

- **Worker Name**: `osp-worker` is fine, or create `osp-unified-worker`
- **Token Issue**: Don't use `RAILWAY_TOKEN` for worker execution
- **Fresh Start**: Recommended if current service is misconfigured
- **Worker Purpose**: Unified worker handles ALL service types (restaurant, etc.)

## 🚀 Success Criteria

When working correctly:
- ✅ Worker starts without environment variable errors
- ✅ Connects to Temporal Cloud successfully  
- ✅ Connects to Supabase successfully
- ✅ Listens on `osp-unified-queue` for workflows
- ✅ Can handle any service type (restaurant, hotel, etc.)
- ✅ No Railway API calls or service creation attempts 