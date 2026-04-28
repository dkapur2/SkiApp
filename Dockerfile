# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all deps (including devDependencies for tsc)
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Compile TypeScript
COPY backend/ ./backend/
RUN cd backend && npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Production dependencies only
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Compiled JS from builder
COPY --from=builder /app/backend/dist ./backend/dist

# Static frontend
COPY frontend/ ./frontend/

EXPOSE 8000

CMD ["node", "backend/dist/server.js"]
