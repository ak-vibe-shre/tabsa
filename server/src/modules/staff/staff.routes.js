import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { STAFF_ROLES, listStaff, createStaff, updateStaff, deleteStaff } from './staff.repository.js';
import { isValidNavKeyArray, CONFIGURABLE_NAV_KEYS } from '../../lib/navItems.js';

export const staffRouter = Router();

function validateNavVisibility(nav_visibility) {
  if (nav_visibility !== undefined && !isValidNavKeyArray(nav_visibility)) {
    throw new HttpError(400, `nav_visibility must be an array made up of: ${CONFIGURABLE_NAV_KEYS.join(', ')}`);
  }
}

staffRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    res.json(listStaff(req.user.restaurantId));
  })
);

staffRouter.post(
  '/',
  asyncRoute(async (req, res) => {
    const { username, role, nav_visibility } = req.body;
    if (!username) throw new HttpError(400, 'username is required');
    if (!STAFF_ROLES.includes(role)) throw new HttpError(400, `role must be one of: ${STAFF_ROLES.join(', ')}`);
    validateNavVisibility(nav_visibility);
    try {
      res.status(201).json(createStaff(req.user.restaurantId, { username, role, nav_visibility }));
    } catch (err) {
      throw new HttpError(409, err.message);
    }
  })
);

staffRouter.patch(
  '/:id',
  asyncRoute(async (req, res) => {
    const { role, nav_visibility } = req.body;
    if (role !== undefined && !STAFF_ROLES.includes(role)) throw new HttpError(400, `role must be one of: ${STAFF_ROLES.join(', ')}`);
    validateNavVisibility(nav_visibility);
    const updated = updateStaff(Number(req.params.id), req.user.restaurantId, { role, nav_visibility });
    if (!updated) throw new HttpError(404, 'Staff member not found');
    res.json(updated);
  })
);

staffRouter.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    const deleted = deleteStaff(Number(req.params.id), req.user.restaurantId);
    if (!deleted) throw new HttpError(404, 'Staff member not found');
    res.status(204).end();
  })
);
