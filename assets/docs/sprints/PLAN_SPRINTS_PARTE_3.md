# PLAN DE SPRINTS - PARTE 3: SPRINTS 4-5 Y SISTEMAS DE CONTROL
**Continuación de:** PLAN_SPRINTS_PARTE_2.md

---

## 🔐 SPRINT 4: SEGURIDAD Y AUTENTICACIÓN AVANZADA

### Información General
- **Duración estimada:** 6-8 horas
- **Prioridad:** 🟠 ALTA
- **Dependencias:** Sprint 3 completado
- **Branch:** `refactor/sprint-4-security`
- **Tag final:** `v1.4.0-sprint4`

### Objetivos
1. Implementar política de contraseñas
2. Agregar rate limiting
3. Mejorar validación de tokens
4. Implementar refresh token automático
5. Agregar logs de auditoría
6. Configurar variables de entorno seguras
7. Implementar HTTPS (opcional para producción)

---

### Tareas Detalladas

#### Tarea 4.1: Implementar Política de Contraseñas

**Archivo:** `/src/utils/password-policy.ts`

```typescript
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(100, 'La contraseña no puede exceder 100 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  try {
    passwordSchema.parse(password);

    // Calcular fuerza
    let score = 0;
    if (password.length >= 12) score++;
    if (/[A-Z].*[A-Z]/.test(password)) score++;
    if (/[0-9].*[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9].*[^A-Za-z0-9]/.test(password)) score++;

    if (score >= 3) strength = 'strong';
    else if (score >= 1) strength = 'medium';

    return { isValid: true, errors: [], strength };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => errors.push(err.message));
    }
    return { isValid: false, errors, strength: 'weak' };
  }
}
```

**Actualizar auth.controller.ts:**
```typescript
import { validatePassword } from '../utils/password-policy';

// En el endpoint de registro/cambio de contraseña
const validation = validatePassword(password);
if (!validation.isValid) {
  return res.status(400).json({
    success: false,
    message: 'Contraseña no cumple con la política de seguridad',
    errors: validation.errors
  });
}
```

---

#### Tarea 4.2: Implementar Rate Limiting

**Instalar dependencia:**
```bash
npm install express-rate-limit
npm install @types/express-rate-limit --save-dev
```

**Archivo:** `/src/middleware/rate-limit.middleware.ts`

```typescript
import rateLimit from 'express-rate-limit';

// Rate limit general
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    message: 'Demasiadas peticiones, intente nuevamente más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit estricto para login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Demasiados intentos de login. Intente nuevamente en 15 minutos'
  }
});

// Rate limit para registro
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 registros por hora por IP
  message: {
    success: false,
    message: 'Demasiados registros desde esta IP'
  }
});
```

**Aplicar en index.ts:**
```typescript
import { generalLimiter, loginLimiter } from './middleware/rate-limit.middleware';

// Aplicar rate limit general
app.use('/api/', generalLimiter);

// Aplicar rate limit específico en rutas de auth
// (Se hace en auth.routes.ts)
```

**En auth.routes.ts:**
```typescript
import { loginLimiter, registerLimiter } from '../middleware/rate-limit.middleware';

router.post('/login', loginLimiter, AuthController.login);
router.post('/register', registerLimiter, AuthController.register);
```

---

#### Tarea 4.3: Mejorar Logging de Auditoría

