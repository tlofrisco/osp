#!/usr/bin/env node

import express from 'express';
import dotenv from 'dotenv';

// --- Configuration ---
dotenv.config();
const PORT = process.env.PORT || 3000;

// --- Main Run ---
async function runDiagnostics() {
  console.log('🚀 Starting OSP Worker in DIAGNOSTIC MODE...');

  // Health check server
  const app = express();
  app.get('/health', (_, res) => {
    console.log('🏥 Health check requested... Responding OK.');
    res.status(200).json({
      status: 'healthy',
      mode: 'diagnostic',
      timestamp: new Date().toISOString(),
    });
  });

  app.listen(PORT, () => {
    console.log(`🏥 Health check server listening on port ${PORT}`);
    console.log('✅ Container is now running and will stay alive.');
    console.log('ℹ️ You can now use "railway ssh" to connect.');
  });

  // Keep the process alive indefinitely
  await new Promise(() => {});
}

// Start the application
runDiagnostics().catch((err) => {
  console.error('❌ Failed to start diagnostic server:', err);
  process.exit(1);
});