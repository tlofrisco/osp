# 🏗️ Temporal Cloud + Railway Integration Architecture
## OSP (One Service Platform) Complete Technical Documentation

**Document Version:** 1.0  
**Date:** December 14, 2024  
**Status:** ❌ Non-Functional - Worker Connection Issues  
**Purpose:** Complete technical reference for troubleshooting and Temporal support  

---

## 📋 **Executive Summary**

The OSP platform uses **Temporal Cloud** for workflow orchestration and **Railway** for worker deployment. While workflow execution from the Svelte frontend works successfully, the dedicated Railway worker has never achieved stable connection to Temporal Cloud.

### **Current Status:**
- ✅ **Frontend Workflows**: Successfully executing from Svelte app
- ❌ **Railway Worker**: Never successfully connected to Temporal Cloud
- ⚠️ **Architecture**: Functional design with connectivity issues

---

## 🏛️ **Overall Architecture**

### **OSP Service Model:**
```
┌─────────────────────────────────────────────────────────┐
│                    OSP Platform                         │
├─────────────────────────────────────────────────────────┤
│  Frontend (Svelte) ──► Temporal Cloud ──► Database      │
│         │                     ▲                         │
│         │              [BROKEN CONNECTION]              │
│         │                     │                         │
│  Railway Worker ──────────────┘                         │
│   (Never Connected)                                     │
└─────────────────────────────────────────────────────────┘
```

### **Intended Workflow:**
1. **Frontend**: User creates service via Svelte UI
2. **Temporal**: Workflow orchestrates service creation
3. **Worker**: Railway worker processes activities (DB writes, etc.)
4. **Database**: Supabase stores service data

### **Current Reality:**
1. **Frontend**: ✅ Successfully triggers workflows
2. **Temporal**: ✅ Workflows execute with fallback activities
3. **Worker**: ❌ Railway worker never connects
4. **Database**: ✅ Frontend activities work directly

---

## 🌐 **Temporal Cloud Configuration**

### **Account Details:**
- **Account ID:** `v5egj`
- **Namespace:** `quickstart-osp.v5egj`
- **Region:** `ap-south-1` (AWS Asia Pacific - Mumbai)
- **Endpoint:** `ap-south-1.aws.api.temporal.io:7233`
- **Alternative Endpoint:** `quickstart-osp.v5egj.tmprl.cloud:7233` (also tested)

### **Authentication Method:**
- **Type:** API Key Authentication (SDK v1.10.0+)
- **Auth Mode:** Bearer Token
- **TLS:** Required
- **Certificates:** CA certificate for TLS verification

### **Worker Configuration:**
- **Worker Strategy:** **Single Worker for ALL OSP Services**
- **Task Queue:** `osp-queue` (unified queue for all services)
- **Worker Identity:** Auto-generated (format: `worker-id@container-hash`)
- **Namespace Strategy:** Single namespace with service prefixing

---

## 🚂 **Railway Configuration**

### **Project Details:**
- **Project ID:** `f8c9b9fc-6faf-411c-9133-7724dc33113c`
- **Environment ID:** `9467ba9c-323f-4429-b535-e6ca7eddb76f`
- **Service Name:** `osp-unified-worker`
- **Deployment Strategy:** Dockerfile-based container deployment

### **Container Configuration:**
```dockerfile
# Final Dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
COPY ./certs /app/certs        # ← Certificate deployment
RUN useradd -r -s /bin/false temporal
USER temporal                  # ← Non-root execution
EXPOSE 3000
CMD ["npm", "start"]           # ← Runs simple-temporal-worker.js
```

### **Health Check Configuration:**
- **Endpoint:** `/health`
- **Timeout:** 300 seconds
- **Port:** 3000 (configurable via PORT env var)
- **Restart Policy:** ON_FAILURE with 3 max retries

---

## 🔐 **Certificate Configuration**

### **Certificate Strategy:**
- **Authentication:** API Key (primary) + TLS Certificates (verification)
- **Certificate Purpose:** TLS connection validation, NOT authentication
- **Files Required:**
  - `ca.pem` (Root certificate - 3,175 bytes)
  - `ca-intermediate.pem` (Intermediate certificate - 3,175 bytes)

### **Certificate Deployment:**
- **Local Path:** `./certs/ca.pem`, `./certs/ca-intermediate.pem`
- **Container Path:** `/app/certs/ca.pem`, `/app/certs/ca-intermediate.pem`
- **Loading Logic:**
  ```javascript
  const caCertPath = fs.existsSync('/app/certs/ca.pem') 
    ? '/app/certs/ca.pem'         // Docker environment
    : './certs/ca.pem';           // Local environment
  ```

