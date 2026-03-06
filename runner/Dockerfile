# ─── ZIVO-AI Remote Runner ────────────────────────────────────────────────────
# Runs quality jobs (npm install / lint / tsc / build) for project workspaces.
# Security: runs as non-root user "runner" with no access to app secrets.

FROM node:20-alpine

# Install build tools needed for some npm packages (node-gyp etc.)
RUN apk add --no-cache python3 make g++ git

# Create unprivileged user
RUN addgroup -S runner && adduser -S -G runner runner

WORKDIR /app

# Copy package manifests and install production deps
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

# Drop to non-root user
USER runner

# Expose no ports — this is a background worker
CMD ["node", "dist/index.js"]
