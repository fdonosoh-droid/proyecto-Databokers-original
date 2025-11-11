import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Badge,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  Error,
  Warning,
  Info,
  CheckCircle,
  Close,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Alert } from '../../types';

interface AlertsPanelProps {
  alerts: Alert[];
  onMarkAsRead?: (alertId: string) => void;
}

const getAlertIcon = (tipo: string) => {
  switch (tipo) {
    case 'critical':
      return <Error color="error" />;
    case 'warning':
      return <Warning color="warning" />;
    case 'info':
      return <Info color="info" />;
    default:
      return <Info />;
  }
};

const getAlertColor = (tipo: string) => {
  switch (tipo) {
    case 'critical':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
};

export default function AlertsPanel({ alerts, onMarkAsRead }: AlertsPanelProps) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const unreadCount = alerts.filter((a) => !a.leida).length;

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
  };

  const handleClose = () => {
    if (selectedAlert && !selectedAlert.leida && onMarkAsRead) {
      onMarkAsRead(selectedAlert.id);
    }
    setSelectedAlert(null);
  };

  const handleMarkAsRead = (alertId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(alertId);
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Alertas</Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error">
                <Chip label="Sin leer" size="small" />
              </Badge>
            )}
          </Box>

          <List>
            {alerts.length === 0 ? (
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Sin alertas"
                  secondary="Todo está funcionando correctamente"
                />
              </ListItem>
            ) : (
              alerts.map((alert) => (
                <ListItem
                  key={alert.id}
                  divider
                  sx={{
                    cursor: 'pointer',
                    bgcolor: alert.leida ? 'transparent' : 'action.hover',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                  onClick={() => handleAlertClick(alert)}
                  secondaryAction={
                    !alert.leida && (
                      <IconButton
                        edge="end"
                        aria-label="marcar como leída"
                        onClick={(e) => handleMarkAsRead(alert.id, e)}
                        size="small"
                      >
                        <Close />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon>{getAlertIcon(alert.tipo)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={alert.leida ? 'normal' : 'bold'}>
                          {alert.titulo}
                        </Typography>
                        <Chip
                          label={alert.tipo}
                          size="small"
                          color={getAlertColor(alert.tipo) as any}
                        />
                      </Box>
                    }
                    secondary={formatDistanceToNow(new Date(alert.fecha), {
                      addSuffix: true,
                      locale: es,
                    })}
                  />
                </ListItem>
              ))
            )}
          </List>
        </CardContent>
      </Card>

      {/* Modal de detalle de alerta */}
      <Dialog open={!!selectedAlert} onClose={handleClose} maxWidth="sm" fullWidth>
        {selectedAlert && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getAlertIcon(selectedAlert.tipo)}
                <Typography variant="h6">{selectedAlert.titulo}</Typography>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedAlert.mensaje}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(selectedAlert.fecha), {
                  addSuffix: true,
                  locale: es,
                })}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cerrar</Button>
              {!selectedAlert.leida && onMarkAsRead && (
                <Button
                  onClick={() => {
                    onMarkAsRead(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  variant="contained"
                >
                  Marcar como leída
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
