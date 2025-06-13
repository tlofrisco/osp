# Use Debian-based image to support Temporal native modules
FROM node:20-bullseye

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy workers package files first (for dependencies)
COPY workers/package*.json ./workers/

# Install dependencies from workers directory and rebuild native modules
WORKDIR /app/workers
RUN npm ci --production && npm rebuild

# Copy all source files
WORKDIR /app
COPY workers/ ./workers/
COPY workflows/ ./workflows/

# Copy root package.json for the start script
COPY package.json ./

# Start the unified worker directly (bypass npm prepare script)
CMD ["node", "workers/unified-worker.js"] 