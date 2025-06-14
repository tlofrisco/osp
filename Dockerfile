# Dockerfile with added diagnostics
FROM node:20-slim

# Install build dependencies AND networking tools (curl, openssl)
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

# Install ALL dependencies
RUN npm ci

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd -r -s /bin/false temporal
RUN chown -R temporal:temporal /app
USER temporal

# Expose a port if your worker has a health check endpoint
EXPOSE 3000

# TEMPORARY start command for debugging.
# This command simply keeps the container alive so we can open a shell into it.
# It will run for about an hour before exiting.
CMD ["sleep", "3600"]