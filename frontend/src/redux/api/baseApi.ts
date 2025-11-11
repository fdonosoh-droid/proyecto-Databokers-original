import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout, refreshToken as refreshTokenAction } from '../slices/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Base query con refresh automático de token
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Si recibimos 401, intentar refresh del token
  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');

    if (refreshToken) {
      // Intentar obtener un nuevo access token
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        // Guardar el nuevo token
        const newToken = (refreshResult.data as any).token;
        api.dispatch(refreshTokenAction(newToken));

        // Reintentar la petición original
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Si el refresh falla, hacer logout
        api.dispatch(logout());
      }
    } else {
      // Si no hay refresh token, hacer logout
      api.dispatch(logout());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auth',
    'Dashboard',
    'Projects',
    'Properties',
    'TradeIns',
    'Publications',
    'Reports',
  ],
  endpoints: () => ({}),
});
