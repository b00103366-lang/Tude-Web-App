FROM node:20-alpine

# Native build tools needed by some npm packages (bcrypt, canvas, etc.)
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Pin pnpm to match lockfileVersion 9.0
RUN npm install -g pnpm@9

# Copy workspace config first (layer cache)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY tsconfig.base.json tsconfig.json ./

# Copy all workspace packages
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Install all deps (no frozen-lockfile in case of minor version drift)
RUN pnpm install --no-frozen-lockfile

# Build only the API server
RUN pnpm --filter @workspace/api-server run build

EXPOSE 3001
CMD ["node", "artifacts/api-server/dist/index.cjs"]
