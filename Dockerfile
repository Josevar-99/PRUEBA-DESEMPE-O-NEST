# ==============================================================================
# DOCKERFILE MULTI-STAGE PARA NESTJS
# ==============================================================================

# 1. Etapa de dependencias y compilación
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluye devDependencies para compilar)
RUN npm install

# Copiar código fuente y compilar
COPY . .
RUN npm run build

# 2. Etapa de ejecución en producción
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar archivos de dependencias e instalar solo las de producción
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el código compilado desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Puerto donde escucha la aplicación
EXPOSE 3000

# Comando de inicio del servidor
CMD ["node", "dist/main"]

