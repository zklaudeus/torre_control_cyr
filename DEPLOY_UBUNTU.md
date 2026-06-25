# Despliegue en VPS Ubuntu — Torre de Control

La plataforma se ejecuta con tres contenedores privados: PostgreSQL, FastAPI y
React/Nginx. El Nginx instalado en Ubuntu es la única entrada pública y deriva
el tráfico al frontend en `127.0.0.1:8080`.

## Datos necesarios antes de comenzar

- IP pública del VPS y acceso SSH con permisos `sudo`.
- Dominio apuntando mediante un registro DNS `A` a la IP del VPS. Se puede
  comenzar solamente con la IP, pero HTTPS requiere un dominio.
- Respaldo `.dump` de la base PostgreSQL actual.

> La restauración inicial es obligatoria en el estado actual del proyecto.
> Alembic parte desde un esquema histórico ya creado y todavía no construye una
> base vacía completa.

## 1. Crear el respaldo en el computador actual

Desde la raíz del proyecto:

```powershell
backend\.venv\Scripts\python.exe backend\scripts\backup_database.py
```

El comando crea un archivo ignorado por Git dentro de `.backups/`. Conserva la
ruta y el SHA-256 que aparecen en pantalla.

## 2. Preparar Ubuntu

Conectarse al servidor:

```bash
ssh root@IP_DEL_VPS
```

Instalar Docker desde su repositorio oficial y las herramientas del proxy:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker nginx
```

Abrir solamente SSH, HTTP y HTTPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

PostgreSQL y FastAPI no publican puertos hacia Internet.

## 3. Copiar el proyecto

Para desplegar exactamente el estado validado del workspace, copiar el paquete
generado junto al respaldo:

```powershell
scp .deploy-bundle\torre-control-deploy-20260624.tar.gz root@IP_DEL_VPS:/tmp/
scp .deploy-bundle\torre-control-database-20260624.dump root@IP_DEL_VPS:/tmp/
```

En el VPS:

```bash
sudo mkdir -p /opt/torre-control
sudo tar -xzf /tmp/torre-control-deploy-20260624.tar.gz -C /opt/torre-control
sudo mv /tmp/torre-control-database-20260624.dump /opt/torre-control/inicial.dump
sudo chown -R "$USER":"$USER" /opt/torre-control
cd /opt/torre-control
```

Alternativamente, si todos los cambios ya fueron confirmados y publicados en
GitHub:

```bash
sudo mkdir -p /opt/torre-control
sudo chown "$USER":"$USER" /opt/torre-control
git clone https://github.com/zklaudeus/torre_control_cyr.git /opt/torre-control
cd /opt/torre-control
git checkout feature/rendimiento-tecnico-reglas-negocio
```

Si el repositorio es privado, configurar una llave SSH de despliegue o usar un
token de acceso de GitHub. No guardar el token dentro del proyecto.

Copiar el respaldo desde el computador local cuando se use la opción Git:

```powershell
scp .backups\NOMBRE_DEL_RESPALDO.dump root@IP_DEL_VPS:/opt/torre-control/inicial.dump
```

## 4. Variables de producción

En el VPS:

```bash
cd /opt/torre-control
cp .env.production.example .env
chmod 600 .env
nano .env
```

Generar valores seguros y pegarlos en `.env`:

```bash
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -hex 32   # SECRET_KEY
```

`FRONTEND_URL` debe ser exactamente la dirección pública, por ejemplo
`https://torre.midominio.cl`. Para una prueba temporal por IP puede utilizarse
`http://IP_DEL_VPS`.

## 5. Restaurar PostgreSQL

```bash
chmod +x deploy/scripts/*.sh
./deploy/scripts/restore-db.sh inicial.dump --force
```

El indicador `--force` es intencional: la restauración reemplaza el contenido
de la base de destino. No debe ejecutarse sobre producción sin crear antes un
respaldo.

## 6. Configurar Nginx del VPS

Con dominio:

```bash
sudo cp deploy/nginx/torre-control.conf /etc/nginx/sites-available/torre-control
sudo sed -i 's/__DOMAIN__/torre.midominio.cl/g' /etc/nginx/sites-available/torre-control
sudo ln -sfn /etc/nginx/sites-available/torre-control /etc/nginx/sites-enabled/torre-control
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

Para una prueba por IP, reemplazar `__DOMAIN__` por la IP pública.

## 7. Construir y arrancar

```bash
./deploy/scripts/preflight.sh
docker compose build --pull
docker compose up -d
docker compose ps
```

Comprobar desde el VPS:

```bash
curl -fsS http://127.0.0.1:8080/health
curl -fsS http://127.0.0.1:8080/api/health/db
```

## 8. Activar HTTPS

Después de que el dominio resuelva hacia el VPS:

```bash
sudo certbot --nginx -d torre.midominio.cl --redirect
sudo certbot renew --dry-run
```

## Operación habitual

Actualizar la aplicación:

```bash
cd /opt/torre-control
./deploy/scripts/backup-db.sh
git pull --ff-only
docker compose build --pull
docker compose up -d
docker compose ps
```

Consultar errores:

```bash
docker compose logs --tail=200 backend
docker compose logs --tail=200 frontend
docker compose logs --tail=200 db
```

Crear un respaldo manual:

```bash
./deploy/scripts/backup-db.sh
```

Los respaldos quedan en `/opt/torre-control/.backups/` y deben copiarse
periódicamente fuera del VPS.
