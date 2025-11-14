# INCONSISTENCIAS CRÍTICAS DETECTADAS
## Proyecto Databrokers - Sistema de Gestión Inmobiliaria

**Fecha:** 14 de Noviembre de 2025
**Versión:** 3.0.0
**Estado:** Pre-Refactorización

---

## 📋 RESUMEN EJECUTIVO

Se detectaron **4 inconsistencias críticas** que impiden la comunicación correcta entre la base de datos PostgreSQL, el backend Express y el frontend React.

| ID | Problema | Severidad | Impacto | Tiempo de Corrección |
|----|----------|-----------|---------|---------------------|
| **P1** | Error sintaxis authorizeRoles() | 🔴 CRÍTICA | Backend no funciona | 1 hora |
| **P2** | Rol ANALISTA faltante | 🟠 ALTA | Usuarios bloqueados | 1.5 horas |
| **P3** | CORS_ORIGIN incorrecto | 🟡 MEDIA | Dev/Prod bloqueado | 30 min |
| **P4** | Variables JWT inconsistentes | 🟢 BAJA | Configuración confusa | 15 min |

**Tiempo Total de Corrección:** 3-4 horas de código + 2-3 horas de testing = **5-7 horas**

---

## 🔴 PROBLEMA #1: ERROR DE SINTAXIS EN AUTHORIZEROLES()

### Severidad: CRÍTICA ⚠️

**Estado:** ❌ SIN CORREGIR
**Prioridad:** P0 - INMEDIATA
**Sprint:** Sprint 1

### Descripción del Problema

La función `authorizeRoles()` en `src/middleware/auth.middleware.ts` espera recibir un **array de strings** como parámetro:

```typescript
// Línea 126 de auth.middleware.ts
export function authorizeRoles(rolesPermitidos: string[]) {
  // La función espera un ARRAY
  return (req: Request, res: Response, next: NextFunction): void => {
    const tienePermiso = rolesPermitidos.includes(req.user.rol.codigo);
    // ...
  };
}
```

Sin embargo, en **4 archivos de rutas** (37 líneas totales) se está invocando con **varargs** (argumentos separados por comas) en lugar de un array:

```typescript
// ❌ INCORRECTO - Código actual
authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')

// ✅ CORRECTO - Debe ser
authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])
```

### Comportamiento del Error

Cuando se ejecuta el código actual:

1. `rolesPermitidos` recibe solo `'ADMIN'` (el primer argumento)
2. Los argumentos `'GESTOR'` y `'ANALISTA'` se **pierden** (no son capturados)
3. `rolesPermitidos.includes(codigo)` busca en el **string** `'ADMIN'` carácter por carácter
4. Siempre deniega acceso excepto en casos muy específicos

**Resultado:** Todas las rutas afectadas **fallan** con `403 Forbidden` incluso para usuarios autorizados.

### Archivos Afectados

| Archivo | Líneas con Error | Total |
|---------|------------------|-------|
| `src/routes/dashboard.routes.ts` | 27, 39, 55, 67, 83, 95, 107, 119, 135, 147, 159 | 11 |
| `src/routes/projects.routes.ts` | 27, 61, 73, 85, 101, 124, 136, 152 | 8 |
| `src/routes/publications.routes.ts` | 27, 40, 52, 65, 77, 90, 106, 118 | 8 |
| `src/routes/reports.routes.ts` | 27, 39, 56, 69, 82, 95, 111, 123, 135, 147 | 10 |
| **TOTAL** | | **37 líneas** |

### Ejemplo Detallado

**Archivo:** `src/routes/dashboard.routes.ts`
**Línea:** 27

```typescript
// ❌ INCORRECTO (Estado actual)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),  // ❌ Error
  dashboardController.getDashboardData
);

// ✅ CORRECTO (Debe ser)
router.get(
  '/',
  authenticateToken,
  authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA']),  // ✅ Array
  dashboardController.getDashboardData
);
```

### Impacto

#### Funcionalidad Afectada

- ❌ Dashboard ejecutivo (11 endpoints)
- ❌ Gestión de proyectos (8 endpoints)
- ❌ Publicaciones a corredores (8 endpoints)
- ❌ Generación de reportes (10 endpoints)