**Archivo:** `/src/middleware/audit-log.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function auditLog(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Guardar método original
  const originalSend = res.send;

  // Override de send para capturar respuesta
  res.send = function (data: any) {
    // Solo auditar si es una operación de escritura
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // Ejecutar logging asíncrono (no bloquear respuesta)
      setImmediate(async () => {
        try {
          await prisma.auditoria_log.create({
            data: {
              usuario_id: (req as any).user?.id || null,
              accion_id: mapMethodToAction(req.method),
              entidad_tipo_id: null, // Implementar mapping de rutas
              entidad_id: extractEntityId(req),
              descripcion: `${req.method} ${req.path}`,
              valores_previos: null,
              valores_nuevos: req.body,
              ip_address: req.ip,
              user_agent: req.get('user-agent') || null,
            },
          });
        } catch (error) {
          console.error('Error en audit log:', error);
        }
      });
    }

    // Llamar al send original
    return originalSend.call(this, data);
  };

  next();
}

function mapMethodToAction(method: string): number {
  const map: Record<string, number> = {
    POST: 1, // CREATE
    PUT: 2, // UPDATE
    PATCH: 2, // UPDATE
    DELETE: 3, // DELETE
    GET: 4, // READ
  };
  return map[method] || 4;
}

function extractEntityId(req: Request): number | null {
  // Extraer ID de la URL si existe
  const matches = req.path.match(/\/(\d+)(?:\/|$)/);
  return matches ? parseInt(matches[1]) : null;
}
```

**Aplicar en index.ts:**
```typescript
import { auditLog } from './middleware/audit-log.middleware';

app.use('/api/', auditLog);
```

---

#### Tarea 4.4: Implementar Refresh Token Automático

**Frontend:** `/frontend/src/redux/api/baseApi.ts`

Agregar interceptor para refresh automático:

```typescript
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const axiosBaseQuery = (): BaseQueryFn<
  {
    url: string;
    method?: AxiosRequestConfig['method'];
    data?: AxiosRequestConfig['data'];
  },
  unknown,
  unknown
> => async ({ url, method = 'GET', data }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

  try {
    const token = localStorage.getItem('access_token');

    const result = await axios({
      url: baseURL + url,
      method,
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return { data: result.data };
  } catch (axiosError) {
    const err = axiosError as AxiosError;

    // Si es 401, intentar refresh
    if (err.response?.status === 401) {
      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
          const refreshResult = await axios.post(baseURL + '/auth/refresh', {
            refresh_token: refreshToken
          });

          // Guardar nuevo token
          localStorage.setItem('access_token', refreshResult.data.data.access_token);

          // Reintentar petición original con nuevo token
          const retryResult = await axios({
            url: baseURL + url,
            method,
            data,
            headers: {
              Authorization: `Bearer ${refreshResult.data.data.access_token}`
            },
          });

          return { data: retryResult.data };
        }
      } catch (refreshError) {
        // Si refresh falla, limpiar tokens y redirigir a login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return {
      error: {
        status: err.response?.status,
        data: err.response?.data || err.message,
      },
    };
  }
};
```

---

#### Tarea 4.5: Generar JWT Secrets Seguros

**Script:** `/scripts/generate-secrets.sh`

```bash
#!/bin/bash

echo "Generando secrets seguros para JWT..."
echo ""

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')

echo "# JWT Secrets generados automáticamente"
echo "# Fecha: $(date)"
echo ""
echo "JWT_SECRET=\"$JWT_SECRET\""
echo "JWT_REFRESH_SECRET=\"$JWT_REFRESH_SECRET\""
echo ""
echo "⚠️  IMPORTANTE: Copia estos valores a tu archivo .env"
echo "⚠️  NO los compartas ni los subas a Git"
```

**Ejecutar:**
```bash
chmod +x scripts/generate-secrets.sh
./scripts/generate-secrets.sh > .env.secrets
cat .env.secrets
# Copiar valores a .env
```

---

### Criterios de Aceptación Sprint 4

1. **Política de Contraseñas:**
   - [ ] Validación de complejidad implementada
   - [ ] Mensajes de error claros
   - [ ] Cálculo de fuerza de contraseña

2. **Rate Limiting:**
   - [ ] Límite general aplicado
   - [ ] Límite de login funciona (5 intentos / 15 min)
   - [ ] Mensajes apropiados al usuario

