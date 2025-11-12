import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useGetProjectStatisticsQuery } from '../../redux/api/projectsApi';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProjectStatisticsProps {
  projectId: string;
}

const COLORS = ['#4caf50', '#ff9800', '#f44336', '#9e9e9e'];

export default function ProjectStatistics({ projectId }: ProjectStatisticsProps) {
  const { isLoading } = useGetProjectStatisticsQuery(projectId);

  if (isLoading) return <LoadingSpinner />;

  // Mock data - Reemplazar con datos reales de la API
  const unitsByStatus = [
    { name: 'Disponibles', value: 45 },
    { name: 'Reservadas', value: 12 },
    { name: 'Vendidas', value: 28 },
    { name: 'Bloqueadas', value: 5 },
  ];

  const salesByMonth = [
    { month: 'Ene', ventas: 4 },
    { month: 'Feb', ventas: 6 },
    { month: 'Mar', ventas: 8 },
    { month: 'Abr', ventas: 5 },
    { month: 'May', ventas: 7 },
    { month: 'Jun', ventas: 3 },
  ];

  const kpis = [
    {
      label: 'Valorización Total',
      value: '$8.500.000.000',
      subtitle: 'Valor total del proyecto',
    },
    {
      label: 'Comisión Estimada',
      value: '$170.000.000',
      subtitle: '2% del total',
    },
    {
      label: 'Velocidad de Ventas',
      value: '4.7 unidades/mes',
      subtitle: 'Promedio últimos 6 meses',
    },
    {
      label: 'Tiempo Promedio Venta',
      value: '18 días',
      subtitle: 'Desde publicación a cierre',
    },
  ];

  return (
    <Box sx={{ px: 2 }}>
      {/* KPIs */}
      <Grid container spacing={3} mb={4}>
        {kpis.map((kpi, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  {kpi.label}
                </Typography>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {kpi.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        {/* Unidades por Estado */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribución de Unidades por Estado
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={unitsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) =>
                      `${props.name}: ${((props.percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {unitsByStatus.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Ventas por Mes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ventas por Mes
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="ventas" fill="#4caf50" name="Unidades Vendidas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabla de Comisiones */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen de Comisiones
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Comisión Bruta
                  </Typography>
                  <Typography variant="h6">$170.000.000</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Comisión Neta
                  </Typography>
                  <Typography variant="h6">$153.000.000</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Comisiones Pagadas
                  </Typography>
                  <Typography variant="h6">$85.000.000</Typography>
                </Grid>
                <Grid size={{ xs: 6, md: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Comisiones Pendientes
                  </Typography>
                  <Typography variant="h6">$68.000.000</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
