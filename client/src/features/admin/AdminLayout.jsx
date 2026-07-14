import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import './admin.css';

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/restaurants', label: 'Restaurants' },
  { to: '/admin/plans', label: 'Plans' },
];

export function AdminLayout() {
  const { logout } = useAuth();

  function handleLogout() {
    if (confirm('Log out of your account?')) logout();
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-brand">
          <img className="admin-brand-logo" src="/assets/logo-lockup.png" alt="Tabsa" />
          <div className="admin-brand-sub">Platform Admin</div>
        </div>
        <nav className="admin-nav">
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          Log out
        </Button>
      </header>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
