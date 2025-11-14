import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useGetProjectsQuery, useDeleteProjectMutation } from '../../redux/api/projectsApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageTitle from '../../components/common/PageTitle';

const ESTADOS = ['ACTIVO', 'INACTIVO', 'EN_CONSTRUCCION', 'FINALIZADO'];
const MODELOS_NEGOCIO = ['VENTA_DIRECTA', 'PREVENTA', 'CONSIGNACION', 'CANJE'];

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    estado: '',
    modeloNegocio: '',
    search: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; nombre: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading, error } = useGetProjectsQuery({
    page: page + 1,
    limit: rowsPerPage,
    filters: {
      ...(filters.estado && { estado: filters.estado }),
      ...(filters.modeloNegocio && { modeloNegocio: filters.modeloNegocio }),
      ...(filters.search && { search: filters.search }),
    },
  });

  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleExport = () => {
    if (!projects || projects.length === 0) {
      setSnackbar({
        open: true,
        message: 'No hay proyectos para exportar',
        severity: 'error',
      });
      return;
    }

    try {
      // Importar xlsx dinámicamente
      import('xlsx').then((XLSX) => {
        // Preparar datos para exportar
        const exportData = projects.map((project) => ({
          'Nombre': project.nombre,
          'Dirección': project.direccion,
          'Inmobiliaria': project.inmobiliaria?.nombre || 'N/A',
          'Estado': project.estado.replace('_', ' '),
          'Total Unidades': project.totalUnidades,
          'Unidades Disponibles': project.unidadesDisponibles,
          'Fecha Entrega': new Date(project.fechaEntrega).toLocaleDateString('es-CL'),
          'Modelo de Negocio': project.modeloNegocio.replace('_', ' '),
        }));

        // Crear workbook y worksheet
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Proyectos');

        // Generar archivo y descargarlo
        const fileName = `proyectos_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        setSnackbar({
          open: true,
          message: 'Proyectos exportados exitosamente',
          severity: 'success',
        });
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al exportar proyectos',
        severity: 'error',
      });
    }
  };

  const handleDeleteClick = (id: string, nombre: string) => {
    setProjectToDelete({ id, nombre });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete.id).unwrap();
      setSnackbar({
        open: true,
        message: `Proyecto "${projectToDelete.nombre}" eliminado exitosamente`,
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || 'Error al eliminar el proyecto',
        severity: 'error',
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getEstadoColor = (estado: string) => {
    const colorMap: Record<string, 'success' | 'warning' | 'info' | 'default'> = {
      ACTIVO: 'success',
      EN_CONSTRUCCION: 'warning',
      INACTIVO: 'default',
      FINALIZADO: 'info',
    };
    return colorMap[estado] || 'default';
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <Typography color="error">Error al cargar proyectos</Typography>;

  const projects = data?.data || [];
  const totalProjects = data?.total || 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <PageTitle title="Proyectos" subtitle="Gestión de proyectos inmobiliarios" />
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/proyectos/nuevo')}
          >
            Nuevo Proyecto
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Buscar por nombre"
              variant="outlined"
              size="small"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.estado}
                label="Estado"
                onChange={(e) => handleFilterChange('estado', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {ESTADOS.map((estado) => (
                  <MenuItem key={estado} value={estado}>
                    {estado.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Modelo de Negocio</InputLabel>
              <Select
                value={filters.modeloNegocio}
                label="Modelo de Negocio"
                onChange={(e) => handleFilterChange('modeloNegocio', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {MODELOS_NEGOCIO.map((modelo) => (
                  <MenuItem key={modelo} value={modelo}>
                    {modelo.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Tabla */}
      {projects.length === 0 ? (
        <EmptyState
          message="No hay proyectos registrados"
          action={{ label: "Crear Proyecto", onClick: () => navigate("/proyectos/nuevo") }}
        />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Inmobiliaria</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Unidades</TableCell>
                <TableCell>Disponibles</TableCell>
                <TableCell>Fecha Entrega</TableCell>
                <TableCell>Modelo</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {project.nombre}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {project.direccion}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {project.inmobiliaria?.nombre || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={project.estado.replace('_', ' ')}
                      color={getEstadoColor(project.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{project.totalUnidades}</TableCell>
                  <TableCell>
                    <Typography
                      color={project.unidadesDisponibles > 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {project.unidadesDisponibles}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(project.fechaEntrega).toLocaleDateString('es-CL')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {project.modeloNegocio.replace('_', ' ')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/proyectos/${project.id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/proyectos/${project.id}/editar`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(project.id, project.nombre)}
                        disabled={isDeleting}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalProjects}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count}`
            }
          />
        </TableContainer>
      )}

      {/* Dialog de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            ¿Está seguro que desea eliminar el proyecto "{projectToDelete?.nombre}"? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
