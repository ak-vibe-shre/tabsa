import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireRole({ role, roles, redirectTo = '/' }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const allowed = roles ? roles.includes(user.role) : user.role === role;
  if (!allowed) return <Navigate to={redirectTo} replace />;
  return <Outlet />;
}
