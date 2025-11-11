# Databrokers Frontend

Sistema de gestión inmobiliaria desarrollado con React + TypeScript + Material-UI.

## Stack Tecnológico

- **Framework:** React 18+ con TypeScript
- **UI Library:** Material-UI (MUI) v5
- **State Management:** Redux Toolkit + RTK Query
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Build Tool:** Vite

## Prerequisitos

- Node.js 18+
- npm o yarn

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Copiar archivo de variables de entorno:
```bash
cp .env.example .env
```

3. Configurar variables de entorno en `.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=Databrokers
```

## Desarrollo

Iniciar servidor de desarrollo:
```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## Build de Producción

Crear build optimizado:
```bash
npm run build
```

Preview del build de producción:
```bash
npm run preview
```

## Estructura de Carpetas

```
frontend/
├── src/
│   ├── api/                 # Configuración API y endpoints
│   ├── assets/              # Imágenes, iconos, etc.
│   ├── components/          # Componentes reutilizables
│   │   ├── common/          # Botones, inputs, modals
│   │   ├── layout/          # Header, Sidebar, Footer
│   │   └── charts/          # Componentes de gráficos
│   ├── features/            # Módulos por feature
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── properties/
│   │   ├── tradeins/
│   │   ├── publications/
│   │   └── reports/
│   ├── hooks/               # Custom hooks
│   ├── layouts/             # Layouts de página
│   ├── pages/               # Páginas principales
│   ├── redux/               # Store, slices, API
│   ├── routes/              # Configuración de rutas
│   ├── types/               # TypeScript types
│   ├── utils/               # Utilidades
│   ├── theme.ts             # Tema de Material-UI
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Módulos Principales

1. **Dashboard** - Panel ejecutivo con KPIs y métricas
2. **Proyectos** - Gestión de proyectos inmobiliarios
3. **Propiedades** - Gestión de propiedades
4. **Canjes** - Sistema de canjes (trade-ins)
5. **Publicaciones** - Gestión de publicaciones
6. **Reportes** - Generador de reportes

## Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Crea build de producción
- `npm run preview` - Preview del build de producción
- `npm run lint` - Ejecuta ESLint

## Convenciones de Código

- Usar TypeScript para todos los componentes
- Usar hooks de React (functional components)
- Usar path aliases (`@/`) para imports
- Seguir estructura de carpetas establecida
- Usar Material-UI components cuando sea posible

## Estado del Proyecto

### ✅ Sprint 1: Setup y Configuración (Completado)
- Proyecto React con Vite + TypeScript configurado
- Dependencias instaladas (MUI, Redux, Router, etc.)
- Estructura de carpetas creada
- Tema personalizado configurado
- Redux store configurado

### ✅ Sprint 2: Layout y Navegación (Completado)
- Layout principal con Header y Sidebar
- Sistema de navegación con React Router
- Componentes comunes reutilizables
- Responsive design implementado
- Breadcrumbs funcional

### 🚧 Próximos Sprints
- Sprint 3: Autenticación y Autorización
- Sprint 4: Dashboard Ejecutivo
- Sprint 5-6: Módulos de Gestión
- Sprint 7: Sistema de Reportes
- Sprint 8: Optimización y Testing

## Licencia

© 2025 Databrokers - Sistema de Gestión Inmobiliaria
