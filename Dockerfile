# ================================
# Stage 1 — Build frontend
# ================================
FROM node:20-alpine AS builder

# Prevent interactive npm behavior
ENV CI=true

WORKDIR /app

# Copy dependency manifests first (better caching)
COPY package.json package-lock.json* ./

# Install dependencies
# - uses npm ci if lockfile exists
# - falls back to npm install if not
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

# Copy rest of source
COPY . .

# Build production assets
RUN npm run build


# ================================
# Stage 2 — Production server
# ================================
FROM nginx:alpine

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Ensure proper permissions
RUN chmod -R 755 /usr/share/nginx/html

# Expose Railway port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
