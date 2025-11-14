import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SalesChartProps {
  data: {
    mes: string;
    ventas: number;
    ingresos: number;
  }[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      notation: 'compact',
    }).format(value);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Ventas por Mes
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'ingresos') {
                    return [formatCurrency(value), 'Ingresos'];
                  }
                  return [value, 'Ventas'];
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ventas"
                stroke="#1976d2"
                strokeWidth={2}
                name="Ventas"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ingresos"
                stroke="#2e7d32"
                strokeWidth={2}
                name="Ingresos"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
