import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Lock } from '@mui/icons-material';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        textAlign: 'center',
      }}
    >
      <Lock sx={{ fontSize: 100, color: 'error.main', mb: 2 }} />
      <Typography variant="h1" component="h1" gutterBottom>
        403
      </Typography>
      <Typography variant="h4" gutterBottom>
        Acceso Denegado
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        No tienes permisos para acceder a esta página.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        Volver al Dashboard
      </Button>
    </Box>
  );
}
