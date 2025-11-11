/**
 * Componente para preview de reportes antes de generar
 */
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import type { ReportPreviewData } from '../types';
import ReportTable from './ReportTable';
import ReportChart from './ReportChart';

interface ReportPreviewProps {
  data: ReportPreviewData | null;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onGenerate: () => void;
}

export default function ReportPreview({
  data,
  loading,
  error,
  onClose,
  onGenerate,
}: ReportPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" onClose={onClose}>
        {error}
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Box>
      {/* Header con acciones */}
      <Paper sx={{ p: 2, mb: 2 }} className="no-print">
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Vista Previa del Reporte</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              size="small"
            >
              Imprimir
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={onGenerate}
              size="small"
            >
              Generar Reporte
            </Button>
            <Button
              variant="text"
              startIcon={<CloseIcon />}
              onClick={onClose}
              size="small"
            >
              Cerrar
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Contenido del reporte */}
      <Paper sx={{ p: 3 }} className="print-content">
        {/* Encabezado del reporte */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {data.title}
          </Typography>
          {data.subtitle && (
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {data.subtitle}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Período: {new Date(data.period.startDate).toLocaleDateString()} -{' '}
            {new Date(data.period.endDate).toLocaleDateString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Generado el: {new Date().toLocaleString()}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Resumen ejecutivo */}
        {data.summary && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Resumen Ejecutivo
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {data.summary.totalRecords}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Registros
                  </Typography>
                </Paper>
              </Grid>
              {data.summary.totalValue !== undefined && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      ${data.summary.totalValue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Valor Total
                    </Typography>
                  </Paper>
                </Grid>
              )}
              {data.summary.averageValue !== undefined && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      ${data.summary.averageValue.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Promedio
                    </Typography>
                  </Paper>
                </Grid>
              )}
              {data.summary.percentageChange !== undefined && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography
                      variant="h4"
                      color={data.summary.percentageChange >= 0 ? 'success.main' : 'error.main'}
                    >
                      {data.summary.percentageChange >= 0 ? '+' : ''}
                      {data.summary.percentageChange.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cambio vs. Período Anterior
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Contenido dinámico del reporte */}
        <Box sx={{ mb: 3 }}>
          {data.data && typeof data.data === 'object' && (
            <Box>
              {/* Renderizar tablas */}
              {data.data.tables?.map((table: any, index: number) => (
                <Box key={index} sx={{ mb: 4 }}>
                  <ReportTable
                    title={table.title}
                    columns={table.columns}
                    data={table.data}
                    showTotal={table.showTotal}
                    totalRow={table.totalRow}
                  />
                </Box>
              ))}

              {/* Renderizar gráficos */}
              {data.data.charts?.map((chart: any, index: number) => (
                <Box key={index} sx={{ mb: 4 }}>
                  <ReportChart
                    title={chart.title}
                    type={chart.type}
                    data={chart.data}
                    dataKey={chart.dataKey}
                    xAxisKey={chart.xAxisKey}
                    colors={chart.colors}
                  />
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Pie de página */}
        <Divider sx={{ mt: 4, mb: 2 }} />
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          © {new Date().getFullYear()} Databrokers - Sistema de Gestión Inmobiliaria
        </Typography>
      </Paper>
    </Box>
  );
}
