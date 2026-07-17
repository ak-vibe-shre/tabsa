import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { PosPage } from './features/pos/PosPage.jsx';
import { ProductsPage } from './features/products/ProductsPage.jsx';
import { InventoryPage } from './features/inventory/InventoryPage.jsx';
import { SettingsPage } from './features/settings/SettingsPage.jsx';
import { LoginPage } from './features/auth/LoginPage.jsx';
import { AdminLayout } from './features/admin/AdminLayout.jsx';
import { AdminDashboardPage } from './features/admin/AdminDashboardPage.jsx';
import { AdminRestaurantsPage } from './features/admin/AdminRestaurantsPage.jsx';
import { AdminPlansPage } from './features/admin/AdminPlansPage.jsx';
import { RequireAuth, RequireRole } from './lib/RequireAuth.jsx';

// Lazy-loaded so recharts (only used here) splits into its own chunk instead
// of bloating the main bundle for every page load.
const DashboardPage = lazy(() =>
  import('./features/dashboard/DashboardPage.jsx').then((m) => ({ default: m.DashboardPage }))
);
const ProfitLossPage = lazy(() =>
  import('./features/profit-loss/ProfitLossPage.jsx').then((m) => ({ default: m.ProfitLossPage }))
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/orders" element={<PosPage />} />

          <Route element={<RequireRole roles={['owner', 'manager', 'staff']} navKey="dashboard" redirectTo="/orders" />}>
            <Route
              path="/"
              element={
                <Suspense fallback={null}>
                  <DashboardPage />
                </Suspense>
              }
            />
          </Route>

          <Route element={<RequireRole roles={['owner', 'manager', 'staff']} navKey="products" redirectTo="/orders" />}>
            <Route path="/products" element={<ProductsPage />} />
          </Route>

          <Route element={<RequireRole roles={['owner', 'manager', 'staff']} navKey="inventory" redirectTo="/orders" />}>
            <Route path="/inventory" element={<InventoryPage />} />
          </Route>

          <Route element={<RequireRole roles={['owner']} redirectTo="/orders" />}>
            <Route path="/settings" element={<SettingsPage />} />
            <Route
              path="/profit-loss"
              element={
                <Suspense fallback={null}>
                  <ProfitLossPage />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route element={<RequireRole role="platform_admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="restaurants" element={<AdminRestaurantsPage />} />
            <Route path="plans" element={<AdminPlansPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

