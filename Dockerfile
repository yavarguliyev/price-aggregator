# Base stage for dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build stage
FROM base AS build
COPY . .
RUN npm run build
RUN npm run prisma:generate
RUN npm prune --production

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy necessary files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/.env ./.env

# Runtime environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create start script with multiple RUN commands
RUN echo '#!/bin/sh' > /app/start.sh
RUN echo 'npx prisma migrate deploy' >> /app/start.sh
RUN echo 'node dist/src/main.js' >> /app/start.sh
RUN chmod +x /app/start.sh

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["/app/start.sh"] 