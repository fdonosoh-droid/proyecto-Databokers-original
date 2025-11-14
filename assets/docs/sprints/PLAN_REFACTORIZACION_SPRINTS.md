# PLAN DE REFACTORIZACIÓN - SPRINTS SECUENCIALES
## Sistema de Gestión Inmobiliaria Databrokers

**Fecha Inicio:** 14 de Noviembre de 2025
**Versión del Proyecto:** 3.0.0
**Metodología:** Sprints cortos y secuenciales
**Sistema de Control:** Git + Puntos de Rollback

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Estructura de Sprints](#estructura-de-sprints)
3. [Sistema de Rollback](#sistema-de-rollback)
4. [Sprint 0: Setup y Preparación](#sprint-0-setup-y-preparación)
5. [Sprint 1: Corrección Crítica authorizeRoles](#sprint-1-corrección-crítica-authorizeroles)
6. [Sprint 2: Sincronización Rol ANALISTA](#sprint-2-sincronización-rol-analista)
7. [Sprint 3: Corrección CORS y Variables](#sprint-3-corrección-cors-y-variables)
8. [Sprint 4: Testing y Validación](#sprint-4-testing-y-validación)
9. [Sprint 5: Optimizaciones Finales](#sprint-5-optimizaciones-finales)
10. [Comandos Git Rápidos](#comandos-git-rápidos)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 INTRODUCCIÓN

### Objetivo

Corregir las **4 inconsistencias críticas** detectadas en la auditoría del proyecto Databrokers, asegurando que la base de datos PostgreSQL, el backend Express y el frontend React se comuniquen correctamente.

### Problemas a Resolver

| ID | Problema | Severidad | Archivos Afectados | Tiempo Estimado |
|----|----------|-----------|-------------------|-----------------|
| **P1** | Error sintaxis authorizeRoles() | 🔴 CRÍTICA | 4 archivos, 37 líneas | 1 hora |
| **P2** | Rol ANALISTA faltante en frontend | 🟠 ALTA | 1-5 archivos | 1.5 horas |
| **P3** | CORS_ORIGIN puerto incorrecto | 🟡 MEDIA | 1-2 archivos | 30 min |
| **P4** | Variables JWT inconsistentes | 🟢 BAJA | 1 archivo | 15 min |

**Total Estimado:** 8-9 horas de trabajo (incluyendo testing)

### Metodología de Trabajo

1. **Sprints Cortos:** 30 min - 2 horas cada uno
2. **Secuenciales:** Uno termina antes de empezar el siguiente
3. **Documentados:** Archivo .md al finalizar cada sprint
4. **Versionados:** Git commit + tag al finalizar cada sprint
5. **Reversibles:** Puntos de rollback en cada sprint

---

## 🏗️ ESTRUCTURA DE SPRINTS

```
Sprint 0: Setup y Preparación (30 min)
    ↓
Sprint 1: Corrección Crítica authorizeRoles (1 hora)
    ↓
Sprint 2: Sincronización Rol ANALISTA (1.5 horas)
    ↓
Sprint 3: Corrección CORS y Variables (45 min)
    ↓
Sprint 4: Testing y Validación (2 horas)
    ↓
Sprint 5: Optimizaciones Finales (3 horas) [OPCIONAL]
```

### Convenciones de Nombres

- **Branch Principal:** `main` o `master`
- **Branch de Trabajo:** `refactor/fix-inconsistencias-nov-2025`
- **Tags de Sprint:** `sprint-0-setup`, `sprint-1-authorizeroles`, etc.
- **Commits:** Prefijos `[SPRINT-N]` seguido de descripción

---

## 🔄 SISTEMA DE ROLLBACK

### Puntos de Rollback por Sprint

Cada sprint crea un **tag de Git** que sirve como punto de rollback:

```bash
# Listar todos los puntos de rollback
git tag --list "sprint-*"

# Volver a un sprint específico
git checkout sprint-1-authorizeroles

# O crear branch desde ese punto
git checkout -b rollback-to-sprint-1 sprint-1-authorizeroles
```

### Archivos de Estado

Cada sprint genera un archivo `.md` de estado:

```
assets/docs/sprints/
├── SPRINT_0_SETUP.md
├── SPRINT_1_AUTHORIZEROLES_COMPLETADO.md
├── SPRINT_2_ROL_ANALISTA_COMPLETADO.md
├── SPRINT_3_CORS_VARS_COMPLETADO.md
├── SPRINT_4_TESTING_COMPLETADO.md
└── SPRINT_5_OPTIMIZACIONES_COMPLETADO.md
```

### Estrategia de Backup

Antes de cada sprint:

```bash
# Crear backup de base de datos
pg_dump -U usuario -h localhost databrokers > backup/databrokers_sprint_N.sql

# Crear backup de archivos
tar -czf backup/proyecto_sprint_N.tar.gz \
  src/ \
  frontend/ \
  prisma/ \
  package.json \
  .env.example
```

### Comandos de Rollback

```bash
# 1. Rollback completo a sprint anterior
git reset --hard sprint-N-nombre

# 2. Rollback solo de archivos específicos
git checkout sprint-N-nombre -- src/routes/dashboard.routes.ts

# 3. Restaurar base de datos
psql -U usuario -h localhost databrokers < backup/databrokers_sprint_N.sql

# 4. Ver diferencias entre sprints
git diff sprint-1-authorizeroles sprint-2-rol-analista
```

---

## 🚀 SPRINT 0: SETUP Y PREPARACIÓN

### Objetivos

1. Crear branch de trabajo
2. Configurar estructura de documentación
3. Crear primer backup
4. Validar entorno de desarrollo

### Duración Estimada

**30 minutos**

### Prerrequisitos

- [ ] Git instalado y configurado
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL 14+ instalado y corriendo
- [ ] pgAdmin4 instalado (opcional)
- [ ] Editor de código (VSCode recomendado)

### Checklist Pre-Sprint

```bash
# Verificar versiones
node --version    # >= 18.0.0
npm --version     # >= 9.0.0
psql --version    # >= 14.0
git --version     # >= 2.30

# Verificar PostgreSQL corriendo
sudo systemctl status postgresql  # Ubuntu/Linux
# o
pg_isready

# Verificar base de datos existe
psql -U usuario -h localhost -l | grep databrokers
```

### Tareas

#### Tarea 0.1: Validar Estado Actual

**Tiempo:** 5 minutos

```bash
# 1. Ir al directorio del proyecto
cd /home/user/proyecto-Databokers-original

# 2. Verificar branch actual
git branch

# 3. Verificar estado
git status

# 4. Ver últimos commits
git log --oneline -5

# 5. Verificar que no hay cambios sin commitear
# Si hay cambios: decidir si commitear o descartar
```

**✅ Criterio de Éxito:** No hay cambios sin commitear o están respaldados.

#### Tarea 0.2: Crear Branch de Trabajo

**Tiempo:** 2 minutos

```bash
# 1. Crear y cambiar a branch de refactorización
git checkout -b refactor/fix-inconsistencias-nov-2025

# 2. Verificar
git branch
# Debe mostrar: * refactor/fix-inconsistencias-nov-2025

# 3. Hacer push del branch (opcional, para backup en remoto)
git push -u origin refactor/fix-inconsistencias-nov-2025
```

**✅ Criterio de Éxito:** Branch creado y activo.

#### Tarea 0.3: Crear Estructura de Documentación

**Tiempo:** 3 minutos

```bash
# 1. Crear directorios
mkdir -p assets/docs/sprints
mkdir -p backup/database
mkdir -p backup/code

# 2. Verificar estructura
ls -la assets/docs/sprints
```

**✅ Criterio de Éxito:** Directorios creados.

#### Tarea 0.4: Crear Backup Inicial

**Tiempo:** 10 minutos

```bash
# 1. Backup de base de datos
pg_dump -U usuario -h localhost databrokers \
  > backup/database/databrokers_pre_refactor_$(date +%Y%m%d_%H%M%S).sql

# 2. Verificar backup
ls -lh backup/database/

# 3. Backup de código
tar -czf backup/code/proyecto_pre_refactor_$(date +%Y%m%d_%H%M%S).tar.gz \
  --exclude=node_modules \
  --exclude=frontend/node_modules \
  --exclude=dist \
  --exclude=frontend/dist \
  --exclude=.git \
  src/ \
  frontend/ \
  prisma/ \
  package.json \
  package-lock.json \
  .env.example

# 4. Verificar backup
ls -lh backup/code/
```

**⚠️ Importante:** Guardar estos backups en un lugar seguro fuera del proyecto.

**✅ Criterio de Éxito:** Backups creados y verificados.

#### Tarea 0.5: Instalar Dependencias

**Tiempo:** 5 minutos

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

**✅ Criterio de Éxito:** Dependencias instaladas sin errores.

#### Tarea 0.6: Crear Tag Inicial

**Tiempo:** 2 minutos

```bash
# 1. Commit del setup
git add .
git commit -m "[SPRINT-0] Setup inicial para refactorización"

# 2. Crear tag
git tag -a sprint-0-setup -m "Sprint 0: Setup y preparación completado"

# 3. Ver tags
git tag

# 4. Push tag (opcional)
git push origin sprint-0-setup
```

**✅ Criterio de Éxito:** Tag `sprint-0-setup` creado.

#### Tarea 0.7: Crear Documento de Sprint

**Tiempo:** 3 minutos

Crear archivo `assets/docs/sprints/SPRINT_0_SETUP.md`:

```markdown
# SPRINT 0: SETUP Y PREPARACIÓN

## Fecha
[FECHA_ACTUAL]

## Objetivos
✅ Branch de trabajo creado
✅ Estructura de documentación creada
✅ Backups creados
✅ Dependencias instaladas
✅ Tag sprint-0-setup creado

## Cambios Realizados
- Creado branch: refactor/fix-inconsistencias-nov-2025
- Creados directorios: assets/docs/sprints, backup/
- Backups: database y código

## Punto de Rollback
Tag: sprint-0-setup
Comando: git checkout sprint-0-setup

## Próximo Sprint
Sprint 1: Corrección Crítica authorizeRoles

## Notas
[Agregar cualquier nota relevante]
```

### Verificación Final Sprint 0

```bash
# Checklist de verificación
git branch | grep "refactor/fix-inconsistencias-nov-2025"  # ✅
git tag | grep "sprint-0-setup"                            # ✅
ls assets/docs/sprints/SPRINT_0_SETUP.md                   # ✅
ls backup/database/*.sql                                    # ✅
ls backup/code/*.tar.gz                                     # ✅
```

### ✅ Sprint 0 Completado

**Punto de Rollback:** `sprint-0-setup`

**Comando para continuar:**
```bash
# Listo para empezar Sprint 1
git log --oneline -1
# Debe mostrar: [SPRINT-0] Setup inicial para refactorización
```

---

## 🔧 SPRINT 1: CORRECCIÓN CRÍTICA AUTHORIZEROLES

### Objetivos

Corregir el error de sintaxis en la función `authorizeRoles()` en 4 archivos de rutas.

### Severidad

🔴 **CRÍTICA** - Sin esta corrección, el backend no funcionará correctamente.

### Duración Estimada

**1 hora** (incluyendo testing)

### Problema a Resolver

La función `authorizeRoles()` espera un **array** pero se está llamando con **varargs** en 37 líneas de código.

### Archivos a Modificar

1. `src/routes/dashboard.routes.ts` - 11 líneas
2. `src/routes/projects.routes.ts` - 8 líneas
3. `src/routes/publications.routes.ts` - 8 líneas
4. `src/routes/reports.routes.ts` - 10 líneas

**Total:** 4 archivos, 37 líneas

### Tareas

#### Tarea 1.1: Validar Problema

**Tiempo:** 5 minutos

```bash
# 1. Buscar todas las ocurrencias del patrón incorrecto
grep -n "authorizeRoles('[A-Z]" src/routes/*.ts

# Debe mostrar ~37 líneas con el patrón incorrecto

# 2. Ver un ejemplo del problema
head -30 src/routes/dashboard.routes.ts | grep -A2 -B2 authorizeRoles
```

**✅ Criterio de Éxito:** Patrón incorrecto identificado.

#### Tarea 1.2: Corregir dashboard.routes.ts

**Tiempo:** 10 minutos

**Archivo:** `src/routes/dashboard.routes.ts`

**Líneas a corregir:** 27, 39, 55, 67, 83, 95, 107, 119, 135, 147, 159

**Patrón de búsqueda:**
```typescript
authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')
```

**Reemplazo:**
```typescript
authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])
```

**Ejemplo:**

```typescript
// ❌ ANTES (Línea 27)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.getDashboardData
);

// ✅ DESPUÉS
router.get(
  '/',
  authenticateToken,
  authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA']),
  dashboardController.getDashboardData
);
```

**Cambios detallados:**

| Línea | Antes | Después |
|-------|-------|---------|
| 27 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 39 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 55 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 67 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 83 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 95 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 107 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 119 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 135 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 147 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 159 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |

**✅ Criterio de Éxito:** 11 líneas corregidas en dashboard.routes.ts

#### Tarea 1.3: Corregir projects.routes.ts

**Tiempo:** 8 minutos

**Archivo:** `src/routes/projects.routes.ts`

**Líneas a corregir:** 27, 61, 73, 85, 101, 124, 136, 152

**Cambios detallados:**

| Línea | Antes | Después |
|-------|-------|---------|
| 27 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |
| 61 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |
| 73 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |
| 85 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 101 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |
| 124 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |
| 136 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |
| 152 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |

**✅ Criterio de Éxito:** 8 líneas corregidas en projects.routes.ts

#### Tarea 1.4: Corregir publications.routes.ts

**Tiempo:** 8 minutos

**Archivo:** `src/routes/publications.routes.ts`

**Líneas a corregir:** 27, 40, 52, 65, 77, 90, 106, 118

**Cambios detallados:**

| Línea | Antes | Después |
|-------|-------|---------|
| 27 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |
| 40 | `authorizeRoles('ADMIN', 'GESTOR', 'CORREDOR')` | `authorizeRoles(['ADMIN', 'GESTOR', 'CORREDOR'])` |
| 52 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 65 | `authorizeRoles('ADMIN', 'GESTOR', 'CORREDOR')` | `authorizeRoles(['ADMIN', 'GESTOR', 'CORREDOR'])` |
| 77 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |
| 90 | `authorizeRoles('ADMIN', 'GESTOR', 'CORREDOR')` | `authorizeRoles(['ADMIN', 'GESTOR', 'CORREDOR'])` |
| 106 | `authorizeRoles('ADMIN', 'GESTOR', 'CORREDOR')` | `authorizeRoles(['ADMIN', 'GESTOR', 'CORREDOR'])` |
| 118 | `authorizeRoles('ADMIN', 'GESTOR', 'CORREDOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'CORREDOR', 'ANALISTA'])` |

**✅ Criterio de Éxito:** 8 líneas corregidas en publications.routes.ts

#### Tarea 1.5: Corregir reports.routes.ts

**Tiempo:** 10 minutos

**Archivo:** `src/routes/reports.routes.ts`

**Líneas a corregir:** 27, 39, 56, 69, 82, 95, 111, 123, 135, 147

**Cambios detallados:**

| Línea | Antes | Después |
|-------|-------|---------|
| 27 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 39 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 56 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 69 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 82 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 95 | `authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')` | `authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])` |
| 111 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |
| 123 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |
| 135 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |
| 147 | `authorizeRoles('ADMIN', 'GESTOR')` | `authorizeRoles(['ADMIN', 'GESTOR'])` |

**✅ Criterio de Éxito:** 10 líneas corregidas en reports.routes.ts

#### Tarea 1.6: Verificar Correcciones

**Tiempo:** 5 minutos

```bash
# 1. Buscar que NO haya más patrones incorrectos
grep -n "authorizeRoles('[A-Z]" src/routes/*.ts

# NO debe mostrar resultados (o solo archivos correctos)

# 2. Verificar que los arrays estén correctos
grep -n "authorizeRoles(\[" src/routes/*.ts | wc -l

# Debe mostrar al menos 37 líneas

# 3. Ver diferencias
git diff src/routes/dashboard.routes.ts
git diff src/routes/projects.routes.ts
git diff src/routes/publications.routes.ts
git diff src/routes/reports.routes.ts
```

**✅ Criterio de Éxito:** No hay patrones incorrectos, todos usan arrays.

#### Tarea 1.7: Compilar TypeScript

**Tiempo:** 3 minutos

```bash
# Compilar backend
npm run build

# Debe compilar sin errores
```

**⚠️ Si hay errores:**
- Revisar sintaxis
- Verificar que todos los corchetes estén balanceados

**✅ Criterio de Éxito:** Compilación exitosa sin errores.

#### Tarea 1.8: Testing Rápido

**Tiempo:** 10 minutos

```bash
# 1. Iniciar backend
npm run dev

# Debe iniciar sin errores en puerto 3000

# 2. En otra terminal, probar health check
curl http://localhost:3000/health

# Debe retornar JSON con status OK

# 3. Probar endpoint con authorizeRoles (requiere token)
# Crear usuario de prueba si no existe
npm run create-admin

# 4. Login para obtener token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@databrokers.cl","password":"admin123"}'

# Copiar el token de la respuesta

# 5. Probar endpoint protegido
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer <TOKEN>"

# Debe retornar datos del dashboard (no 403)
```

**✅ Criterio de Éxito:** Endpoints responden correctamente con autorización.

#### Tarea 1.9: Commit y Tag

**Tiempo:** 3 minutos

```bash
# 1. Ver cambios
git status

# 2. Agregar archivos modificados
git add src/routes/dashboard.routes.ts
git add src/routes/projects.routes.ts
git add src/routes/publications.routes.ts
git add src/routes/reports.routes.ts

# 3. Commit
git commit -m "[SPRINT-1] Fix: Corregir sintaxis de authorizeRoles() en 4 archivos de rutas

Problema: authorizeRoles() espera array pero se llamaba con varargs
Solución: Agregados corchetes [] en 37 líneas
Archivos: dashboard, projects, publications, reports routes

Severidad: CRÍTICA
Impacto: Autenticación RBAC ahora funciona correctamente"

# 4. Crear tag
git tag -a sprint-1-authorizeroles -m "Sprint 1: Corrección authorizeRoles completado"

# 5. Verificar
git log --oneline -1
git tag
```

**✅ Criterio de Éxito:** Commit y tag creados.

#### Tarea 1.10: Documentar Sprint

**Tiempo:** 5 minutos

Crear archivo `assets/docs/sprints/SPRINT_1_AUTHORIZEROLES_COMPLETADO.md`:

```markdown
# SPRINT 1: CORRECCIÓN CRÍTICA AUTHORIZEROLES

## Fecha
[FECHA]

## Objetivos
✅ Corregir error de sintaxis en authorizeRoles()
✅ 4 archivos corregidos
✅ 37 líneas modificadas
✅ Testing exitoso
✅ Backend compilando correctamente

## Problema Resuelto
Error de sintaxis: authorizeRoles() esperaba array pero se llamaba con varargs

## Archivos Modificados
1. src/routes/dashboard.routes.ts (11 líneas)
2. src/routes/projects.routes.ts (8 líneas)
3. src/routes/publications.routes.ts (8 líneas)
4. src/routes/reports.routes.ts (10 líneas)

Total: 37 líneas corregidas

## Cambio Realizado
ANTES: authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA')
DESPUÉS: authorizeRoles(['ADMIN', 'GESTOR', 'ANALISTA'])

## Testing
✅ Compilación TypeScript exitosa
✅ Backend inicia correctamente
✅ Endpoints protegidos funcionan con autenticación
✅ RBAC funciona correctamente

## Punto de Rollback
Tag: sprint-1-authorizeroles
Comando: git checkout sprint-1-authorizeroles

## Próximo Sprint
Sprint 2: Sincronización Rol ANALISTA en Frontend

## Impacto
- Severidad del problema original: CRÍTICA
- Tiempo de corrección: 1 hora
- Archivos afectados: 4
- Líneas modificadas: 37
- Tests realizados: ✅ Exitosos
```

### Verificación Final Sprint 1

```bash
# Checklist
git tag | grep "sprint-1-authorizeroles"                    # ✅
ls assets/docs/sprints/SPRINT_1_AUTHORIZEROLES_COMPLETADO.md # ✅
grep -n "authorizeRoles('[A-Z]" src/routes/*.ts | wc -l     # 0 ✅
npm run build                                                # ✅
```

### ✅ Sprint 1 Completado

**Punto de Rollback:** `sprint-1-authorizeroles`

**Comando para rollback:**
```bash
git checkout sprint-1-authorizeroles
```

---

## 🎭 SPRINT 2: SINCRONIZACIÓN ROL ANALISTA

### Objetivos

Agregar el rol `ANALISTA` al frontend para sincronizar con el backend.

### Severidad

🟠 **ALTA** - Usuarios con rol ANALISTA no pueden usar el sistema.

### Duración Estimada

**1.5 horas** (incluyendo testing)

### Problema a Resolver

El tipo `User` en frontend no incluye el rol `ANALISTA` que está definido y usado en el backend.

### Archivos a Modificar

1. `frontend/src/types/index.ts` - Definición de tipo User
2. Posiblemente componentes de role-based access
3. Posiblemente sidebar/menú

### Tareas

#### Tarea 2.1: Validar Problema

**Tiempo:** 5 minutos

```bash
# 1. Ver definición actual
grep -A5 "interface User" frontend/src/types/index.ts

# Debe mostrar: rol: 'ADMIN' | 'GESTOR' | 'CORREDOR';

# 2. Buscar usos del tipo User
grep -r "User" frontend/src --include="*.ts" --include="*.tsx" | wc -l

# 3. Buscar componentes que usen rol
grep -r "user.rol" frontend/src --include="*.ts" --include="*.tsx"
```

**✅ Criterio de Éxito:** Problema identificado.

#### Tarea 2.2: Corregir Tipo User

**Tiempo:** 3 minutos

**Archivo:** `frontend/src/types/index.ts`

**Línea 8:**

```typescript
// ❌ ANTES
export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ADMIN' | 'GESTOR' | 'CORREDOR';
}

// ✅ DESPUÉS
export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ADMIN' | 'GESTOR' | 'CORREDOR' | 'ANALISTA';
}
```

**✅ Criterio de Éxito:** Tipo User actualizado.

#### Tarea 2.3: Verificar Componentes Role-Based

**Tiempo:** 20 minutos

Buscar y actualizar componentes que usen roles:

```bash
# 1. Buscar componentes con role-based logic
find frontend/src/components -name "*Role*.tsx"
find frontend/src/components -name "*Private*.tsx"

# 2. Revisar cada archivo encontrado
```

**Archivos probables:**
- `frontend/src/components/auth/PrivateRoute.tsx`
- `frontend/src/components/auth/RoleBasedAccess.tsx`

**Ejemplo de actualización:**

Si hay código como:
```typescript
// ❌ ANTES
type AllowedRoles = 'ADMIN' | 'GESTOR' | 'CORREDOR';

// ✅ DESPUÉS
type AllowedRoles = 'ADMIN' | 'GESTOR' | 'CORREDOR' | 'ANALISTA';
```

O mejor, usar el tipo importado:
```typescript
import { User } from '@/types';

type AllowedRoles = User['rol'];
```

**✅ Criterio de Éxito:** Componentes actualizados si es necesario.

#### Tarea 2.4: Actualizar Sidebar/Menú

**Tiempo:** 15 minutos

**Archivo:** `frontend/src/components/layout/Sidebar.tsx`

Agregar opciones de menú para rol ANALISTA:

```typescript
// Ejemplo de estructura de menú
const menuItems = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
    roles: ['ADMIN', 'GESTOR', 'ANALISTA'],  // ✅ Agregar ANALISTA
  },
  {
    title: 'Reportes',
    path: '/reportes',
    icon: <ReportIcon />,
    roles: ['ADMIN', 'GESTOR', 'ANALISTA'],  // ✅ Agregar ANALISTA
  },
  {
    title: 'Proyectos',
    path: '/proyectos',
    icon: <ProjectIcon />,
    roles: ['ADMIN', 'GESTOR', 'CORREDOR', 'ANALISTA'],  // ✅ Agregar ANALISTA
  },
  // ...
];
```

**Permisos recomendados para ANALISTA:**
- ✅ Dashboard (lectura)
- ✅ Reportes (generación, descarga)
- ✅ Estadísticas (lectura)
- ✅ Proyectos (lectura)
- ✅ Propiedades (lectura)
- ✅ Publicaciones (lectura, estadísticas)
- ❌ Crear/Editar proyectos
- ❌ Crear/Editar propiedades
- ❌ Gestión de usuarios

**✅ Criterio de Éxito:** Menú actualizado con opciones para ANALISTA.

#### Tarea 2.5: Verificar Redux Slices

**Tiempo:** 10 minutos

**Archivo:** `frontend/src/redux/slices/authSlice.ts`

Verificar que no haya validaciones hardcodeadas de roles:

```bash
# Buscar validaciones de rol
grep -n "ADMIN\|GESTOR\|CORREDOR" frontend/src/redux/slices/authSlice.ts
```

**✅ Criterio de Éxito:** No hay validaciones hardcodeadas que excluyan ANALISTA.

#### Tarea 2.6: Actualizar RTK Query APIs

**Tiempo:** 15 minutos

Verificar APIs que puedan tener validaciones de roles:

```bash
# Buscar en APIs
grep -r "rol.*==\|rol.*!=" frontend/src/redux/api
```

**Archivos a revisar:**
- `frontend/src/redux/api/dashboardApi.ts`
- `frontend/src/redux/api/reportsApi.ts`

**Si hay validaciones, asegurarse que incluyan ANALISTA:**

```typescript
// ❌ ANTES
if (user.rol === 'ADMIN' || user.rol === 'GESTOR') {
  // ...
}

// ✅ DESPUÉS
if (['ADMIN', 'GESTOR', 'ANALISTA'].includes(user.rol)) {
  // ...
}
```

**✅ Criterio de Éxito:** APIs actualizadas.

#### Tarea 2.7: Compilar Frontend

**Tiempo:** 5 minutos

```bash
cd frontend

# Compilar
npm run build

# Debe compilar sin errores TypeScript
```

**⚠️ Si hay errores:**
- Revisar todos los archivos que usan el tipo User
- Asegurarse que todos acepten 'ANALISTA'

**✅ Criterio de Éxito:** Compilación exitosa.

#### Tarea 2.8: Testing de Autenticación

**Tiempo:** 20 minutos

**Prerequisito:** Crear usuario con rol ANALISTA en BD

```bash
# 1. Crear rol ANALISTA en BD (si no existe)
psql -U usuario -h localhost databrokers -c "
INSERT INTO roles (codigo, nombre, descripcion, activo)
VALUES ('ANALISTA', 'Analista de Datos', 'Rol para análisis de datos y reportes', true)
ON CONFLICT (codigo) DO NOTHING;
"

# 2. Crear usuario ANALISTA de prueba
psql -U usuario -h localhost databrokers -c "
INSERT INTO usuarios (email, password, nombre, apellido, rol_id, activo)
SELECT
  'analista@databrokers.cl',
  '\$2b\$10\$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijk',  -- password: analista123
  'Analista',
  'Prueba',
  (SELECT id FROM roles WHERE codigo = 'ANALISTA'),
  true
ON CONFLICT (email) DO NOTHING;
"
```

**Testing Manual:**

1. Iniciar backend:
```bash
npm run dev
```

2. Iniciar frontend:
```bash
cd frontend
npm run dev
```

3. Probar login con usuario ANALISTA:
   - Ir a `http://localhost:5173/login`
   - Email: `analista@databrokers.cl`
   - Password: `analista123`

4. Verificar:
   - ✅ Login exitoso
   - ✅ Sidebar muestra opciones correctas
   - ✅ Puede acceder a Dashboard
   - ✅ Puede acceder a Reportes
   - ✅ Puede ver estadísticas
   - ❌ NO puede crear/editar proyectos
   - ❌ NO puede gestionar usuarios

**✅ Criterio de Éxito:** Usuario ANALISTA puede usar el sistema correctamente.

#### Tarea 2.9: Commit y Tag

**Tiempo:** 3 minutos

```bash
# Volver a raíz
cd ..

# Ver cambios
git status

# Agregar archivos
git add frontend/src/types/index.ts
git add frontend/src/components/  # Si hubo cambios
git add frontend/src/redux/        # Si hubo cambios

# Commit
git commit -m "[SPRINT-2] Feat: Agregar rol ANALISTA al frontend

Problema: Rol ANALISTA no definido en tipos del frontend
Solución: Agregado 'ANALISTA' a User.rol type
Archivos: types, componentes role-based, sidebar

Severidad: ALTA
Impacto: Usuarios ANALISTA pueden usar el sistema

Cambios:
- Actualizado User interface con rol ANALISTA
- Actualizado componentes de role-based access
- Actualizado menú/sidebar con opciones para ANALISTA
- Testing con usuario ANALISTA exitoso"

# Tag
git tag -a sprint-2-rol-analista -m "Sprint 2: Rol ANALISTA sincronizado completado"

# Verificar
git log --oneline -1
git tag
```

**✅ Criterio de Éxito:** Commit y tag creados.

#### Tarea 2.10: Documentar Sprint

**Tiempo:** 5 minutos

Crear archivo `assets/docs/sprints/SPRINT_2_ROL_ANALISTA_COMPLETADO.md`:

```markdown
# SPRINT 2: SINCRONIZACIÓN ROL ANALISTA

## Fecha
[FECHA]

## Objetivos
✅ Agregar rol ANALISTA al tipo User del frontend
✅ Actualizar componentes role-based access
✅ Actualizar sidebar/menú con opciones para ANALISTA
✅ Testing con usuario ANALISTA exitoso
✅ Frontend compilando correctamente

## Problema Resuelto
Rol ANALISTA definido en backend pero no en frontend

## Archivos Modificados
1. frontend/src/types/index.ts (línea 8)
2. frontend/src/components/auth/* (si aplicaba)
3. frontend/src/components/layout/Sidebar.tsx
4. frontend/src/redux/* (si aplicaba)

## Cambio Realizado
ANTES: rol: 'ADMIN' | 'GESTOR' | 'CORREDOR'
DESPUÉS: rol: 'ADMIN' | 'GESTOR' | 'CORREDOR' | 'ANALISTA'

## Permisos de Rol ANALISTA
✅ Dashboard (lectura)
✅ Reportes (generación, descarga)
✅ Estadísticas (lectura)
✅ Proyectos (lectura)
✅ Propiedades (lectura)
✅ Publicaciones (lectura)
❌ Crear/Editar proyectos
❌ Crear/Editar propiedades
❌ Gestión de usuarios

## Testing
✅ Compilación TypeScript exitosa
✅ Frontend inicia correctamente
✅ Login con usuario ANALISTA exitoso
✅ Sidebar muestra opciones correctas
✅ Acceso a rutas permitidas funciona
✅ Acceso a rutas no permitidas bloqueado

## Punto de Rollback
Tag: sprint-2-rol-analista
Comando: git checkout sprint-2-rol-analista

## Próximo Sprint
Sprint 3: Corrección CORS y Variables de Entorno

## Impacto
- Severidad del problema original: ALTA
- Tiempo de corrección: 1.5 horas
- Archivos afectados: 3-5
- Endpoints ahora accesibles: 20+
- Tests realizados: ✅ Exitosos
```

### Verificación Final Sprint 2

```bash
# Checklist
git tag | grep "sprint-2-rol-analista"                      # ✅
ls assets/docs/sprints/SPRINT_2_ROL_ANALISTA_COMPLETADO.md # ✅
grep "ANALISTA" frontend/src/types/index.ts                 # ✅
cd frontend && npm run build && cd ..                       # ✅
```

### ✅ Sprint 2 Completado

**Punto de Rollback:** `sprint-2-rol-analista`

---

## 🌐 SPRINT 3: CORRECCIÓN CORS Y VARIABLES

### Objetivos

1. Corregir CORS_ORIGIN para puerto correcto
2. Estandarizar variables de entorno JWT
3. Soportar múltiples orígenes CORS

### Severidad

🟡 **MEDIA** - Puede causar problemas en desarrollo y producción.

### Duración Estimada

**45 minutos**

### Problemas a Resolver

1. CORS_ORIGIN configurado para puerto 3001, frontend usa 5173
2. Variables JWT inconsistentes (JWT_EXPIRATION vs JWT_EXPIRES_IN)

### Archivos a Modificar

1. `.env.example` - Variables de entorno
2. `src/index.ts` - Configuración CORS
3. `frontend/.env.example` - Variables del frontend

### Tareas

#### Tarea 3.1: Actualizar CORS_ORIGIN

**Tiempo:** 5 minutos

**Archivo:** `.env.example`

```env
# ❌ ANTES
CORS_ORIGIN="http://localhost:3001"

# ✅ DESPUÉS
CORS_ORIGIN="http://localhost:5173"
```

**✅ Criterio de Éxito:** CORS_ORIGIN actualizado.

#### Tarea 3.2: Soportar Múltiples Orígenes

**Tiempo:** 15 minutos

**Archivo:** `src/index.ts`

Actualizar configuración CORS para soportar múltiples orígenes:

```typescript
// ❌ ANTES (línea 40-43)
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

**Actualizar `.env.example` para documentar:**

```env
# CORS - Soporta múltiples orígenes separados por coma
CORS_ORIGIN="http://localhost:5173,http://localhost:3001,http://localhost:4173"
```

**✅ Criterio de Éxito:** CORS soporta múltiples orígenes.

#### Tarea 3.3: Estandarizar Variables JWT

**Tiempo:** 10 minutos

**Opción recomendada:** Actualizar `.env.example` para coincidir con código

**Archivo:** `.env.example`

```env
# ❌ ANTES
JWT_EXPIRATION="7d"
JWT_REFRESH_EXPIRATION="30d"

# ✅ DESPUÉS
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"
```

**✅ Criterio de Éxito:** Variables JWT estandarizadas.

#### Tarea 3.4: Agregar Variables de Producción

**Tiempo:** 10 minutos

Crear archivo `.env.production.example`:

```env
# =====================================================
# PRODUCCIÓN - DATABROKERS
# =====================================================

# Base de datos
DATABASE_URL="postgresql://usuario:password@production-host:5432/databrokers"

# JWT - Usar claves más largas en producción
JWT_SECRET="[GENERAR_CLAVE_SEGURA_64_CHARS]"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Servidor
NODE_ENV="production"
PORT=3000

# CORS - Dominio de producción
CORS_ORIGIN="https://databrokers.cl,https://www.databrokers.cl,https://app.databrokers.cl"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="[EMAIL]"
SMTP_PASSWORD="[APP_PASSWORD]"
EMAIL_FROM="noreply@databrokers.cl"

# Archivos
UPLOAD_DIR="/var/www/databrokers/uploads"
MAX_FILE_SIZE=5242880

# KPIs y Reportes
KPI_CALCULATION_CRON="0 2 * * *"
REPORTS_DIR="/var/www/databrokers/reports"
REPORTS_RETENTION_DAYS=90

# Rate Limiting - Más estricto en producción
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="warn"
LOG_DIR="/var/log/databrokers"
```

**✅ Criterio de Éxito:** Archivo de producción creado.

#### Tarea 3.5: Actualizar Frontend .env.example

**Tiempo:** 3 minutos

**Archivo:** `frontend/.env.example`

```env
# =====================================================
# DESARROLLO - FRONTEND DATABROKERS
# =====================================================

# API Base URL - Backend local
VITE_API_BASE_URL=http://localhost:3000/api

# Nombre de la aplicación
VITE_APP_NAME=Databrokers

# Modo de desarrollo
VITE_ENV=development
```

Crear `frontend/.env.production.example`:

```env
# =====================================================
# PRODUCCIÓN - FRONTEND DATABROKERS
# =====================================================

# API Base URL - Backend producción
VITE_API_BASE_URL=https://api.databrokers.cl/api

# Nombre de la aplicación
VITE_APP_NAME=Databrokers

# Modo de producción
VITE_ENV=production
```

**✅ Criterio de Éxito:** Archivos de frontend actualizados.

#### Tarea 3.6: Testing CORS

**Tiempo:** 10 minutos

```bash
# 1. Iniciar backend con nueva configuración
npm run dev

# 2. Iniciar frontend
cd frontend
npm run dev
cd ..

# 3. Probar desde navegador
# Abrir: http://localhost:5173/login
# Login con admin@databrokers.cl / admin123
# Verificar que no hay errores CORS en consola

# 4. Probar desde curl (simular otro origen)
curl -X OPTIONS http://localhost:3000/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Debe retornar:
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Credentials: true
```

**✅ Criterio de Éxito:** CORS funciona correctamente.

#### Tarea 3.7: Commit y Tag

**Tiempo:** 3 minutos

```bash
git add .env.example
git add .env.production.example
git add src/index.ts
git add frontend/.env.example
git add frontend/.env.production.example

git commit -m "[SPRINT-3] Fix: Corregir CORS y estandarizar variables de entorno

Problemas:
- CORS_ORIGIN configurado para puerto incorrecto (3001 vs 5173)
- Variables JWT inconsistentes (JWT_EXPIRATION vs JWT_EXPIRES_IN)

Soluciones:
- Actualizado CORS_ORIGIN a puerto 5173
- Soportar múltiples orígenes CORS separados por coma
- Estandarizado variables JWT (JWT_EXPIRES_IN)
- Creados archivos .env.production.example

Severidad: MEDIA
Impacto: Desarrollo y producción configurados correctamente"

git tag -a sprint-3-cors-vars -m "Sprint 3: CORS y Variables completado"
```

**✅ Criterio de Éxito:** Commit y tag creados.

#### Tarea 3.8: Documentar Sprint

**Tiempo:** 5 minutos

Crear archivo `assets/docs/sprints/SPRINT_3_CORS_VARS_COMPLETADO.md`.

### ✅ Sprint 3 Completado

**Punto de Rollback:** `sprint-3-cors-vars`

---

## 🧪 SPRINT 4: TESTING Y VALIDACIÓN

### Objetivos

1. Testing de integración completo
2. Validación de comunicación DB ↔ Backend ↔ Frontend
3. Testing de autenticación con 4 roles
4. Verificación de endpoints críticos

### Duración Estimada

**2 horas**

### Tareas

#### Tarea 4.1: Testing de Base de Datos

**Tiempo:** 15 minutos

```bash
# 1. Verificar conexión
psql -U usuario -h localhost databrokers -c "SELECT version();"

# 2. Verificar roles
psql -U usuario -h localhost databrokers -c "SELECT * FROM roles;"

# Debe mostrar: ADMIN, GESTOR, CORREDOR, ANALISTA

# 3. Verificar usuarios
psql -U usuario -h localhost databrokers -c "SELECT u.email, r.codigo as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id;"

# 4. Verificar modelos de negocio
psql -U usuario -h localhost databrokers -c "SELECT * FROM modelos_negocio;"

# 5. Contar propiedades
psql -U usuario -h localhost databrokers -c "SELECT COUNT(*) FROM propiedades;"
```

**✅ Criterio de Éxito:** Base de datos funcional y con datos.

#### Tarea 4.2: Testing Backend Endpoints

**Tiempo:** 30 minutos

Crear script `test-endpoints.sh`:

```bash
#!/bin/bash

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# URL base
BASE_URL="http://localhost:3000"

echo "========================================="
echo "TESTING BACKEND DATABROKERS"
echo "========================================="

# 1. Health check
echo -e "\n1. Health Check:"
curl -s $BASE_URL/health | jq .
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Health check OK${NC}"
else
  echo -e "${RED}❌ Health check FAIL${NC}"
fi

# 2. Login ADMIN
echo -e "\n2. Login ADMIN:"
ADMIN_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@databrokers.cl","password":"admin123"}' \
  | jq -r '.token')

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
  echo -e "${GREEN}✅ Login ADMIN OK${NC}"
  echo "Token: ${ADMIN_TOKEN:0:20}..."
else
  echo -e "${RED}❌ Login ADMIN FAIL${NC}"
  exit 1
fi

# 3. Dashboard (ADMIN)
echo -e "\n3. Dashboard con token ADMIN:"
curl -s $BASE_URL/api/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.success'

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Dashboard OK${NC}"
else
  echo -e "${RED}❌ Dashboard FAIL${NC}"
fi

# 4. Login ANALISTA
echo -e "\n4. Login ANALISTA:"
ANALISTA_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analista@databrokers.cl","password":"analista123"}' \
  | jq -r '.token')

if [ "$ANALISTA_TOKEN" != "null" ] && [ -n "$ANALISTA_TOKEN" ]; then
  echo -e "${GREEN}✅ Login ANALISTA OK${NC}"
else
  echo -e "${RED}❌ Login ANALISTA FAIL${NC}"
fi

# 5. Dashboard (ANALISTA)
echo -e "\n5. Dashboard con token ANALISTA:"
curl -s $BASE_URL/api/dashboard \
  -H "Authorization: Bearer $ANALISTA_TOKEN" \
  | jq '.success'

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Dashboard ANALISTA OK${NC}"
else
  echo -e "${RED}❌ Dashboard ANALISTA FAIL${NC}"
fi

# 6. Reportes (ANALISTA)
echo -e "\n6. Reportes con token ANALISTA:"
curl -s $BASE_URL/api/reports \
  -H "Authorization: Bearer $ANALISTA_TOKEN" \
  | jq '.success'

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Reportes ANALISTA OK${NC}"
else
  echo -e "${RED}❌ Reportes ANALISTA FAIL${NC}"
fi

echo -e "\n========================================="
echo "TESTING COMPLETADO"
echo "========================================="
```

Ejecutar:
```bash
chmod +x test-endpoints.sh
./test-endpoints.sh
```

**✅ Criterio de Éxito:** Todos los tests pasan.

#### Tarea 4.3: Testing Frontend

**Tiempo:** 30 minutos

Testing manual con cada rol:

**Test 1: Login ADMIN**
1. Ir a http://localhost:5173/login
2. Email: admin@databrokers.cl
3. Password: admin123
4. Verificar:
   - ✅ Login exitoso
   - ✅ Redirect a dashboard
   - ✅ Sidebar muestra todas las opciones
   - ✅ Puede acceder a todas las rutas

**Test 2: Login GESTOR**
1. Crear usuario GESTOR si no existe
2. Login
3. Verificar permisos correctos

**Test 3: Login CORREDOR**
1. Crear usuario CORREDOR si no existe
2. Login
3. Verificar solo ve sus publicaciones

**Test 4: Login ANALISTA**
1. Email: analista@databrokers.cl
2. Password: analista123
3. Verificar:
   - ✅ Login exitoso
   - ✅ Puede ver dashboard
   - ✅ Puede ver reportes
   - ✅ Puede generar reportes
   - ❌ NO puede crear proyectos
   - ❌ NO puede editar propiedades
   - ❌ NO puede gestionar usuarios

**✅ Criterio de Éxito:** Todos los roles funcionan correctamente.

#### Tarea 4.4: Testing de Integración Completa

**Tiempo:** 20 minutos

Flujo completo end-to-end:

1. **Login** → Dashboard
2. **Dashboard** → Ver KPIs
3. **Proyectos** → Listar
4. **Proyectos** → Ver detalle
5. **Propiedades** → Listar
6. **Reportes** → Generar reporte PDF
7. **Reportes** → Descargar reporte

**✅ Criterio de Éxito:** Flujo completo funciona sin errores.

#### Tarea 4.5: Verificar Comunicación DB-Backend-Frontend

**Tiempo:** 15 minutos

```bash
# 1. Crear propiedad desde backend
curl -X POST http://localhost:3000/api/properties \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "TEST-001",
    "titulo": "Propiedad de Prueba",
    "tipo_propiedad_id": 1,
    "direccion": "Calle Test 123",
    "comuna_id": 1,
    "region_id": 1,
    "precio": 100000000,
    "superficie_total": 100,
    "dormitorios": 3,
    "banos": 2,
    "estado_propiedad_id": 1,
    "modelo_negocio_id": 1
  }'

# 2. Verificar en base de datos
psql -U usuario -h localhost databrokers -c "SELECT * FROM propiedades WHERE codigo = 'TEST-001';"

# 3. Verificar en frontend
# Ir a http://localhost:5173/propiedades
# Buscar "TEST-001"
# Debe aparecer en la lista

# 4. Limpiar
curl -X DELETE http://localhost:3000/api/properties/TEST-001 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**✅ Criterio de Éxito:** Datos fluyen correctamente entre capas.

#### Tarea 4.6: Documentar Resultados

**Tiempo:** 10 minutos

Crear archivo `assets/docs/sprints/SPRINT_4_TESTING_COMPLETADO.md`.

### ✅ Sprint 4 Completado

**Punto de Rollback:** `sprint-4-testing`

---

## 🚀 SPRINT 5: OPTIMIZACIONES FINALES (OPCIONAL)

### Objetivos

1. Agregar configuración Docker
2. Agregar tests E2E
3. Mejorar documentación
4. Optimizaciones de rendimiento

### Duración Estimada

**3 horas** (opcional)

### Prioridad

**P3** - Mejoras de calidad

Este sprint es opcional y puede realizarse después del deployment inicial.

---

## 📝 COMANDOS GIT RÁPIDOS

### Trabajar con Sprints

```bash
# Ver todos los sprints (tags)
git tag --list "sprint-*"

# Ir a un sprint específico
git checkout sprint-N-nombre

# Crear branch desde sprint
git checkout -b feature/nueva sprint-N-nombre

# Ver diferencias entre sprints
git diff sprint-1-authorizeroles..sprint-2-rol-analista

# Ver archivos cambiados entre sprints
git diff --name-only sprint-1-authorizeroles..sprint-2-rol-analista
```

### Rollback

```bash
# Rollback completo (PELIGROSO)
git reset --hard sprint-N-nombre

# Rollback suave (mantiene cambios)
git reset --soft sprint-N-nombre

# Rollback solo de archivos específicos
git checkout sprint-N-nombre -- archivo.ts

# Ver qué cambiaría un rollback
git diff HEAD..sprint-N-nombre
```

### Backup y Restauración

```bash
# Crear backup rápido
git stash save "Backup antes de cambio importante"

# Ver backups
git stash list

# Restaurar backup
git stash pop

# Aplicar backup sin eliminar
git stash apply stash@{0}
```

---

## 🔧 TROUBLESHOOTING

### Problema: Backend no inicia

```bash
# 1. Verificar puerto
lsof -i :3000

# 2. Matar proceso si existe
kill -9 $(lsof -t -i :3000)

# 3. Verificar logs
tail -f logs/*.log

# 4. Verificar variables de entorno
cat .env

# 5. Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Problema: Frontend no compila

```bash
cd frontend

# 1. Limpiar cache
rm -rf node_modules .vite dist

# 2. Reinstalar
npm install

# 3. Verificar tipos
npm run type-check

# 4. Ver errores detallados
npm run build -- --debug
```

### Problema: Base de datos no conecta

```bash
# 1. Verificar PostgreSQL corriendo
sudo systemctl status postgresql

# 2. Reiniciar PostgreSQL
sudo systemctl restart postgresql

# 3. Verificar credenciales
psql -U usuario -h localhost databrokers

# 4. Verificar DATABASE_URL en .env
grep DATABASE_URL .env

# 5. Testing de conexión con Prisma
npx prisma db pull
```

### Problema: CORS bloqueando requests

```bash
# 1. Verificar CORS_ORIGIN en backend
grep CORS_ORIGIN .env

# 2. Verificar puerto del frontend
grep "port:" frontend/vite.config.ts

# 3. Ver headers CORS
curl -X OPTIONS http://localhost:3000/api/auth/login \
  -H "Origin: http://localhost:5173" \
  -v

# 4. Actualizar .env
echo 'CORS_ORIGIN="http://localhost:5173"' >> .env

# 5. Reiniciar backend
```

### Problema: authorizeRoles sigue dando 403

```bash
# 1. Verificar sintaxis corregida
grep "authorizeRoles(\[" src/routes/dashboard.routes.ts

# 2. Verificar token válido
# Decodificar token JWT en https://jwt.io

# 3. Verificar rol del usuario en BD
psql -U usuario -h localhost databrokers -c "
SELECT u.email, r.codigo as rol
FROM usuarios u
JOIN roles r ON u.rol_id = r.id
WHERE u.email = 'tu_email@ejemplo.com';
"

# 4. Ver logs del backend
tail -f logs/*.log | grep "authorizeRoles"
```

---

## 📊 RESUMEN DE SPRINTS

| Sprint | Duración | Archivos | Líneas | Severidad | Estado |
|--------|----------|----------|--------|-----------|--------|
| Sprint 0 | 30 min | - | - | Setup | ⏸️ Pendiente |
| Sprint 1 | 1 hora | 4 | 37 | 🔴 CRÍTICA | ⏸️ Pendiente |
| Sprint 2 | 1.5 horas | 3-5 | 5-10 | 🟠 ALTA | ⏸️ Pendiente |
| Sprint 3 | 45 min | 5 | 10-15 | 🟡 MEDIA | ⏸️ Pendiente |
| Sprint 4 | 2 horas | - | - | Testing | ⏸️ Pendiente |
| Sprint 5 | 3 horas | - | - | 🟢 BAJA | ⏸️ Opcional |

**Duración Total:** 8-9 horas (sin Sprint 5)

---

## ✅ CHECKLIST FINAL

### Pre-Deployment

- [ ] Sprint 0: Setup completado
- [ ] Sprint 1: authorizeRoles corregido
- [ ] Sprint 2: Rol ANALISTA sincronizado
- [ ] Sprint 3: CORS y variables actualizadas
- [ ] Sprint 4: Testing completado
- [ ] Todos los tests pasan
- [ ] Base de datos migrada y con seed
- [ ] Archivos .env configurados
- [ ] README actualizado

### Post-Deployment

- [ ] Verificar logs de producción
- [ ] Monitoring configurado
- [ ] Backups automáticos configurados
- [ ] SSL/HTTPS configurado
- [ ] Documentación actualizada

---

## 📞 SOPORTE

Para preguntas:
- Revisar: `AUDITORIA_COMPLETA.md`
- Revisar: `INCONSISTENCIAS_CRITICAS.md`
- Ver logs: `assets/docs/sprints/`

---

**FIN DEL PLAN DE REFACTORIZACIÓN**