**Total:** 37 endpoints no funcionan correctamente

#### Usuarios Afectados

- ADMIN: Parcialmente afectado
- GESTOR: Completamente bloqueado
- CORREDOR: Parcialmente afectado
- ANALISTA: Completamente bloqueado

#### Severidad del Impacto

- **Crítico:** El sistema no es funcional
- **Bloqueante:** Impide uso normal del sistema
- **Producción:** NO SE PUEDE DEPLOYAR con este error

### Solución

Agregar corchetes `[]` alrededor de los roles en las 37 líneas afectadas.

**Patrón de búsqueda (Regex):**
```regex
authorizeRoles\(('[\w]+'(?:,\s*'[\w]+')+)\)
```

**Patrón de reemplazo:**
```regex
authorizeRoles([$1])
```

### Tiempo de Corrección

- **Manual:** 20-30 minutos
- **Con script:** 5-10 minutos
- **Testing:** 30 minutos
- **Total:** 1 hora

### Verificación

```bash
# Antes de la corrección (debe mostrar ~37 líneas)
grep -n "authorizeRoles('[A-Z]" src/routes/*.ts | wc -l

# Después de la corrección (debe mostrar 0)
grep -n "authorizeRoles('[A-Z]" src/routes/*.ts | wc -l

# Verificar que ahora usan arrays (debe mostrar ~37)
grep -n "authorizeRoles(\[" src/routes/*.ts | wc -l
```

### Referencias

- **Sprint:** Sprint 1 - Corrección Crítica authorizeRoles
- **Archivo Original:** `src/middleware/auth.middleware.ts:126`
- **Documentación:** `PLAN_REFACTORIZACION_SPRINTS.md` - Sprint 1

---

## 🟠 PROBLEMA #2: ROL ANALISTA NO DEFINIDO EN FRONTEND

### Severidad: ALTA ⚠️

**Estado:** ❌ SIN CORREGIR
**Prioridad:** P1 - ALTA
**Sprint:** Sprint 2

### Descripción del Problema

El backend define y utiliza **4 roles**:
- ADMIN ✅
- GESTOR ✅
- CORREDOR ✅
- ANALISTA ✅

El frontend solo define **3 roles** en sus tipos TypeScript:

```typescript
// frontend/src/types/index.ts - Línea 8
export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ADMIN' | 'GESTOR' | 'CORREDOR';  // ❌ Falta 'ANALISTA'
}
```

### Impacto

#### Autenticación

Un usuario con rol ANALISTA en la base de datos:
- ❌ No puede autenticarse correctamente en el frontend
- ❌ TypeScript marca error de tipo en authSlice
- ❌ El token puede ser rechazado por inconsistencia de tipos

#### Navegación y UI

- ❌ Componentes con role-based rendering fallan
- ❌ Rutas protegidas no muestran contenido correcto
- ❌ Sidebar/menú no muestra opciones para ANALISTA

#### Endpoints Backend Afectados

**20 endpoints** del backend requieren rol ANALISTA pero el frontend no puede accederlos:

| Módulo | Endpoints | Ejemplos |
|--------|-----------|----------|
| Dashboard | 11 | `/api/dashboard`, `/api/dashboard/kpis`, `/api/dashboard/charts/*` |
| Reports | 6 | `/api/reports/generate`, `/api/reports/:id/download` |
| Publications | 2 | `/api/publications/statistics`, `/api/publications/:id/activities` |
| Projects | 1 | `/api/projects/:id/statistics` |

### Archivos Probablemente Afectados

```
frontend/src/
├── types/index.ts              # ❌ Definición de User.rol (LÍNEA 8)
├── redux/slices/authSlice.ts   # ⚠️ User state type
├── components/auth/
│   ├── PrivateRoute.tsx        # ⚠️ Role validation
│   └── RoleBasedAccess.tsx     # ⚠️ Role rendering
├── components/layout/
│   └── Sidebar.tsx             # ⚠️ Menu by role
└── pages/
    ├── DashboardPage.tsx       # ⚠️ Requiere ANALISTA
    └── ReportsPage.tsx         # ⚠️ Requiere ANALISTA
```

### Solución