### **TLS Configuration:**
```javascript
tls: {
  serverRootCACertificate: caCert,
  serverNameOverride: sniHost,    // Derived from TEMPORAL_ADDRESS
}
```

---

## 🔧 **Environment Variables**

### **Railway Worker Variables (Current Standard):**
```env
# Temporal Configuration
TEMPORAL_ADDRESS=ap-south-1.aws.api.temporal.io:7233
TEMPORAL_NAMESPACE=quickstart-osp.v5egj
TEMPORAL_API_KEY=eyJhbGciOiJFUzI1NiIsICJraWQiOiJXdnR3YUEifQ.eyJhY2NvdW50X2lkIjoidjVlZ2oiLCAiYXVkIjpbInRlbXBvcmFsLmlvIl0sICJleHAiOjE3ODE0MzkwNDUsICJpc3MiOiJ0ZW1wb3JhbC5pbyIsICJqdGkiOiJBY1Fyd055UzBSUXR2UDRqM0tHNjA2QXBoU1FITXBlOCIsICJrZXlfaWQiOiJBY1Fyd055UzBSUXR2UDRqM0tHNjA2QXBoU1FITXBlOCIsICJzdWIiOiIzMGQ3NDBiYTlkZmQ0ZGNjYjI0NDhjNDA4ZDA0ODk4ZCJ9.KzbSuopMkr9iljD2sFKlGGtsB4UcWjwilf31Ni7AUND2rHp7wYftWdwXBMJndVXdawbFHi2mZ_NucvnzfEu3mw

# Application Configuration  
PORT=8080

# Database Configuration (for activities)
PUBLIC_SUPABASE_URL=https://gqhrgbhmunksvwndwwzr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxaHJnYmhtdW5rc3Z3bmR3d3pyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTE0Njc3NCwiZXhwIjoyMDU2NzIyNzc0fQ.DoTbcQacpAJ_2dQvEElhTOBoBNOSZWVzh515gK3uwq0
```

### **Frontend Workflow Variables (Different Set):**
```env
# Temporal Configuration (Legacy naming)
TEMPORAL_CLOUD_ENDPOINT=ap-south-1.aws.api.temporal.io:7233
TEMPORAL_CLOUD_NAMESPACE=quickstart-osp.v5egj
TEMPORAL_API_KEY=eyJhbGciOiJFUzI1NiIsICJraWQiOiJXdnR3YUEifQ...

# Note: Frontend uses different variable names but same values
```

### **Variable Naming Strategy:**
- **Worker (Railway):** `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE`, `TEMPORAL_API_KEY`
- **Frontend (Svelte):** `TEMPORAL_CLOUD_ENDPOINT`, `TEMPORAL_CLOUD_NAMESPACE`, `TEMPORAL_API_KEY`
- **Reason:** Historical evolution - worker uses standardized names, frontend uses legacy names

---

## 📁 **Code Architecture**

### **Worker Entry Point** (`simple-temporal-worker.js`):
```javascript
#!/usr/bin/env node
import { Worker } from '@temporalio/worker';
import { Connection } from '@temporalio/client';

// Environment validation
const requiredVars = [
  'TEMPORAL_ADDRESS',      // ← Worker-specific variable names
  'TEMPORAL_NAMESPACE', 
  'TEMPORAL_API_KEY',
];

// Connection establishment
const connection = await Connection.connect({
  address: process.env.TEMPORAL_ADDRESS,
  apiKey: process.env.TEMPORAL_API_KEY,
  connectTimeout: '30s',
  tls: {
    serverRootCACertificate: caCert,
    serverNameOverride: sniHost,  // ← Derived from TEMPORAL_ADDRESS
  },
});

// Worker creation
const worker = await Worker.create({
  connection,
  namespace: process.env.TEMPORAL_NAMESPACE,
  taskQueue: 'osp-queue',      // ← Single queue for all OSP services
  workflowsPath: './workflows.js',
  activities,
});
```

### **Frontend Client** (`src/lib/temporal/client.ts`):
```javascript
import { 
  TEMPORAL_CLOUD_ENDPOINT,     // ← Frontend-specific variable names
  TEMPORAL_CLOUD_NAMESPACE, 
  TEMPORAL_API_KEY
} from '$env/static/private';

// Connection for workflow execution
const connection = await Connection.connect({
  address: TEMPORAL_CLOUD_ENDPOINT,
  tls: true,
  apiKey: TEMPORAL_API_KEY,
});

const client = new Client({
  connection,
  namespace: TEMPORAL_CLOUD_NAMESPACE,
});
```

**This document represents the complete technical state as of December 14, 2024. All configuration appears correct, but the core connection between Railway worker and Temporal Cloud remains non-functional despite multiple architectural approaches and debugging attempts.** 