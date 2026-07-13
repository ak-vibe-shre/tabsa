import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { requireRole } from '../../middleware/requireAuth.js';
import { listPlans, updatePlan } from './plans.repository.js';

export const plansRouter = Router();

plansRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    res.json(listPlans());
  })
);

plansRouter.patch(
  '/:key',
  requireRole('platform_admin'),
  asyncRoute(async (req, res) => {
    const { table_limit, features } = req.body;
    if (table_limit !== undefined && table_limit !== null && (!Number.isInteger(table_limit) || table_limit < 1)) {
      throw new HttpError(400, 'table_limit must be a positive integer or null for unlimited');
    }
    if (features !== undefined && !Array.isArray(features)) {
      throw new HttpError(400, 'features must be an array of strings');
    }
    const updated = updatePlan(req.params.key, req.body);
    if (!updated) throw new HttpError(404, 'Plan not found');
    res.json(updated);
  })
);
