import { baseApi } from './baseApi';
import type { Property } from '../../types';

export interface PropertyFilters {
  tipo?: string;
  estado?: string;
  modeloNegocio?: string;
  regionId?: string;
  comunaId?: string;
  precioMin?: number;
  precioMax?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const propertiesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProperties: builder.query<PaginatedResponse<Property>, { page?: number; limit?: number; filters?: PropertyFilters }>({
      query: ({ page = 1, limit = 10, filters = {} }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...Object.entries(filters).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = value.toString();
            }
            return acc;
          }, {} as Record<string, string>),
        });
        return `/propiedades?${params.toString()}`;
      },
      providesTags: ['Properties'],
    }),
    getPropertyById: builder.query<Property, string>({
      query: (id) => `/propiedades/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Properties', id }],
    }),
    createProperty: builder.mutation<Property, Partial<Property>>({
      query: (body) => ({
        url: '/propiedades',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Properties'],
    }),
    updateProperty: builder.mutation<Property, { id: string; data: Partial<Property> }>({
      query: ({ id, data }) => ({
        url: `/propiedades/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Properties', id }, 'Properties'],
    }),
    deleteProperty: builder.mutation<void, string>({
      query: (id) => ({
        url: `/propiedades/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Properties'],
    }),
    getPropertyHistory: builder.query<any[], string>({
      query: (id) => `/propiedades/${id}/historial`,
      providesTags: (_result, _error, id) => [{ type: 'Properties', id }],
    }),
  }),
});

export const {
  useGetPropertiesQuery,
  useGetPropertyByIdQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,
  useGetPropertyHistoryQuery,
} = propertiesApi;
