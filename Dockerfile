# -----------------------------------
# 1. Build stage
# -----------------------------------
FROM node:18 as builder

# Crear directorio de app
WORKDIR /app

# Copiar package.json e instalar deps
COPY package*.json ./

RUN npm install

# Copiar todo el proyecto
COPY . .

# Construir NestJS
RUN npm run build


# -----------------------------------
# 2. Production stage
# -----------------------------------
FROM node:18-alpine

WORKDIR /app

# Copiar solo lo necesario desde el builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Puerto expuesto (Render detecta este puerto)
EXPOSE 3000

# Comando para iniciar NestJS
CMD ["node", "dist/main.js"]
