# Use Debian-based image to support Temporal native modules
FROM node:20-bullseye

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY workers/package*.json ./workers/

# Install dependencies
WORKDIR /app/workers
RUN npm ci --production || npm install --production

# Copy all source files
WORKDIR /app
COPY workers/ ./workers/
COPY workflows/ ./workflows/

# Set working directory to workers
WORKDIR /app/workers

# Make scripts executable
RUN chmod +x *.js || true

# Start the unified worker that handles all service types
CMD ["node", "unified-worker.js"] 