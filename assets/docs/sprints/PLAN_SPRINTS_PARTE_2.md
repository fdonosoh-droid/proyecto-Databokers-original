# PLAN DE SPRINTS - PARTE 2: SPRINTS 1-3
**Continuación de:** PLAN_SPRINTS_REFACTORIZACION.md

---

## 🗄️ SPRINT 1: BASE DE DATOS Y MIGRACIONES

### Información General
- **Duración estimada:** 6-8 horas
- **Prioridad:** 🔴 CRÍTICA
- **Dependencias:** Sprint 0 completado
- **Branch:** `refactor/sprint-1-database`
- **Tag final:** `v1.1.0-sprint1`

### Objetivos
1. Ejecutar migraciones de Prisma
2. Crear tablas en PostgreSQL
3. Ejecutar scripts de seed
4. Crear usuario administrador
5. Poblar datos iniciales
6. Validar integridad referencial

### Prerequisitos
- Sprint 0 completado exitosamente
- PostgreSQL corriendo
- Archivo .env configurado
- Prisma CLI disponible

---

### Tareas Detalladas

#### Tarea 1.1: Crear Branch de Trabajo
```bash
git checkout develop
git pull origin develop
git checkout -b refactor/sprint-1-database
```

#### Tarea 1.2: Instalar Dependencias de Prisma
```bash
# Backend
cd /home/user/proyecto-Databokers-original
npm install

# Verificar Prisma
npx prisma --version
```

**Validación:**
```bash
npx prisma --version
# Output esperado: prisma: 5.3.1
```

---

#### Tarea 1.3: Generar Cliente Prisma
```bash
npx prisma generate
```

**Output esperado:**
```
✔ Generated Prisma Client (5.3.1) to ./node_modules/@prisma/client
```

**Validación:**
```bash
ls -lh node_modules/@prisma/client
# Debe existir la carpeta
```

---

#### Tarea 1.4: Crear Migración Inicial

```bash
# Crear primera migración
npx prisma migrate dev --name initial_schema

# Seguir prompts:
# - "We need to reset the database, do you want to continue?" → Yes
```

**Output esperado:**
```
✔ Generated Prisma Client (5.3.1)
The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20251114XXXXXX_initial_schema/
      └─ migration.sql

✔ Generated Prisma Client (5.3.1)
```

**Validación:**
```bash
# Verificar que existe la migración
ls -lh prisma/migrations/

# Debe mostrar carpeta con timestamp y nombre "initial_schema"

# Verificar en pgAdmin o por consola que las tablas existen
docker exec -it databrokers_postgres psql -U databrokers_user -d databrokers -c "\dt"
```

**Output esperado de \dt:**
```
                    List of relations
 Schema |            Name            | Type  |       Owner
--------+----------------------------+-------+-------------------
 public | actividades_publicacion    | table | databrokers_user
 public | alertas                    | table | databrokers_user
 public | auditoria_log              | table | databrokers_user
 public | canjes                     | table | databrokers_user
 public | dom_categorias             | table | databrokers_user
 public | dom_parametros             | table | databrokers_user
 public | kpi_valores                | table | databrokers_user
 public | kpis                       | table | databrokers_user
 public | modelos_negocio            | table | databrokers_user
 public | programacion_reportes      | table | databrokers_user
 public | projectos                  | table | databrokers_user
 public | propiedades                | table | databrokers_user
 public | propiedades_nuevas         | table | databrokers_user
 public | publicaciones_corredores   | table | databrokers_user
 public | reportes                   | table | databrokers_user
 public | roles                      | table | databrokers_user
 public | tipologias                 | table | databrokers_user
 public | transacciones              | table | databrokers_user
 public | usuarios                   | table | databrokers_user
(22 rows)
```

---

#### Tarea 1.5: Crear Backup Post-Migración

```bash
# Crear carpeta para backups si no existe
mkdir -p backups/database

# Crear backup
docker exec -it databrokers_postgres pg_dump -U databrokers_user databrokers > backups/database/post_migration_$(date +%Y%m%d_%H%M%S).sql

# Verificar backup
ls -lh backups/database/
```

---

#### Tarea 1.6: Ejecutar Seed de Datos Iniciales

**Archivo:** Verificar `/seed-data.ts`

```bash
# Verificar que existe
ls -lh seed-data.ts

# Ejecutar seed
npx ts-node seed-data.ts
```

