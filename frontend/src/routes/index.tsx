import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import DashboardPage from '@/pages/DashboardPage';
import ProjectsListPage from '@/pages/projects/ProjectsListPage';
import ProjectDetailPage from '@/pages/projects/ProjectDetailPage';
import ProjectFormPage from '@/pages/projects/ProjectFormPage';
import PropertiesListPage from '@/pages/properties/PropertiesListPage';
import PropertyDetailPage from '@/pages/properties/PropertyDetailPage';
import PropertyFormPage from '@/pages/properties/PropertyFormPage';
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
  // Proyectos
  {
    path: '/proyectos',
    element: <MainLayout><ProjectsListPage /></MainLayout>,
  },
  {
    path: '/proyectos/nuevo',
    element: <MainLayout><ProjectFormPage /></MainLayout>,
  },
  {
    path: '/proyectos/:id',
    element: <MainLayout><ProjectDetailPage /></MainLayout>,
  },
  {
    path: '/proyectos/:id/editar',
    element: <MainLayout><ProjectFormPage /></MainLayout>,
  },
  // Propiedades
  {
    path: '/propiedades',
    element: <MainLayout><PropertiesListPage /></MainLayout>,
  },
  {
    path: '/propiedades/nuevo',
    element: <MainLayout><PropertyFormPage /></MainLayout>,
  },
  {
    path: '/propiedades/:id',
    element: <MainLayout><PropertyDetailPage /></MainLayout>,
  },
  {
    path: '/propiedades/:id/editar',
    element: <MainLayout><PropertyFormPage /></MainLayout>,
  },
  // Otros módulos
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
