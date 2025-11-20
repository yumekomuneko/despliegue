# -----------------------------
# STAGE 1: Builder
# -----------------------------
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package.json + lock y instalar deps de build
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar el código y construir
COPY . .
RUN npm run build

# -----------------------------
# STAGE 2: Production
# -----------------------------
FROM node:18-alpine AS runner

WORKDIR /app

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps

# Copiar solo el build ya generado
COPY --from=builder /app/dist ./dist

# Exponer puerto (no obligatorio, pero informativo)
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/main.js"]