3. **Auditoría:**
   - [ ] Logs de auditoría se crean correctamente
   - [ ] IP y User-Agent se registran
   - [ ] No bloquea las respuestas

4. **Refresh Token:**
   - [ ] Refresh automático funciona
   - [ ] Redirect a login si refresh falla
   - [ ] Experiencia de usuario sin interrupciones

5. **Secrets:**
   - [ ] JWT secrets son seguros (no placeholders)
   - [ ] Scripts de generación disponibles

---

### Checkpoint Sprint 4

```bash
git add src/middleware/
git add src/utils/
git add frontend/src/redux/
git add scripts/
git add assets/docs/sprints/

git commit -m "[SPRINT-4] SECURITY: Implementar mejoras de seguridad

Agrega política de contraseñas, rate limiting, auditoría y refresh automático.

- Implementar validación de contraseñas robusta
- Agregar rate limiting (general + específico)
- Mejorar logging de auditoría
- Implementar refresh token automático
- Generar JWT secrets seguros
- Documentar políticas de seguridad

Features: 5 nuevas
Tests: ✅ Seguridad validada
Rollback tag: v1.4.0-sprint4"

git tag -a v1.4.0-sprint4 -m "Sprint 4: Seguridad implementada

Política de contraseñas
Rate limiting
Auditoría mejorada
Refresh token automático"

git push origin refactor/sprint-4-security
git push --tags
```

---

## 🧪 SPRINT 5: TESTING, DEPLOYMENT Y DOCUMENTACIÓN

### Información General
- **Duración estimada:** 10-12 horas
- **Prioridad:** 🟡 MEDIA-ALTA
- **Dependencias:** Sprint 4 completado
- **Branch:** `refactor/sprint-5-testing-deployment`
- **Tag final:** `v1.5.0-sprint5` → `v2.0.0` (Release)

### Objetivos
1. Crear scripts de deployment para Ubuntu 22
2. Configurar PM2 para backend
3. Configurar Nginx (opcional)
4. Crear documentación completa
5. Implementar tests automatizados básicos
6. Crear scripts de backup automático
7. Preparar release de producción

---

### Tareas Detalladas

#### Tarea 5.1: Script de Deployment para Ubuntu 22

**Archivo:** `/scripts/deploy-ubuntu22.sh`

