import { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Toolbar,
} from '@mui/material';
import {
  Dashboard,
  Business,
  Home,
  SwapHoriz,
  Campaign,
  Assessment,
  ExpandLess,
  ExpandMore,
  Settings,
  People,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { selectCurrentUser } from '@/redux/slices/authSlice';

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path?: string;
  children?: MenuItem[];
  roles?: Array<'ADMIN' | 'GESTOR' | 'CORREDOR'>;
}

const menuItems: MenuItem[] = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
    roles: ['ADMIN', 'GESTOR'], // Solo ADMIN y GESTOR pueden ver el dashboard
  },
  {
    text: 'Proyectos',
    icon: <Business />,
    path: '/proyectos',
    roles: ['ADMIN', 'GESTOR'],
  },
  {
    text: 'Propiedades',
    icon: <Home />,
    path: '/propiedades',
    roles: ['ADMIN', 'GESTOR'],
  },
  {
    text: 'Canjes',
    icon: <SwapHoriz />,
    path: '/canjes',
    roles: ['ADMIN', 'GESTOR'],
  },
  {
    text: 'Publicaciones',
    icon: <Campaign />,
    path: '/publicaciones',
    // Todos los roles pueden ver publicaciones
  },
  {
    text: 'Reportes',
    icon: <Assessment />,
    path: '/reportes',
    roles: ['ADMIN', 'GESTOR'],
  },
];

const adminMenuItems: MenuItem[] = [
  {
    text: 'Administración',
    icon: <Settings />,
    roles: ['ADMIN'], // Solo ADMIN puede ver la administración
    children: [
      {
        text: 'Usuarios',
        icon: <People />,
        path: '/admin/usuarios',
      },
      {
        text: 'Configuración',
        icon: <Settings />,
        path: '/admin/configuracion',
      },
    ],
  },
];

interface SidebarProps {
  onClose: () => void;
  mobileOpen: boolean;
}

export default function Sidebar({ onClose, mobileOpen }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const handleClick = (item: MenuItem) => {
    if (item.children) {
      setOpenSubmenu(openSubmenu === item.text ? null : item.text);
    } else if (item.path) {
      navigate(item.path);
      if (mobileOpen) {
        onClose();
      }
    }
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    // Exact match or starts with the path (for sub-routes)
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Filtrar menú según el rol del usuario
  const hasAccess = (item: MenuItem) => {
    if (!item.roles) return true; // Si no tiene roles definidos, todos tienen acceso
    if (!user) return false;
    return item.roles.includes(user.rol);
  };

  const filterMenuByRole = (items: MenuItem[]): MenuItem[] => {
    return items.filter(hasAccess);
  };

  const renderMenuItem = (item: MenuItem, depth = 0) => (
    <div key={item.text}>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => handleClick(item)}
          selected={isActive(item.path)}
          sx={{ pl: depth * 2 + 2 }}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
          {item.children && (openSubmenu === item.text ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
      </ListItem>
      {item.children && (
        <Collapse in={openSubmenu === item.text} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child) => renderMenuItem(child, depth + 1))}
          </List>
        </Collapse>
      )}
    </div>
  );

  const filteredMenuItems = filterMenuByRole(menuItems);
  const filteredAdminItems = filterMenuByRole(adminMenuItems);

  const drawerContent = (
    <>
      <Toolbar />
      <List>
        {filteredMenuItems.map((item) => renderMenuItem(item))}
      </List>
      {filteredAdminItems.length > 0 && (
        <>
          <Divider />
          <List>
            {filteredAdminItems.map((item) => renderMenuItem(item))}
          </List>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
