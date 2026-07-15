import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { getSummary, getSalesTrend, getTopItems, getCategoryRevenue } from './reports.repository.js';

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
