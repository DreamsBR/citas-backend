# Backend - Sistema de Reservas de Fisioterapia

API REST completa construida con NestJS + TypeScript + TypeORM + PostgreSQL

## 🚀 Características Principales

- ✅ **Autenticación JWT** para administradores
- ✅ **CRUD completo** de especialidades, especialistas y disponibilidad
- ✅ **Sistema de reservas** con validación de disponibilidad (8am-9pm)
- ✅ **Links únicos** para pacientes (sin necesidad de registro)
- ✅ **Emails automáticos** con Bull + Nodemailer (templates HTML)
- ✅ **Analytics** (top especialistas, ingresos, estadísticas)
- ✅ **Webhooks** para integración con n8n
- ✅ **Documentación Swagger** en `/api/docs`

## 📋 Requisitos

- Node.js 18+ (recomendado 20+)
- PostgreSQL 14+
- Redis (opcional, para colas de emails)

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# Iniciar PostgreSQL
# Asegúrate de tener una base de datos creada

# Compilar
npm run build

# Iniciar en desarrollo
npm run start:dev

# Iniciar en producción
npm run start:prod
```

## 🗄️ Base de Datos

### Sincronización Automática (Desarrollo)

En desarrollo, TypeORM sincroniza automáticamente el esquema (`synchronize: true`).
Las tablas se crean automáticamente al iniciar la aplicación.

### Entidades

1. **Specialty** - Especialidades de fisioterapia
2. **Specialist** - Fisioterapeutas/Especialistas
3. **Availability** - Horarios disponibles por especialista
4. **Appointment** - Citas reservadas
5. **Admin** - Administradores del sistema
6. **EmailLog** - Registro de emails enviados

## 📚 Documentación API (Swagger)

Una vez iniciado el servidor:

```
http://localhost:3001/api/docs
```

## 🔑 Endpoints Principales

### Públicos (Sin autenticación)

#### Reservas
```
GET  /appointments/public/available-slots?specialistId={id}&date=2024-01-15
POST /appointments/public/book
GET  /appointments/public/token/{uniqueToken}
PATCH /appointments/public/token/{token}/cancel
```

#### Especialidades y Especialistas
```
GET /specialties
GET /specialists?specialtyId={id}
```

### Privados (Requieren JWT)

#### Autenticación
```
POST /auth/register - Crear admin
POST /auth/login - Login
GET  /auth/profile - Perfil del admin autenticado
```

#### Gestión de Citas (Admin)
```
GET   /appointments - Todas las citas
GET   /appointments/:id - Cita específica
PATCH /appointments/:id/confirm - Confirmar/rechazar cita
GET   /appointments/calendar?startDate=...&endDate=... - Vista calendario
```

#### Analytics (Admin)
```
GET /analytics/dashboard - Stats generales
GET /analytics/top-specialists - Top especialistas por citas
GET /analytics/appointments-by-status - Citas por estado
GET /analytics/revenue-by-specialty - Ingresos por especialidad
```

## 🔐 Autenticación

### Registrar primer admin

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fisioterapia.com",
    "password": "Admin123!",
    "firstName": "Admin",
    "lastName": "Principal",
    "role": "super_admin"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fisioterapia.com",
    "password": "Admin123!"
  }'
```

