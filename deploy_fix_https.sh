#!/bin/bash
# =============================================================
# Script de despliegue VPS - Fix Mixed Content HTTPS
# Ejecutar en el VPS como root: bash deploy_fix_https.sh eisesa.cloud
# =============================================================

set -e
DOMAIN=${1:-"eisesa.cloud"}

echo "==> Dominio: $DOMAIN"

echo "==> Buscando directorio del proyecto..."
PROJECT_DIR=$(find /root /home /opt /srv -maxdepth 4 -name "docker-compose.yml" 2>/dev/null | head -1 | xargs dirname 2>/dev/null || echo "")

if [ -z "$PROJECT_DIR" ]; then
  echo "ERROR: No se encontró docker-compose.yml."
  echo "Uso: PROJECT_DIR=/ruta/proyecto bash deploy_fix_https.sh $DOMAIN"
  exit 1
fi

echo "==> Proyecto en: $PROJECT_DIR"

# ---------------------------------------------------------------
# 1. Actualizar client.ts (fix Mixed Content)
# ---------------------------------------------------------------
TARGET_FILE="$PROJECT_DIR/frontend/src/api/client.ts"
mkdir -p "$(dirname "$TARGET_FILE")"

echo "==> Escribiendo client.ts corregido..."
cat > "$TARGET_FILE" << 'TSEOF'
import axios from 'axios';

const resolveBaseUrl = () => {
  if (import.meta.env.DEV) {
    const url = (import.meta.env.VITE_API_URL?.trim() || `${window.location.protocol}//${window.location.hostname}:8000`).replace(/\/+$/, '');
    return url;
  }
  return '';
};

export const API_BASE_URL = resolveBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('torreControlToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));
TSEOF

echo "    client.ts OK."

# ---------------------------------------------------------------
# 2. Configurar nginx del sistema con HTTPS (Let's Encrypt)
# ---------------------------------------------------------------
NGINX_CONF="/etc/nginx/sites-available/torre-control"

if command -v nginx &> /dev/null; then
  echo "==> Configurando nginx del sistema para $DOMAIN..."

  # Instalar Certbot si no existe
  if ! command -v certbot &> /dev/null; then
    echo "    Instalando certbot..."
    apt-get update -qq && apt-get install -y certbot python3-certbot-nginx -qq
  fi

  # Obtener certificado SSL si no existe
  if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "    Obteniendo certificado SSL para $DOMAIN..."
    certbot certonly --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email
  else
    echo "    Certificado SSL ya existe para $DOMAIN."
  fi

  cat > "$NGINX_CONF" << NGINXEOF
# Redirigir HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# Servidor HTTPS principal
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name $DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 50m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
NGINXEOF

  # Activar sitio si no está activo
  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/torre-control 2>/dev/null || true

  nginx -t && systemctl reload nginx
  echo "    nginx recargado OK."
else
  echo "    nginx no encontrado en el sistema - omitiendo config nginx."
fi

# ---------------------------------------------------------------
# 3. Rebuild y restart del contenedor frontend
# ---------------------------------------------------------------
cd "$PROJECT_DIR"

echo "==> Rebuilding frontend Docker (sin caché)..."
docker compose build --no-cache frontend

echo "==> Reiniciando contenedor frontend..."
docker compose up -d frontend

echo ""
echo "✅ Deploy completado."
echo "   Abre https://$DOMAIN y verifica que no haya errores Mixed Content."
