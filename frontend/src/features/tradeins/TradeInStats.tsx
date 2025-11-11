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
} from 'recharts';
import { useGetTradeInStatsQuery } from '../../redux/api/tradeInsApi';
import { LoadingSpinner } from '../../components/common';
import type { TradeInFilters } from '../../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface TradeInStatsProps {
  filters?: TradeInFilters;
}

export default function TradeInStats({ filters }: TradeInStatsProps) {
  const { data: stats, isLoading, error } = useGetTradeInStatsQuery(filters);

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
  const estadosData = Object.entries(stats.canjesPorEstado).map(([estado, cantidad]) => ({
    estado,
    cantidad,
  }));

  const topGestoresData = stats.topGestores.map((gestor) => ({
    nombre: gestor.nombre,
    canjes: gestor.cantidadCanjes,
  }));

  return (
    <Box>
      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Canjes
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {stats.totalCanjes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tasa de Éxito
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.tasaExito.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Diferencia Promedio
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {formatCurrency(stats.valorPromedioDiferencia)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tiempo Promedio
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {Math.round(stats.tiempoPromedioProcesoHoras)} hrs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Canjes por Estado */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Canjes por Estado
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
                  label={(entry) => `${entry.estado}: ${entry.cantidad}`}
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

        {/* Top Gestores */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Gestores
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topGestoresData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="canjes" fill="#8884d8" name="Canjes Gestionados" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
