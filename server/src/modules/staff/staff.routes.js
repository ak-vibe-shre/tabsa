import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { STAFF_ROLES, listStaff, createStaff, updateStaffRole, deleteStaff } from './staff.repository.js';

export const staffRouter = Router();

staffRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    res.json(listStaff(req.user.restaurantId));
  })
);

staffRouter.post(
  '/',
  asyncRoute(async (req, res) => {
    const { username, role } = req.body;
    if (!username) throw new HttpError(400, 'username is required');
    if (!STAFF_ROLES.includes(role)) throw new HttpError(400, `role must be one of: ${STAFF_ROLES.join(', ')}`);
    try {
      res.status(201).json(createStaff(req.user.restaurantId, { username, role }));
    } catch (err) {
      throw new HttpError(409, err.message);
    }
  })
);

staffRouter.patch(
  '/:id',
  asyncRoute(async (req, res) => {
    const { role } = req.body;
    if (!STAFF_ROLES.includes(role)) throw new HttpError(400, `role must be one of: ${STAFF_ROLES.join(', ')}`);
    const updated = updateStaffRole(Number(req.params.id), req.user.restaurantId, role);
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
