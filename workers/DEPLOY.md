# 🚀 OSP Worker Deployment Guide

## **Environment Variables Required**

Create these environment variables in your Railway/Fly.io project:

```bash
# Temporal Cloud Configuration
TEMPORAL_CLOUD_NAMESPACE=quickstart-osp.v5egj
TEMPORAL_CLOUD_ADDRESS=ap-south-1.a****emporal.io:7233
TEMPORAL_API_KEY=eyJhbGciOiJFXXXX...

# Supabase Configuration  
PUBLIC_SUPABASE_URL=https://******.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiXXXX...

# Production Environment
NODE_ENV=production
```

## **Railway Deployment**

### 1. Create New Project
```bash
# Install Railway CLI (if needed)
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new osp-restaurant-worker
```

### 2. Set Environment Variables
```bash
railway variables set TEMPORAL_CLOUD_NAMESPACE=your-namespace
railway variables set TEMPORAL_CLOUD_ADDRESS=your-endpoint:7233
railway variables set TEMPORAL_API_KEY=your-api-key
railway variables set PUBLIC_SUPABASE_URL=your-supabase-url
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-key
railway variables set NODE_ENV=production
```

### 3. Deploy
```bash
# From the workers directory
cd workers
railway up
```

### 4. Monitor Logs
```bash
railway logs
```

## **Fly.io Deployment**

### 1. Create fly.toml
```toml
app = "osp-restaurant-worker"
primary_region = "iad"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"

[processes]
  worker = "node launch-worker.js ../manifests/a_restaurant_reservation_syste_1749301938153.json"

[[services]]
  processes = ["worker"]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

### 2. Deploy to Fly.io
```bash
# Install Fly CLI (if needed)
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
fly apps create osp-restaurant-worker

# Set secrets
fly secrets set TEMPORAL_CLOUD_NAMESPACE=your-namespace
fly secrets set TEMPORAL_CLOUD_ADDRESS=your-endpoint:7233
fly secrets set TEMPORAL_API_KEY=your-api-key
fly secrets set PUBLIC_SUPABASE_URL=your-supabase-url
fly secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Deploy
fly deploy
```

## **Verifying Deployment**

### 1. Check Worker Logs
Look for these success messages:
```
🚀 OSP Worker Launcher
📋 Manifest path: ../manifests/a_restaurant_reservation_syste_1749301938153.json
🌍 Environment: production

🔄 Loading service manifest...
🔁 Spawning worker for service schema: a_restaurant_reservation_syste_1749301938153
📌 Task Queue: a_restaurant_reservation_syste_1749301938153-tasks
🌐 Connecting to Temporal Cloud...
✅ Connected to Temporal Cloud
📦 Loading activities...
✅ Loaded 5 activities
🔄 Loading workflows...
✅ Loaded workflow: createReservation
✅ Loaded workflow: cancelReservation
✅ Loaded workflow: processPayment
🚀 Worker ready for service: a_restaurant_reservation_syste_1749301938153
🔥 Worker is now listening on task queue: a_restaurant_reservation_syste_1749301938153-tasks
```

### 2. Test Workflow Execution
1. Submit a form through OSP UI
2. Check Temporal Cloud UI for workflow execution
3. Monitor worker logs for activity execution

## **Scaling to Multiple Services**

### Option 1: Multiple Railway/Fly Apps
Create separate deployments for each service:
```bash
# Healthcare service
railway new osp-healthcare-worker
# Set env vars and deploy

# Telecom service  
railway new osp-telecom-worker
# Set env vars and deploy
```

### Option 2: Process Manager (Advanced)
Use PM2 or similar to run multiple workers:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'restaurant-worker',
      script: 'launch-worker.js',
      args: '../manifests/a_restaurant_reservation_syste_1749301938153.json'
    },
    {
      name: 'healthcare-worker',
      script: 'launch-worker.js',
      args: '../manifests/healthcare_service_1234567890.json'
    }
  ]
};
```

## **Monitoring & Health Checks**

### Railway
- View logs: `railway logs`
- Check metrics: Railway dashboard
- Set up alerts: Railway integrations

### Fly.io
- View logs: `fly logs`
- Check status: `fly status`
- Monitor: `fly dashboard`

## **Troubleshooting**

### Worker Won't Start
1. Check environment variables are set correctly
2. Verify Temporal Cloud credentials
3. Ensure manifest file path is correct
4. Check Supabase connection

### Workflows Not Executing
1. Verify worker is connected to correct task queue
2. Check workflow names match between UI and worker
3. Ensure Temporal namespace is correct
4. Monitor worker logs for errors

### Memory Issues
Add to Railway/Fly config:
```toml
[env]
  NODE_OPTIONS = "--max-old-space-size=2048"
``` 