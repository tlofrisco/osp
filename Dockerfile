# Use Alpine for better native module compatibility
FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Set working directory
WORKDIR /app

# Copy workers package files first (for dependencies)
COPY workers/package*.json ./workers/

# Install dependencies and force clean install of native modules
WORKDIR /app/workers
RUN npm ci --production && \
    rm -rf node_modules/@temporalio/core-bridge && \
    npm install @temporalio/core-bridge --force

# Copy all source files
WORKDIR /app
COPY workers/ ./workers/
COPY workflows/ ./workflows/

# Copy root package.json for the start script
COPY package.json ./

# Start the unified worker directly
CMD ["node", "workers/unified-worker.js"] 