**Output esperado:**
```
🌱 Iniciando seed de datos...

✅ Roles creados (4)
✅ Categorías de dominios creadas (15)
✅ Parámetros creados (60+)
✅ Modelos de negocio creados (3)

🎉 Seed completado exitosamente
```

**Validación:**
```bash
# Verificar roles
docker exec -it databrokers_postgres psql -U databrokers_user -d databrokers -c "SELECT codigo, nombre FROM roles;"

# Output esperado:
#  codigo   |      nombre
# ----------+------------------
#  ADMIN    | Administrador
#  GESTOR   | Gestor
#  ANALISTA | Analista
#  CORREDOR | Corredor

# Verificar modelos de negocio
docker exec -it databrokers_postgres psql -U databrokers_user -d databrokers -c "SELECT codigo, nombre FROM modelos_negocio;"

# Output esperado:
#     codigo      |      nombre
# ----------------+------------------
#  VENTA_DIRECTA  | Venta Directa
#  CANJE          | Canje
#  CORRETAJE      | Corretaje
```

---

#### Tarea 1.7: Crear Usuario Administrador

**Archivo:** Verificar `/create-admin-user.ts`

```bash
# Verificar que existe
ls -lh create-admin-user.ts

# Ejecutar creación de admin
npx ts-node create-admin-user.ts
```

**Output esperado:**
```
🔐 Creando usuario administrador...

Email: admin@databrokers.cl
Nombre: Administrador
Rol: ADMIN

✅ Usuario administrador creado exitosamente

Credenciales de acceso:
Email: admin@databrokers.cl
Password: admin123

⚠️  IMPORTANTE: Cambiar la contraseña al primer login
```

**Validación:**
```bash
# Verificar usuario creado
docker exec -it databrokers_postgres psql -U databrokers_user -d databrokers -c "
SELECT u.email, u.nombre, r.codigo as rol
FROM usuarios u
JOIN roles r ON u.rol_id = r.id;
"

# Output esperado:
#        email          |     nombre      |  rol
# ----------------------+-----------------+-------
#  admin@databrokers.cl | Administrador   | ADMIN
```

---

#### Tarea 1.8: Ejecutar Seed de KPIs (Opcional - Datos de Prueba)

```bash
# Solo si quieres datos de prueba para testing
npx ts-node scripts/seed-kpis-test.ts
```

---

#### Tarea 1.9: Verificar Integridad Referencial

**Script:** `/scripts/validate-database.sql`

```sql
-- Validación de integridad de la base de datos

-- 1. Contar registros en tablas principales
SELECT 'Roles' as tabla, COUNT(*) as registros FROM roles
UNION ALL
SELECT 'Usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'Modelos Negocio', COUNT(*) FROM modelos_negocio
UNION ALL
SELECT 'Dominios Categorías', COUNT(*) FROM dom_categorias
UNION ALL
SELECT 'Dominios Parámetros', COUNT(*) FROM dom_parametros;

-- 2. Verificar que no hay registros huérfanos
-- (Esto depende de las foreign keys, Prisma las maneja automáticamente)

-- 3. Verificar índices
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4. Verificar restricciones
SELECT conname, contype, conrelid::regclass
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace;
```

**Ejecutar:**
```bash
docker exec -it databrokers_postgres psql -U databrokers_user -d databrokers -f /ruta/al/script/validate-database.sql
```

---

### Criterios de Aceptación Sprint 1

#### ✅ Debe cumplirse TODO lo siguiente:

1. **Migraciones:**
   - [ ] Carpeta `prisma/migrations/` existe
   - [ ] Migración inicial ejecutada exitosamente
   - [ ] Cliente Prisma generado

2. **Tablas:**
   - [ ] 22 tablas creadas en PostgreSQL
   - [ ] Todas las relaciones (foreign keys) existen
   - [ ] Índices creados automáticamente

3. **Datos Iniciales:**
   - [ ] 4 roles creados (ADMIN, GESTOR, ANALISTA, CORREDOR)
   - [ ] 3 modelos de negocio creados
   - [ ] 15+ categorías de dominios
   - [ ] 60+ parámetros
   - [ ] 1 usuario administrador

4. **Integridad:**
   - [ ] No hay registros huérfanos
   - [ ] Todas las foreign keys válidas
   - [ ] Restricciones unique funcionando

