import { useState } from 'react';
import { Box, Toolbar, Container } from '@mui/material';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header onMenuClick={handleDrawerToggle} />
      <Sidebar
        onClose={handleDrawerToggle}
        mobileOpen={mobileOpen}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - 240px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl">
          <Breadcrumbs />
          {children}
        </Container>
      </Box>
    </Box>
  );
}
