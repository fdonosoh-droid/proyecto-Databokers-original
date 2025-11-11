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

const drawerWidth = 240;

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    text: 'Proyectos',
    icon: <Business />,
    path: '/proyectos',
  },
  {
    text: 'Propiedades',
    icon: <Home />,
    path: '/propiedades',
  },
  {
    text: 'Canjes',
    icon: <SwapHoriz />,
    path: '/canjes',
  },
  {
    text: 'Publicaciones',
    icon: <Campaign />,
    path: '/publicaciones',
  },
  {
    text: 'Reportes',
    icon: <Assessment />,
    path: '/reportes',
  },
];

const adminMenuItems: MenuItem[] = [
  {
    text: 'Administración',
    icon: <Settings />,
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

  const renderMenuItem = (item: MenuItem, depth = 0) => (
    <div key={item.text}>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => handleClick(item)}
          selected={isActive(item.path)}
          sx={{ pl: depth * 2 + 2 }}
          aria-label={item.text}
          aria-current={isActive(item.path) ? 'page' : undefined}
          aria-expanded={item.children ? openSubmenu === item.text : undefined}
        >
          <ListItemIcon aria-hidden="true">{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
          {item.children && (
            <span aria-hidden="true">
              {openSubmenu === item.text ? <ExpandLess /> : <ExpandMore />}
            </span>
          )}
        </ListItemButton>
      </ListItem>
      {item.children && (
        <Collapse in={openSubmenu === item.text} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            role="group"
            aria-label={`${item.text} submenú`}
          >
            {item.children.map((child) => renderMenuItem(child, depth + 1))}
          </List>
        </Collapse>
      )}
    </div>
  );

  const drawerContent = (
    <>
      <Toolbar />
      <nav aria-label="menú principal de navegación">
        <List>
          {menuItems.map((item) => renderMenuItem(item))}
        </List>
      </nav>
      <Divider role="separator" />
      <nav aria-label="menú de administración">
        <List>
          {adminMenuItems.map((item) => renderMenuItem(item))}
        </List>
      </nav>
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
        aria-label="navegación principal"
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
        aria-label="navegación principal"
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
