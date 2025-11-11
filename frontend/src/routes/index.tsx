import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { LoadingSpinner } from '@/components/common';

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProjectsListPage = lazy(() => import('@/pages/projects/ProjectsListPage'));
const ProjectDetailPage = lazy(() => import('@/pages/projects/ProjectDetailPage'));
const ProjectFormPage = lazy(() => import('@/pages/projects/ProjectFormPage'));
const PropertiesListPage = lazy(() => import('@/pages/properties/PropertiesListPage'));
const PropertyDetailPage = lazy(() => import('@/pages/properties/PropertyDetailPage'));
const PropertyFormPage = lazy(() => import('@/pages/properties/PropertyFormPage'));
const TradeInsPage = lazy(() => import('@/pages/TradeInsPage'));
const PublicationsPage = lazy(() => import('@/pages/PublicationsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage'));

// Wrapper component for suspense
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout><PageWrapper><DashboardPage /></PageWrapper></MainLayout>,
  },
  {
    path: '/dashboard',
    element: <MainLayout><PageWrapper><DashboardPage /></PageWrapper></MainLayout>,
  },
  // Proyectos
  {
    path: '/proyectos',
    element: <MainLayout><PageWrapper><ProjectsListPage /></PageWrapper></MainLayout>,
  },
  {
    path: '/proyectos/nuevo',
    element: <MainLayout><PageWrapper><ProjectFormPage /></PageWrapper></MainLayout>,
  },
  {
    path: '/proyectos/:id',
    element: <MainLayout><PageWrapper><ProjectDetailPage /></PageWrapper></MainLayout>,
  },
  {
    path: '/proyectos/:id/editar',
    element: <MainLayout><PageWrapper><ProjectFormPage /></PageWrapper></MainLayout>,
  },
  // Propiedades
  {
    path: '/propiedades',
    element: <MainLayout><PageWrapper><PropertiesListPage /></PageWrapper></MainLayout>,
  },
  {
    path: '/propiedades/nuevo',
    element: <MainLayout><PageWrapper><PropertyFormPage /></PageWrapper></MainLayout>,
  },
  {
    path: '/propiedades/:id',
    element: <MainLayout><PageWrapper><PropertyDetailPage /></PageWrapper></MainLayout>,
  },
  {
    path: '/propiedades/:id/editar',
    element: <MainLayout><PageWrapper><PropertyFormPage /></PageWrapper></MainLayout>,
  },
  // Otros módulos
  {
    path: '/canjes',
    element: <MainLayout><PageWrapper><TradeInsPage /></PageWrapper></MainLayout>,
  },
  {
    path: '/publicaciones',
    element: <MainLayout><PageWrapper><PublicationsPage /></PageWrapper></MainLayout>,
  },
  {
    path: '/reportes',
    element: <MainLayout><PageWrapper><ReportsPage /></PageWrapper></MainLayout>,
  },
  {
    path: '/403',
    element: <PageWrapper><ForbiddenPage /></PageWrapper>,
  },
  {
    path: '*',
    element: <PageWrapper><NotFoundPage /></PageWrapper>,
  },
]);
