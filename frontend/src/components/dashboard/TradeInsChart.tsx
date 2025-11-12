import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

interface TradeInsChartProps {
  data: {
    estado: string;
    cantidad: number;
  }[];
}

const getBarColor = (estado: string) => {
  const colores: Record<string, string> = {
    'Iniciado': '#9e9e9e',
    'En Evaluación': '#2196f3',
    'Aprobado': '#4caf50',
    'Finalizado': '#1976d2',
    'Rechazado': '#f44336',
  };
  return colores[estado] || '#757575';
};

export default function TradeInsChart({ data }: TradeInsChartProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Canjes por Estado
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="estado" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cantidad" name="Cantidad">
                {data.map((entry, _index) => (
                  <Cell key={`cell-${entry.estado}`} fill={getBarColor(entry.estado)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