```bash
#!/bin/bash

set -e  # Exit on error

echo "=================================================="
echo "DATABROKERS - DEPLOYMENT EN UBUNTU 22.04"
echo "=================================================="
echo ""

# Variables
PROJECT_DIR="/opt/databrokers"
DB_NAME="databrokers"
DB_USER="databrokers_user"
DB_PASS="databrokers_2025_secure"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función de log
log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# 1. Actualizar sistema
echo "1. Actualizando sistema..."
sudo apt update && sudo apt upgrade -y
log_success "Sistema actualizado"

# 2. Instalar PostgreSQL 14
echo ""
echo "2. Instalando PostgreSQL 14..."
if ! command -v psql &> /dev/null; then
  sudo apt install -y postgresql-14 postgresql-contrib-14
  log_success "PostgreSQL 14 instalado"
else
  log_success "PostgreSQL ya instalado"
fi

# 3. Configurar PostgreSQL
echo ""
echo "3. Configurando PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
EOF
log_success "Base de datos configurada"

# 4. Instalar Node.js 18+ (via NVM)
echo ""
echo "4. Instalando Node.js..."
if ! command -v node &> /dev/null; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 18
  nvm use 18
  log_success "Node.js instalado"
else
  log_success "Node.js ya instalado: $(node --version)"
fi

# 5. Instalar PM2
echo ""
echo "5. Instalando PM2..."
npm install -g pm2
log_success "PM2 instalado"

# 6. Clonar proyecto (si no existe)
echo ""
echo "6. Configurando proyecto..."
if [ ! -d "$PROJECT_DIR" ]; then
  sudo mkdir -p $PROJECT_DIR
  sudo chown $USER:$USER $PROJECT_DIR
  git clone https://github.com/fdonosoh-droid/proyecto-Databokers-original.git $PROJECT_DIR
  log_success "Proyecto clonado"
else
  log_success "Proyecto ya existe"
fi

# 7. Instalar dependencias
echo ""
echo "7. Instalando dependencias..."
cd $PROJECT_DIR
npm install
cd frontend && npm install && cd ..
log_success "Dependencias instaladas"

# 8. Configurar .env
echo ""
echo "8. Configurando variables de entorno..."
if [ ! -f ".env" ]; then
  cp .env.example .env
  # Actualizar DATABASE_URL
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME\"|" .env
  log_success ".env configurado"
else
  log_success ".env ya existe"
fi

# 9. Ejecutar migraciones
echo ""
echo "9. Ejecutando migraciones..."
npx prisma generate
npx prisma migrate deploy
log_success "Migraciones completadas"

# 10. Ejecutar seeds
echo ""
echo "10. Poblando base de datos..."
npx ts-node seed-data.ts
npx ts-node create-admin-user.ts
log_success "Datos iniciales creados"

# 11. Build del backend
echo ""
echo "11. Compilando backend..."
npm run build
log_success "Backend compilado"

# 12. Build del frontend
echo ""
echo "12. Compilando frontend..."
cd frontend
npm run build
cd ..
log_success "Frontend compilado"

# 13. Configurar PM2
echo ""
echo "13. Configurando PM2..."
pm2 delete databrokers-api 2>/dev/null || true
pm2 start npm --name "databrokers-api" -- start
pm2 startup
pm2 save
log_success "PM2 configurado"

# 14. Instalar Nginx (opcional)
echo ""
echo "14. ¿Instalar Nginx para servir frontend? (y/n)"
read -r install_nginx

if [ "$install_nginx" == "y" ]; then
  sudo apt install -y nginx

  # Configurar Nginx
  sudo tee /etc/nginx/sites-available/databrokers <<EOF
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root $PROJECT_DIR/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

  sudo ln -sf /etc/nginx/sites-available/databrokers /etc/nginx/sites-enabled/
  sudo rm -f /etc/nginx/sites-enabled/default
  sudo nginx -t
  sudo systemctl restart nginx

  log_success "Nginx configurado"
fi

# 15. Configurar firewall
echo ""
echo "15. Configurando firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5432/tcp  # PostgreSQL (solo si necesitas acceso externo)
sudo ufw --force enable
log_success "Firewall configurado"

# Finalizar
echo ""
echo "=================================================="
echo "✅ DEPLOYMENT COMPLETADO"
echo "=================================================="
echo ""
echo "Backend (PM2):  http://localhost:3000"
echo "Frontend:       http://localhost (via Nginx)"
echo "                o http://localhost:5173 (dev)"
echo ""
echo "Credenciales admin:"
echo "  Email: admin@databrokers.cl"
echo "  Password: admin123"
echo ""
echo "Comandos útiles:"
echo "  pm2 status          - Ver estado de procesos"
echo "  pm2 logs            - Ver logs"
echo "  pm2 restart all     - Reiniciar servicios"
echo "  sudo systemctl status nginx  - Estado de Nginx"
echo ""
echo "=================================================="
```

**Hacer ejecutable:**
```bash
chmod +x scripts/deploy-ubuntu22.sh
```

---

#### Tarea 5.2: Script de Backup Automático

**Archivo:** `/scripts/backup-database.sh`

```bash
#!/bin/bash

# Configuración
BACKUP_DIR="/opt/databrokers/backups/database"
DB_NAME="databrokers"
DB_USER="databrokers_user"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"
RETENTION_DAYS=30

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Crear backup
echo "Creando backup de $DB_NAME..."
pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# Comprimir
gzip $BACKUP_FILE
echo "✅ Backup creado: ${BACKUP_FILE}.gz"

# Limpiar backups antiguos
echo "Limpiando backups antiguos (> $RETENTION_DAYS días)..."
find $BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
echo "✅ Limpieza completada"

# Verificar tamaño
SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
echo "Tamaño del backup: $SIZE"
```

