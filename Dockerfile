# Final Dockerfile
FROM node:20-slim

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first (for better cache efficiency)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all application source code
COPY . .

# ✅ Copy certs directory before changing user
COPY ./certs /app/certs

# Create and use a non-root user for security
RUN useradd -r -s /bin/false temporal && \
    chown -R temporal:temporal /app
USER temporal

# Expose the health check port
EXPOSE 3000

# Start the worker
CMD ["npm", "start"]
