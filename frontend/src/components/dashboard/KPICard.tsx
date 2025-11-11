import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
} from '@mui/icons-material';

interface KPICardProps {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'percentage' | 'number' | 'days';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const formatValue = (value: number | string, format?: string): string => {
  if (typeof value === 'string') return value;

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(value);
    case 'percentage':
      return `${value.toFixed(2)}%`;
    case 'days':
      return `${value.toFixed(0)} días`;
    case 'number':
    default:
      return new Intl.NumberFormat('es-CL').format(value);
  }
};

const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
  switch (trend) {
    case 'up':
      return <TrendingUp fontSize="small" />;
    case 'down':
      return <TrendingDown fontSize="small" />;
    case 'neutral':
    default:
      return <TrendingFlat fontSize="small" />;
  }
};

const getTrendColor = (trend?: 'up' | 'down' | 'neutral', isPositiveGood: boolean = true) => {
  if (!trend || trend === 'neutral') return 'default';

  if (isPositiveGood) {
    return trend === 'up' ? 'success' : 'error';
  } else {
    return trend === 'up' ? 'error' : 'success';
  }
};

export default function KPICard({
  label,
  value,
  change,
  trend,
  format = 'number',
  color = 'primary',
}: KPICardProps) {
  // Determinar si el cambio es positivo o negativo según el tipo de KPI
  const isPositiveGood = !label.toLowerCase().includes('tiempo');
  const trendColor = change !== undefined ? getTrendColor(trend, isPositiveGood) : undefined;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          gutterBottom
          sx={{ fontWeight: 500 }}
        >
          {label}
        </Typography>

        <Typography
          variant="h4"
          component="div"
          color={`${color}.main`}
          sx={{ fontWeight: 'bold', my: 1 }}
        >
          {formatValue(value, format)}
        </Typography>

        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={getTrendIcon(trend)}
              label={`${change > 0 ? '+' : ''}${change.toFixed(2)}%`}
              size="small"
              color={trendColor}
              sx={{ fontWeight: 500 }}
            />
            <Typography variant="caption" color="text.secondary">
              vs período anterior
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
