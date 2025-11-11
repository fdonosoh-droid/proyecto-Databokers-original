import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Divider,
  ListItemIcon,
} from '@mui/material';
import {
  AccountCircle,
  Settings,
  Logout,
  Person,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectCurrentUser } from '@/redux/slices/authSlice';
import { logout } from '@/redux/slices/authSlice';
import { useLogoutMutation } from '@/redux/api/authApi';

const UserMenu = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const [logoutApi] = useLogoutMutation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleSettings = () => {
    handleClose();
    navigate('/settings');
  };

  const handleLogout = async () => {
    handleClose();
    try {
      // Llamar al endpoint de logout
      await logoutApi().unwrap();
    } catch (error) {
      console.error('Error al hacer logout:', error);
    } finally {
      // Siempre limpiar el estado local
      dispatch(logout());
      navigate('/login');
    }
  };

  if (!user) return null;

  const initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
          }}
        >
          {initials}
        </Avatar>
      </IconButton>

      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 220,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
            },
          },
        }}
      >
        {/* Info del usuario */}
        <MenuItem disabled sx={{ opacity: '1 !important' }}>
          <div>
            <Typography variant="subtitle2" fontWeight="bold">
              {user.nombre} {user.apellido}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
            <Typography
              variant="caption"
              display="block"
              sx={{
                mt: 0.5,
                px: 1,
                py: 0.25,
                bgcolor: 'primary.light',
                color: 'primary.dark',
                borderRadius: 1,
                display: 'inline-block',
              }}
            >
              {user.rol}
            </Typography>
          </div>
        </MenuItem>

        <Divider />

        {/* Perfil */}
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Mi Perfil
        </MenuItem>

        {/* Configuración */}
        <MenuItem onClick={handleSettings}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Configuración
        </MenuItem>

        <Divider />

        {/* Cerrar sesión */}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <Typography color="error">Cerrar Sesión</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;
