# Clean Temporal Worker Dockerfile - Based on Railway Best Practices
FROM node:20-slim

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for native module compilation)
RUN npm ci

# Copy application code
COPY . .

# Create non-root user
RUN useradd -r -s /bin/false temporal
RUN chown -R temporal:temporal /app
USER temporal

# Health check endpoint
EXPOSE 3000

# Start the worker
CMD ["npm", "start"]