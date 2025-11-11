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
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useGetProjectsQuery } from '../../redux/api/projectsApi';
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

  const { data, isLoading, error } = useGetProjectsQuery({
    page: page + 1,
    limit: rowsPerPage,
    filters: {
      ...(filters.estado && { estado: filters.estado }),
      ...(filters.modeloNegocio && { modeloNegocio: filters.modeloNegocio }),
      ...(filters.search && { search: filters.search }),
    },
  });

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
    // TODO: Implementar exportación a Excel
    console.log('Exportar a Excel');
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
          action={{ label: "Crear Proyecto", onClick: () => navigate("/projects/new") }}
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
                      <IconButton size="small" color="error">
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
    </Box>
  );
}
