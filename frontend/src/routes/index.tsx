import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import { PrivateRoute, RoleBasedAccess } from '@/components/auth';

// Auth Pages
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

// Main Pages
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
import ProfilePage from '@/pages/ProfilePage';

// Error Pages
import NotFoundPage from '@/pages/NotFoundPage';
import ForbiddenPage from '@/pages/ForbiddenPage';

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
            <DashboardPage />
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
            <ProjectsListPage />
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
            <ProjectFormPage />
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
            <ProjectDetailPage />
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
            <ProjectFormPage />
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
            <PropertiesListPage />
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
            <PropertyFormPage />
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
            <PropertyDetailPage />
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
            <PropertyFormPage />
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
            <TradeInsPage />
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
          <PublicationsPage />
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
            <ReportsPage />
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
          <ProfilePage />
        </MainLayout>
      </PrivateRoute>
    ),
  },

  // Error routes
  {
    path: '/403',
    element: <ForbiddenPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