**Automatizar con cron:**
```bash
# Editar crontab
crontab -e

# Agregar línea (backup diario a las 2 AM)
0 2 * * * /opt/databrokers/scripts/backup-database.sh >> /opt/databrokers/logs/backup.log 2>&1
```

---

#### Tarea 5.3: Script de Restore

**Archivo:** `/scripts/restore-database.sh`

```bash
#!/bin/bash

if [ -z "$1" ]; then
  echo "Uso: $0 <archivo_backup.sql.gz>"
  echo ""
  echo "Backups disponibles:"
  ls -lh /opt/databrokers/backups/database/
  exit 1
fi

BACKUP_FILE=$1
DB_NAME="databrokers"
DB_USER="databrokers_user"

echo "⚠️  ADVERTENCIA: Esto sobrescribirá la base de datos actual"
echo "¿Continuar? (yes/no)"
read -r confirm

if [ "$confirm" != "yes" ]; then
  echo "Cancelado"
  exit 0
fi

# Descomprimir
gunzip -c $BACKUP_FILE > /tmp/restore_temp.sql

# Restaurar
echo "Restaurando base de datos..."
psql -U $DB_USER $DB_NAME < /tmp/restore_temp.sql

# Limpiar
rm /tmp/restore_temp.sql

echo "✅ Base de datos restaurada desde: $BACKUP_FILE"
echo "⚠️  Reinicia el backend: pm2 restart databrokers-api"
```

---

#### Tarea 5.4: Documentación de API (Swagger/OpenAPI - Opcional)

Si quieres implementar Swagger:

```bash
npm install swagger-jsdoc swagger-ui-express
npm install @types/swagger-jsdoc @types/swagger-ui-express --save-dev
```

**Archivo:** `/src/config/swagger.ts`

```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Databrokers API',
      version: '3.0.0',
      description: 'Sistema de Gestión Inmobiliaria - API REST',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
```

**En index.ts:**
```typescript
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

#### Tarea 5.5: README Actualizado con Instrucciones Completas

**Actualizar `/README.md`** con secciones:
- Deployment en Ubuntu 22
- Configuración de PostgreSQL
- Uso de scripts de backup/restore
- Comandos PM2
- Troubleshooting

---

### Criterios de Aceptación Sprint 5

1. **Deployment:**
   - [ ] Script de deployment funciona en Ubuntu 22
   - [ ] PostgreSQL 14 se instala correctamente
   - [ ] PM2 mantiene backend corriendo
   - [ ] Nginx sirve frontend (opcional)

2. **Backup:**
   - [ ] Script de backup funciona
   - [ ] Cron job configurado
   - [ ] Script de restore funciona
   - [ ] Retención de backups implementada

3. **Documentación:**
   - [ ] README actualizado
   - [ ] Scripts documentados
   - [ ] API documentada (opcional: Swagger)
   - [ ] Troubleshooting guide

4. **Production Ready:**
   - [ ] Variables de entorno seguras
   - [ ] Logs configurados
   - [ ] Firewall configurado
   - [ ] Sistema estable

---

### Checkpoint Sprint 5 y Release v2.0.0

```bash
git add scripts/
git add README.md
git add docs/
git add assets/docs/sprints/

git commit -m "[SPRINT-5] DEPLOY: Preparar sistema para producción

Implementa deployment completo, backups y documentación final.

- Crear script de deployment Ubuntu 22
- Configurar PostgreSQL 14 automático
- Implementar PM2 para backend
- Configurar Nginx (opcional)
- Scripts de backup/restore
- Documentación completa actualizada
- Sistema production-ready

