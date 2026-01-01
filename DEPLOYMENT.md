# Guía de Deployment - Fisioterapia Backend

## Despliegue en Digital Ocean con Dockploy

Esta guía te ayudará a desplegar el backend de Fisioterapia en un VPS de Digital Ocean usando Dockploy.

---

## 📋 Requisitos Previos

### 1. VPS en Digital Ocean

- **Droplet recomendado:** Basic ($12/mes)
  - 2 GB RAM
  - 1 vCPU
  - 50 GB SSD
  - Ubuntu 22.04 LTS

### 2. Dominio configurado

- Apunta tu dominio/subdominio a la IP del VPS
- Ejemplo: `api.tudominio.com` → IP de tu Droplet

### 3. Cuenta de Gmail para envío de correos

- Activa 2FA en tu cuenta Gmail
- Crea una App Password: https://myaccount.google.com/apppasswords

---

## 🚀 Paso 1: Instalar Dockploy en el VPS

### Conectarse al VPS

```bash
ssh root@tu-ip-del-vps
```

### Instalar Dockploy

```bash
curl -sSL https://dockploy.com/install.sh | sh
```

Esto instalará:
- Docker
- Docker Compose
- Dockploy dashboard

### Acceder a Dockploy

Una vez instalado, ve a:
```
http://tu-ip-del-vps:3000
```

Crea tu usuario admin en el primer acceso.

---

## 🔧 Paso 2: Preparar el Repositorio

### Subir archivos de Docker a Git

En tu proyecto local, asegúrate de tener estos archivos (ya creados):

```
citas-backend/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.production (NO subir a Git)
└── src/
    └── app.controller.ts (con health check)
```

### Actualizar .gitignore

Asegúrate de que `.env.production` esté en `.gitignore`:

```bash
# En .gitignore
.env
.env.*
!.env.example
```

### Commit y Push

```bash
git add Dockerfile docker-compose.yml .dockerignore src/app.controller.ts
git commit -m "Add Docker configuration for production deployment"
git push origin main
```

---

## 📦 Paso 3: Configurar en Dockploy

### 3.1 Crear un Nuevo Proyecto

1. En Dockploy dashboard, click en **"Create Project"**
2. Nombre: `fisioterapia-backend`
3. Selecciona: **"Docker Compose"**

### 3.2 Conectar Repositorio Git

1. Click en **"Connect Git Repository"**
2. Conecta tu cuenta de GitHub/GitLab
3. Selecciona el repositorio: `citas-backend`
4. Branch: `main` (o tu rama principal)

### 3.3 Configurar Variables de Entorno

En la sección **Environment Variables**, agrega cada variable del archivo `.env.production`:

**IMPORTANTE:** Genera valores seguros para producción

#### Database

```
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<GENERA_PASSWORD_FUERTE>
DB_DATABASE=fisioterapia_db
```

**Generar password seguro:**
```bash
openssl rand -base64 32
```

#### JWT

```
JWT_SECRET=<GENERA_SECRET_FUERTE>
JWT_EXPIRATION=24h
```

**Generar JWT secret:**
```bash
openssl rand -base64 64
```

#### SMTP (Gmail)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=Fisioterapia <tu-email@gmail.com>
```

**Obtener SMTP_PASS:**
1. Ve a https://myaccount.google.com/apppasswords
2. Selecciona "Mail" como app
3. Copia el password generado (16 caracteres con espacios)

#### Redis

```
REDIS_HOST=redis
REDIS_PORT=6379
```

#### Aplicación

```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://tu-dominio-frontend.com
```

#### Opcional (n8n)

```
N8N_WEBHOOK_URL=
```

### 3.4 Configurar Puerto

- **Container Port:** `3001`
- **Host Port:** `3001` (o el que prefieras)

### 3.5 Configurar Dominio (SSL automático)

1. En **Domains**, click en **"Add Domain"**
2. Ingresa: `api.tudominio.com`
3. Dockploy automáticamente:
   - Configurará Nginx reverse proxy
   - Obtendrá certificado SSL (Let's Encrypt)
   - Redirigirá HTTP → HTTPS

---

## 🎯 Paso 4: Deploy

1. Click en **"Deploy"**
2. Dockploy automáticamente:
   - Clonará el repositorio
   - Construirá la imagen Docker
   - Levantará PostgreSQL, Redis y Backend
   - Configurará el reverse proxy

### Monitorear el Deploy

En la pestaña **Logs**, verás:

```
✓ Building backend...
✓ Starting postgres...
✓ Starting redis...
✓ Starting backend...
✓ Health check passed
✓ SSL certificate obtained
✓ Deployment successful
```

---

## ✅ Paso 5: Verificación

### Health Check

```bash
curl https://api.tudominio.com/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### Verificar Swagger

