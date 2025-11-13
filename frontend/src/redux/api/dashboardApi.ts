import { baseApi } from './baseApi';
import type { Alert } from '../../types';

export interface DashboardKPIs {
  valorizacionTotal: number;
  comisionBrutaEstimada: number;
  comisionNeta: number;
  tasaConversion: number;
  tiempoPromedioVenta: number;
  inventarioDisponible: number;
  rotacionInventario: number;
  canjesActivos: number;
  tasaExitoCanjes: number;
  // Comparaciones con período anterior
  cambios: {
    valorizacionTotal: number;
    comisionBrutaEstimada: number;
    comisionNeta: number;
    tasaConversion: number;
    tiempoPromedioVenta: number;
    inventarioDisponible: number;
    rotacionInventario: number;
    canjesActivos: number;
    tasaExitoCanjes: number;
  };
}

export interface DashboardStatistics {
  ventasPorMes: {
    mes: string;
    ventas: number;
    ingresos: number;
  }[];
  distribucionModeloNegocio: {
    modelo: string;
    cantidad: number;
    porcentaje: number;
  }[];
  canjesPorEstado: {
    estado: string;
    cantidad: number;
  }[];
  publicacionesActivas: {
    tipo: string;
    cantidad: number;
  }[];
  actividadReciente: {
    id: string;
    tipo: 'venta' | 'canje' | 'publicacion' | 'proyecto';
    descripcion: string;
    fecha: string;
    usuario: string;
  }[];
}

export interface DashboardFilters {
  periodo?: 'hoy' | 'semana' | 'mes' | 'anio' | 'personalizado';
  fechaInicio?: string;
  fechaFin?: string;
  modeloNegocio?: string;
  regionId?: string;
  comunaId?: string;
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Obtener KPIs del dashboard
    getDashboardKPIs: builder.query<DashboardKPIs, DashboardFilters | void>({
      query: (filters = {}) => ({
        url: '/dashboard/kpis',
        params: filters || {},
      }),
      transformResponse: (response: any) => {
        // Transformar array de KPIs a objeto plano
        const kpisArray = response.data || [];
        const kpisMap: any = {};

        // Mapear códigos de KPI a propiedades del objeto
        const mapping: Record<string, string> = {
          'VALORIZACION_TOTAL': 'valorizacionTotal',
          'COMISION_TOTAL_GENERADA': 'comisionBrutaEstimada',
          'COMISION_NETA_AGENCIA': 'comisionNeta',
          'TASA_CONVERSION': 'tasaConversion',
          'TIEMPO_PROMEDIO_VENTA': 'tiempoPromedioVenta',
          'INDICE_STOCK': 'inventarioDisponible',
          'ROTACION_INVENTARIO': 'rotacionInventario',
          'CANJES_ACTIVOS': 'canjesActivos',
          'TASA_EXITO_CANJES': 'tasaExitoCanjes',
        };

        const cambios: any = {};

        kpisArray.forEach((kpi: any) => {
          const propName = mapping[kpi.codigo];
          if (propName) {
            kpisMap[propName] = kpi.valor;
            cambios[propName] = kpi.comparacion?.variacion || 0;
          }
        });

        return {
          ...kpisMap,
          cambios
        };
      },
      providesTags: ['Dashboard'],
      // Polling cada 5 minutos para datos en tiempo real
      keepUnusedDataFor: 300,
    }),

    // Obtener estadísticas del dashboard
    getDashboardStatistics: builder.query<DashboardStatistics, DashboardFilters | void>({
      query: (filters = {}) => ({
        url: '/dashboard/statistics',
        params: filters || {},
      }),
      transformResponse: (response: any) => response.data || {},
      providesTags: ['Dashboard'],
      keepUnusedDataFor: 300,
    }),

    // Obtener alertas del dashboard
    getDashboardAlerts: builder.query<Alert[], void>({
      query: () => '/dashboard/alerts',
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Dashboard'],
      // Polling cada 2 minutos para alertas
      keepUnusedDataFor: 120,
    }),

    // Obtener actividad reciente
    getRecentActivity: builder.query<DashboardStatistics['actividadReciente'], { limit?: number }>({
      query: ({ limit = 10 }) => ({
        url: '/dashboard/recent-activity',
        params: { limit },
      }),
      transformResponse: (response: any) => response.data || [],
      providesTags: ['Dashboard'],
    }),

    // Marcar alerta como leída
    markAlertAsRead: builder.mutation<void, string>({
      query: (alertId) => ({
        url: `/dashboard/alerts/${alertId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Dashboard'],
    }),

    // Exportar datos del dashboard
    exportDashboard: builder.mutation<Blob, { formato: 'pdf' | 'excel'; filters?: DashboardFilters }>({
      query: ({ formato, filters }) => ({
        url: `/dashboard/export/${formato}`,
        method: 'POST',
        body: filters,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetDashboardKPIsQuery,
  useGetDashboardStatisticsQuery,
  useGetDashboardAlertsQuery,
  useGetRecentActivityQuery,
  useMarkAlertAsReadMutation,
  useExportDashboardMutation,
} = dashboardApi;
