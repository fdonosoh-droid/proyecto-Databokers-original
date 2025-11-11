# 🏢 Databrokers - Frontend

Sistema de gestión inmobiliaria desarrollado con React + TypeScript + Material-UI

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Prerequisitos](#prerequisitos)
- [Instalación](#instalación)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración](#configuración)
- [Convenciones de Código](#convenciones-de-código)

## 🛠️ Stack Tecnológico

- **Framework**: React 18+ con TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit + RTK Query
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Date Handling**: date-fns
- **API Client**: RTK Query
- **Testing**: Vitest + React Testing Library

## 📦 Prerequisitos

- Node.js >= 18.x
- npm >= 9.x
- Backend API corriendo en http://localhost:3000

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <repository-url>

# Navegar a la carpeta frontend
cd frontend

# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.example .env

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: http://localhost:5173

## 📜 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo con HMR

# Build
npm run build        # Genera build de producción en /dist

# Preview
npm run preview      # Previsualiza el build de producción

# Linting
npm run lint         # Ejecuta ESLint

# Formateo
npm run format       # Formatea código con Prettier

# Testing
npm run test         # Ejecuta tests con Vitest
npm run test:ui      # Ejecuta tests con UI
npm run test:coverage # Genera reporte de cobertura
```

## 📁 Estructura del Proyecto

```
frontend/
├── public/               # Archivos estáticos
├── src/
│   ├── api/             # Configuración de API y endpoints
│   ├── assets/          # Imágenes, iconos, etc.
│   ├── components/      # Componentes reutilizables
│   │   ├── common/      # Botones, inputs, modals
│   │   ├── layout/      # Header, Sidebar, Footer
│   │   └── charts/      # Componentes de gráficos
│   ├── features/        # Módulos por feature
│   │   ├── auth/        # Autenticación
│   │   ├── dashboard/   # Dashboard ejecutivo
│   │   ├── projects/    # Gestión de proyectos
│   │   ├── properties/  # Gestión de propiedades
│   │   ├── tradeins/    # Canjes
│   │   ├── publications/# Publicaciones
│   │   └── reports/     # Reportes
│   ├── hooks/           # Custom hooks
│   ├── layouts/         # Layouts de página
│   ├── pages/           # Páginas principales
│   ├── redux/           # Store, slices, API
│   │   ├── api/         # RTK Query endpoints
│   │   ├── slices/      # Redux slices
│   │   ├── store.ts     # Configuración del store
│   │   └── hooks.ts     # Hooks tipados de Redux
│   ├── routes/          # Configuración de rutas
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilidades
│   ├── theme.ts         # Tema de Material-UI
│   ├── App.tsx          # Componente principal
│   └── main.tsx         # Entry point
├── .env                 # Variables de entorno (no commitear)
├── .env.example         # Plantilla de variables de entorno
├── .prettierrc          # Configuración de Prettier
├── eslint.config.js     # Configuración de ESLint
├── tsconfig.json        # Configuración de TypeScript
├── vite.config.ts       # Configuración de Vite
└── package.json
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Environment
VITE_ENV=development

# App Configuration
VITE_APP_NAME=Databrokers
VITE_APP_VERSION=1.0.0
```

### Path Aliases

El proyecto usa path aliases para imports más limpios:

```typescript
// En lugar de:
import Button from '../../../components/common/Button';

// Usa:
import Button from '@/components/common/Button';
```

## 📝 Convenciones de Código

### Nomenclatura de Archivos

- **Componentes**: PascalCase (ej: `UserProfile.tsx`)
- **Hooks**: camelCase con prefijo `use` (ej: `useAuth.ts`)
- **Utils**: camelCase (ej: `formatDate.ts`)
- **Types**: camelCase (ej: `user.types.ts`)

### Estructura de Componentes

```typescript
// Imports
import { useState } from 'react';
import { Box, Button } from '@mui/material';

// Types
interface MyComponentProps {
  title: string;
  onSubmit: () => void;
}

// Component
export const MyComponent: React.FC<MyComponentProps> = ({ title, onSubmit }) => {
  // Hooks
  const [state, setState] = useState<string>('');

  // Handlers
  const handleClick = () => {
    // Logic here
  };

  // Render
  return (
    <Box>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Click me</Button>
    </Box>
  );
};
```

### Redux con RTK Query

```typescript
// Definir API endpoint
import { baseApi } from '@/redux/api/baseApi';

const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query({
      query: () => '/projects',
      providesTags: ['Projects'],
    }),
  }),
});

export const { useGetProjectsQuery } = projectsApi;
```

### Uso en Componentes

```typescript
import { useGetProjectsQuery } from '@/redux/api/projectsApi';

const ProjectsList = () => {
  const { data, isLoading, error } = useGetProjectsQuery();

  if (isLoading) return <Loading />;
  if (error) return <Error />;

  return <div>{/* Render projects */}</div>;
};
```

## 🎨 Material-UI Theme

El tema personalizado está configurado en `src/theme.ts`. Para usar colores:

```typescript
import { useTheme } from '@mui/material/styles';

const MyComponent = () => {
  const theme = useTheme();

  return <Box sx={{ color: theme.palette.primary.main }}>Content</Box>;
};
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests en modo watch
npm run test:watch

# Ver cobertura
npm run test:coverage
```

## 🚢 Deployment

```bash
# Generar build de producción
npm run build

# El build estará en /dist
# Configurar servidor web para servir archivos estáticos
```

## 📞 Soporte

Para dudas o problemas, contactar al equipo de desarrollo.

---

**© 2025 Databrokers - Sistema de Gestión Inmobiliaria**