```
https://api.tudominio.com/api
```

### Probar endpoint público

```bash
curl https://api.tudominio.com/specialties
```

---

## 🔍 Monitoreo y Logs

### Ver logs en tiempo real

En Dockploy:
1. Selecciona el proyecto
2. Pestaña **Logs**
3. Filtra por servicio:
   - `backend`: logs de la aplicación
   - `postgres`: logs de base de datos
   - `redis`: logs de Redis

### Logs de correos

Busca en logs del backend:

```
[EmailsService] Email de confirmación encolado para appointment xxx
[EmailsProcessor] Procesando job de email: 1
[EmailsService] Email enviado exitosamente
```

### Monitorear cola de Redis

Conéctate al contenedor Redis:

```bash
docker exec -it fisioterapia-redis redis-cli

# Ver keys de Bull
KEYS bull:emails:*

# Ver cantidad de jobs pendientes
LLEN bull:emails:wait

# Ver jobs
LRANGE bull:emails:wait 0 -1
```

---

## 🔄 Actualizaciones

### Deploy automático con Git

Dockploy puede configurarse para auto-deploy:

1. En proyecto → **Settings**
2. Activa **"Auto Deploy on Git Push"**
3. Configura webhook en GitHub/GitLab

Cada push a `main` desplegará automáticamente.

### Deploy manual

1. En Dockploy dashboard
2. Selecciona el proyecto
3. Click en **"Redeploy"**

---

## 🛠️ Troubleshooting

### Backend no inicia

**Verifica logs:**
```bash
docker logs fisioterapia-backend
```

**Problemas comunes:**
- ❌ PostgreSQL no está listo → Espera 30s y reintenta
- ❌ Redis no conecta → Verifica `REDIS_HOST=redis`
- ❌ Falta variable de entorno → Revisa todas las env vars

### Correos no se envían

**Verifica:**

1. SMTP credentials correctas
2. Redis está corriendo:
   ```bash
   docker ps | grep redis
   ```
3. Logs del procesador:
   ```bash
   docker logs fisioterapia-backend | grep EmailsProcessor
   ```

### SSL no funciona

**Verifica:**
1. DNS apunta correctamente a la IP del VPS
2. Puerto 80 y 443 abiertos en firewall:
   ```bash
   ufw allow 80/tcp
   ufw allow 443/tcp
   ```

---

## 📊 Recursos del VPS

### Monitoreo

```bash
# Uso de memoria
docker stats

# Espacio en disco
df -h

# Logs de sistema
journalctl -u docker
```

### Backups

**PostgreSQL:**
```bash
docker exec fisioterapia-db pg_dump -U postgres fisioterapia_db > backup.sql
```

**Subir a S3/Spaces (recomendado):**
```bash
# Instalar AWS CLI
apt install awscli

# Configurar
aws configure

# Backup automático
0 2 * * * docker exec fisioterapia-db pg_dump -U postgres fisioterapia_db | gzip | aws s3 cp - s3://mi-bucket/backups/$(date +\%Y\%m\%d).sql.gz
```

---

## 🔐 Seguridad

### Firewall

```bash
# Solo permitir SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Actualizar sistema

```bash
apt update && apt upgrade -y
```

### Cambiar puerto SSH (recomendado)

```bash
# Editar /etc/ssh/sshd_config
Port 2222

# Reiniciar SSH
systemctl restart sshd

# Actualizar firewall
ufw allow 2222/tcp
ufw delete allow 22/tcp
```

---

## 📞 Soporte

### Logs importantes

Siempre incluye estos logs al reportar problemas:

```bash
# Logs del backend
docker logs fisioterapia-backend --tail 100

# Estado de contenedores
docker ps -a

# Espacio en disco
df -h

# Memoria
free -h
```

---

## 🎉 Checklist Final

Antes de considerar el deployment completo, verifica:

- [ ] Health check responde correctamente
- [ ] Swagger accesible en `/api`
- [ ] SSL configurado (HTTPS funciona)
- [ ] Puedes crear una cita desde el frontend
- [ ] Correos de confirmación se envían correctamente
- [ ] Redis procesa la cola (ver logs)
- [ ] Backups de DB configurados
- [ ] Firewall configurado
- [ ] Monitoreo configurado (opcional: Uptime Kuma, Grafana)

---

¡Deployment completado! 🚀
