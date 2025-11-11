import { baseApi } from './baseApi';
import type { Publication, PublicationStats, PublicationFilters } from '../../types';

interface GetPublicationsParams {
  filters?: PublicationFilters;
  page?: number;
  limit?: number;
}

interface GetPublicationsResponse {
  data: Publication[];
  total: number;
  page: number;
  pages: number;
}

interface CreatePublicationRequest {
  propiedadId: string;
  corredorId: string;
  tipoExclusividad: Publication['tipoExclusividad'];
  comisionAcordada: number;
  fechaVencimiento: string;
  notas?: string;
  restricciones?: string;
}

interface UpdatePublicationRequest extends Partial<CreatePublicationRequest> {
  estado?: Publication['estado'];
}

export const publicationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Listar publicaciones con filtros
    getPublications: builder.query<GetPublicationsResponse, GetPublicationsParams>({
      query: ({ filters = {}, page = 1, limit = 10 }) => ({
        url: '/publicaciones',
        params: {
          ...filters,
          page,
          limit,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Publications' as const, id })),
              { type: 'Publications', id: 'LIST' },
            ]
          : [{ type: 'Publications', id: 'LIST' }],
    }),

    // Obtener una publicación por ID
    getPublicationById: builder.query<Publication, string>({
      query: (id) => `/publicaciones/${id}`,
      providesTags: (result, error, id) => [{ type: 'Publications', id }],
    }),

    // Crear una publicación
    createPublication: builder.mutation<Publication, CreatePublicationRequest>({
      query: (body) => ({
        url: '/publicaciones',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Publications', id: 'LIST' }],
    }),

    // Actualizar una publicación
    updatePublication: builder.mutation<
      Publication,
      { id: string; data: UpdatePublicationRequest }
    >({
      query: ({ id, data }) => ({
        url: `/publicaciones/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Publications', id },
        { type: 'Publications', id: 'LIST' },
      ],
    }),

    // Eliminar una publicación
    deletePublication: builder.mutation<void, string>({
      query: (id) => ({
        url: `/publicaciones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Publications', id: 'LIST' }],
    }),

    // Pausar/Reactivar publicación
    togglePublicationStatus: builder.mutation<Publication, string>({
      query: (id) => ({
        url: `/publicaciones/${id}/toggle-estado`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Publications', id },
        { type: 'Publications', id: 'LIST' },
      ],
    }),

    // Finalizar publicación
    finalizePublication: builder.mutation<Publication, { id: string; motivo?: string }>({
      query: ({ id, motivo }) => ({
        url: `/publicaciones/${id}/finalizar`,
        method: 'POST',
        body: { motivo },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Publications', id },
        { type: 'Publications', id: 'LIST' },
      ],
    }),

    // Renovar publicación
    renewPublication: builder.mutation<
      Publication,
      { id: string; nuevaFechaVencimiento: string }
    >({
      query: ({ id, nuevaFechaVencimiento }) => ({
        url: `/publicaciones/${id}/renovar`,
        method: 'POST',
        body: { fechaVencimiento: nuevaFechaVencimiento },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Publications', id },
        { type: 'Publications', id: 'LIST' },
      ],
    }),

    // Cambiar corredor asignado
    changePublicationBroker: builder.mutation<
      Publication,
      { id: string; nuevoCorredorId: string }
    >({
      query: ({ id, nuevoCorredorId }) => ({
        url: `/publicaciones/${id}/cambiar-corredor`,
        method: 'PATCH',
        body: { corredorId: nuevoCorredorId },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Publications', id },
        { type: 'Publications', id: 'LIST' },
      ],
    }),

    // Actualizar métricas
    updatePublicationMetrics: builder.mutation<
      Publication,
      { id: string; visualizaciones?: number; contactos?: number; ofertas?: number }
    >({
      query: ({ id, ...metrics }) => ({
        url: `/publicaciones/${id}/metricas`,
        method: 'PATCH',
        body: metrics,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Publications', id },
        { type: 'Publications', id: 'LIST' },
      ],
    }),

    // Obtener estadísticas de publicaciones
    getPublicationStats: builder.query<PublicationStats, PublicationFilters | void>({
      query: (filters) => ({
        url: '/publicaciones/estadisticas',
        params: filters,
      }),
      providesTags: [{ type: 'Publications', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetPublicationsQuery,
  useGetPublicationByIdQuery,
  useCreatePublicationMutation,
  useUpdatePublicationMutation,
  useDeletePublicationMutation,
  useTogglePublicationStatusMutation,
  useFinalizePublicationMutation,
  useRenewPublicationMutation,
  useChangePublicationBrokerMutation,
  useUpdatePublicationMetricsMutation,
  useGetPublicationStatsQuery,
} = publicationsApi;
