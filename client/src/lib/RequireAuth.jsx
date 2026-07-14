import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// navKey gates on that individual user's own owner-configurable
// nav_visibility (edited per-staff-member in StaffSection) in addition to
// the static role list, so hiding a tab also blocks direct navigation to it,
// not just the sidebar link.
export function RequireRole({ role, roles, navKey, redirectTo = '/' }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const allowed = roles ? roles.includes(user.role) : user.role === role;
  if (!allowed) return <Navigate to={redirectTo} replace />;

  if (navKey && user.role !== 'owner' && !(user.nav_visibility ?? []).includes(navKey)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
