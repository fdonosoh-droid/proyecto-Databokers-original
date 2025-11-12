import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  IconButton,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import {
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from '../../redux/api/projectsApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTitle from '../../components/common/PageTitle';

interface ProjectFormData {
  nombre: string;
  inmobiliariaId: string;
  direccion: string;
  regionId: string;
  comunaId: string;
  modeloNegocio: string;
  estado: string;
  fechaInicioVentas: string;
  fechaEntrega: string;
  totalUnidades: string;
}

const initialFormData: ProjectFormData = {
  nombre: '',
  inmobiliariaId: '',
  direccion: '',
  regionId: '',
  comunaId: '',
  modeloNegocio: 'VENTA_DIRECTA',
  estado: 'ACTIVO',
  fechaInicioVentas: '',
  fechaEntrega: '',
  totalUnidades: '',
};

const ESTADOS = ['ACTIVO', 'INACTIVO', 'EN_CONSTRUCCION', 'FINALIZADO'];
const MODELOS_NEGOCIO = ['VENTA_DIRECTA', 'PREVENTA', 'CONSIGNACION', 'CANJE'];

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<ProjectFormData>>({});

  const { data: project, isLoading: loadingProject } = useGetProjectByIdQuery(id!, {
    skip: !isEdit,
  });
  const [createProject, { isLoading: creating }] = useCreateProjectMutation();
  const [updateProject, { isLoading: updating }] = useUpdateProjectMutation();

  useEffect(() => {
    if (project && isEdit) {
      setFormData({
        nombre: project.nombre,
        inmobiliariaId: project.inmobiliariaId,
        direccion: project.direccion,
        regionId: project.regionId,
        comunaId: project.comunaId,
        modeloNegocio: project.modeloNegocio,
        estado: project.estado,
        fechaInicioVentas: project.fechaInicioVentas.split('T')[0],
        fechaEntrega: project.fechaEntrega.split('T')[0],
        totalUnidades: project.totalUnidades.toString(),
      });
    }
  }, [project, isEdit]);

  const validate = (): boolean => {
    const newErrors: Partial<ProjectFormData> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    if (!formData.inmobiliariaId) {
      newErrors.inmobiliariaId = 'La inmobiliaria es requerida';
    }
    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }
    if (!formData.regionId) {
      newErrors.regionId = 'La región es requerida';
    }
    if (!formData.comunaId) {
      newErrors.comunaId = 'La comuna es requerida';
    }
    if (!formData.fechaInicioVentas) {
      newErrors.fechaInicioVentas = 'La fecha de inicio es requerida';
    }
    if (!formData.fechaEntrega) {
      newErrors.fechaEntrega = 'La fecha de entrega es requerida';
    }
    if (!formData.totalUnidades || parseInt(formData.totalUnidades) <= 0) {
      newErrors.totalUnidades = 'El total de unidades debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data = {
      nombre: formData.nombre,
      inmobiliariaId: formData.inmobiliariaId,
      direccion: formData.direccion,
      regionId: formData.regionId,
      comunaId: formData.comunaId,
      modeloNegocio: formData.modeloNegocio,
      estado: formData.estado,
      fechaInicioVentas: formData.fechaInicioVentas,
      fechaEntrega: formData.fechaEntrega,
      totalUnidades: parseInt(formData.totalUnidades),
    };

    try {
      if (isEdit) {
        await updateProject({ id: id!, data }).unwrap();
      } else {
        await createProject(data).unwrap();
      }
      navigate('/proyectos');
    } catch (error) {
      console.error('Error al guardar proyecto:', error);
    }
  };

  const handleChange = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (loadingProject) return <LoadingSpinner />;

  const isLoading = creating || updating;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/proyectos')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <PageTitle
          title={isEdit ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          subtitle={isEdit ? project?.nombre : 'Crear un nuevo proyecto inmobiliario'}
        />
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Nombre */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Nombre del Proyecto"
                  value={formData.nombre}
                  onChange={(e) => handleChange('nombre', e.target.value)}
                  error={Boolean(errors.nombre)}
                  helperText={errors.nombre}
                />
              </Grid>

              {/* Inmobiliaria */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="ID Inmobiliaria"
                  value={formData.inmobiliariaId}
                  onChange={(e) => handleChange('inmobiliariaId', e.target.value)}
                  error={Boolean(errors.inmobiliariaId)}
                  helperText={errors.inmobiliariaId || 'UUID de la inmobiliaria'}
                />
              </Grid>

              {/* Dirección */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  required
                  label="Dirección"
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  error={Boolean(errors.direccion)}
                  helperText={errors.direccion}
                />
              </Grid>

              {/* Región */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="ID Región"
                  value={formData.regionId}
                  onChange={(e) => handleChange('regionId', e.target.value)}
                  error={Boolean(errors.regionId)}
                  helperText={errors.regionId || 'UUID de la región'}
                />
              </Grid>

              {/* Comuna */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="ID Comuna"
                  value={formData.comunaId}
                  onChange={(e) => handleChange('comunaId', e.target.value)}
                  error={Boolean(errors.comunaId)}
                  helperText={errors.comunaId || 'UUID de la comuna'}
                />
              </Grid>

              {/* Modelo de Negocio */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Modelo de Negocio"
                  value={formData.modeloNegocio}
                  onChange={(e) => handleChange('modeloNegocio', e.target.value)}
                >
                  {MODELOS_NEGOCIO.map((modelo) => (
                    <MenuItem key={modelo} value={modelo}>
                      {modelo.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Estado */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Estado"
                  value={formData.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                >
                  {ESTADOS.map((estado) => (
                    <MenuItem key={estado} value={estado}>
                      {estado.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Fecha Inicio Ventas */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Fecha Inicio Ventas"
                  value={formData.fechaInicioVentas}
                  onChange={(e) => handleChange('fechaInicioVentas', e.target.value)}
                  error={Boolean(errors.fechaInicioVentas)}
                  helperText={errors.fechaInicioVentas}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Fecha Entrega */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Fecha de Entrega"
                  value={formData.fechaEntrega}
                  onChange={(e) => handleChange('fechaEntrega', e.target.value)}
                  error={Boolean(errors.fechaEntrega)}
                  helperText={errors.fechaEntrega}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Total Unidades */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Total de Unidades"
                  value={formData.totalUnidades}
                  onChange={(e) => handleChange('totalUnidades', e.target.value)}
                  error={Boolean(errors.totalUnidades)}
                  helperText={errors.totalUnidades}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>

              {/* Botones */}
              <Grid size={{ xs: 12 }}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/proyectos')}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
