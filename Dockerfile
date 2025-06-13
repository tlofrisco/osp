# Use specific Node version known to work well with Temporal
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy workers package files and install dependencies
COPY workers/package*.json ./workers/
WORKDIR /app/workers
RUN npm ci --production

# Copy source files to correct locations
WORKDIR /app
COPY workers/ ./workers/
COPY workflows/ ./workflows/

# Set proper permissions
RUN chmod +x workers/*.js

# Start the unified worker (railway.json expects workers/unified-worker.js)
CMD ["node", "workers/unified-worker.js"] 