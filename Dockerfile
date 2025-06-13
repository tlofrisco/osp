# Use Debian-based image to support Temporal native modules
FROM node:20-bullseye

# Set working directory
WORKDIR /app

# Copy root package files first (for better caching)
COPY package*.json ./

# Install dependencies from root
RUN npm ci --production || npm install --production

# Copy all source files
COPY workers/ ./workers/
COPY workflows/ ./workflows/
COPY src/ ./src/

# Start the unified worker using root package.json
CMD ["npm", "start"] 