5. **Backup:**
   - [ ] Backup post-migración creado
   - [ ] Backup puede restaurarse correctamente

---

### Tests de Validación

**Script:** `/scripts/validate-sprint-1.sh`

```bash
#!/bin/bash

echo "============================================"
echo "VALIDACIÓN SPRINT 1: BASE DE DATOS"
echo "============================================"
echo ""

ERRORS=0

# Test 1: Migraciones
echo "Test 1: Migraciones ejecutadas..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
  echo "✅ Migraciones existen"
else
  echo "❌ Migraciones NO existen"
  ((ERRORS++))
fi

# Test 2: Tablas creadas
echo "Test 2: Tablas en PostgreSQL..."
TABLE_COUNT=$(docker exec databrokers_postgres psql -U databrokers_user -d databrokers -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | xargs)

if [ "$TABLE_COUNT" -eq "22" ]; then
  echo "✅ 22 tablas creadas correctamente"
else
  echo "❌ Esperadas 22 tablas, encontradas: $TABLE_COUNT"
  ((ERRORS++))
fi

# Test 3: Roles
echo "Test 3: Roles iniciales..."
ROLES_COUNT=$(docker exec databrokers_postgres psql -U databrokers_user -d databrokers -t -c "SELECT COUNT(*) FROM roles;" | xargs)

if [ "$ROLES_COUNT" -eq "4" ]; then
  echo "✅ 4 roles creados"
else
  echo "❌ Esperados 4 roles, encontrados: $ROLES_COUNT"
  ((ERRORS++))
fi

# Test 4: Usuario admin
echo "Test 4: Usuario administrador..."
ADMIN_EXISTS=$(docker exec databrokers_postgres psql -U databrokers_user -d databrokers -t -c "SELECT COUNT(*) FROM usuarios WHERE email='admin@databrokers.cl';" | xargs)

if [ "$ADMIN_EXISTS" -eq "1" ]; then
  echo "✅ Usuario admin existe"
else
  echo "❌ Usuario admin NO existe"
  ((ERRORS++))
fi

# Test 5: Modelos de negocio
echo "Test 5: Modelos de negocio..."
MODELS_COUNT=$(docker exec databrokers_postgres psql -U databrokers_user -d databrokers -t -c "SELECT COUNT(*) FROM modelos_negocio;" | xargs)

if [ "$MODELS_COUNT" -eq "3" ]; then
  echo "✅ 3 modelos de negocio creados"
else
  echo "❌ Esperados 3 modelos, encontrados: $MODELS_COUNT"
  ((ERRORS++))
fi

# Test 6: Backup existe
echo "Test 6: Backup de base de datos..."
if ls backups/database/post_migration_*.sql 1> /dev/null 2>&1; then
  echo "✅ Backup existe"
else
  echo "❌ Backup NO existe"
  ((ERRORS++))
fi

# Resultado final
echo ""
echo "============================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅ SPRINT 1 COMPLETADO EXITOSAMENTE"
  echo "Puedes continuar con Sprint 2"
else
  echo "❌ SPRINT 1 INCOMPLETO - $ERRORS errores"
  echo "Corrige los errores antes de continuar"
  exit 1
fi
echo "============================================"
```

---

### Checkpoint y Commit Sprint 1

```bash
# Stage de cambios
git add prisma/migrations/
git add scripts/
git add assets/docs/sprints/SPRINT_1_RESUMEN.md

# Commit
git commit -m "[SPRINT-1] FEAT: Configurar base de datos y ejecutar migraciones

Ejecuta migraciones de Prisma y pobla datos iniciales.
Crea usuario administrador y valida integridad de DB.

- Ejecutar migración inicial (22 tablas)
- Generar cliente Prisma
- Ejecutar seed de datos (roles, dominios, modelos)
- Crear usuario admin (admin@databrokers.cl)
- Crear backup post-migración
- Implementar scripts de validación

Tablas creadas: 22
Registros iniciales: 70+
Usuario admin: ✅ Creado
Tests: ✅ 6/6 pasando
Rollback tag: v1.1.0-sprint1"

# Tag
git tag -a v1.1.0-sprint1 -m "Sprint 1: Base de datos funcional

22 tablas creadas
Datos iniciales poblados
Usuario admin disponible
Sistema validado"

# Push
git push origin refactor/sprint-1-database
git push --tags
```

---

## 🔌 SPRINT 2: CONEXIÓN BACKEND - BASE DE DATOS