Respuesta:
```json
{
  "admin": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Usar el token

Incluir en headers de requests protegidos:
```
Authorization: Bearer {token}
```

## 📧 Sistema de Emails

### Configuración

Editar `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=Fisioterapia <noreply@fisioterapia.com>
```

### Gmail App Password

1. Ir a Google Account → Security
2. Activar 2-Step Verification
3. Ir a App Passwords
4. Crear password para "Mail"
5. Usar ese password en `SMTP_PASS`

### Flujo de Emails

1. Admin confirma cita → Se encola email en Bull
2. Worker procesa job → Renderiza template HTML
3. Nodemailer envía email → Se registra en EmailLog

## 🎯 Lógica de Disponibilidad

### Horarios

- **Rango**: 8:00 AM - 9:00 PM (última cita a las 9pm)
- **Duración**: 1 hora por cita
- **Slots**: 08:00, 09:00, 10:00, ..., 21:00

### Cálculo

```typescript
// El sistema:
// 1. Obtiene availability del especialista para ese día de la semana
// 2. Genera slots de 1 hora entre 8am-9pm
// 3. Filtra slots ocupados (citas confirmed/pending)
// 4. Retorna slots disponibles
```

## 🔗 Integración n8n

### Configurar

```env
N8N_WEBHOOK_URL=https://tu-n8n.com/webhook/fisioterapia
```

### Eventos Disparados

- `appointment.created` - Cita creada (pending)
- `appointment.confirmed` - Cita confirmada por admin
- `appointment.cancelled` - Cita cancelada por paciente

### Payload Ejemplo

```json
{
  "event": "appointment.confirmed",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "appointmentId": "uuid",
    "patientEmail": "paciente@email.com",
    "patientName": "Juan Pérez",
    "appointmentDate": "2024-01-20",
    "appointmentTime": "14:00",
    "confirmedAt": "2024-01-15T10:30:00Z"
  }
}
```

## 📊 Analytics

### Dashboard Stats

```bash
curl http://localhost:3001/analytics/dashboard \
  -H "Authorization: Bearer {token}"
```

Respuesta:
```json
{
  "totalAppointments": 150,
  "pendingAppointments": 12,
  "confirmedAppointments": 100,
  "totalRevenue": 7500.00
}
```

### Top Especialistas

```bash
curl "http://localhost:3001/analytics/top-specialists?limit=5" \
  -H "Authorization: Bearer {token}"
```

## 🏗️ Estructura del Proyecto

```
backend/
├── src/
│   ├── main.ts                 # Entry point + Swagger config
│   ├── app.module.ts           # Módulo principal
│   ├── auth/                   # Autenticación JWT
│   │   ├── strategies/         # JWT strategy
│   │   ├── guards/             # Auth guards
│   │   └── decorators/         # Custom decorators
│   ├── specialties/            # CRUD especialidades
│   ├── specialists/            # CRUD especialistas + availability
│   ├── appointments/           # Sistema de citas
│   ├── emails/                 # Sistema de emails
│   │   ├── templates/          # Templates HTML (Handlebars)
│   │   ├── emails.service.ts   # Lógica de envío
│   │   └── emails.processor.ts # Bull processor
│   ├── analytics/              # Estadísticas
│   ├── webhooks/               # Integración n8n
│   └── admin/                  # Entidades admin
├── .env                        # Variables de entorno
├── .env.example                # Template de variables
└── README.md                   # Esta documentación
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🚀 Deployment

### Railway

1. Crear proyecto en Railway
2. Agregar PostgreSQL addon
3. Configurar variables de entorno
4. Deploy desde GitHub

### Vercel (solo para info, backend va a Railway)

Backend debe estar en Railway/Render, no Vercel (necesita server persistente).

## 📝 Variables de Entorno

Ver `.env.example` para todas las variables disponibles.

### Críticas

- `DB_*` - Credenciales de PostgreSQL
- `JWT_SECRET` - Secret para JWT (cambiar en producción!)
- `SMTP_*` - Credenciales de email
- `FRONTEND_URL` - URL del frontend (para links en emails)

### Opcionales

- `REDIS_*` - Para Bull (si no hay Redis, emails se logean pero no se envían)
- `N8N_WEBHOOK_URL` - Para webhooks de n8n

## 🐛 Troubleshooting

### Error: Cannot connect to PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo
psql -U postgres -h localhost

# Verificar credenciales en .env
```

### Error: ECONNREFUSED Redis

Redis es opcional. Si no lo tienes:
- Comentar BullModule en app.module.ts TEMPORALMENTE
- O instalar Redis: `brew install redis` / `apt install redis`

### Emails no se envían

- Verificar credenciales SMTP en .env
- Para Gmail, usar App Password, no tu password normal
- Si no configuras SMTP, se logean en consola

## 📖 Recursos

- [NestJS Docs](https://docs.nestjs.com)
- [TypeORM Docs](https://typeorm.io)
- [Swagger/OpenAPI](https://swagger.io)
- [Bull Queue](https://github.com/OptimalBits/bull)

## 👥 Autor

Proyecto de reservas de fisioterapia - Backend API

## 📄 Licencia

MIT
