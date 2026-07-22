# ── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Copy lockfile + manifest together for a reproducible install
COPY client/package.json client/package-lock.json ./
RUN npm ci

# Copy source and build
COPY client/ ./
# Accept backend URL at build time so Vite bakes it into the JS bundle.
# Passed via --build-arg VITE_API_BASE_URL=<backend-cloud-run-url> in CI.
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ── Production stage ─────────────────────────────────────────────────────────
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html

# Configure nginx: port 8080 (Cloud Run) + SPA routing fallback
RUN printf 'server {\nlisten 8080;\nroot /usr/share/nginx/html;\nindex index.html;\nlocation / {\ntry_files $uri $uri/ /index.html;\n}\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