### Información General
- **Duración estimada:** 4-6 horas
- **Prioridad:** 🔴 CRÍTICA
- **Dependencias:** Sprint 1 completado
- **Branch:** `refactor/sprint-2-backend-connection`
- **Tag final:** `v1.2.0-sprint2`

### Objetivos
1. Verificar conexión Prisma Client
2. Probar todos los endpoints API
3. Corregir errores de consultas
4. Validar autenticación JWT
5. Probar CRUD completo
6. Generar documentación de API

---

### Tareas Detalladas

#### Tarea 2.1: Verificar Conexión de Prisma

**Archivo de test:** `/scripts/test-prisma-connection.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a base de datos...');

    // Test básico de conexión
    await prisma.$connect();
    console.log('✅ Conexión exitosa');

    // Test de consulta simple
    const rolesCount = await prisma.roles.count();
    console.log(`✅ Roles encontrados: ${rolesCount}`);

    const usuariosCount = await prisma.usuarios.count();
    console.log(`✅ Usuarios encontrados: ${usuariosCount}`);

    // Test de relaciones
    const adminUser = await prisma.usuarios.findFirst({
      where: { email: 'admin@databrokers.cl' },
      include: { rol: true }
    });

    if (adminUser) {
      console.log(`✅ Usuario admin encontrado: ${adminUser.email}`);
      console.log(`   Rol: ${adminUser.rol?.nombre}`);
    }

    console.log('\n🎉 Todas las pruebas pasaron exitosamente');

  } catch (error) {
    console.error('❌ Error de conexión:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

**Ejecutar:**
```bash
npx ts-node scripts/test-prisma-connection.ts
```

---

#### Tarea 2.2: Iniciar Backend en Modo Desarrollo

```bash
# Terminal 1: Backend
npm run dev
```

**Output esperado:**
```
╔════════════════════════════════════════════════╗
║                                                ║
║     🏢  DATABROKERS API - ACTIVO  🚀           ║
║                                                ║
╚════════════════════════════════════════════════╝

📡 Servidor escuchando en puerto: 3000
🌍 Entorno: development
📊 Endpoints API disponibles: 58+
✅ Backend completado al 100%

🔗 URL: http://localhost:3000
🏥 Health Check: http://localhost:3000/health
```

**Validación:**
```bash
# En otra terminal
curl http://localhost:3000/health

# Output esperado:
{
  "status": "OK",
  "timestamp": "2025-11-14T...",
  "uptime": 5.123,
  "environment": "development"
}
```

---

#### Tarea 2.3: Probar Endpoint de Login

**Usando curl:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@databrokers.cl",
    "password": "admin123"
  }'
```

**Output esperado:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 1,
      "email": "admin@databrokers.cl",
      "nombre": "Administrador",
      "rol": "ADMIN"
    }
  }
}
```

**Guardar el token:**
```bash
# Extraer token para uso posterior
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@databrokers.cl","password":"admin123"}' | \
  jq -r '.data.access_token')

echo $TOKEN
```

---

#### Tarea 2.4: Probar Endpoints Protegidos

**Dashboard:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/dashboard
```

**Usuarios:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/users
```

**Propiedades:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/properties
```

---

#### Tarea 2.5: Crear Script de Test de Endpoints

**Archivo:** `/scripts/test-all-endpoints.sh`