Agregar `'ANALISTA'` al union type de `User.rol`:

```typescript
// ✅ CORRECTO
export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ADMIN' | 'GESTOR' | 'CORREDOR' | 'ANALISTA';  // ✅ Con ANALISTA
}
```

### Permisos Recomendados para ANALISTA

| Funcionalidad | Permiso |
|---------------|---------|
| Dashboard | ✅ Lectura |
| Reportes | ✅ Generación y descarga |
| Estadísticas | ✅ Visualización |
| Proyectos | ✅ Lectura |
| Propiedades | ✅ Lectura |
| Publicaciones | ✅ Lectura |
| Crear/Editar Proyectos | ❌ No |
| Crear/Editar Propiedades | ❌ No |
| Gestión de Usuarios | ❌ No |

### Tiempo de Corrección

- **Actualizar tipo User:** 2 minutos
- **Verificar componentes:** 30 minutos
- **Actualizar sidebar/menú:** 20 minutos
- **Testing con usuario ANALISTA:** 30 minutos
- **Total:** 1.5 horas

### Verificación

```bash
# Verificar tipo actualizado
grep "ANALISTA" frontend/src/types/index.ts

# Compilar frontend
cd frontend && npm run build

# Debe compilar sin errores TypeScript
```

### Testing

1. Crear usuario ANALISTA en BD
2. Login con usuario ANALISTA
3. Verificar acceso a:
   - ✅ Dashboard
   - ✅ Reportes
   - ✅ Estadísticas
4. Verificar NO acceso a:
   - ❌ Crear proyectos
   - ❌ Editar propiedades
   - ❌ Gestionar usuarios

### Referencias

- **Sprint:** Sprint 2 - Sincronización Rol ANALISTA
- **Archivo Principal:** `frontend/src/types/index.ts:8`
- **Documentación:** `PLAN_REFACTORIZACION_SPRINTS.md` - Sprint 2

---

## 🟡 PROBLEMA #3: CORS_ORIGIN CONFIGURADO PARA PUERTO INCORRECTO

### Severidad: MEDIA ⚠️

**Estado:** ❌ SIN CORREGIR
**Prioridad:** P2 - MEDIA
**Sprint:** Sprint 3

### Descripción del Problema

El archivo `.env.example` del backend tiene configurado CORS para puerto **3001**, pero el frontend de Vite corre en puerto **5173**.

**Backend `.env.example`:**
```env
CORS_ORIGIN="http://localhost:3001"  # ❌ Puerto incorrecto
```

**Frontend `vite.config.ts`:**
```typescript
server: {
  port: 5173,  // ✅ Puerto real del frontend
}
```

### Impacto

Si un desarrollador copia `.env.example` a `.env` sin modificarlo:

1. El frontend en `http://localhost:5173` será **bloqueado por CORS**
2. Todas las llamadas API fallarán con error:
   ```
   Access to XMLHttpRequest at 'http://localhost:3000/api/...'
   from origin 'http://localhost:5173' has been blocked by CORS policy
   ```
3. Mensajes de error en consola del navegador
4. Sistema completamente no funcional

### Escenarios

| Escenario | Archivo .env | Resultado |
|-----------|--------------|-----------|
| Sin .env | (usa default '*') | ✅ Funciona |
| Con .env copiado de .env.example | CORS_ORIGIN="http://localhost:3001" | ❌ Bloqueado |
| Con .env actualizado | CORS_ORIGIN="http://localhost:5173" | ✅ Funciona |

### Workaround Temporal

El frontend tiene un proxy configurado que **mitiga** el problema en desarrollo:

