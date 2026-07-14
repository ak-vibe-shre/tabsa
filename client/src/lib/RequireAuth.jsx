import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { useSettings } from './SettingsContext.jsx';

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// navKey gates on the owner-configurable per-role nav visibility (see
// NavVisibilitySection) in addition to the static role list, so hiding a tab
// also blocks direct navigation to it, not just the sidebar link.
export function RequireRole({ role, roles, navKey, redirectTo = '/' }) {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const allowed = roles ? roles.includes(user.role) : user.role === role;
  if (!allowed) return <Navigate to={redirectTo} replace />;

  if (navKey && user.role !== 'owner') {
    if (settings === null) return null; // wait for /api/settings before deciding
    const visible = settings?.nav_visibility?.[user.role] ?? [];
    if (!visible.includes(navKey)) return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
