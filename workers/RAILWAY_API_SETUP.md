# Railway API Setup Guide

## Overview
This guide explains how to set up Railway API integration for automatic worker deployment in OSP.

## Prerequisites

1. A Railway account with an active project
2. Railway API token
3. GitHub repository connected to Railway

## Required Environment Variables

Add these to your `.env` file:

```bash
# Railway API Configuration
RAILWAY_API_TOKEN=your-railway-api-token
RAILWAY_PROJECT_ID=your-railway-project-id
RAILWAY_ENVIRONMENT_ID=production

# GitHub Repository Configuration
GITHUB_REPO=your-github-username/osp
GITHUB_BRANCH=main
```

## Getting Railway Credentials

### 1. Railway API Token
1. Go to [Railway Dashboard](https://railway.app/account/tokens)
2. Click "Create Token"
3. Give it a descriptive name (e.g., "OSP Worker Automation")
4. Copy the token and save it as `RAILWAY_API_TOKEN`

### 2. Project ID
1. Open your Railway project
2. Go to Settings
3. Copy the Project ID
4. Save it as `RAILWAY_PROJECT_ID`

### 3. Environment ID
1. In your Railway project, click on the environment (e.g., "production")
2. The URL will contain the environment ID
3. Or use the Railway CLI: `railway environment`
4. Save it as `RAILWAY_ENVIRONMENT_ID`

## Database Migration

Run this SQL migration to add Railway service tracking:

```sql
-- Add railway_service_id column to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS railway_service_id TEXT;

-- Add railway_service_id to worker_registry table
ALTER TABLE worker_registry
ADD COLUMN IF NOT EXISTS railway_service_id TEXT;
```

## Testing the Integration

1. Create a new service in OSP
2. Check the logs for Railway API calls
3. Verify the service appears in Railway dashboard
4. Check that environment variables are set correctly

## Troubleshooting

### "Missing required environment variable"
- Ensure all Railway environment variables are set in `.env`
- Check that `.env` is loaded correctly

### "Failed to create Railway service"
- Verify your API token has correct permissions
- Check that the project ID and environment ID are correct
- Ensure your GitHub repo is connected to Railway

### "Service already exists"
- The system will automatically fetch the existing service ID
- No action needed

## Architecture Flow

```
Service Creation in OSP
    ↓
deployWorkerForService()
    ↓
queueWorkerBuild()
    ↓
Railway API: Create Service
    ↓
Railway API: Set Environment Variables
    ↓
Railway API: Deploy Service
    ↓
Worker Running on Railway
```

## Security Notes

- Never commit `.env` files with real tokens
- Use Railway's environment variables for production
- Rotate API tokens regularly
- Monitor Railway API usage for anomalies 