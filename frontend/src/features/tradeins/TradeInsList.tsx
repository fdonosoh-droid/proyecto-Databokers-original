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
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useGetTradeInsQuery } from '../../redux/api/tradeInsApi';
import type { TradeInEstado, TradeInFilters } from '../../types';
import { LoadingSpinner } from '../../components/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const estadoColors: Record<TradeInEstado, 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info'> = {
  INICIADO: 'info',
  EN_EVALUACION: 'warning',
  APROBADO: 'success',
  RECHAZADO: 'error',
  FINALIZADO: 'success',
  CANCELADO: 'default',
};

const estadoLabels: Record<TradeInEstado, string> = {
  INICIADO: 'Iniciado',
  EN_EVALUACION: 'En Evaluación',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

interface TradeInsListProps {
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCreate?: () => void;
}

export default function TradeInsList({
  onView,
  onEdit,
  onDelete,
  onCreate,
}: TradeInsListProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<TradeInFilters>({});

  const { data, isLoading, error } = useGetTradeInsQuery({
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

  const handleFilterChange = (key: keyof TradeInFilters, value: string) => {
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
    return format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: es });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error al cargar los canjes</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Estado"
              value={filters.estado || ''}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
              size="small"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="INICIADO">Iniciado</MenuItem>
              <MenuItem value="EN_EVALUACION">En Evaluación</MenuItem>
              <MenuItem value="APROBADO">Aprobado</MenuItem>
              <MenuItem value="RECHAZADO">Rechazado</MenuItem>
              <MenuItem value="FINALIZADO">Finalizado</MenuItem>
              <MenuItem value="CANCELADO">Cancelado</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Desde"
              type="date"
              value={filters.fechaDesde || ''}
              onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Hasta"
              type="date"
              value={filters.fechaHasta || ''}
              onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              onClick={onCreate}
            >
              Nuevo Canje
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Propiedad Entregada</TableCell>
              <TableCell>Propiedad Recibida</TableCell>
              <TableCell align="right">Diferencia</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Gestor</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && data.data.length > 0 ? (
              data.data.map((tradeIn) => (
                <TableRow key={tradeIn.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {tradeIn.codigo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {tradeIn.propiedadEntregada?.direccion || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {tradeIn.propiedadRecibida?.direccion || 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      color={tradeIn.diferencia >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {formatCurrency(tradeIn.diferencia)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={estadoLabels[tradeIn.estado]}
                      color={estadoColors[tradeIn.estado]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {tradeIn.gestor
                      ? `${tradeIn.gestor.nombre} ${tradeIn.gestor.apellido}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{formatDate(tradeIn.fechaCreacion)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => onView?.(tradeIn.id)}
                        color="primary"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {tradeIn.estado !== 'FINALIZADO' &&
                      tradeIn.estado !== 'CANCELADO' && (
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => onEdit?.(tradeIn.id)}
                            color="info"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => onDelete?.(tradeIn.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" py={3}>
                    No se encontraron canjes
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
