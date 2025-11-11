import { useState } from 'react';
import {
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { useCreateTradeInMutation } from '../../redux/api/tradeInsApi';
import type { Property } from '../../types';

interface TradeInFormData {
  propiedadEntregadaId: string;
  propiedadRecibidaId: string;
  valorizacionEntregada: number;
  valorizacionRecibida: number;
  formaPagoDiferencia: string;
  comentarios: string;
}

const initialFormData: TradeInFormData = {
  propiedadEntregadaId: '',
  propiedadRecibidaId: '',
  valorizacionEntregada: 0,
  valorizacionRecibida: 0,
  formaPagoDiferencia: '',
  comentarios: '',
};

const steps = [
  'Propiedad Entregada',
  'Propiedad Recibida',
  'Valorización',
  'Forma de Pago',
];

interface TradeInFormProps {
  propiedades?: Property[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TradeInForm({
  propiedades = [],
  onSuccess,
  onCancel,
}: TradeInFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<TradeInFormData>(initialFormData);
  const [createTradeIn, { isLoading }] = useCreateTradeInMutation();

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleChange = (field: keyof TradeInFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await createTradeIn({
        propiedadEntregadaId: formData.propiedadEntregadaId,
        propiedadRecibidaId: formData.propiedadRecibidaId,
        valorizacionEntregada: formData.valorizacionEntregada,
        valorizacionRecibida: formData.valorizacionRecibida,
        formaPagoDiferencia: formData.formaPagoDiferencia,
        comentarios: formData.comentarios,
      }).unwrap();
      onSuccess?.();
    } catch (error) {
      console.error('Error al crear canje:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  const calculateDifference = () => {
    return formData.valorizacionRecibida - formData.valorizacionEntregada;
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Seleccione la propiedad que el cliente entrega
            </Typography>
            <TextField
              select
              fullWidth
              label="Propiedad Entregada"
              value={formData.propiedadEntregadaId}
              onChange={(e) => handleChange('propiedadEntregadaId', e.target.value)}
              margin="normal"
              required
            >
              {propiedades.map((prop) => (
                <MenuItem key={prop.id} value={prop.id}>
                  {prop.direccion} - {prop.tipo}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Seleccione la propiedad que el cliente recibe
            </Typography>
            <TextField
              select
              fullWidth
              label="Propiedad Recibida"
              value={formData.propiedadRecibidaId}
              onChange={(e) => handleChange('propiedadRecibidaId', e.target.value)}
              margin="normal"
              required
            >
              {propiedades
                .filter((p) => p.id !== formData.propiedadEntregadaId)
                .map((prop) => (
                  <MenuItem key={prop.id} value={prop.id}>
                    {prop.direccion} - {prop.tipo}
                  </MenuItem>
                ))}
            </TextField>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Ingrese las valorizaciones
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Valorización Propiedad Entregada"
                  type="number"
                  value={formData.valorizacionEntregada}
                  onChange={(e) =>
                    handleChange('valorizacionEntregada', Number(e.target.value))
                  }
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Valorización Propiedad Recibida"
                  type="number"
                  value={formData.valorizacionRecibida}
                  onChange={(e) =>
                    handleChange('valorizacionRecibida', Number(e.target.value))
                  }
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
            </Grid>
            <Card sx={{ mt: 3, bgcolor: 'background.default' }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Diferencia calculada
                </Typography>
                <Typography
                  variant="h4"
                  color={calculateDifference() >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(calculateDifference())}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {calculateDifference() >= 0
                    ? 'El cliente debe pagar esta diferencia'
                    : 'El cliente recibe esta diferencia'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Forma de pago de la diferencia
            </Typography>
            <TextField
              select
              fullWidth
              label="Forma de Pago"
              value={formData.formaPagoDiferencia}
              onChange={(e) => handleChange('formaPagoDiferencia', e.target.value)}
              margin="normal"
              required
            >
              <MenuItem value="CONTADO">Contado</MenuItem>
              <MenuItem value="CREDITO">Crédito Hipotecario</MenuItem>
              <MenuItem value="SUBSIDIO">Con Subsidio</MenuItem>
              <MenuItem value="MIXTO">Mixto</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Comentarios"
              value={formData.comentarios}
              onChange={(e) => handleChange('comentarios', e.target.value)}
              margin="normal"
              multiline
              rows={4}
            />

            {/* Preview */}
            <Card sx={{ mt: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumen del Canje
                </Typography>
                <Divider sx={{ my: 2, borderColor: 'primary.contrastText' }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Diferencia Total:
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatCurrency(calculateDifference())}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Forma de Pago:
                    </Typography>
                    <Typography variant="body1">
                      {formData.formaPagoDiferencia || 'No especificada'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return formData.propiedadEntregadaId !== '';
      case 1:
        return formData.propiedadRecibidaId !== '';
      case 2:
        return (
          formData.valorizacionEntregada > 0 && formData.valorizacionRecibida > 0
        );
      case 3:
        return formData.formaPagoDiferencia !== '';
      default:
        return false;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Nuevo Canje
      </Typography>
      <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Atrás
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!isStepValid() || isLoading}
            >
              {isLoading ? 'Creando...' : 'Crear Canje'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              Siguiente
            </Button>
          )}
        </Box>
      </Box>
    </Paper>
  );
}
