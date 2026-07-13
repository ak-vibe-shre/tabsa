import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { requireRestaurantRole } from '../../middleware/requireAuth.js';
import { listProducts, getProduct, createProduct, updateProduct, setAvailability, deleteProduct } from './products.repository.js';

export const productsRouter = Router();
const requireManage = requireRestaurantRole('owner', 'manager');

function businessTypeOf(req) {
  if (!req.user.businessType) throw new HttpError(400, 'No business type configured for this restaurant');
  return req.user.businessType;
}

productsRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    const { category_id, available } = req.query;
    res.json(
      listProducts(businessTypeOf(req), req.user.restaurantId, {
        category_id: category_id ? Number(category_id) : undefined,
        available: available === undefined ? undefined : available === 'true',
      })
    );
  })
);

productsRouter.post(
  '/',
  requireManage,
  asyncRoute(async (req, res) => {
    const { category_id, name, price } = req.body;
    if (!category_id || !name || price === undefined) {
      throw new HttpError(400, 'category_id, name, and price are required');
    }
    res.status(201).json(createProduct(businessTypeOf(req), req.user.restaurantId, req.body));
  })
);

productsRouter.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const item = getProduct(businessTypeOf(req), Number(req.params.id), req.user.restaurantId);
    if (!item) throw new HttpError(404, 'Product not found');
    res.json(item);
  })
);

productsRouter.patch(
  '/:id',
  requireManage,
  asyncRoute(async (req, res) => {
    const updated = updateProduct(businessTypeOf(req), Number(req.params.id), req.user.restaurantId, req.body);
    if (!updated) throw new HttpError(404, 'Product not found');
    res.json(updated);
  })
);

productsRouter.patch(
  '/:id/availability',
  requireManage,
  asyncRoute(async (req, res) => {
    const updated = setAvailability(businessTypeOf(req), Number(req.params.id), req.user.restaurantId, Boolean(req.body.is_available));
    if (!updated) throw new HttpError(404, 'Product not found');
    res.json(updated);
  })
);

productsRouter.delete(
  '/:id',
  requireManage,
  asyncRoute(async (req, res) => {
    const deleted = deleteProduct(businessTypeOf(req), Number(req.params.id), req.user.restaurantId);
    if (!deleted) throw new HttpError(404, 'Product not found');
    res.status(204).end();
  })
);
