# ARCHITECTURAL TRACE: Infraestructura — Contenedorización (Regla R5)

# ---- Etapa de build ----
FROM node:20.17.0-alpine3.20 AS builder
WORKDIR /build
COPY package.json ./
RUN npm install
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ---- Etapa de runtime ----
FROM nginx:1.27.1-alpine3.20
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx \
    && touch /var/run/nginx.pid && chown appuser:appgroup /var/run/nginx.pid
COPY --from=builder /build/dist /usr/share/nginx/html
USER appuser
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
