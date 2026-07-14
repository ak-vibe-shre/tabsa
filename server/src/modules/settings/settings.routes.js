import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { requireRestaurantRole } from '../../middleware/requireAuth.js';
import { getSettings, updateSettings } from './settings.repository.js';
import { CONFIGURABLE_NAV_KEYS } from '../../lib/navItems.js';

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
    const { nav_visibility } = req.body;
    if (nav_visibility !== undefined) {
      const roles = Object.keys(nav_visibility);
      const validShape =
        roles.every((role) => role === 'manager' || role === 'staff') &&
        roles.every(
          (role) => Array.isArray(nav_visibility[role]) && nav_visibility[role].every((key) => CONFIGURABLE_NAV_KEYS.includes(key))
        );
      if (!validShape) {
        throw new HttpError(400, `nav_visibility must only contain 'manager'/'staff' keys with values from ${CONFIGURABLE_NAV_KEYS.join(', ')}`);
      }
    }
    res.json(updateSettings(req.user.restaurantId, req.body));
  })
);
