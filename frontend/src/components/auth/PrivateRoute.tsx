import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { selectIsAuthenticated, selectAuthLoading } from '@/redux/slices/authSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const location = useLocation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Guardar la ubicación a la que el usuario intentaba acceder
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
