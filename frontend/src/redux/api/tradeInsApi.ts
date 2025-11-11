import { baseApi } from './baseApi';
import type { TradeIn, TradeInStats, TradeInFilters } from '../../types';

interface GetTradeInsParams {
  filters?: TradeInFilters;
  page?: number;
  limit?: number;
}

interface GetTradeInsResponse {
  data: TradeIn[];
  total: number;
  page: number;
  pages: number;
}

interface CreateTradeInRequest {
  propiedadEntregadaId: string;
  propiedadRecibidaId: string;
  valorizacionEntregada: number;
  valorizacionRecibida: number;
  formaPagoDiferencia?: string;
  comentarios?: string;
}

interface UpdateTradeInStatusRequest {
  estado: TradeIn['estado'];
  comentario?: string;
}

export const tradeInsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Listar canjes con filtros
    getTradeIns: builder.query<GetTradeInsResponse, GetTradeInsParams>({
      query: ({ filters = {}, page = 1, limit = 10 }) => ({
        url: '/canjes',
        params: {
          ...filters,
          page,
          limit,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'TradeIns' as const, id })),
              { type: 'TradeIns', id: 'LIST' },
            ]
          : [{ type: 'TradeIns', id: 'LIST' }],
    }),

    // Obtener un canje por ID
    getTradeInById: builder.query<TradeIn, string>({
      query: (id) => `/canjes/${id}`,
      providesTags: (result, error, id) => [{ type: 'TradeIns', id }],
    }),

    // Crear un canje
    createTradeIn: builder.mutation<TradeIn, CreateTradeInRequest>({
      query: (body) => ({
        url: '/canjes',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'TradeIns', id: 'LIST' }],
    }),

    // Actualizar estado de un canje
    updateTradeInStatus: builder.mutation<
      TradeIn,
      { id: string; data: UpdateTradeInStatusRequest }
    >({
      query: ({ id, data }) => ({
        url: `/canjes/${id}/estado`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'TradeIns', id },
        { type: 'TradeIns', id: 'LIST' },
      ],
    }),

    // Actualizar un canje
    updateTradeIn: builder.mutation<TradeIn, { id: string; data: Partial<TradeIn> }>({
      query: ({ id, data }) => ({
        url: `/canjes/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'TradeIns', id },
        { type: 'TradeIns', id: 'LIST' },
      ],
    }),

    // Eliminar un canje
    deleteTradeIn: builder.mutation<void, string>({
      query: (id) => ({
        url: `/canjes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'TradeIns', id: 'LIST' }],
    }),

    // Obtener estadísticas de canjes
    getTradeInStats: builder.query<TradeInStats, TradeInFilters | void>({
      query: (filters) => ({
        url: '/canjes/estadisticas',
        params: filters,
      }),
      providesTags: [{ type: 'TradeIns', id: 'STATS' }],
    }),

    // Finalizar un canje
    finalizeTradeIn: builder.mutation<TradeIn, string>({
      query: (id) => ({
        url: `/canjes/${id}/finalizar`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'TradeIns', id },
        { type: 'TradeIns', id: 'LIST' },
      ],
    }),

    // Cancelar un canje
    cancelTradeIn: builder.mutation<TradeIn, { id: string; motivo?: string }>({
      query: ({ id, motivo }) => ({
        url: `/canjes/${id}/cancelar`,
        method: 'POST',
        body: { motivo },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'TradeIns', id },
        { type: 'TradeIns', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTradeInsQuery,
  useGetTradeInByIdQuery,
  useCreateTradeInMutation,
  useUpdateTradeInStatusMutation,
  useUpdateTradeInMutation,
  useDeleteTradeInMutation,
  useGetTradeInStatsQuery,
  useFinalizeTradeInMutation,
  useCancelTradeInMutation,
} = tradeInsApi;
