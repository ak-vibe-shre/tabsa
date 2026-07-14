import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { requireRestaurantRole } from '../../middleware/requireAuth.js';
import { getSettings, updateSettings } from './settings.repository.js';

export const settingsRouter = Router();

settingsRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    res.json(getSettings(req.user.restaurantId));
  })
);

settingsRouter.patch(
  '/',
  requireRestaurantRole('owner'),
  asyncRoute(async (req, res) => {
    res.json(updateSettings(req.user.restaurantId, req.body));
  })
);
