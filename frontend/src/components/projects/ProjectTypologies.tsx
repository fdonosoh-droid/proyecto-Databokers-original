import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  useGetTypologiesQuery,
  useCreateTypologyMutation,
  useUpdateTypologyMutation,
  useDeleteTypologyMutation,
} from '../../redux/api/projectsApi';
import type { Typology } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

interface ProjectTypologiesProps {
  projectId: string;
}

interface TypologyFormData {
  nombre: string;
  tipoPropiedad: string;
  superficieTotal: string;
  superficieUtil: string;
  dormitorios: string;
  banos: string;
  estacionamientos: string;
  bodegas: string;
  precioDesde: string;
  precioHasta: string;
}

const initialFormData: TypologyFormData = {
  nombre: '',
  tipoPropiedad: '',
  superficieTotal: '',
  superficieUtil: '',
  dormitorios: '',
  banos: '',
  estacionamientos: '',
  bodegas: '',
  precioDesde: '',
  precioHasta: '',
};

export default function ProjectTypologies({ projectId }: ProjectTypologiesProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTypology, setEditingTypology] = useState<Typology | null>(null);
  const [formData, setFormData] = useState<TypologyFormData>(initialFormData);

  const { data: typologies, isLoading } = useGetTypologiesQuery(projectId);
  const [createTypology] = useCreateTypologyMutation();
  const [updateTypology] = useUpdateTypologyMutation();
  const [deleteTypology] = useDeleteTypologyMutation();

  const handleOpenDialog = (typology?: Typology) => {
    if (typology) {
      setEditingTypology(typology);
      setFormData({
        nombre: typology.nombre,
        tipoPropiedad: typology.tipoPropiedad,
        superficieTotal: typology.superficieTotal.toString(),
        superficieUtil: typology.superficieUtil.toString(),
        dormitorios: typology.dormitorios.toString(),
        banos: typology.banos.toString(),
        estacionamientos: typology.estacionamientos.toString(),
        bodegas: typology.bodegas.toString(),
        precioDesde: typology.precioDesde.toString(),
        precioHasta: typology.precioHasta.toString(),
      });
    } else {
      setEditingTypology(null);
      setFormData(initialFormData);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTypology(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async () => {
    const data = {
      nombre: formData.nombre,
      tipoPropiedad: formData.tipoPropiedad,
      superficieTotal: parseFloat(formData.superficieTotal),
      superficieUtil: parseFloat(formData.superficieUtil),
      dormitorios: parseInt(formData.dormitorios),
      banos: parseInt(formData.banos),
      estacionamientos: parseInt(formData.estacionamientos),
      bodegas: parseInt(formData.bodegas),
      precioDesde: parseFloat(formData.precioDesde),
      precioHasta: parseFloat(formData.precioHasta),
    };

    try {
      if (editingTypology) {
        await updateTypology({
          projectId,
          id: editingTypology.id,
          data,
        }).unwrap();
      } else {
        await createTypology({ projectId, data }).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error al guardar tipología:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta tipología?')) {
      try {
        await deleteTypology({ projectId, id }).unwrap();
      } catch (error) {
        console.error('Error al eliminar tipología:', error);
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Box sx={{ px: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Tipologías</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nueva Tipología
        </Button>
      </Box>

      {!typologies || typologies.length === 0 ? (
        <EmptyState
          message="No hay tipologías definidas"
          action={{
            label: "Crear Tipología",
            onClick: () => handleOpenDialog()
          }}
        />
      ) : (
        <Grid container spacing={2}>
          {typologies.map((typology) => (
            <Grid size={{ xs: 12, md: 6 }} key={typology.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Typography variant="h6" gutterBottom>
                      {typology.nombre}
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenDialog(typology)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(typology.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {typology.tipoPropiedad}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Superficie Total
                      </Typography>
                      <Typography variant="body2">
                        {typology.superficieTotal} m²
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Superficie Útil
                      </Typography>
                      <Typography variant="body2">
                        {typology.superficieUtil} m²
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Dormitorios
                      </Typography>
                      <Typography variant="body2">{typology.dormitorios}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Baños
                      </Typography>
                      <Typography variant="body2">{typology.banos}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Estac.
                      </Typography>
                      <Typography variant="body2">{typology.estacionamientos}</Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="caption" color="text.secondary">
                    Rango de Precio
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    ${typology.precioDesde.toLocaleString()} - $
                    {typology.precioHasta.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog para crear/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTypology ? 'Editar Tipología' : 'Nueva Tipología'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Tipo de Propiedad"
                value={formData.tipoPropiedad}
                onChange={(e) =>
                  setFormData({ ...formData, tipoPropiedad: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Dormitorios"
                type="number"
                value={formData.dormitorios}
                onChange={(e) => setFormData({ ...formData, dormitorios: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Baños"
                type="number"
                value={formData.banos}
                onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Estacionamientos"
                type="number"
                value={formData.estacionamientos}
                onChange={(e) =>
                  setFormData({ ...formData, estacionamientos: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Bodegas"
                type="number"
                value={formData.bodegas}
                onChange={(e) => setFormData({ ...formData, bodegas: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Precio Desde"
                type="number"
                value={formData.precioDesde}
                onChange={(e) =>
                  setFormData({ ...formData, precioDesde: e.target.value })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Precio Hasta"
                type="number"
                value={formData.precioHasta}
                onChange={(e) =>
                  setFormData({ ...formData, precioHasta: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingTypology ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
