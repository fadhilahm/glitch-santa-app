# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code and build files
COPY server.ts ./
COPY src/ ./src/
COPY index.html ./

# Build the application (frontend goes to public/dist, backend to dist/)
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built backend from builder stage
COPY --from=builder /app/dist ./dist

# Copy built frontend from builder stage (public/dist contains the Vite build)
COPY --from=builder /app/public ./public

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
