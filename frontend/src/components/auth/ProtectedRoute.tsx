import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import type { UserRole } from '../../auth/AuthContext';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.rol)) {
    // If not authorized, redirect to their default home
    if (user.rol === 'supervisor') {
      return <Navigate to="/supervisor/bitacora" replace />;
    } else {
      return <Navigate to="/torre-control/inicio-dia" replace />;
    }
  }

  return <Outlet />;
};