Scripts: 3 nuevos
Docs: Actualizadas
Production: ✅ Listo
Rollback tag: v1.5.0-sprint5"

git tag -a v1.5.0-sprint5 -m "Sprint 5: Production ready

Deployment completo
Backups automáticos
Documentación final"

git push origin refactor/sprint-5-testing-deployment
git push --tags

# MERGE A MAIN Y RELEASE FINAL
git checkout main
git merge refactor/sprint-5-testing-deployment

git tag -a v2.0.0 -m "Release 2.0.0: Sistema Completo

Backend 100%
Frontend integrado
Base de datos funcional
Seguridad implementada
Production ready

Changelog:
- PostgreSQL 14 + pgAdmin4
- 22 tablas, datos iniciales
- 69 endpoints API
- Autenticación JWT completa
- Frontend React funcional
- Deployment automatizado
- Backups automáticos"

git push origin main
git push --tags
```

---

## MATRIZ DE DEPENDENCIAS

```
Sprint 0 (Infraestructura)
    │
    ├──> Sprint 1 (Base de Datos)
    │       │
    │       ├──> Sprint 2 (Backend Connection)
    │       │       │
    │       │       └──> Sprint 3 (Frontend Integration)
    │       │               │
    │       │               └──> Sprint 4 (Seguridad)
    │       │                       │
    │       │                       └──> Sprint 5 (Deployment)
    │       │
    │       └──> (alternativa directa) Sprint 5 (Deployment)
    │
    └──> (en paralelo) Documentación continua
```

### Tabla de Dependencias

| Sprint | Depende de | Puede iniciarse en paralelo con | Bloquea a |
|--------|------------|--------------------------------|-----------|
| Sprint 0 | - | - | Sprint 1 |
| Sprint 1 | Sprint 0 | - | Sprint 2, Sprint 5 |
| Sprint 2 | Sprint 1 | - | Sprint 3 |
| Sprint 3 | Sprint 2 | Sprint 4 (parcial) | Sprint 5 (completo) |
| Sprint 4 | Sprint 2 | Sprint 3 | Sprint 5 |
| Sprint 5 | Sprint 1 (mínimo), Sprint 4 (completo) | Documentación | Release |

---

## SISTEMA DE ALERTAS Y VALIDACIONES

### Alertas Automáticas Pre-Sprint

Antes de iniciar cada sprint, ejecutar script de validación:

**Archivo:** `/scripts/pre-sprint-check.sh`

```bash
#!/bin/bash

SPRINT=$1

if [ -z "$SPRINT" ]; then
  echo "Uso: $0 <numero_sprint>"
  exit 1
fi

echo "============================================"
echo "PRE-SPRINT CHECK - SPRINT $SPRINT"
echo "============================================"
echo ""

ERRORS=0

