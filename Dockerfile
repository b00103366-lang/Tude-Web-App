FROM node:20-alpine

# Native build tools needed by some npm packages
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Pin exact pnpm version to match local (lockfile created with 10.32.1)
RUN npm install -g pnpm@10.32.1

# Copy workspace config files explicitly (better cache + guarantees lockfile is present)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc tsconfig.base.json tsconfig.json ./

# Copy workspace packages needed by the API server
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Build only the API server
RUN pnpm --filter @workspace/api-server run build

EXPOSE 3001
CMD ["node", "artifacts/api-server/dist/index.cjs"]
