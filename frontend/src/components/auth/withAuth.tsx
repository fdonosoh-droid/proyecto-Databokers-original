import type { ComponentType } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { selectIsAuthenticated, selectCurrentUser } from '@/redux/slices/authSlice';

interface WithAuthOptions {
  allowedRoles?: Array<'ADMIN' | 'GESTOR' | 'CORREDOR'>;
}

/**
 * HOC para proteger componentes con autenticación
 * @param Component - Componente a proteger
 * @param options - Opciones de configuración
 * @returns Componente protegido
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options?: WithAuthOptions
) {
  return function WithAuthComponent(props: P) {
    const location = useLocation();
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const user = useAppSelector(selectCurrentUser);

    // Si no está autenticado, redirigir a login
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si hay roles permitidos, verificar que el usuario tenga el rol adecuado
    if (options?.allowedRoles && user) {
      if (!options.allowedRoles.includes(user.rol)) {
        return <Navigate to="/403" replace />;
      }
    }

    return <Component {...props} />;
  };
}
