import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
} from '@mui/material';
import { useCreatePublicationMutation } from '../../redux/api/publicationsApi';
import type { Property, User, TipoExclusividad } from '../../types';
import { addDays, format } from 'date-fns';

interface PublicationFormData {
  propiedadId: string;
  corredorId: string;
  tipoExclusividad: TipoExclusividad;
  comisionAcordada: number;
  fechaVencimiento: string;
  notas: string;
  restricciones: string;
}

const initialFormData: PublicationFormData = {
  propiedadId: '',
  corredorId: '',
  tipoExclusividad: 'EXCLUSIVA',
  comisionAcordada: 0,
  fechaVencimiento: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
  notas: '',
  restricciones: '',
};

interface PublicationFormProps {
  propiedades?: Property[];
  corredores?: User[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PublicationForm({
  propiedades = [],
  corredores = [],
  onSuccess,
  onCancel,
}: PublicationFormProps) {
  const [formData, setFormData] = useState<PublicationFormData>(initialFormData);
  const [createPublication, { isLoading }] = useCreatePublicationMutation();

  const handleChange = (field: keyof PublicationFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createPublication({
        propiedadId: formData.propiedadId,
        corredorId: formData.corredorId,
        tipoExclusividad: formData.tipoExclusividad,
        comisionAcordada: formData.comisionAcordada,
        fechaVencimiento: formData.fechaVencimiento,
        notas: formData.notas || undefined,
        restricciones: formData.restricciones || undefined,
      }).unwrap();
      onSuccess?.();
    } catch (error) {
      console.error('Error al crear publicación:', error);
    }
  };

  const isFormValid = () => {
    return (
      formData.propiedadId &&
      formData.corredorId &&
      formData.tipoExclusividad &&
      formData.comisionAcordada > 0 &&
      formData.fechaVencimiento
    );
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Nueva Publicación
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Complete la información para crear una nueva publicación de propiedad
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Propiedad */}
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Propiedad"
              value={formData.propiedadId}
              onChange={(e) => handleChange('propiedadId', e.target.value)}
              required
              helperText="Seleccione la propiedad a publicar"
            >
              {propiedades.map((prop) => (
                <MenuItem key={prop.id} value={prop.id}>
                  {prop.direccion} - {prop.tipo} - {new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                  }).format(prop.precio)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Corredor */}
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Corredor Externo"
              value={formData.corredorId}
              onChange={(e) => handleChange('corredorId', e.target.value)}
              required
              helperText="Seleccione el corredor que manejará la publicación"
            >
              {corredores
                .filter((user) => user.rol === 'CORREDOR')
                .map((corredor) => (
                  <MenuItem key={corredor.id} value={corredor.id}>
                    {corredor.nombre} {corredor.apellido} - {corredor.email}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>

          {/* Tipo de Exclusividad */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Tipo de Exclusividad"
              value={formData.tipoExclusividad}
              onChange={(e) => handleChange('tipoExclusividad', e.target.value)}
              required
            >
              <MenuItem value="EXCLUSIVA">Exclusiva</MenuItem>
              <MenuItem value="SEMI_EXCLUSIVA">Semi-Exclusiva</MenuItem>
              <MenuItem value="NO_EXCLUSIVA">No Exclusiva</MenuItem>
            </TextField>
          </Grid>

          {/* Comisión */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Comisión Acordada"
              type="number"
              value={formData.comisionAcordada}
              onChange={(e) => handleChange('comisionAcordada', Number(e.target.value))}
              required
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
              helperText="Monto de comisión acordada con el corredor"
            />
          </Grid>

          {/* Fecha de Vencimiento */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de Vencimiento"
              type="date"
              value={formData.fechaVencimiento}
              onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
              required
              InputLabelProps={{ shrink: true }}
              helperText="Fecha en que vence la publicación"
              inputProps={{
                min: format(new Date(), 'yyyy-MM-dd'),
              }}
            />
          </Grid>

          {/* Notas */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Notas"
              value={formData.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              multiline
              rows={3}
              helperText="Notas adicionales sobre la publicación"
            />
          </Grid>

          {/* Restricciones */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Restricciones"
              value={formData.restricciones}
              onChange={(e) => handleChange('restricciones', e.target.value)}
              multiline
              rows={2}
              helperText="Restricciones o condiciones especiales"
            />
          </Grid>
        </Grid>

        {/* Botones */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
          <Button onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? 'Creando...' : 'Crear Publicación'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
