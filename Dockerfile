FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install
RUN pnpm --filter @workspace/api-server run build
EXPOSE 3001
CMD ["node", "artifacts/api-server/dist/index.cjs"]
