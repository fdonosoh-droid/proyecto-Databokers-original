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
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useGetTradeInByIdQuery } from '../../redux/api/tradeInsApi';
import type { TradeInEstado } from '../../types';
import { LoadingSpinner } from '../../components/common';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Colores para Chip component
const estadoColorsChip: Record<TradeInEstado, 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info'> = {
  INICIADO: 'info',
  EN_EVALUACION: 'warning',
  APROBADO: 'success',
  RECHAZADO: 'error',
  FINALIZADO: 'success',
  CANCELADO: 'default',
};

// Colores para TimelineDot component
const estadoColorsTimeline: Record<TradeInEstado, 'grey' | 'primary' | 'success' | 'error' | 'warning' | 'info'> = {
  INICIADO: 'info',
  EN_EVALUACION: 'warning',
  APROBADO: 'success',
  RECHAZADO: 'error',
  FINALIZADO: 'success',
  CANCELADO: 'grey',
};

const estadoLabels: Record<TradeInEstado, string> = {
  INICIADO: 'Iniciado',
  EN_EVALUACION: 'En Evaluación',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

interface TradeInDetailProps {
  id: string;
  onEdit?: () => void;
  onBack?: () => void;
  onChangeStatus?: (newStatus: TradeInEstado) => void;
}

export default function TradeInDetail({
  id,
  onEdit,
  onBack,
  onChangeStatus,
}: TradeInDetailProps) {
  const { data: tradeIn, isLoading, error } = useGetTradeInByIdQuery(id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM, yyyy 'a las' HH:mm", {
      locale: es,
    });
  };

  const getTimelineIcon = (estado: TradeInEstado) => {
    switch (estado) {
      case 'APROBADO':
      case 'FINALIZADO':
        return <CheckCircleIcon />;
      case 'RECHAZADO':
      case 'CANCELADO':
        return <CancelIcon />;
      default:
        return <HourglassIcon />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !tradeIn) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error al cargar el canje</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Canje {tradeIn.codigo}
          </Typography>
          <Chip
            label={estadoLabels[tradeIn.estado]}
            color={estadoColorsChip[tradeIn.estado]}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onBack && (
            <Button variant="outlined" onClick={onBack}>
              Volver
            </Button>
          )}
          {tradeIn.estado !== 'FINALIZADO' && (tradeIn.estado as string) !== 'CANCELADO' && onEdit && (
            <Button variant="contained" startIcon={<EditIcon />} onClick={onEdit}>
              Editar
            </Button>
          )}
        </Box>
      </Box>

      {/* Información General */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información General
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Gestor
            </Typography>
            <Typography variant="body1" gutterBottom>
              {tradeIn.gestor
                ? `${tradeIn.gestor.nombre} ${tradeIn.gestor.apellido}`
                : 'N/A'}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Fecha de Creación
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(tradeIn.fechaCreacion)}
            </Typography>
          </Grid>
          {tradeIn.comentarios && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">
                Comentarios
              </Typography>
              <Typography variant="body1">{tradeIn.comentarios}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Propiedades */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Propiedad Entregada */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error.main">
                Propiedad Entregada
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {tradeIn.propiedadEntregada ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Dirección
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {tradeIn.propiedadEntregada.direccion}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tipo
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {tradeIn.propiedadEntregada.tipo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valorización
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {formatCurrency(tradeIn.valorizacionEntregada)}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Propiedad Recibida */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="success.main">
                Propiedad Recibida
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {tradeIn.propiedadRecibida ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Dirección
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {tradeIn.propiedadRecibida.direccion}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tipo
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {tradeIn.propiedadRecibida.tipo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valorización
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(tradeIn.valorizacionRecibida)}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No disponible
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diferencia y Forma de Pago */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Diferencia de Valor
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Diferencia
            </Typography>
            <Typography
              variant="h4"
              color={tradeIn.diferencia >= 0 ? 'success.main' : 'error.main'}
            >
              {formatCurrency(tradeIn.diferencia)}
            </Typography>
          </Grid>
          {tradeIn.formaPagoDiferencia && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Forma de Pago
              </Typography>
              <Typography variant="body1">{tradeIn.formaPagoDiferencia}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Timeline */}
      {tradeIn.timeline && tradeIn.timeline.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Historial de Estados
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Timeline>
            {tradeIn.timeline.map((event, index) => (
              <TimelineItem key={event.id}>
                <TimelineOppositeContent color="text.secondary">
                  {formatDate(event.fecha)}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color={estadoColorsTimeline[event.estado]}>
                    {getTimelineIcon(event.estado)}
                  </TimelineDot>
                  {index < tradeIn.timeline!.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6" component="span">
                    {estadoLabels[event.estado]}
                  </Typography>
                  {event.usuario && (
                    <Typography variant="body2" color="text.secondary">
                      Por: {event.usuario}
                    </Typography>
                  )}
                  {event.comentario && (
                    <Typography variant="body2">{event.comentario}</Typography>
                  )}
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Paper>
      )}

      {/* Acciones según estado */}
      {onChangeStatus && tradeIn.estado !== 'FINALIZADO' && (tradeIn.estado as string) !== 'CANCELADO' && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Acciones
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {tradeIn.estado === 'INICIADO' && (
              <Button
                variant="contained"
                color="warning"
                onClick={() => onChangeStatus('EN_EVALUACION')}
              >
                Pasar a Evaluación
              </Button>
            )}
            {tradeIn.estado === 'EN_EVALUACION' && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => onChangeStatus('APROBADO')}
                >
                  Aprobar
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => onChangeStatus('RECHAZADO')}
                >
                  Rechazar
                </Button>
              </>
            )}
            {tradeIn.estado === 'APROBADO' && (
              <Button
                variant="contained"
                color="success"
                onClick={() => onChangeStatus('FINALIZADO')}
              >
                Finalizar Canje
              </Button>
            )}
            {(tradeIn.estado as string) !== 'CANCELADO' && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => onChangeStatus('CANCELADO')}
              >
                Cancelar Canje
              </Button>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
