FROM node:20-alpine

WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm ci

# Copy rest of application code
COPY . .

# Expose API port
EXPOSE 4000

# Start server
CMD ["node", "src/index.js"]
