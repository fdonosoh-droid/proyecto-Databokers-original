import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { PrivateRoute, RoleBasedAccess } from '@/components/auth';
import { LoadingSpinner } from '@/components/common';

// Auth Pages (no lazy loading for auth pages)
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

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
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage'));

// Wrapper component for suspense
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  // Public routes - Auth
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // Protected routes
  {
    path: '/',
    element: (
      <PrivateRoute>
        <Navigate to="/dashboard" replace />
      </PrivateRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <PrivateRoute>
        <RoleBasedAccess allowedRoles={['ADMIN', 'GESTOR']}>
          <MainLayout>
            <PageWrapper>
              <DashboardPage />
            </PageWrapper>
          </MainLayout>
        </RoleBasedAccess>
      </PrivateRoute>
    ),
  },
  // Proyectos
  {
    path: '/proyectos',
    element: (
      <PrivateRoute>
        <RoleBasedAccess allowedRoles={['ADMIN', 'GESTOR']}>
          <MainLayout>
            <PageWrapper>
              <ProjectsListPage />
            </PageWrapper>
          </MainLayout>
        </RoleBasedAccess>
      </PrivateRoute>
    ),
  },
  {
    path: '/proyectos/nuevo',
    element: (
      <PrivateRoute>
        <RoleBasedAccess allowedRoles={['ADMIN', 'GESTOR']}>
          <MainLayout>
            <PageWrapper>
              <ProjectFormPage />
            </PageWrapper>
          </MainLayout>
        </RoleBasedAccess>
      </PrivateRoute>
    ),
  },
  {
    path: '/proyectos/:id',
    element: (
      <PrivateRoute>
        <RoleBasedAccess allowedRoles={['ADMIN', 'GESTOR']}>
          <MainLayout>
            <PageWrapper>
              <ProjectDetailPage />
            </PageWrapper>
          </MainLayout>
        </RoleBasedAccess>
      </PrivateRoute>
    ),
  },
  {
    path: '/proyectos/:id/editar',
    element: (
      <PrivateRoute>
        <RoleBasedAccess allowedRoles={['ADMIN', 'GESTOR']}>
          <MainLayout>
            <PageWrapper>
              <ProjectFormPage />
            </PageWrapper>
          </MainLayout>
        </RoleBasedAccess>
      </PrivateRoute>
    ),
  },
  // Propiedades
  {
    path: '/propiedades',
    element: (
      <PrivateRoute>
        <RoleBasedAccess allowedRoles={['ADMIN', 'GESTOR']}>
          <MainLayout>
            <PageWrapper>
              <PropertiesListPage />
            </PageWrapper>
          </MainLayout>
        </RoleBasedAccess>
      </PrivateRoute>
    ),
  },
  {
    path: '/propiedades/nuevo',
    element: (
      <PrivateRoute>
        <RoleBasedAccess allowedRoles={['ADMIN', 'GESTOR']}>
          <MainLayout>
            <PageWrapper>
              <PropertyFormPage />
            </PageWrapper>
          </MainLayout>
        </RoleBasedAccess>
      </PrivateRoute>
    ),
  },
  {
    path: '/propiedades/:id',
    element: (
      <PrivateRoute>
        <RoleBasedAccess allowedRoles={['ADMIN', 'GESTOR']}>
          <MainLayout>
            <PageWrapper>
              <PropertyDetailPage />
            </PageWrapper>
          </MainLayout>
        </RoleBasedAccess>
      </PrivateRoute>
    ),
  },
  {
    path: '/propiedades/:id/editar',
    element: (
      <PrivateRoute>
        <RoleBasedAccess allowedRoles={['ADMIN', 'GESTOR']}>
          <MainLayout>
            <PageWrapper>
              <PropertyFormPage />
            </PageWrapper>
          </MainLayout>
        </RoleBasedAccess>
      </PrivateRoute>
    ),
  },
  // Otros módulos
  {
    path: '/canjes',
    element: (
      <PrivateRoute>
        <RoleBasedAccess allowedRoles={['ADMIN', 'GESTOR']}>
          <MainLayout>
            <PageWrapper>
              <TradeInsPage />
            </PageWrapper>
          </MainLayout>
        </RoleBasedAccess>
      </PrivateRoute>
    ),
  },
  {
    path: '/publicaciones',
    element: (
      <PrivateRoute>
        <MainLayout>
          <PageWrapper>
            <PublicationsPage />
          </PageWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },
  {
    path: '/reportes',
    element: (
      <PrivateRoute>
        <RoleBasedAccess allowedRoles={['ADMIN', 'GESTOR']}>
          <MainLayout>
            <PageWrapper>
              <ReportsPage />
            </PageWrapper>
          </MainLayout>
        </RoleBasedAccess>
      </PrivateRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <PrivateRoute>
        <MainLayout>
          <PageWrapper>
            <ProfilePage />
          </PageWrapper>
        </MainLayout>
      </PrivateRoute>
    ),
  },

  // Error routes
  {
    path: '/403',
    element: <PageWrapper><ForbiddenPage /></PageWrapper>,
  },
  {
    path: '*',
    element: <PageWrapper><NotFoundPage /></PageWrapper>,
  },
]);