```typescript
// frontend/vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

**⚠️ Pero este proxy solo funciona en `npm run dev`, NO en producción.**

### Solución

#### Opción 1: Actualizar .env.example (Simple)

```env
CORS_ORIGIN="http://localhost:5173"  # ✅ Puerto correcto
```

#### Opción 2: Soportar Múltiples Orígenes (Recomendado)

**Actualizar `.env.example`:**
```env
# Soporta múltiples orígenes separados por coma
CORS_ORIGIN="http://localhost:5173,http://localhost:3001,http://localhost:4173"
```

**Actualizar `src/index.ts`:**
```typescript
// ❌ ANTES
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// ✅ DESPUÉS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || '*',
  credentials: true,
}));
```

### Configuración para Producción

Crear `.env.production.example`:
```env
CORS_ORIGIN="https://databrokers.cl,https://www.databrokers.cl,https://app.databrokers.cl"
```

### Tiempo de Corrección

- **Actualizar .env.example:** 2 minutos
- **Actualizar código CORS:** 10 minutos
- **Testing:** 15 minutos
- **Total:** 30 minutos

### Verificación

```bash
# Testing CORS
curl -X OPTIONS http://localhost:3000/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Debe retornar:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Credentials: true
```

### Referencias

- **Sprint:** Sprint 3 - Corrección CORS y Variables
- **Archivo Backend:** `.env.example:14`
- **Archivo Código:** `src/index.ts:40-43`
- **Documentación:** `PLAN_REFACTORIZACION_SPRINTS.md` - Sprint 3

---

## 🟢 PROBLEMA #4: VARIABLES DE ENTORNO JWT CON NOMBRES INCONSISTENTES

### Severidad: BAJA ℹ️

**Estado:** ❌ SIN CORREGIR
**Prioridad:** P3 - BAJA
**Sprint:** Sprint 3

### Descripción del Problema

Las variables de entorno JWT tienen nombres diferentes entre `.env.example` y el código que las consume.

**Archivo `.env.example`:**
```env
JWT_EXPIRATION="7d"
JWT_REFRESH_EXPIRATION="30d"
```

**Código en `auth.controller.ts`:**
```typescript
const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
```

### Impacto

- Si se usa `.env.example` tal cual, las variables **no se leerán**
- Se usarán valores por defecto del código
- Puede causar confusión en configuración
- Los tiempos de expiración serán diferentes a los esperados

### Valores por Defecto Diferentes

| Variable | .env.example | Código default | Valor real usado |
|----------|--------------|----------------|------------------|
| JWT Expiration | 7 días | 24 horas | **24h** (default del código) |
| JWT Refresh | 30 días | 7 días | **7d** (default del código) |

### Ejemplo de Confusión

Un desarrollador configura:
```env
# .env
JWT_EXPIRATION="30d"  # Espera tokens de 30 días
```

Pero el código busca `JWT_EXPIRES_IN`, entonces usa el default `'24h'`.

**Resultado:** Tokens expiran en 24 horas, no 30 días como esperaba.

### Solución

#### Opción 1: Actualizar .env.example (Recomendado)

```env
# ✅ CORRECTO - Coincide con código
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"
```

**Razón:** `JWT_EXPIRES_IN` es más estándar en la comunidad.

#### Opción 2: Actualizar código

```typescript
// Cambiar código para leer JWT_EXPIRATION
const expiresIn = process.env.JWT_EXPIRATION || '24h';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRATION || '7d';
```

### Tiempo de Corrección

- **Actualizar .env.example:** 2 minutos
- **Documentar cambio:** 3 minutos
- **Total:** 5 minutos

### Verificación

```bash
# Verificar que variables se lean correctamente
grep "JWT_EXPIRES_IN\|JWT_REFRESH_EXPIRES_IN" .env

