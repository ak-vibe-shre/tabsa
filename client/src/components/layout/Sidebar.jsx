import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Package, Settings } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';

export function Sidebar({ lowStockCount = 0, enabledModules }) {
  const { user, logout } = useAuth();
  const businessType = useCurrentBusinessType();

  const NAV_ITEMS = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', module: 'dashboard', key: 'dashboard', togglable: true, roles: ['owner', 'manager'] },
    { to: '/orders', icon: UtensilsCrossed, label: businessType.orderNoun, module: null, key: 'orders', togglable: false, roles: ['owner', 'manager', 'staff'] },
    { to: '/products', icon: ClipboardList, label: businessType.productNoun.plural, module: null, key: 'products', togglable: true, roles: ['owner', 'manager'] },
    { to: '/inventory', icon: Package, label: 'Inventory', module: 'inventory', key: 'inventory', togglable: true, roles: ['owner', 'manager'] },
    { to: '/settings', icon: Settings, label: 'Settings', module: null, key: 'settings', togglable: false, roles: ['owner'] },
  ];

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.module && enabledModules && !enabledModules.includes(item.module)) return false;
    if (!user) return false;
    if (user.role === 'owner') return item.roles.includes('owner');
    if (!item.togglable) return item.roles.includes(user.role);
    return (user.nav_visibility ?? []).includes(item.key);
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img className="sidebar-brand-logo" src="/assets/logo-lockup.png" alt="Tabsa" />
        <div className="sidebar-brand-sub">{businessType.label} OS</div>
      </div>
      <nav className="sidebar-nav">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              end={item.to === '/'}
            >
              <span className="sidebar-link-icon">
                <Icon size={18} strokeWidth={2} />
              </span>
              <span className="sidebar-link-text">{item.label}</span>
              {item.to === '/inventory' && lowStockCount > 0 && (
                <span className="sidebar-link-badge">
                  <Badge variant="warning">{lowStockCount}</Badge>
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-footer-user">{user?.username}</div>
        <button className="sidebar-logout" onClick={logout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
