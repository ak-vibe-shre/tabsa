import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { requireRestaurantRole } from '../../middleware/requireAuth.js';
import { getSummary, getSalesTrend, getTopItems, getCategoryRevenue, getProfitLoss } from './reports.repository.js';

export const reportsRouter = Router();

function rangeFromQuery(req) {
  return { from: req.query.from, to: req.query.to };
}

reportsRouter.get(
  '/summary',
  asyncRoute(async (req, res) => {
    res.json(await getSummary(req.user.restaurantId, rangeFromQuery(req)));
  })
);

reportsRouter.get(
  '/sales-trend',
  asyncRoute(async (req, res) => {
    res.json(await getSalesTrend(req.user.restaurantId, rangeFromQuery(req)));
  })
);

reportsRouter.get(
  '/top-items',
  asyncRoute(async (req, res) => {
    res.json(await getTopItems(req.user.restaurantId, rangeFromQuery(req), req.query.limit ? Number(req.query.limit) : 10));
  })
);

reportsRouter.get(
  '/category-revenue',
  asyncRoute(async (req, res) => {
    res.json(await getCategoryRevenue(req.user.businessType, req.user.restaurantId, rangeFromQuery(req)));
  })
);

// requireRestaurantRole('owner') layers a hard gate on top of this router's
// mount-level requireNavAccess('dashboard') — manager/staff can be granted
// 'dashboard' via nav_visibility, but must never see cost/profit data.
reportsRouter.get(
  '/profit-loss',
  requireRestaurantRole('owner'),
  asyncRoute(async (req, res) => {
    res.json(await getProfitLoss(req.user.businessType, req.user.restaurantId, rangeFromQuery(req)));
  })
);