# Testing de login para verificar expiración
# El token debe tener el exp correcto cuando se decodifica en jwt.io
```

### Referencias

- **Sprint:** Sprint 3 - Corrección CORS y Variables
- **Archivo:** `.env.example:5-7`
- **Archivo Código:** `src/controllers/auth.controller.ts`
- **Documentación:** `PLAN_REFACTORIZACION_SPRINTS.md` - Sprint 3

---

## 📊 MATRIZ DE IMPACTO

### Por Componente

| Componente | P1 (authorizeRoles) | P2 (ANALISTA) | P3 (CORS) | P4 (JWT vars) |
|------------|---------------------|---------------|-----------|---------------|
| **Base de Datos** | - | - | - | - |
| **Backend** | 🔴 CRÍTICO | - | 🟡 MEDIO | 🟢 BAJO |
| **Frontend** | - | 🟠 ALTO | 🟡 MEDIO | - |
| **Integración** | 🔴 CRÍTICO | 🟠 ALTO | 🟡 MEDIO | - |

### Por Usuario

| Rol | P1 | P2 | P3 | P4 |
|-----|----|----|----|----|
| **ADMIN** | 🟡 Parcial | - | 🟡 MEDIO | - |
| **GESTOR** | 🔴 BLOQUEADO | - | 🟡 MEDIO | - |
| **CORREDOR** | 🟡 Parcial | - | 🟡 MEDIO | - |
| **ANALISTA** | 🔴 BLOQUEADO | 🔴 BLOQUEADO | 🟡 MEDIO | - |

### Por Entorno

| Entorno | P1 | P2 | P3 | P4 |
|---------|----|----|----|----|
| **Desarrollo** | 🔴 NO FUNCIONA | 🟠 PARCIAL | 🟡 WORKAROUND | 🟢 LEVE |
| **Testing** | 🔴 NO FUNCIONA | 🟠 NO FUNCIONA | 🟡 BLOQUEADO | 🟢 LEVE |
| **Producción** | 🔴 NO DEPLOYABLE | 🔴 NO DEPLOYABLE | 🔴 CRÍTICO | 🟡 CONFUSO |

---

## 🚨 ALERTAS Y ADVERTENCIAS

### ⛔ NO DEPLOYAR A PRODUCCIÓN

**El sistema NO debe deployarse a producción hasta corregir al menos P1 y P2.**

Razones:
1. **P1** causa que 37 endpoints fallen con 403
2. **P2** bloquea completamente a usuarios ANALISTA
3. **P3** bloqueará el frontend en producción (no hay proxy)

### ⚠️ Testing Requerido

Después de cada corrección:

1. **Testing de Compilación:**
   ```bash
   npm run build
   cd frontend && npm run build
   ```

2. **Testing de Autenticación:**
   - Login con cada rol (ADMIN, GESTOR, CORREDOR, ANALISTA)
   - Verificar acceso a endpoints correspondientes

3. **Testing de Integración:**
   - Flujo completo: Login → Dashboard → Reportes
   - Verificar CORS no bloquea

### 📝 Documentación Requerida

Después de correcciones:

1. Actualizar README.md con:
   - Roles correctos (incluir ANALISTA)
   - Variables de entorno correctas
   - Configuración CORS

2. Crear CHANGELOG.md con:
   - Lista de correcciones
   - Breaking changes
   - Migration guide

---

## 🔧 HERRAMIENTAS DE DETECCIÓN

### Scripts de Verificación

```bash
# Script: verify-consistency.sh
#!/bin/bash

echo "🔍 Verificando consistencias..."

