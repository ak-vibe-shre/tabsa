import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './db/bootstrap.js';
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
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { publicRouter } from './modules/public/public.routes.js';
import { requireAuth, requireRole, requireRestaurantRole, requireNavAccess } from './middleware/requireAuth.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);

app.use('/api/admin', requireAuth, requireRole('platform_admin'), adminRouter);
app.use('/api/plans', requireAuth, plansRouter);
app.use('/api/business-types', requireAuth, businessTypesRouter);

app.use('/api/categories', requireAuth, categoriesRouter);
app.use('/api/products', requireAuth, productsRouter);
app.use('/api/tables', requireAuth, tablesRouter);
app.use('/api/orders', requireAuth, ordersRouter);
app.use('/api/inventory', requireAuth, requireNavAccess('inventory'), inventoryRouter);
app.use('/api/reports', requireAuth, requireNavAccess('dashboard'), reportsRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/uploads', requireAuth, uploadsRouter);
app.use('/api/staff', requireAuth, requireRestaurantRole('owner'), staffRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);
