/**
 * Componente de gráficos para reportes
 */
import { Box, Typography, Paper } from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export type ChartType = 'bar' | 'line' | 'pie';

interface ReportChartProps {
  title?: string;
  type: ChartType;
  data: any[];
  dataKey?: string;
  xAxisKey?: string;
  colors?: string[];
  height?: number;
}

const DEFAULT_COLORS = [
  '#1976d2',
  '#dc004e',
  '#ff9800',
  '#4caf50',
  '#9c27b0',
  '#00bcd4',
  '#ff5722',
];

export default function ReportChart({
  title,
  type,
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  colors = DEFAULT_COLORS,
  height = 300,
}: ReportChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                dataKey={dataKey}
                nameKey={xAxisKey}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 2 }} className="report-chart">
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      <Box className="print-chart">{renderChart()}</Box>
    </Paper>
  );
}
