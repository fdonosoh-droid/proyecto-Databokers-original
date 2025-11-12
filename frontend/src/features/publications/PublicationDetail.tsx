import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  Button,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  ContactMail as ContactMailIcon,
  LocalOffer as LocalOfferIcon,
  Edit as EditIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useGetPublicationByIdQuery } from '../../redux/api/publicationsApi';
import type { PublicationEstado } from '../../types';
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

interface PublicationDetailProps {
  id: string;
  onEdit?: () => void;
  onBack?: () => void;
  onToggleStatus?: () => void;
  onFinalize?: () => void;
  onRenew?: () => void;
}

export default function PublicationDetail({
  id,
  onEdit,
  onBack,
  onToggleStatus,
  onFinalize,
  onRenew,
}: PublicationDetailProps) {
  const { data: publication, isLoading, error } = useGetPublicationByIdQuery(id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM, yyyy", { locale: es });
  };

  const getDaysInPublication = () => {
    if (!publication) return 0;
    return differenceInDays(new Date(), new Date(publication.fechaInicio));
  };

  const getDaysUntilExpiration = () => {
    if (!publication) return 0;
    return differenceInDays(new Date(publication.fechaVencimiento), new Date());
  };

  const getConversionRate = () => {
    if (!publication || publication.visualizaciones === 0) return 0;
    return (publication.contactos / publication.visualizaciones) * 100;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !publication) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error al cargar la publicación</Typography>
      </Box>
    );
  }

  const daysLeft = getDaysUntilExpiration();
  const conversionRate = getConversionRate();

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Publicación de Propiedad
          </Typography>
          <Chip
            label={estadoLabels[publication.estado]}
            color={estadoColors[publication.estado]}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onBack && (
            <Button variant="outlined" onClick={onBack}>
              Volver
            </Button>
          )}
          {onEdit && (
            <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
              Editar
            </Button>
          )}
        </Box>
      </Box>

      {/* Información de la Propiedad */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información de la Propiedad
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {publication.propiedad ? (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Dirección
              </Typography>
              <Typography variant="body1" gutterBottom>
                {publication.propiedad.direccion}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Tipo
              </Typography>
              <Typography variant="body1" gutterBottom>
                {publication.propiedad.tipo}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Precio
              </Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(publication.propiedad.precio)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Características
              </Typography>
              <Typography variant="body1">
                {publication.propiedad.dormitorios} dorm • {publication.propiedad.banos}{' '}
                baños • {publication.propiedad.superficie}m²
              </Typography>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Información de propiedad no disponible
          </Typography>
        )}
      </Paper>

      {/* Información del Corredor */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Corredor Asignado
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Nombre
            </Typography>
            <Typography variant="body1" gutterBottom>
              {publication.corredor
                ? `${publication.corredor.nombre} ${publication.corredor.apellido}`
                : 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1" gutterBottom>
              {publication.corredor?.email || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Detalles de Publicación */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Detalles de Publicación
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Tipo de Exclusividad
            </Typography>
            <Typography variant="body1" gutterBottom>
              {publication.tipoExclusividad.replace('_', ' ')}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Comisión Acordada
            </Typography>
            <Typography variant="h6" color="success.main">
              {formatCurrency(publication.comisionAcordada)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Fecha de Inicio
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(publication.fechaInicio)}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Fecha de Vencimiento
            </Typography>
            <Typography
              variant="body1"
              color={daysLeft < 7 ? 'error.main' : 'text.primary'}
              gutterBottom
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
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Días en Publicación
            </Typography>
            <Typography variant="body1">{getDaysInPublication()} días</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Métricas de Performance */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VisibilityIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Visualizaciones</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {publication.visualizaciones}
              </Typography>
              {publication.metricas && (
                <Typography variant="caption" color="text.secondary">
                  {publication.metricas.visualizacionesSemana} esta semana
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ContactMailIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Contactos</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {publication.contactos}
              </Typography>
              {publication.metricas && (
                <Typography variant="caption" color="text.secondary">
                  {publication.metricas.contactosSemana} esta semana
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalOfferIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Ofertas</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {publication.ofertas || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tasa de Conversión */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tasa de Conversión
        </Typography>
        <Box sx={{ mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(conversionRate * 10, 100)}
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="h4" sx={{ mt: 2 }}>
            {conversionRate.toFixed(2)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {publication.contactos} contactos de {publication.visualizaciones}{' '}
            visualizaciones
          </Typography>
        </Box>
      </Paper>

      {/* Notas y Restricciones */}
      {(publication.notas || publication.restricciones) && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notas Adicionales
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {publication.notas && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Notas
              </Typography>
              <Typography variant="body1">{publication.notas}</Typography>
            </Box>
          )}
          {publication.restricciones && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Restricciones
              </Typography>
              <Typography variant="body1">{publication.restricciones}</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Acciones */}
      {(onToggleStatus || onFinalize || onRenew) && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Acciones
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {publication.estado === 'ACTIVA' && onToggleStatus && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<PauseIcon />}
                onClick={onToggleStatus}
              >
                Pausar Publicación
              </Button>
            )}
            {publication.estado === 'PAUSADA' && onToggleStatus && (
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={onToggleStatus}
              >
                Reactivar Publicación
              </Button>
            )}
            {(publication.estado === 'ACTIVA' || publication.estado === 'PAUSADA') &&
              onFinalize && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={onFinalize}
                >
                  Finalizar Publicación
                </Button>
              )}
            {(publication.estado === 'VENCIDA' || publication.estado === 'FINALIZADA') &&
              onRenew && (
                <Button variant="contained" color="primary" onClick={onRenew}>
                  Renovar Publicación
                </Button>
              )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
