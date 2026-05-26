FROM node:20-alpine
WORKDIR /app

# Copy workspace manifests first (for layer caching)
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci --workspace=apps/web --include-workspace-root

# Copy source
COPY apps/web ./apps/web

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "dev"]
