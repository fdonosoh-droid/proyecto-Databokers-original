import { useState } from 'react';
import { Typography, Box, Grid, CircularProgress, Alert } from '@mui/material';
import { PageTitle } from '../components/common';
import {
  KPICard,
  SalesChart,
  BusinessModelChart,
  TradeInsChart,
  PublicationsChart,
  RecentActivity,
  AlertsPanel,
  DashboardFilters,
} from '../components/dashboard';
import {
  useGetDashboardKPIsQuery,
  useGetDashboardStatisticsQuery,
  useGetDashboardAlertsQuery,
  useGetRecentActivityQuery,
  useMarkAlertAsReadMutation,
  useExportDashboardMutation,
  DashboardFilters as Filters,
} from '../redux/api/dashboardApi';

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>({ periodo: 'mes' });

  // Queries
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useGetDashboardKPIsQuery(filters);
  const { data: statistics, isLoading: statsLoading, error: statsError } = useGetDashboardStatisticsQuery(filters);
  const { data: alerts, isLoading: alertsLoading } = useGetDashboardAlertsQuery();
  const { data: recentActivity } = useGetRecentActivityQuery({ limit: 10 });

  // Mutations
  const [markAlertAsRead] = useMarkAlertAsReadMutation();
  const [exportDashboard] = useExportDashboardMutation();

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleExport = async (formato: 'pdf' | 'excel') => {
    try {
      const blob = await exportDashboard({ formato, filters }).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al exportar dashboard:', error);
    }
  };

  const handleMarkAlertAsRead = (alertId: string) => {
    markAlertAsRead(alertId);
  };

  if (kpisLoading || statsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (kpisError || statsError) {
    return (
      <Box>
        <PageTitle title="Dashboard Ejecutivo" />
        <Alert severity="error">
          Error al cargar los datos del dashboard. Por favor, intente nuevamente.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageTitle title="Dashboard Ejecutivo" />

      {/* Filtros */}
      <DashboardFilters onFiltersChange={handleFiltersChange} onExport={handleExport} />

      {/* Grid de KPIs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            label="Valorización Total"
            value={kpis?.valorizacionTotal || 0}
            change={kpis?.cambios.valorizacionTotal}
            trend={
              kpis?.cambios.valorizacionTotal
                ? kpis.cambios.valorizacionTotal > 0
                  ? 'up'
                  : kpis.cambios.valorizacionTotal < 0
                  ? 'down'
                  : 'neutral'
                : undefined
            }
            format="currency"
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            label="Comisión Bruta Estimada"
            value={kpis?.comisionBrutaEstimada || 0}
            change={kpis?.cambios.comisionBrutaEstimada}
            trend={
              kpis?.cambios.comisionBrutaEstimada
                ? kpis.cambios.comisionBrutaEstimada > 0
                  ? 'up'
                  : kpis.cambios.comisionBrutaEstimada < 0
                  ? 'down'
                  : 'neutral'
                : undefined
            }
            format="currency"
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            label="Comisión Neta"
            value={kpis?.comisionNeta || 0}
            change={kpis?.cambios.comisionNeta}
            trend={
              kpis?.cambios.comisionNeta
                ? kpis.cambios.comisionNeta > 0
                  ? 'up'
                  : kpis.cambios.comisionNeta < 0
                  ? 'down'
                  : 'neutral'
                : undefined
            }
            format="currency"
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            label="Tasa de Conversión"
            value={kpis?.tasaConversion || 0}
            change={kpis?.cambios.tasaConversion}
            trend={
              kpis?.cambios.tasaConversion
                ? kpis.cambios.tasaConversion > 0
                  ? 'up'
                  : kpis.cambios.tasaConversion < 0
                  ? 'down'
                  : 'neutral'
                : undefined
            }
            format="percentage"
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            label="Tiempo Promedio de Venta"
            value={kpis?.tiempoPromedioVenta || 0}
            change={kpis?.cambios.tiempoPromedioVenta}
            trend={
              kpis?.cambios.tiempoPromedioVenta
                ? kpis.cambios.tiempoPromedioVenta > 0
                  ? 'down'
                  : kpis.cambios.tiempoPromedioVenta < 0
                  ? 'up'
                  : 'neutral'
                : undefined
            }
            format="days"
            color="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            label="Inventario Disponible"
            value={kpis?.inventarioDisponible || 0}
            change={kpis?.cambios.inventarioDisponible}
            trend={
              kpis?.cambios.inventarioDisponible
                ? kpis.cambios.inventarioDisponible > 0
                  ? 'up'
                  : kpis.cambios.inventarioDisponible < 0
                  ? 'down'
                  : 'neutral'
                : undefined
            }
            format="number"
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            label="Rotación de Inventario"
            value={kpis?.rotacionInventario || 0}
            change={kpis?.cambios.rotacionInventario}
            trend={
              kpis?.cambios.rotacionInventario
                ? kpis.cambios.rotacionInventario > 0
                  ? 'up'
                  : kpis.cambios.rotacionInventario < 0
                  ? 'down'
                  : 'neutral'
                : undefined
            }
            format="percentage"
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            label="Canjes Activos"
            value={kpis?.canjesActivos || 0}
            change={kpis?.cambios.canjesActivos}
            trend={
              kpis?.cambios.canjesActivos
                ? kpis.cambios.canjesActivos > 0
                  ? 'up'
                  : kpis.cambios.canjesActivos < 0
                  ? 'down'
                  : 'neutral'
                : undefined
            }
            format="number"
            color="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <KPICard
            label="Tasa de Éxito de Canjes"
            value={kpis?.tasaExitoCanjes || 0}
            change={kpis?.cambios.tasaExitoCanjes}
            trend={
              kpis?.cambios.tasaExitoCanjes
                ? kpis.cambios.tasaExitoCanjes > 0
                  ? 'up'
                  : kpis.cambios.tasaExitoCanjes < 0
                  ? 'down'
                  : 'neutral'
                : undefined
            }
            format="percentage"
            color="success"
          />
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <SalesChart data={statistics?.ventasPorMes || []} />
        </Grid>

        <Grid item xs={12} lg={4}>
          <BusinessModelChart data={statistics?.distribucionModeloNegocio || []} />
        </Grid>

        <Grid item xs={12} md={6}>
          <TradeInsChart data={statistics?.canjesPorEstado || []} />
        </Grid>

        <Grid item xs={12} md={6}>
          <PublicationsChart data={statistics?.publicacionesActivas || []} />
        </Grid>
      </Grid>

      {/* Actividad Reciente y Alertas */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <RecentActivity activities={recentActivity || []} />
        </Grid>

        <Grid item xs={12} lg={4}>
          {!alertsLoading && (
            <AlertsPanel alerts={alerts || []} onMarkAsRead={handleMarkAlertAsRead} />
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
