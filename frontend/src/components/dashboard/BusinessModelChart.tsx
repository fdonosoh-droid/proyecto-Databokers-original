import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface BusinessModelChartProps {
  data: {
    modelo: string;
    cantidad: number;
    porcentaje: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function BusinessModelChart({ data }: BusinessModelChartProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Distribución por Modelo de Negocio
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => `${props.porcentaje.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="cantidad"
                nameKey="modelo"
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
