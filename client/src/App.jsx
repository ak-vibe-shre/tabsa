import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { DashboardPage } from './features/dashboard/DashboardPage.jsx';
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/orders" element={<PosPage />} />

          <Route element={<RequireRole roles={['owner', 'manager', 'staff']} navKey="dashboard" redirectTo="/orders" />}>
            <Route path="/" element={<DashboardPage />} />
          </Route>

          <Route element={<RequireRole roles={['owner', 'manager', 'staff']} navKey="products" redirectTo="/orders" />}>
            <Route path="/products" element={<ProductsPage />} />
          </Route>

          <Route element={<RequireRole roles={['owner', 'manager', 'staff']} navKey="inventory" redirectTo="/orders" />}>
            <Route path="/inventory" element={<InventoryPage />} />
          </Route>

          <Route element={<RequireRole roles={['owner']} redirectTo="/orders" />}>
            <Route path="/settings" element={<SettingsPage />} />
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