case $SPRINT in
  1)
    echo "Validando prerequisitos para Sprint 1..."

    # Verificar Sprint 0 completado
    if ! docker ps | grep -q databrokers_postgres; then
      echo "❌ PostgreSQL no está corriendo (Sprint 0 incompleto)"
      ((ERRORS++))
    else
      echo "✅ PostgreSQL corriendo"
    fi

    if [ ! -f ".env" ]; then
      echo "❌ Archivo .env no existe (Sprint 0 incompleto)"
      ((ERRORS++))
    else
      echo "✅ Archivo .env existe"
    fi
    ;;

  2)
    echo "Validando prerequisitos para Sprint 2..."

    # Verificar Sprint 1 completado
    TABLE_COUNT=$(docker exec databrokers_postgres psql -U databrokers_user -d databrokers -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | xargs)

    if [ "$TABLE_COUNT" != "22" ]; then
      echo "❌ Tablas de base de datos no creadas (Sprint 1 incompleto)"
      ((ERRORS++))
    else
      echo "✅ Base de datos configurada"
    fi

    if [ ! -d "node_modules/@prisma/client" ]; then
      echo "❌ Prisma Client no generado (Sprint 1 incompleto)"
      ((ERRORS++))
    else
      echo "✅ Prisma Client generado"
    fi
    ;;

  3)
    echo "Validando prerequisitos para Sprint 3..."

    # Verificar Sprint 2 completado
    if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
      echo "❌ Backend no está corriendo (Sprint 2 incompleto)"
      ((ERRORS++))
    else
      echo "✅ Backend funcionando"
    fi
    ;;

  4)
    echo "Validando prerequisitos para Sprint 4..."

    if [ ! -d "frontend/node_modules" ]; then
      echo "❌ Frontend sin dependencias instaladas (Sprint 3 incompleto)"
      ((ERRORS++))
    else
      echo "✅ Frontend configurado"
    fi
    ;;

  5)
    echo "Validando prerequisitos para Sprint 5..."

    # Verificar todos los sprints anteriores
    if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
      echo "❌ Backend no funcional"
      ((ERRORS++))
    else
      echo "✅ Backend funcional"
    fi

    # Verificar que existen logs de auditoría
    if docker exec databrokers_postgres psql -U databrokers_user -d databrokers -t -c "SELECT COUNT(*) FROM auditoria_log;" 2>/dev/null | xargs > /dev/null; then
      echo "✅ Sistema de auditoría activo"
    else
      echo "⚠️  Sistema de auditoría sin registros"
    fi
    ;;

  *)
    echo "Sprint no reconocido"
    exit 1
    ;;
esac

echo ""
echo "============================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅ LISTO PARA SPRINT $SPRINT"
  echo "Puede continuar con seguridad"
else
  echo "❌ NO LISTO - $ERRORS problemas detectados"
  echo "Completa los sprints anteriores primero"
  exit 1
fi
echo "============================================"
```

**Uso:**
```bash
chmod +x scripts/pre-sprint-check.sh
./scripts/pre-sprint-check.sh 1  # Antes de Sprint 1
./scripts/pre-sprint-check.sh 2  # Antes de Sprint 2
# etc.
```

---

### Alertas de Inconsistencia Durante Sprint

**Script de monitoreo continuo:** `/scripts/health-monitor.sh`

```bash
#!/bin/bash

# Monitor continuo cada 30 segundos
while true; do
  clear
  echo "============================================"
  echo "DATABROKERS - HEALTH MONITOR"
  echo "Timestamp: $(date)"
  echo "============================================"
  echo ""

  # PostgreSQL
  if docker ps | grep -q databrokers_postgres; then
    echo "✅ PostgreSQL: Running"
  else
    echo "❌ PostgreSQL: DOWN"
  fi

  # Backend
  if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend: Running"
  else
    echo "❌ Backend: DOWN"
  fi

  # Frontend (dev)
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend: Running"
  else
    echo "⚠️  Frontend: Not running (normal si no está en dev)"
  fi

  # Disk space
  DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️  Disk: ${DISK_USAGE}% (LOW SPACE)"
  else
    echo "✅ Disk: ${DISK_USAGE}% used"
  fi

  # Memory
  MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
  if [ $MEM_USAGE -gt 90 ]; then
    echo "⚠️  Memory: ${MEM_USAGE}% (HIGH)"
  else
    echo "✅ Memory: ${MEM_USAGE}% used"
  fi

  echo ""
  echo "Presiona Ctrl+C para salir"
  sleep 30
