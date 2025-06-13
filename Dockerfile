# Use specific Node version known to work well with Temporal
FROM node:18-bullseye

# Set working directory
WORKDIR /app

# Copy workers package files and install dependencies
COPY workers/package*.json ./
RUN npm ci --production

# Copy source files
COPY workers/ ./
COPY workflows/ ../workflows/

# Set proper permissions
RUN chmod +x *.js

# Start the unified worker
CMD ["node", "unified-worker.js"] 