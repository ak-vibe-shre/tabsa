import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';
import { api } from '../../lib/apiClient.js';

export function AppLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [lowStockCount, setLowStockCount] = useState(0);
  const { settings } = useSettings();
  const { user } = useAuth();
  const businessType = useCurrentBusinessType();
  const canSeeInventory = user?.role === 'owner' || user?.role === 'manager';

  const TITLES = {
    '/': 'Dashboard',
    '/orders': `${businessType.orderNoun} & Billing`,
    '/products': `${businessType.productNoun.plural} Management`,
    '/inventory': 'Inventory',
    '/settings': 'Settings',
  };

  useEffect(() => {
    if (!canSeeInventory) {
      setLowStockCount(0);
      return;
    }
    let cancelled = false;
    api
      .get('/inventory?low_stock=true')
      .then((items) => {
        if (!cancelled) setLowStockCount(items.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [location.pathname, canSeeInventory]);

  const title = TITLES[location.pathname] ?? 'Tabsa';
  const enabledModules = settings?.enabled_modules ?? null;

  return (
    <div className="app-shell">
      <Sidebar lowStockCount={lowStockCount} enabledModules={enabledModules} />
      <div className="app-main">
        <Topbar title={title} theme={theme} onToggleTheme={toggleTheme} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