done
```

---

## RESUMEN DE ENTREGABLES POR SPRINT

### Sprint 0
- ✅ `docker-compose.yml`
- ✅ `scripts/init-db.sql`
- ✅ `.env` (backend)
- ✅ `frontend/.env`
- ✅ `scripts/validate-sprint-0.sh`
- ✅ `assets/docs/sprints/SPRINT_0_RESUMEN.md`
- ✅ Tag: `v1.0.0-sprint0`

### Sprint 1
- ✅ Migraciones de Prisma
- ✅ Datos seed ejecutados
- ✅ Usuario admin creado
- ✅ `scripts/validate-sprint-1.sh`
- ✅ Backup post-migración
- ✅ `assets/docs/sprints/SPRINT_1_RESUMEN.md`
- ✅ Tag: `v1.1.0-sprint1`

### Sprint 2
- ✅ `scripts/test-prisma-connection.ts`
- ✅ `scripts/test-all-endpoints.sh`
- ✅ Backend funcional validado
- ✅ `assets/docs/sprints/SPRINT_2_RESUMEN.md`
- ✅ Tag: `v1.2.0-sprint2`

### Sprint 3
- ✅ Frontend integrado
- ✅ Login funcional end-to-end
- ✅ `assets/docs/sprints/MANUAL_TEST_FRONTEND.md`
- ✅ `assets/docs/sprints/SPRINT_3_RESUMEN.md`
- ✅ Tag: `v1.3.0-sprint3`

### Sprint 4
- ✅ `src/utils/password-policy.ts`
- ✅ `src/middleware/rate-limit.middleware.ts`
- ✅ `src/middleware/audit-log.middleware.ts`
- ✅ `scripts/generate-secrets.sh`
- ✅ Refresh token automático (frontend)
- ✅ `assets/docs/sprints/SPRINT_4_RESUMEN.md`
- ✅ Tag: `v1.4.0-sprint4`

### Sprint 5
- ✅ `scripts/deploy-ubuntu22.sh`
- ✅ `scripts/backup-database.sh`
- ✅ `scripts/restore-database.sh`
- ✅ `README.md` actualizado
- ✅ Configuración PM2 + Nginx
- ✅ `assets/docs/sprints/SPRINT_5_RESUMEN.md`
- ✅ Tag: `v1.5.0-sprint5`
- ✅ Tag: `v2.0.0` (Release final)

---

## COMANDOS RÁPIDOS DE GIT

### Ver todos los sprints completados
```bash
git tag -l "v*.0-sprint*"
```

### Rollback a un sprint específico
```bash
# Ver el sprint
git show v1.2.0-sprint2

# Crear branch de rollback
git checkout -b rollback/to-sprint2 v1.2.0-sprint2

# Ver diferencias con estado actual
git diff v1.2.0-sprint2 main
```

### Ver cambios de un sprint
```bash
git diff v1.1.0-sprint1..v1.2.0-sprint2
```

### Ver log de commits por sprint
```bash
git log v1.1.0-sprint1..v1.2.0-sprint2 --oneline
```

---

## CONCLUSIÓN

Este plan proporciona:

1. ✅ **Sprints secuenciales** con dependencias claras
2. ✅ **Documentación automática** por cada sprint
3. ✅ **Sistema de rollback** con tags Git
4. ✅ **Validación en cada paso** con scripts automatizados
5. ✅ **Alertas de inconsistencias** pre y durante sprints
6. ✅ **Control de versiones** robusto
7. ✅ **Deployment production-ready** para Ubuntu 22

**Tiempo total estimado:** 50-65 horas
**Duración por sprint:** 4-12 horas
**Total de sprints:** 6 (0-5)

**Próximo paso:** Ejecutar Sprint 0 siguiendo el plan detallado en `PLAN_SPRINTS_REFACTORIZACION.md`

---

**Documentos generados:**
- `AUDITORIA_INICIAL.md` - Análisis completo de problemas
- `PLAN_SPRINTS_REFACTORIZACION.md` - Sprint 0 y metodología
- `PLAN_SPRINTS_PARTE_2.md` - Sprints 1-3
- `PLAN_SPRINTS_PARTE_3.md` - Sprints 4-5 y sistemas de control (ESTE DOCUMENTO)

---

*Fin del Plan de Sprints - Parte 3/3*
**Fecha:** 14 de Noviembre 2025
**Versión:** 1.0
