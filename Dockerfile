FROM node:20-alpine

# Native build tools needed by some npm packages
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Pin exact pnpm version to match local (lockfile created with 10.32.1)
RUN npm install -g pnpm@10.32.1

# Copy entire repo (node_modules, dist, local-uploads excluded via .dockerignore)
COPY . .

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Build only the API server
RUN pnpm --filter @workspace/api-server run build

EXPOSE 3001
CMD ["node", "artifacts/api-server/dist/index.cjs"]
