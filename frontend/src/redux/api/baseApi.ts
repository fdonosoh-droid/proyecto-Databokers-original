import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base URL para la API
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Configuración base de RTK Query
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      // Agregar token de autenticación si existe
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  // Tags para invalidación de cache
  tagTypes: [
    'Auth',
    'Dashboard',
    'Projects',
    'Properties',
    'TradeIns',
    'Publications',
    'Reports',
    'Users',
  ],
  // Los endpoints se definirán en archivos separados
  endpoints: () => ({}),
});

export default baseApi;
