# Simple production Dockerfile for Google Cloud Run
FROM node:20-alpine

# Install dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ gcc

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci
RUN npm install tsx

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]