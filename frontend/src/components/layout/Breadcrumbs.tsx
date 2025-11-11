import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const pathNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  proyectos: 'Proyectos',
  propiedades: 'Propiedades',
  canjes: 'Canjes',
  publicaciones: 'Publicaciones',
  reportes: 'Reportes',
  admin: 'Administración',
  usuarios: 'Usuarios',
  configuracion: 'Configuración',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <MuiBreadcrumbs
      separator={<NavigateNext fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      <Link
        component={RouterLink}
        to="/"
        underline="hover"
        color="inherit"
      >
        Inicio
      </Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = pathNameMap[value] || value;

        return last ? (
          <Typography key={to} color="text.primary">
            {label}
          </Typography>
        ) : (
          <Link
            key={to}
            component={RouterLink}
            to={to}
            underline="hover"
            color="inherit"
          >
            {label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
