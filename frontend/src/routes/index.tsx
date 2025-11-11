import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { LoadingSpinner } from '@/components/common';

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const PropertiesPage = lazy(() => import('@/pages/PropertiesPage'));
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
  {
    path: '/proyectos',
    element: <MainLayout><PageWrapper><ProjectsPage /></PageWrapper></MainLayout>,
  },
  {
    path: '/propiedades',
    element: <MainLayout><PageWrapper><PropertiesPage /></PageWrapper></MainLayout>,
  },
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
