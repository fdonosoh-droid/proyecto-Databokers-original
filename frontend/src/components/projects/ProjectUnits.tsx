import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  useGetUnitsQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
  useDeleteUnitMutation,
  useGetTypologiesQuery,
} from '../../redux/api/projectsApi';
import { Unit } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

interface ProjectUnitsProps {
  projectId: string;
}

interface UnitFormData {
  numero: string;
  piso: string;
  tipologiaId: string;
  precio: string;
  superficieTotal: string;
  superficieUtil: string;
  estado: string;
}

const initialFormData: UnitFormData = {
  numero: '',
  piso: '',
  tipologiaId: '',
  precio: '',
  superficieTotal: '',
  superficieUtil: '',
  estado: 'DISPONIBLE',
};

const ESTADOS_UNIDAD = ['DISPONIBLE', 'RESERVADA', 'VENDIDA', 'BLOQUEADA'];

export default function ProjectUnits({ projectId }: ProjectUnitsProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState<UnitFormData>(initialFormData);

  const { data, isLoading } = useGetUnitsQuery({ projectId, page: page + 1, limit: rowsPerPage });
  const { data: typologies } = useGetTypologiesQuery(projectId);
  const [createUnit] = useCreateUnitMutation();
  const [updateUnit] = useUpdateUnitMutation();
  const [deleteUnit] = useDeleteUnitMutation();

  const handleOpenDialog = (unit?: Unit) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        numero: unit.numero,
        piso: unit.piso,
        tipologiaId: unit.tipologiaId,
        precio: unit.precio.toString(),
        superficieTotal: unit.superficieTotal.toString(),
        superficieUtil: unit.superficieUtil.toString(),
        estado: unit.estado,
      });
    } else {
      setEditingUnit(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUnit(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    const data = {
      numero: formData.numero,
      piso: formData.piso,
      tipologiaId: formData.tipologiaId,
      precio: parseFloat(formData.precio),
      superficieTotal: parseFloat(formData.superficieTotal),
      superficieUtil: parseFloat(formData.superficieUtil),
      estado: formData.estado,
    };

    try {
      if (editingUnit) {
        await updateUnit({
          projectId,
          id: editingUnit.id,
          data,
        }).unwrap();
      } else {
        await createUnit({ projectId, data }).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error al guardar unidad:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta unidad?')) {
      try {
        await deleteUnit({ projectId, id }).unwrap();
      } catch (error) {
        console.error('Error al eliminar unidad:', error);
      }
    }
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

  const units = data?.data || [];
  const totalUnits = data?.total || 0;

  return (
    <Box sx={{ px: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Unidades</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Unidad
        </Button>
      </Box>

      {units.length === 0 ? (
        <EmptyState
          message="No hay unidades registradas"
          actionText="Crear Unidad"
          onAction={() => handleOpenDialog()}
        />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Piso</TableCell>
                <TableCell>Tipología</TableCell>
                <TableCell>Superficie</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {unit.numero}
                    </Typography>
                  </TableCell>
                  <TableCell>{unit.piso}</TableCell>
                  <TableCell>{unit.tipologia?.nombre || 'N/A'}</TableCell>
                  <TableCell>
                    {unit.superficieTotal} m² ({unit.superficieUtil} m² útil)
                  </TableCell>
                  <TableCell>${unit.precio.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={unit.estado}
                      color={getEstadoColor(unit.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(unit)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(unit.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={totalUnits}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
          />
        </TableContainer>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUnit ? 'Editar Unidad' : 'Nueva Unidad'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Número"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Piso"
                value={formData.piso}
                onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipología</InputLabel>
                <Select
                  value={formData.tipologiaId}
                  label="Tipología"
                  onChange={(e) =>
                    setFormData({ ...formData, tipologiaId: e.target.value })
                  }
                >
                  {typologies?.map((typology) => (
                    <MenuItem key={typology.id} value={typology.id}>
                      {typology.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Precio"
                type="number"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Superficie Total (m²)"
                type="number"
                value={formData.superficieTotal}
                onChange={(e) =>
                  setFormData({ ...formData, superficieTotal: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Superficie Útil (m²)"
                type="number"
                value={formData.superficieUtil}
                onChange={(e) =>
                  setFormData({ ...formData, superficieUtil: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.estado}
                  label="Estado"
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                >
                  {ESTADOS_UNIDAD.map((estado) => (
                    <MenuItem key={estado} value={estado}>
                      {estado}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingUnit ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
