import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Grid,
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ViewModule as CardViewIcon,
  ViewList as ListViewIcon,
  Bed as BedIcon,
  Bathtub as BathIcon,
  DirectionsCar as ParkingIcon,
} from '@mui/icons-material';
import { useGetPropertiesQuery, useDeletePropertyMutation } from '../../redux/api/propertiesApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageTitle from '../../components/common/PageTitle';

const TIPOS_PROPIEDAD = ['CASA', 'DEPARTAMENTO', 'OFICINA', 'LOCAL_COMERCIAL', 'TERRENO'];
const ESTADOS = ['DISPONIBLE', 'RESERVADA', 'VENDIDA', 'BLOQUEADA'];
const MODELOS_NEGOCIO = ['VENTA_DIRECTA', 'PREVENTA', 'CONSIGNACION', 'CANJE'];

export default function PropertiesListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [filters, setFilters] = useState({
    tipo: '',
    estado: '',
    modeloNegocio: '',
    search: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<{ id: string; direccion: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading, error } = useGetPropertiesQuery({
    page: page + 1,
    limit: rowsPerPage,
    filters: {
      ...(filters.tipo && { tipo: filters.tipo }),
      ...(filters.estado && { estado: filters.estado }),
      ...(filters.modeloNegocio && { modeloNegocio: filters.modeloNegocio }),
      ...(filters.search && { search: filters.search }),
    },
  });

  const [deleteProperty, { isLoading: isDeleting }] = useDeletePropertyMutation();

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

  const handleDeleteClick = (id: string, direccion: string) => {
    setPropertyToDelete({ id, direccion });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!propertyToDelete) return;

    try {
      await deleteProperty(propertyToDelete.id).unwrap();
      setSnackbar({
        open: true,
        message: `Propiedad "${propertyToDelete.direccion}" eliminada exitosamente`,
        severity: 'success',
      });
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.data?.message || 'Error al eliminar la propiedad',
        severity: 'error',
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPropertyToDelete(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getEstadoColor = (estado: string) => {
    const colorMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
      DISPONIBLE: 'success',
      RESERVADA: 'warning',
      VENDIDA: 'error',
      BLOQUEADA: 'default',
    };
    return colorMap[estado] || 'default';
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <Typography color="error">Error al cargar propiedades</Typography>;

  const properties = data?.data || [];
  const totalProperties = data?.total || 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <PageTitle title="Propiedades" subtitle="Gestión de propiedades inmobiliarias" />
        <Box display="flex" gap={2} alignItems="center">
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_e, newMode) => newMode && setViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="table">
              <ListViewIcon />
            </ToggleButton>
            <ToggleButton value="cards">
              <CardViewIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/propiedades/nuevo')}
          >
            Nueva Propiedad
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Buscar"
              variant="outlined"
              size="small"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filters.tipo}
                label="Tipo"
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {TIPOS_PROPIEDAD.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
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
                    {estado}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Modelo</InputLabel>
              <Select
                value={filters.modeloNegocio}
                label="Modelo"
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

      {properties.length === 0 ? (
        <EmptyState
          message="No hay propiedades registradas"
          action={{ label: "Crear Propiedad", onClick: () => navigate("/properties/new") }}
        />
      ) : viewMode === 'table' ? (
        /* Vista de Tabla */
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Propiedad</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Características</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {property.direccion}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {property.superficie} m²
                    </Typography>
                  </TableCell>
                  <TableCell>{property.tipo.replace('_', ' ')}</TableCell>
                  <TableCell>
                    {property.comuna}, {property.region}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      ${property.precio.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1} alignItems="center">
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <BedIcon fontSize="small" />
                        <Typography variant="caption">{property.dormitorios}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <BathIcon fontSize="small" />
                        <Typography variant="caption">{property.banos}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <ParkingIcon fontSize="small" />
                        <Typography variant="caption">{property.estacionamientos}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={property.estado}
                      color={getEstadoColor(property.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/propiedades/${property.id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/propiedades/${property.id}/editar`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(property.id, property.direccion)}
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
            count={totalProperties}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </TableContainer>
      ) : (
        /* Vista de Tarjetas */
        <>
          <Grid container spacing={3}>
            {properties.map((property) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={property.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="div"
                    sx={{
                      height: 200,
                      bgcolor: 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Sin imagen
                    </Typography>
                  </CardMedia>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                      <Typography variant="h6" component="div">
                        ${property.precio.toLocaleString()}
                      </Typography>
                      <Chip
                        label={property.estado}
                        color={getEstadoColor(property.estado)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {property.tipo.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      {property.direccion}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      {property.comuna}, {property.region}
                    </Typography>
                    <Box display="flex" gap={2} mb={2}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <BedIcon fontSize="small" />
                        <Typography variant="body2">{property.dormitorios}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <BathIcon fontSize="small" />
                        <Typography variant="body2">{property.banos}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <ParkingIcon fontSize="small" />
                        <Typography variant="body2">{property.estacionamientos}</Typography>
                      </Box>
                      <Typography variant="body2">{property.superficie} m²</Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate(`/propiedades/${property.id}`)}
                      >
                        Ver
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        fullWidth
                        onClick={() => navigate(`/propiedades/${property.id}/editar`)}
                      >
                        Editar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box display="flex" justifyContent="center" mt={3}>
            <TablePagination
              component="div"
              count={totalProperties}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Items por página:"
            />
          </Box>
        </>
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
            ¿Está seguro que desea eliminar la propiedad "{propertyToDelete?.direccion}"? Esta acción no se puede deshacer.
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
