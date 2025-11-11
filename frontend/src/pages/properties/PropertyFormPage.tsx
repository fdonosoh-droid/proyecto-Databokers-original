import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  MenuItem,
  IconButton,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import {
  useGetPropertyByIdQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
} from '../../redux/api/propertiesApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageTitle from '../../components/common/PageTitle';

interface PropertyFormData {
  tipo: string;
  direccion: string;
  comuna: string;
  region: string;
  precio: string;
  superficie: string;
  superficieUtil: string;
  dormitorios: string;
  banos: string;
  estacionamientos: string;
  bodegas: string;
  estado: string;
  modeloNegocio: string;
  descripcion: string;
}

const initialFormData: PropertyFormData = {
  tipo: 'DEPARTAMENTO',
  direccion: '',
  comuna: '',
  region: '',
  precio: '',
  superficie: '',
  superficieUtil: '',
  dormitorios: '',
  banos: '',
  estacionamientos: '',
  bodegas: '0',
  estado: 'DISPONIBLE',
  modeloNegocio: 'VENTA_DIRECTA',
  descripcion: '',
};

const TIPOS_PROPIEDAD = ['CASA', 'DEPARTAMENTO', 'OFICINA', 'LOCAL_COMERCIAL', 'TERRENO'];
const ESTADOS = ['DISPONIBLE', 'RESERVADA', 'VENDIDA', 'BLOQUEADA'];
const MODELOS_NEGOCIO = ['VENTA_DIRECTA', 'PREVENTA', 'CONSIGNACION', 'CANJE'];

export default function PropertyFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<PropertyFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<PropertyFormData>>({});

  const { data: property, isLoading: loadingProperty } = useGetPropertyByIdQuery(id!, {
    skip: !isEdit,
  });
  const [createProperty, { isLoading: creating }] = useCreatePropertyMutation();
  const [updateProperty, { isLoading: updating }] = useUpdatePropertyMutation();

  useEffect(() => {
    if (property && isEdit) {
      setFormData({
        tipo: property.tipo,
        direccion: property.direccion,
        comuna: property.comuna,
        region: property.region,
        precio: property.precio.toString(),
        superficie: property.superficie.toString(),
        superficieUtil: property.superficieUtil?.toString() || '',
        dormitorios: property.dormitorios.toString(),
        banos: property.banos.toString(),
        estacionamientos: property.estacionamientos.toString(),
        bodegas: property.bodegas?.toString() || '0',
        estado: property.estado,
        modeloNegocio: property.modeloNegocio || 'VENTA_DIRECTA',
        descripcion: property.descripcion || '',
      });
    }
  }, [property, isEdit]);

  const validate = (): boolean => {
    const newErrors: Partial<PropertyFormData> = {};

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida';
    }
    if (!formData.comuna.trim()) {
      newErrors.comuna = 'La comuna es requerida';
    }
    if (!formData.region.trim()) {
      newErrors.region = 'La región es requerida';
    }
    if (!formData.precio || parseFloat(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0';
    }
    if (!formData.superficie || parseFloat(formData.superficie) <= 0) {
      newErrors.superficie = 'La superficie debe ser mayor a 0';
    }
    if (!formData.dormitorios || parseInt(formData.dormitorios) < 0) {
      newErrors.dormitorios = 'El número de dormitorios debe ser válido';
    }
    if (!formData.banos || parseInt(formData.banos) < 0) {
      newErrors.banos = 'El número de baños debe ser válido';
    }
    if (!formData.estacionamientos || parseInt(formData.estacionamientos) < 0) {
      newErrors.estacionamientos = 'El número de estacionamientos debe ser válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data = {
      tipo: formData.tipo,
      direccion: formData.direccion,
      comuna: formData.comuna,
      region: formData.region,
      precio: parseFloat(formData.precio),
      superficie: parseFloat(formData.superficie),
      superficieUtil: formData.superficieUtil ? parseFloat(formData.superficieUtil) : undefined,
      dormitorios: parseInt(formData.dormitorios),
      banos: parseInt(formData.banos),
      estacionamientos: parseInt(formData.estacionamientos),
      bodegas: parseInt(formData.bodegas),
      estado: formData.estado,
      modeloNegocio: formData.modeloNegocio,
      descripcion: formData.descripcion || undefined,
    };

    try {
      if (isEdit) {
        await updateProperty({ id: id!, data }).unwrap();
      } else {
        await createProperty(data).unwrap();
      }
      navigate('/propiedades');
    } catch (error) {
      console.error('Error al guardar propiedad:', error);
    }
  };

  const handleChange = (field: keyof PropertyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (loadingProperty) return <LoadingSpinner />;

  const isLoading = creating || updating;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/propiedades')} sx={{ mr: 2 }}>
          <BackIcon />
        </IconButton>
        <PageTitle
          title={isEdit ? 'Editar Propiedad' : 'Nueva Propiedad'}
          subtitle={isEdit ? property?.direccion : 'Registrar una nueva propiedad'}
        />
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Tipo de Propiedad */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Tipo de Propiedad"
                  value={formData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value)}
                >
                  {TIPOS_PROPIEDAD.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Estado */}
              <Grid item xs={12} md={6}>
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
                      {estado}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Dirección */}
              <Grid item xs={12}>
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

              {/* Comuna */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Comuna"
                  value={formData.comuna}
                  onChange={(e) => handleChange('comuna', e.target.value)}
                  error={Boolean(errors.comuna)}
                  helperText={errors.comuna}
                />
              </Grid>

              {/* Región */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Región"
                  value={formData.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  error={Boolean(errors.region)}
                  helperText={errors.region}
                />
              </Grid>

              {/* Precio */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Precio"
                  value={formData.precio}
                  onChange={(e) => handleChange('precio', e.target.value)}
                  error={Boolean(errors.precio)}
                  helperText={errors.precio}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              {/* Modelo de Negocio */}
              <Grid item xs={12} md={6}>
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

              {/* Superficie Total */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Superficie Total (m²)"
                  value={formData.superficie}
                  onChange={(e) => handleChange('superficie', e.target.value)}
                  error={Boolean(errors.superficie)}
                  helperText={errors.superficie}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>

              {/* Superficie Útil */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Superficie Útil (m²)"
                  value={formData.superficieUtil}
                  onChange={(e) => handleChange('superficieUtil', e.target.value)}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              </Grid>

              {/* Dormitorios */}
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Dormitorios"
                  value={formData.dormitorios}
                  onChange={(e) => handleChange('dormitorios', e.target.value)}
                  error={Boolean(errors.dormitorios)}
                  helperText={errors.dormitorios}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              {/* Baños */}
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Baños"
                  value={formData.banos}
                  onChange={(e) => handleChange('banos', e.target.value)}
                  error={Boolean(errors.banos)}
                  helperText={errors.banos}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              {/* Estacionamientos */}
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Estacionamientos"
                  value={formData.estacionamientos}
                  onChange={(e) => handleChange('estacionamientos', e.target.value)}
                  error={Boolean(errors.estacionamientos)}
                  helperText={errors.estacionamientos}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              {/* Bodegas */}
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Bodegas"
                  value={formData.bodegas}
                  onChange={(e) => handleChange('bodegas', e.target.value)}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              {/* Descripción */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descripción"
                  value={formData.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  placeholder="Descripción detallada de la propiedad..."
                />
              </Grid>

              {/* Botones */}
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/propiedades')}
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" variant="contained" disabled={isLoading}>
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
