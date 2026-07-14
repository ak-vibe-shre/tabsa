import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import './admin.css';

const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Overview', end: true },
  { to: '/admin/restaurants', label: 'Restaurants' },
  { to: '/admin/plans', label: 'Plans' },
];

export function AdminLayout() {
  const { logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleConfirmLogout() {
    setConfirmOpen(false);
    logout();
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
        <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(true)} aria-label="Log out">
          <LogOut size={14} strokeWidth={2} />
          <span className="admin-logout-text">Log out</span>
        </Button>
      </header>
      <main className="admin-content">
        <Outlet />
      </main>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Log out?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmLogout}>
              Log out
            </Button>
          </>
        }
      >
        <p>You'll need to sign in again to continue.</p>
      </Modal>
    </div>
  );
}