# P1: authorizeRoles
echo "\n1. Verificando authorizeRoles()..."
INCORRECT=$(grep -n "authorizeRoles('[A-Z]" src/routes/*.ts | wc -l)
if [ $INCORRECT -gt 0 ]; then
  echo "❌ P1: $INCORRECT líneas con sintaxis incorrecta"
else
  echo "✅ P1: authorizeRoles correcto"
fi

# P2: Rol ANALISTA
echo "\n2. Verificando rol ANALISTA en frontend..."
if grep -q "ANALISTA" frontend/src/types/index.ts; then
  echo "✅ P2: Rol ANALISTA definido"
else
  echo "❌ P2: Rol ANALISTA faltante"
fi

# P3: CORS_ORIGIN
echo "\n3. Verificando CORS_ORIGIN..."
CORS=$(grep "CORS_ORIGIN" .env.example | grep "5173")
if [ -n "$CORS" ]; then
  echo "✅ P3: CORS_ORIGIN correcto"
else
  echo "❌ P3: CORS_ORIGIN incorrecto"
fi

# P4: Variables JWT
echo "\n4. Verificando variables JWT..."
if grep -q "JWT_EXPIRES_IN" .env.example; then
  echo "✅ P4: Variables JWT estandarizadas"
else
  echo "⚠️  P4: Variables JWT inconsistentes"
fi

echo "\n✅ Verificación completada"
```

### Testing Automatizado

```bash
# Script: test-all.sh
#!/bin/bash

echo "🧪 Ejecutando tests..."

# Backend
echo "\n1. Backend:"
npm run build
if [ $? -eq 0 ]; then
  echo "✅ Backend compila"
else
  echo "❌ Backend falla"
  exit 1
fi

# Frontend
echo "\n2. Frontend:"
cd frontend
npm run build
if [ $? -eq 0 ]; then
  echo "✅ Frontend compila"
else
  echo "❌ Frontend falla"
  exit 1
fi
cd ..

echo "\n✅ Todos los tests pasaron"
```

---

## 📈 MÉTRICAS DE CALIDAD

### Antes de Correcciones

| Métrica | Valor | Estado |
|---------|-------|--------|
| Endpoints funcionales | 21/58 (36%) | 🔴 CRÍTICO |
| Roles funcionales | 2/4 (50%) | 🟠 MEDIO |
| Tests pasando | 0/10 (0%) | 🔴 CRÍTICO |
| Compilación exitosa | ❌ Backend falla | 🔴 CRÍTICO |
| Deployable a producción | ❌ NO | 🔴 CRÍTICO |

### Después de Correcciones (Esperado)

| Métrica | Valor | Estado |
|---------|-------|--------|
| Endpoints funcionales | 58/58 (100%) | ✅ EXCELENTE |
| Roles funcionales | 4/4 (100%) | ✅ EXCELENTE |
| Tests pasando | 10/10 (100%) | ✅ EXCELENTE |
| Compilación exitosa | ✅ Backend + Frontend | ✅ EXCELENTE |
| Deployable a producción | ✅ SÍ | ✅ EXCELENTE |

---

## 📚 REFERENCIAS

### Documentos Relacionados

1. **AUDITORIA_COMPLETA.md** - Auditoría exhaustiva del proyecto
2. **PLAN_REFACTORIZACION_SPRINTS.md** - Plan detallado de sprints
3. **README.md** - Documentación principal del proyecto

### Archivos Clave

#### Backend
- `src/middleware/auth.middleware.ts:126` - Definición de authorizeRoles()
- `src/routes/dashboard.routes.ts` - 11 líneas a corregir
- `src/routes/projects.routes.ts` - 8 líneas a corregir
- `src/routes/publications.routes.ts` - 8 líneas a corregir
- `src/routes/reports.routes.ts` - 10 líneas a corregir
- `.env.example` - Variables de entorno
- `src/index.ts:40-43` - Configuración CORS

#### Frontend
- `frontend/src/types/index.ts:8` - Definición de User.rol
- `frontend/vite.config.ts:14` - Puerto del servidor
- `frontend/.env.example` - Variables de entorno

#### Database
- `prisma/schema.prisma` - Schema completo
- Rol ANALISTA ya definido en tabla `roles`

---

## 🎯 PRÓXIMOS PASOS

1. **Revisar este documento completo** ✅
2. **Leer PLAN_REFACTORIZACION_SPRINTS.md**
3. **Ejecutar Sprint 0: Setup**
4. **Ejecutar Sprint 1: Corrección authorizeRoles** (CRÍTICO)
5. **Ejecutar Sprint 2: Rol ANALISTA** (ALTO)
6. **Ejecutar Sprint 3: CORS y Variables** (MEDIO)
7. **Ejecutar Sprint 4: Testing** (REQUERIDO)
8. **Deployment**

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Pre-Corrección

- [ ] Leer AUDITORIA_COMPLETA.md
- [ ] Leer este documento (INCONSISTENCIAS_CRITICAS.md)
- [ ] Leer PLAN_REFACTORIZACION_SPRINTS.md
- [ ] Crear backups de BD y código
- [ ] Crear branch de trabajo
- [ ] Instalar dependencias

### Post-Corrección

- [ ] P1: authorizeRoles corregido (37 líneas)
- [ ] P2: Rol ANALISTA agregado al frontend
- [ ] P3: CORS_ORIGIN actualizado
- [ ] P4: Variables JWT estandarizadas
- [ ] Backend compila sin errores
- [ ] Frontend compila sin errores
- [ ] Tests de autenticación pasan
- [ ] Tests de integración pasan
- [ ] Documentación actualizada

---

**DOCUMENTO CRÍTICO - LEER ANTES DE EMPEZAR CORRECCIONES**

**Última Actualización:** 14 de Noviembre de 2025
