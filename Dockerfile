# Bunker MCP server. Starts over stdio. No secrets. No required environment variables.
# Base image is the Node.js release the project tests with (.nvmrc and CI: 24.22.1).
# Digest is the multi-arch index for node:24.22.1-bookworm-slim (same as node:24.22.1-slim).
FROM node:24.22.1-bookworm-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c

WORKDIR /app

# The project has zero npm dependencies, so there is no install step.
# Copy only the files the MCP server needs at runtime.
COPY --chown=node:node package.json ./
COPY --chown=node:node mcp/ mcp/
COPY --chown=node:node src/ src/
COPY --chown=node:node LICENSE NOTICE ./

# The official image already has a non-root user named node (uid 1000).
USER node

# Clients must keep stdin open (docker run -i). Logs go to stderr. Protocol goes to stdout.
ENTRYPOINT ["node", "mcp/server.js"]
