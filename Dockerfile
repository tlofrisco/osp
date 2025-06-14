# Clean Temporal Worker Dockerfile
FROM node:20-slim

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies using the lockfile
RUN npm ci

# Copy application code
COPY . .

# Create non-root user
RUN useradd -r -s /bin/false temporal
RUN chown -R temporal:temporal /app
USER temporal

# Expose port for health check
EXPOSE 3000

# Start the worker script
CMD ["npm", "start"]