```bash
#!/bin/bash

echo "============================================"
echo "TEST DE ENDPOINTS API"
echo "============================================"
echo ""

# Configuración
API_URL="http://localhost:3000/api"
ERRORS=0

# Login y obtener token
echo "1. Login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@databrokers.cl","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')

if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  echo "✅ Login exitoso"
else
  echo "❌ Login falló"
  ((ERRORS++))
  exit 1
fi

# Función de test
test_endpoint() {
  local name=$1
  local endpoint=$2
  local method=${3:-GET}

  echo ""
  echo "Testing: $name ($method $endpoint)"

  if [ "$method" == "GET" ]; then
    RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" $API_URL$endpoint)
  else
    RESPONSE=$(curl -s -X $method -H "Authorization: Bearer $TOKEN" $API_URL$endpoint)
  fi

  SUCCESS=$(echo $RESPONSE | jq -r '.success')

  if [ "$SUCCESS" == "true" ] || [ "$SUCCESS" == "null" ]; then
    echo "✅ $name"
  else
    echo "❌ $name"
    echo "   Response: $RESPONSE"
    ((ERRORS++))
  fi
}

# Tests
test_endpoint "Dashboard" "/dashboard"
test_endpoint "Dashboard Financiero" "/dashboard/financiero"
test_endpoint "Dashboard KPIs" "/dashboard/kpis"
test_endpoint "Usuarios List" "/users"
test_endpoint "Propiedades List" "/properties"
test_endpoint "Proyectos List" "/projects"
test_endpoint "Modelos Negocio" "/business-models"
test_endpoint "Dominios" "/domains"
test_endpoint "Publicaciones" "/publications"
test_endpoint "Canjes" "/trade-ins"
test_endpoint "Reportes" "/reports"

# Resultado
echo ""
echo "============================================"
if [ $ERRORS -eq 0 ]; then
  echo "✅ TODOS LOS ENDPOINTS FUNCIONAN"
else
  echo "❌ $ERRORS endpoints fallaron"
  exit 1
fi
echo "============================================"
```

**Ejecutar:**
```bash
chmod +x scripts/test-all-endpoints.sh
./scripts/test-all-endpoints.sh
```

---

### Criterios de Aceptación Sprint 2

1. **Conexión:**
   - [ ] Prisma Client se conecta a PostgreSQL
   - [ ] Backend inicia sin errores
   - [ ] Health check responde correctamente

2. **Autenticación:**
   - [ ] Login funciona con credenciales correctas
   - [ ] Login falla con credenciales incorrectas
   - [ ] Token JWT se genera correctamente
   - [ ] Refresh token funciona

3. **Endpoints:**
   - [ ] Todos los endpoints GET funcionan
   - [ ] Endpoints protegidos rechazan sin token
   - [ ] CORS permite peticiones desde frontend (puerto 5173)

4. **Datos:**
   - [ ] Las consultas retornan datos reales de la DB
   - [ ] Las relaciones (joins) funcionan
   - [ ] Los filtros y búsquedas funcionan

---

### Checkpoint Sprint 2

```bash
git add scripts/
git add assets/docs/sprints/SPRINT_2_RESUMEN.md

git commit -m "[SPRINT-2] TEST: Validar conexión Backend-Database

Prueba todos los endpoints API contra base de datos real.
Valida autenticación JWT y CORS.

- Crear scripts de test de conexión Prisma
- Probar login y generación de tokens
- Probar todos los endpoints principales (11+)
- Validar CORS desde frontend
- Verificar consultas y relaciones DB

Endpoints testeados: 11
Tests: ✅ 11/11 pasando
Backend funcional: ✅
Rollback tag: v1.2.0-sprint2"

git tag -a v1.2.0-sprint2 -m "Sprint 2: Backend conectado a DB

Todos los endpoints funcionales
Autenticación validada
CORS configurado correctamente"

git push origin refactor/sprint-2-backend-connection
git push --tags
```

---

## 🎨 SPRINT 3: INTEGRACIÓN FRONTEND - BACKEND

### Información General
- **Duración estimada:** 8-10 horas
- **Prioridad:** 🟠 ALTA
- **Dependencias:** Sprint 2 completado
- **Branch:** `refactor/sprint-3-frontend-integration`
- **Tag final:** `v1.3.0-sprint3`

### Objetivos
1. Iniciar frontend en desarrollo
2. Probar login desde UI
3. Validar comunicación con API
4. Corregir errores de CORS (si existen)
5. Probar navegación entre páginas
6. Validar guards de autenticación

---

### Tareas Detalladas

#### Tarea 3.1: Instalar Dependencias de Frontend

```bash
cd frontend
npm install
cd ..
```

---

#### Tarea 3.2: Iniciar Frontend

```bash
# Terminal 2: Frontend (backend debe estar corriendo en Terminal 1)
cd frontend
npm run dev
```

**Output esperado:**
```
VITE v7.2.2  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Validación:**
- Abrir `http://localhost:5173` en navegador
- Debe mostrar la página de login

---

#### Tarea 3.3: Probar Login desde UI

**Pasos manuales:**
1. Ir a `http://localhost:5173/login`
2. Ingresar credenciales:
   - Email: `admin@databrokers.cl`
   - Password: `admin123`
3. Click en "Iniciar Sesión"

