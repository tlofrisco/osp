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

# Copy package files
COPY package*.json ./

# Install dependencies using the lockfile for consistency
RUN npm ci

# Copy all application source code
COPY . .

# ✅ ADD THIS LINE to copy the downloaded certificates into the image
COPY ./certs /app/certs

# Create and switch to a non-root user for better security
RUN useradd -r -s /bin/false temporal
RUN chown -R temporal:temporal /app
USER temporal

# Expose the health check port
EXPOSE 3000

# Start the worker using the npm script
CMD ["npm", "start"]