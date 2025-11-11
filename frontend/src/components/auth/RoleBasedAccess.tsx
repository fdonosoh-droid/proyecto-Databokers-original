import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/redux/hooks';
import { selectCurrentUser } from '@/redux/slices/authSlice';

interface RoleBasedAccessProps {
  children: React.ReactNode;
  allowedRoles: Array<'ADMIN' | 'GESTOR' | 'CORREDOR'>;
}

const RoleBasedAccess = ({ children, allowedRoles }: RoleBasedAccessProps) => {
  const user = useAppSelector(selectCurrentUser);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.rol)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

export default RoleBasedAccess;
