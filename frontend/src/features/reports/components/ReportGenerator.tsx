/**
 * Componente generador de reportes con formulario de configuración
 */
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Grid,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { ReportType, ReportFormat, type ReportFilters } from '../types';
import {
  useGetReportPreviewMutation,
  useGenerateReportMutation,
  useDownloadReportMutation,
} from '../../../redux/api/reportsApi';
import ReportPreview from './ReportPreview';

// Metadata de tipos de reportes
const REPORT_TYPES = [
  {
    value: ReportType.PROJECTS,
    label: 'Reporte de Proyectos',
    description: 'Análisis completo de proyectos inmobiliarios',
  },
  {
    value: ReportType.SALES,
    label: 'Reporte de Ventas',
    description: 'Ventas realizadas y métricas de conversión',
  },
  {
    value: ReportType.TRADEINS,
    label: 'Reporte de Canjes',
    description: 'Análisis de canjes (trade-ins) realizados',
  },
  {
    value: ReportType.PUBLICATIONS,
    label: 'Reporte de Publicaciones',
    description: 'Estadísticas de publicaciones y corredores',
  },
  {
    value: ReportType.COMMISSIONS,
    label: 'Reporte de Comisiones',
    description: 'Detalle de comisiones generadas',
  },
  {
    value: ReportType.CONSOLIDATED,
    label: 'Reporte Consolidado',
    description: 'Resumen ejecutivo de todos los módulos',
  },
];

const REPORT_FORMATS = [
  { value: ReportFormat.PDF, label: 'PDF' },
  { value: ReportFormat.EXCEL, label: 'Excel' },
];

export default function ReportGenerator() {
  const [reportType, setReportType] = useState<ReportType>(ReportType.PROJECTS);
  const [format, setFormat] = useState<ReportFormat>(ReportFormat.PDF);
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filters] = useState<ReportFilters>({});
  const [showPreview, setShowPreview] = useState(false);

  const [getPreview, { data: previewData, isLoading: isLoadingPreview, error: previewError }] =
    useGetReportPreviewMutation();
  const [generateReport, { isLoading: isGenerating }] = useGenerateReportMutation();
  const [downloadReport] = useDownloadReportMutation();

  const selectedReportType = REPORT_TYPES.find((rt) => rt.value === reportType);

  const handlePreview = async () => {
    try {
      await getPreview({
        type: reportType,
        format,
        startDate,
        endDate,
        filters,
      }).unwrap();
      setShowPreview(true);
    } catch (error) {
      console.error('Error al obtener preview:', error);
    }
  };

  const handleGenerate = async () => {
    try {
      const result = await generateReport({
        type: reportType,
        format,
        startDate,
        endDate,
        filters,
      }).unwrap();

      // Descargar automáticamente
      if (result.id) {
        const blob = await downloadReport({
          id: result.id,
          format,
        }).unwrap();

        // Crear enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-${reportType}-${new Date().toISOString().split('T')[0]}.${
          format === ReportFormat.PDF ? 'pdf' : 'xlsx'
        }`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      setShowPreview(false);
    } catch (error) {
      console.error('Error al generar reporte:', error);
    }
  };

  if (showPreview) {
    return (
      <ReportPreview
        data={previewData || null}
        loading={isLoadingPreview}
        error={previewError ? 'Error al cargar preview' : undefined}
        onClose={() => setShowPreview(false)}
        onGenerate={handleGenerate}
      />
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Generador de Reportes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure los parámetros del reporte que desea generar
      </Typography>

      <Grid container spacing={3}>
        {/* Tipo de Reporte */}
        <Grid size={{ xs: 12 }}>
          <FormControl fullWidth>
            <InputLabel>Tipo de Reporte</InputLabel>
            <Select
              value={reportType}
              label="Tipo de Reporte"
              onChange={(e) => setReportType(e.target.value as ReportType)}
            >
              {REPORT_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box>
                    <Typography variant="body1">{type.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {type.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Formato */}
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Formato</InputLabel>
            <Select
              value={format}
              label="Formato"
              onChange={(e) => setFormat(e.target.value as ReportFormat)}
            >
              {REPORT_FORMATS.map((fmt) => (
                <MenuItem key={fmt.value} value={fmt.value}>
                  {fmt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Fecha de Inicio */}
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="Fecha de Inicio"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Fecha de Fin */}
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="Fecha de Fin"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Filtros adicionales según tipo de reporte */}
        {selectedReportType && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>{selectedReportType.label}</strong>
              <br />
              {selectedReportType.description}
            </Alert>
          </Grid>
        )}

        {/* Acciones */}
        <Grid size={{ xs: 12 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={handlePreview}
              disabled={isLoadingPreview || isGenerating}
            >
              Vista Previa
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleGenerate}
              disabled={isLoadingPreview || isGenerating}
            >
              {isGenerating ? 'Generando...' : 'Generar y Descargar'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
}
