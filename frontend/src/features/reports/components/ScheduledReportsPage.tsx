/**
 * Página de gestión de reportes programados
 */
import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import {
  useGetScheduledReportsQuery,
  useScheduleReportMutation,
  useUpdateScheduledReportMutation,
  useDeleteScheduledReportMutation,
  useToggleScheduledReportMutation,
} from '../../../redux/api/reportsApi';
import { ReportType, ReportFormat, ReportFrequency, type ScheduledReport } from '../types';
import PageTitle from '../../../components/common/PageTitle';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';

const REPORT_TYPES = [
  { value: ReportType.PROJECTS, label: 'Proyectos' },
  { value: ReportType.SALES, label: 'Ventas' },
  { value: ReportType.TRADEINS, label: 'Canjes' },
  { value: ReportType.PUBLICATIONS, label: 'Publicaciones' },
  { value: ReportType.COMMISSIONS, label: 'Comisiones' },
  { value: ReportType.CONSOLIDATED, label: 'Consolidado' },
];

const FREQUENCIES = [
  { value: ReportFrequency.DAILY, label: 'Diario' },
  { value: ReportFrequency.WEEKLY, label: 'Semanal' },
  { value: ReportFrequency.MONTHLY, label: 'Mensual' },
];

export default function ScheduledReportsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    format: string;
    frequency: string;
    recipients: string;
  }>({
    name: '',
    type: ReportType.PROJECTS,
    format: ReportFormat.PDF,
    frequency: ReportFrequency.MONTHLY,
    recipients: '',
  });

  const { data: reports = [], isLoading, refetch } = useGetScheduledReportsQuery();
  const [scheduleReport] = useScheduleReportMutation();
  const [updateReport] = useUpdateScheduledReportMutation();
  const [deleteReport] = useDeleteScheduledReportMutation();
  const [toggleReport] = useToggleScheduledReportMutation();

  const handleOpenDialog = (report?: ScheduledReport) => {
    if (report) {
      setEditingReport(report);
      setFormData({
        name: report.name,
        type: report.type,
        format: report.format,
        frequency: report.frequency,
        recipients: report.recipients.join(', '),
      });
    } else {
      setEditingReport(null);
      setFormData({
        name: '',
        type: ReportType.PROJECTS,
        format: ReportFormat.PDF,
        frequency: ReportFrequency.MONTHLY,
        recipients: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingReport(null);
  };

  const handleSubmit = async () => {
    try {
      const recipients = formData.recipients.split(',').map((email) => email.trim());
      const payload = {
        name: formData.name,
        type: formData.type as ReportType,
        format: formData.format as ReportFormat,
        frequency: formData.frequency as ReportFrequency,
        config: {
          type: formData.type as ReportType,
          format: formData.format as ReportFormat,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
        recipients,
      };

      if (editingReport) {
        await updateReport({ id: editingReport.id, data: payload }).unwrap();
      } else {
        await scheduleReport(payload).unwrap();
      }

      refetch();
      handleCloseDialog();
    } catch (error) {
      console.error('Error al guardar reporte programado:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este reporte programado?')) {
      try {
        await deleteReport(id).unwrap();
        refetch();
      } catch (error) {
        console.error('Error al eliminar reporte:', error);
      }
    }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await toggleReport({ id, isActive: !isActive }).unwrap();
      refetch();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <PageTitle title="Reportes Programados" />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Configure reportes automáticos que se generarán periódicamente
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Nuevo Reporte Programado
          </Button>
        </Stack>
      </Paper>

      {reports.length === 0 ? (
        <EmptyState
          title="No hay reportes programados"
          message="Cree su primer reporte programado para recibir información automáticamente"
        />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Frecuencia</TableCell>
                <TableCell>Próxima Ejecución</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Typography variant="body2">{report.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Destinatarios: {report.recipients.length}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {REPORT_TYPES.find((t) => t.value === report.type)?.label || report.type}
                  </TableCell>
                  <TableCell>
                    {FREQUENCIES.find((f) => f.value === report.frequency)?.label ||
                      report.frequency}
                  </TableCell>
                  <TableCell>
                    {new Date(report.nextRun).toLocaleDateString()}{' '}
                    {new Date(report.nextRun).toLocaleTimeString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={report.isActive ? 'Activo' : 'Pausado'}
                      color={report.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleToggle(report.id, report.isActive)}
                      title={report.isActive ? 'Pausar' : 'Activar'}
                    >
                      {report.isActive ? <PauseIcon /> : <PlayIcon />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(report)}
                      title="Editar"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(report.id)}
                      title="Eliminar"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog para crear/editar reporte programado */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingReport ? 'Editar Reporte Programado' : 'Nuevo Reporte Programado'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nombre del Reporte"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Reporte</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo de Reporte"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ReportType })}
                >
                  {REPORT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Formato</InputLabel>
                <Select
                  value={formData.format}
                  label="Formato"
                  onChange={(e) =>
                    setFormData({ ...formData, format: e.target.value as ReportFormat })
                  }
                >
                  <MenuItem value={ReportFormat.PDF}>PDF</MenuItem>
                  <MenuItem value={ReportFormat.EXCEL}>Excel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Frecuencia</InputLabel>
                <Select
                  value={formData.frequency}
                  label="Frecuencia"
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value as ReportFrequency })
                  }
                >
                  {FREQUENCIES.map((freq) => (
                    <MenuItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Destinatarios (emails separados por coma)"
                value={formData.recipients}
                onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                multiline
                rows={2}
                placeholder="email1@example.com, email2@example.com"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingReport ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
