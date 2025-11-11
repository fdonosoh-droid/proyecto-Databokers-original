import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useGetPublicationStatsQuery } from '../../redux/api/publicationsApi';
import { LoadingSpinner } from '../../components/common';
import type { PublicationFilters } from '../../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface PublicationStatsProps {
  filters?: PublicationFilters;
}

export default function PublicationStats({ filters }: PublicationStatsProps) {
  const { data: stats, isLoading, error } = useGetPublicationStatsQuery(filters);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error al cargar estadísticas</Typography>
      </Box>
    );
  }

  // Preparar datos para gráficos
  const estadosData = Object.entries(stats.publicacionesPorEstado).map(
    ([estado, cantidad]) => ({
      estado,
      cantidad,
    })
  );

  const efectividadData = stats.efectividadPorCorreedor.map((corredor) => ({
    nombre: corredor.nombre,
    activas: corredor.publicacionesActivas,
    tasaExito: corredor.tasaExito,
  }));

  return (
    <Box>
      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Publicaciones
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.totalPublicaciones}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Publicaciones Activas
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.publicacionesPorEstado.ACTIVA || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Comisiones Generadas
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {formatCurrency(stats.comisionesGeneradas)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tiempo Promedio Cierre
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {Math.round(stats.tiempoPromedioHastaCierre)} días
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Publicaciones por Estado */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Publicaciones por Estado
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={estadosData}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.estado}: ${entry.cantidad}`}
                >
                  {estadosData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Efectividad por Corredor */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Publicaciones Activas por Corredor
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={efectividadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="activas"
                  fill="#8884d8"
                  name="Publicaciones Activas"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Tasa de Éxito por Corredor */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tasa de Éxito por Corredor
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={efectividadData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="tasaExito"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Tasa de Éxito (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de Efectividad Detallada */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Efectividad por Corredor (Detalle)
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {stats.efectividadPorCorreedor.map((corredor) => (
            <Grid size={{ xs: 12, md: 6 }} key={corredor.corredorId}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">{corredor.nombre}</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Publicaciones Activas
                      </Typography>
                      <Typography variant="h5">
                        {corredor.publicacionesActivas}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="text.secondary">
                        Tasa de Éxito
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {corredor.tasaExito.toFixed(1)}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
