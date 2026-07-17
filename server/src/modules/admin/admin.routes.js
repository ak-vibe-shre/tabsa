import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { BUSINESS_TYPE_KEYS } from '../../lib/businessTypes.js';
import { listRestaurants, createRestaurantWithOwner, updateRestaurant, getPlatformStats } from './admin.repository.js';

export const adminRouter = Router();
const BILLING_CYCLES = ['monthly', 'half_yearly', 'yearly'];

adminRouter.get(
  '/stats',
  asyncRoute(async (req, res) => {
    res.json(await getPlatformStats());
  })
);

adminRouter.get(
  '/restaurants',
  asyncRoute(async (req, res) => {
    res.json(await listRestaurants());
  })
);

adminRouter.post(
  '/restaurants',
  asyncRoute(async (req, res) => {
    const { name, username, business_type, billing_cycle } = req.body;
    if (!name || !username) throw new HttpError(400, 'name and username are required');
    if (!business_type || !BUSINESS_TYPE_KEYS.includes(business_type)) {
      throw new HttpError(400, `business_type must be one of: ${BUSINESS_TYPE_KEYS.join(', ')}`);
    }
    if (billing_cycle && !BILLING_CYCLES.includes(billing_cycle)) {
      throw new HttpError(400, `billing_cycle must be one of: ${BILLING_CYCLES.join(', ')}`);
    }
    try {
      res.status(201).json(await createRestaurantWithOwner({ name, username, business_type, billing_cycle }));
    } catch (err) {
      throw new HttpError(409, err.message);
    }
  })
);

adminRouter.patch(
  '/restaurants/:id',
  asyncRoute(async (req, res) => {
    const { status, subscription_plan, business_type, billing_cycle } = req.body;
    if (status && !['active', 'suspended'].includes(status)) {
      throw new HttpError(400, 'status must be active or suspended');
    }
    if (subscription_plan && !['starter', 'growth', 'enterprise'].includes(subscription_plan)) {
      throw new HttpError(400, 'subscription_plan must be starter, growth, or enterprise');
    }
    if (business_type && !BUSINESS_TYPE_KEYS.includes(business_type)) {
      throw new HttpError(400, `business_type must be one of: ${BUSINESS_TYPE_KEYS.join(', ')}`);
    }
    if (billing_cycle !== undefined && billing_cycle !== null && !BILLING_CYCLES.includes(billing_cycle)) {
      throw new HttpError(400, `billing_cycle must be one of: ${BILLING_CYCLES.join(', ')}, or null to clear it`);
    }
    const updated = await updateRestaurant(Number(req.params.id), req.body);
    if (!updated) throw new HttpError(404, 'Restaurant not found');
    res.json(updated);
  })
);
