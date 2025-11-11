import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import ProjectsPage from '@/pages/ProjectsPage';
import PropertiesPage from '@/pages/PropertiesPage';
import TradeInsPage from '@/pages/TradeInsPage';
import PublicationsPage from '@/pages/PublicationsPage';
import ReportsPage from '@/pages/ReportsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import ForbiddenPage from '@/pages/ForbiddenPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout><DashboardPage /></MainLayout>,
  },
  {
    path: '/dashboard',
    element: <MainLayout><DashboardPage /></MainLayout>,
  },
  {
    path: '/proyectos',
    element: <MainLayout><ProjectsPage /></MainLayout>,
  },
  {
    path: '/propiedades',
    element: <MainLayout><PropertiesPage /></MainLayout>,
  },
  {
    path: '/canjes',
    element: <MainLayout><TradeInsPage /></MainLayout>,
  },
  {
    path: '/publicaciones',
    element: <MainLayout><PublicationsPage /></MainLayout>,
  },
  {
    path: '/reportes',
    element: <MainLayout><ReportsPage /></MainLayout>,
  },
  {
    path: '/403',
    element: <ForbiddenPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
