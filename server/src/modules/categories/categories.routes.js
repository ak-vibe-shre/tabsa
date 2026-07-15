import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { requireRestaurantRole } from '../../middleware/requireAuth.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from './categories.repository.js';

export const categoriesRouter = Router();
const requireManage = requireRestaurantRole('owner', 'manager');

categoriesRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    res.json(await listCategories(req.user.restaurantId));
  })
);

categoriesRouter.post(
  '/',
  requireManage,
  asyncRoute(async (req, res) => {
    const { name, sort_order } = req.body;
    if (!name) throw new HttpError(400, 'name is required');
    res.status(201).json(await createCategory(req.user.restaurantId, { name, sort_order }));
  })
);

categoriesRouter.patch(
  '/:id',
  requireManage,
  asyncRoute(async (req, res) => {
    const updated = await updateCategory(Number(req.params.id), req.user.restaurantId, req.body);
    if (!updated) throw new HttpError(404, 'Category not found');
    res.json(updated);
  })
);

categoriesRouter.delete(
  '/:id',
  requireManage,
  asyncRoute(async (req, res) => {
    const deleted = await deleteCategory(Number(req.params.id), req.user.restaurantId);
    if (!deleted) throw new HttpError(404, 'Category not found');
    res.status(204).end();
  })
);
