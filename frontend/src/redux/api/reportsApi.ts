/**
 * API endpoints para el módulo de Reportes
 */
import { baseApi } from './baseApi';
import type {
  GeneratedReport,
  ScheduledReport,
  ReportHistoryResponse,
  GenerateReportRequest,
  ScheduleReportRequest,
  ReportPreviewData,
} from '../../features/reports/types';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Generar reporte
    generateReport: builder.mutation<GeneratedReport, GenerateReportRequest>({
      query: (config) => ({
        url: '/reports/generate',
        method: 'POST',
        body: config,
      }),
      invalidatesTags: ['Reports'],
    }),

    // Obtener reporte por ID
    getReport: builder.query<GeneratedReport, number>({
      query: (id) => `/reports/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Reports', id }],
    }),

    // Descargar reporte
    downloadReport: builder.mutation<Blob, { id: number; format: string }>({
      query: ({ id, format }) => ({
        url: `/reports/${id}/download`,
        method: 'GET',
        params: { format },
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Obtener historial de reportes
    getReportHistory: builder.query<
      ReportHistoryResponse,
      { page?: number; limit?: number; type?: string }
    >({
      query: ({ page = 1, limit = 10, type }) => ({
        url: '/reports/history',
        params: { page, limit, type },
      }),
      providesTags: ['Reports'],
    }),

    // Obtener reportes programados
    getScheduledReports: builder.query<ScheduledReport[], void>({
      query: () => '/reports/scheduled',
      providesTags: ['Reports'],
    }),

    // Crear reporte programado
    scheduleReport: builder.mutation<ScheduledReport, ScheduleReportRequest>({
      query: (config) => ({
        url: '/reports/schedule',
        method: 'POST',
        body: config,
      }),
      invalidatesTags: ['Reports'],
    }),

    // Actualizar reporte programado
    updateScheduledReport: builder.mutation<
      ScheduledReport,
      { id: number; data: Partial<ScheduleReportRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/reports/scheduled/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Reports'],
    }),

    // Eliminar reporte programado
    deleteScheduledReport: builder.mutation<void, number>({
      query: (id) => ({
        url: `/reports/scheduled/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reports'],
    }),

    // Activar/Desactivar reporte programado
    toggleScheduledReport: builder.mutation<ScheduledReport, { id: number; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/reports/scheduled/${id}/toggle`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['Reports'],
    }),

    // Obtener preview de reporte
    getReportPreview: builder.mutation<ReportPreviewData, GenerateReportRequest>({
      query: (config) => ({
        url: '/reports/preview',
        method: 'POST',
        body: config,
      }),
    }),

    // Enviar reporte por email
    sendReportByEmail: builder.mutation<void, { reportId: number; recipients: string[] }>({
      query: ({ reportId, recipients }) => ({
        url: `/reports/${reportId}/send`,
        method: 'POST',
        body: { recipients },
      }),
    }),
  }),
});

export const {
  useGenerateReportMutation,
  useGetReportQuery,
  useDownloadReportMutation,
  useGetReportHistoryQuery,
  useGetScheduledReportsQuery,
  useScheduleReportMutation,
  useUpdateScheduledReportMutation,
  useDeleteScheduledReportMutation,
  useToggleScheduledReportMutation,
  useGetReportPreviewMutation,
  useSendReportByEmailMutation,
} = reportsApi;
