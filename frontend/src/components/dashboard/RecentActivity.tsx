import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
} from '@mui/material';
import {
  HomeWork,
  SwapHoriz,
  Campaign,
  Apartment,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Activity {
  id: string;
  tipo: 'venta' | 'canje' | 'publicacion' | 'proyecto';
  descripcion: string;
  fecha: string;
  usuario: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const getActivityIcon = (tipo: string) => {
  switch (tipo) {
    case 'venta':
      return <HomeWork />;
    case 'canje':
      return <SwapHoriz />;
    case 'publicacion':
      return <Campaign />;
    case 'proyecto':
      return <Apartment />;
    default:
      return <HomeWork />;
  }
};

const getActivityColor = (tipo: string) => {
  switch (tipo) {
    case 'venta':
      return 'success';
    case 'canje':
      return 'info';
    case 'publicacion':
      return 'warning';
    case 'proyecto':
      return 'primary';
    default:
      return 'default';
  }
};

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Actividad Reciente
        </Typography>
        <List>
          {activities.map((activity) => (
            <ListItem key={activity.id} divider>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: `${getActivityColor(activity.tipo)}.main` }}>
                  {getActivityIcon(activity.tipo)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={activity.descripcion}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {activity.usuario}
                    </Typography>
                    {' • '}
                    {formatDistanceToNow(new Date(activity.fecha), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </>
                }
              />
              <Chip label={activity.tipo} color={getActivityColor(activity.tipo) as any} size="small" />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
