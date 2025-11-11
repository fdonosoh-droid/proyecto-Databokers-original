import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Button,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useGetPublicationsQuery } from '../../redux/api/publicationsApi';
import type { PublicationEstado, PublicationFilters } from '../../types';
import { LoadingSpinner } from '../../components/common';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

const estadoColors: Record<PublicationEstado, 'default' | 'success' | 'warning' | 'error'> = {
  ACTIVA: 'success',
  PAUSADA: 'warning',
  FINALIZADA: 'default',
  VENCIDA: 'error',
};

const estadoLabels: Record<PublicationEstado, string> = {
  ACTIVA: 'Activa',
  PAUSADA: 'Pausada',
  FINALIZADA: 'Finalizada',
  VENCIDA: 'Vencida',
};

const exclusividadColors = {
  EXCLUSIVA: 'success',
  SEMI_EXCLUSIVA: 'warning',
  NO_EXCLUSIVA: 'default',
} as const;

const exclusividadLabels = {
  EXCLUSIVA: 'Exclusiva',
  SEMI_EXCLUSIVA: 'Semi-Exclusiva',
  NO_EXCLUSIVA: 'No Exclusiva',
} as const;

interface PublicationsListProps {
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCreate?: () => void;
  onToggleStatus?: (id: string) => void;
  onRenew?: (id: string) => void;
}

export default function PublicationsList({
  onView,
  onEdit,
  onDelete,
  onCreate,
  onToggleStatus,
  onRenew,
}: PublicationsListProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<PublicationFilters>({});

  const { data, isLoading, error } = useGetPublicationsQuery({
    filters,
    page: page + 1,
    limit: rowsPerPage,
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (key: keyof PublicationFilters, value: string | boolean) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  };

  const getDaysUntilExpiration = (dateString: string) => {
    return differenceInDays(new Date(dateString), new Date());
  };

  const getConversionRate = (contactos: number, visualizaciones: number) => {
    if (visualizaciones === 0) return 0;
    return (contactos / visualizaciones) * 100;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error al cargar las publicaciones</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Estado"
              value={filters.estado || ''}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ACTIVA">Activa</MenuItem>
              <MenuItem value="PAUSADA">Pausada</MenuItem>
              <MenuItem value="FINALIZADA">Finalizada</MenuItem>
              <MenuItem value="VENCIDA">Vencida</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Tipo de Exclusividad"
              value={filters.tipoExclusividad || ''}
              onChange={(e) => handleFilterChange('tipoExclusividad', e.target.value)}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="EXCLUSIVA">Exclusiva</MenuItem>
              <MenuItem value="SEMI_EXCLUSIVA">Semi-Exclusiva</MenuItem>
              <MenuItem value="NO_EXCLUSIVA">No Exclusiva</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleFilterChange('vencimientoProximo', !filters.vencimientoProximo)}
              color={filters.vencimientoProximo ? 'primary' : 'inherit'}
            >
              Vencimiento Próximo
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              onClick={onCreate}
            >
              Nueva Publicación
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Propiedad</TableCell>
              <TableCell>Corredor</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Exclusividad</TableCell>
              <TableCell align="center">Métricas</TableCell>
              <TableCell align="right">Comisión</TableCell>
              <TableCell>Vencimiento</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && data.data.length > 0 ? (
              data.data.map((publication) => {
                const daysLeft = getDaysUntilExpiration(publication.fechaVencimiento);
                const conversionRate = getConversionRate(
                  publication.contactos,
                  publication.visualizaciones
                );

                return (
                  <TableRow key={publication.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {publication.propiedad?.direccion || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {publication.propiedad?.tipo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {publication.corredor
                        ? `${publication.corredor.nombre} ${publication.corredor.apellido}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={estadoLabels[publication.estado]}
                        color={estadoColors[publication.estado]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={exclusividadLabels[publication.tipoExclusividad]}
                        color={exclusividadColors[publication.tipoExclusividad]}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ minWidth: 150 }}>
                        <Typography variant="caption" display="block">
                          {publication.visualizaciones} vistas • {publication.contactos}{' '}
                          contactos
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(conversionRate * 10, 100)}
                          sx={{ mt: 0.5 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {conversionRate.toFixed(1)}% conversión
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(publication.comisionAcordada)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        color={daysLeft < 7 ? 'error.main' : 'text.primary'}
                      >
                        {formatDate(publication.fechaVencimiento)}
                      </Typography>
                      {daysLeft >= 0 && (
                        <Typography
                          variant="caption"
                          color={daysLeft < 7 ? 'error.main' : 'text.secondary'}
                        >
                          {daysLeft} días restantes
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Ver detalles">
                        <IconButton
                          size="small"
                          onClick={() => onView?.(publication.id)}
                          color="primary"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {publication.estado === 'ACTIVA' && (
                        <Tooltip title="Pausar">
                          <IconButton
                            size="small"
                            onClick={() => onToggleStatus?.(publication.id)}
                            color="warning"
                          >
                            <PauseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {publication.estado === 'PAUSADA' && (
                        <Tooltip title="Reactivar">
                          <IconButton
                            size="small"
                            onClick={() => onToggleStatus?.(publication.id)}
                            color="success"
                          >
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(publication.estado === 'VENCIDA' ||
                        publication.estado === 'FINALIZADA') && (
                        <Tooltip title="Renovar">
                          <IconButton
                            size="small"
                            onClick={() => onRenew?.(publication.id)}
                            color="info"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => onEdit?.(publication.id)}
                          color="info"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => onDelete?.(publication.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" py={3}>
                    No se encontraron publicaciones
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {data && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={data.total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count}`
            }
          />
        )}
      </TableContainer>
    </Box>
  );
}
