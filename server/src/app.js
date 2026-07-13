import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './db/migrate.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { plansRouter } from './modules/plans/plans.routes.js';
import { staffRouter } from './modules/staff/staff.routes.js';
import { categoriesRouter } from './modules/categories/categories.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { businessTypesRouter } from './modules/business-types/business-types.routes.js';
import { tablesRouter } from './modules/tables/tables.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { inventoryRouter } from './modules/inventory/inventory.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { settingsRouter } from './modules/settings/settings.routes.js';
import { requireAuth, requireRole, requireRestaurantRole } from './middleware/requireAuth.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);

app.use('/api/admin', requireAuth, requireRole('platform_admin'), adminRouter);
app.use('/api/plans', requireAuth, plansRouter);
app.use('/api/business-types', requireAuth, businessTypesRouter);

app.use('/api/categories', requireAuth, categoriesRouter);
app.use('/api/products', requireAuth, productsRouter);
app.use('/api/tables', requireAuth, tablesRouter);
app.use('/api/orders', requireAuth, ordersRouter);
app.use('/api/inventory', requireAuth, requireRestaurantRole('owner', 'manager'), inventoryRouter);
app.use('/api/reports', requireAuth, requireRestaurantRole('owner', 'manager'), reportsRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/staff', requireAuth, requireRestaurantRole('owner'), staffRouter);

// Serve the built client (client/dist) when present, so a single server can host
// both the API and the frontend. In local dev this directory doesn't exist —
// Vite's dev server handles the frontend instead — so this block is skipped.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');

if (fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath));

  app.get(/^\/app(\/.*)?$/, (req, res, next) => {
    res.sendFile(path.join(clientDistPath, 'app', 'index.html'), (err) => err && next(err));
  });

  app.get(/^(?!\/api).*/, (req, res, next) => {
    res.sendFile(clientIndexPath, (err) => err && next(err));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);
