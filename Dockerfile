# Clean Temporal Worker Dockerfile - Based on Railway Best Practices
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN useradd -r -s /bin/false temporal
USER temporal

# Health check endpoint
EXPOSE 3000

# Start the worker
CMD ["npm", "start"] 