**Resultado esperado:**
- ✅ Login exitoso
- ✅ Redirección a `/dashboard`
- ✅ Token guardado en localStorage
- ✅ Menú de usuario visible

**Si falla:**
- Verificar errores en Console del navegador
- Verificar errores CORS
- Verificar que backend está corriendo
- Verificar variable `VITE_API_BASE_URL` en frontend/.env

---

#### Tarea 3.4: Verificar Token en LocalStorage

**En Console del navegador:**
```javascript
// Ver token almacenado
console.log(localStorage.getItem('access_token'));

// Ver usuario
console.log(localStorage.getItem('user'));
```

---

#### Tarea 3.5: Probar Navegación de Páginas

**Páginas a probar:**
- `/dashboard` - Dashboard principal
- `/proyectos` - Lista de proyectos
- `/propiedades` - Lista de propiedades
- `/canjes` - Lista de canjes
- `/publicaciones` - Lista de publicaciones
- `/reportes` - Reportes
- `/profile` - Perfil de usuario

**Para cada página verificar:**
- [ ] Carga sin errores
- [ ] Hace petición al backend correcto
- [ ] Muestra datos (o mensaje "sin datos" si está vacía)
- [ ] No hay errores en Console

---

#### Tarea 3.6: Crear Script de Test E2E Básico

**Archivo:** `/frontend/tests/e2e/login.test.ts` (si usas Playwright/Cypress)

O manualmente documentar en:
**Archivo:** `/assets/docs/sprints/MANUAL_TEST_FRONTEND.md`

```markdown
# TESTS MANUALES FRONTEND

## Test 1: Login
- [ ] Página de login carga correctamente
- [ ] Formulario acepta input
- [ ] Login con credenciales correctas → éxito
- [ ] Login con credenciales incorrectas → error
- [ ] Redirección post-login funciona

## Test 2: Dashboard
- [ ] Dashboard carga después de login
- [ ] KPIs se muestran correctamente
- [ ] Gráficos se renderizan
- [ ] No hay errores de API

## Test 3: Navegación
- [ ] Sidebar funciona
- [ ] Rutas protegidas requieren auth
- [ ] Logout funciona
- [ ] Redirect a login después de logout

## Test 4: CRUD (ejemplo: Proyectos)
- [ ] Lista de proyectos carga
- [ ] Filtros funcionan
- [ ] Botón "Nuevo" abre formulario
- [ ] Formulario valida campos
- [ ] (No crear aún, solo verificar UI)
```

---

### Criterios de Aceptación Sprint 3

1. **Frontend Funcional:**
   - [ ] Frontend inicia sin errores
   - [ ] No hay errores de compilación
   - [ ] Assets se cargan correctamente

2. **Integración:**
   - [ ] Login funciona end-to-end
   - [ ] Token se guarda en localStorage
   - [ ] Peticiones usan el token correcto
   - [ ] No hay errores CORS

3. **Navegación:**
   - [ ] Todas las rutas principales cargan
   - [ ] Guards de auth funcionan
   - [ ] Redirect a login si no autenticado
   - [ ] Logout funciona

4. **UI/UX:**
   - [ ] Componentes se renderizan correctamente
   - [ ] No hay errores en Console
   - [ ] Responsive funciona (opcional)

---

### Checkpoint Sprint 3

```bash
git add frontend/
git add assets/docs/sprints/

git commit -m "[SPRINT-3] FEAT: Integrar Frontend con Backend

Conecta interfaz React con API REST.
Valida login, navegación y comunicación completa.

- Instalar dependencias de frontend
- Configurar variables de entorno
- Probar login end-to-end
- Validar navegación entre páginas
- Verificar guards de autenticación
- Documentar tests manuales

Tests E2E: ✅ Login funcional
Navegación: ✅ Todas las rutas
CORS: ✅ Sin errores
Rollback tag: v1.3.0-sprint3"

git tag -a v1.3.0-sprint3 -m "Sprint 3: Frontend integrado

Login funcional
Navegación completa
Comunicación Frontend-Backend exitosa"

git push origin refactor/sprint-3-frontend-integration
git push --tags
```

---

**Continúa en PLAN_SPRINTS_PARTE_3.md con:**
- Sprint 4: Seguridad y Autenticación Avanzada
- Sprint 5: Testing y Deployment
- Matriz de Dependencias
- Sistema de Alertas

---

*Este es el documento 2 de 3 del Plan de Sprints*
