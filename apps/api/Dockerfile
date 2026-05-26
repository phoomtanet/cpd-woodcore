FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

# Copy workspace manifests first (for layer caching)
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN npm ci --workspace=apps/api --workspace=packages/db --include-workspace-root

# Copy source
COPY apps/api ./apps/api
COPY packages/db ./packages/db

# Generate Prisma client for linux platform
RUN cd packages/db && npx prisma generate

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["npm", "run", "dev"]
