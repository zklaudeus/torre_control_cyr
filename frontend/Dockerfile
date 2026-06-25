# Etapa 1: Construcción (Build stage)
FROM node:22-alpine AS build
WORKDIR /app

# Copiar e instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el resto del código y construir
COPY . .
# Podemos pasar variables de entorno al momento del build si es necesario
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: Servidor Web (Production stage)
FROM nginx:1.28-alpine

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los estáticos generados por React/Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
