import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { requireRestaurantRole } from '../../middleware/requireAuth.js';
import { listProducts, getProduct, createProduct, updateProduct, setAvailability, deleteProduct } from './products.repository.js';
import { getBusinessType } from '../../lib/businessTypes.js';
import { stripIfNotOwner } from '../../lib/ownerOnly.js';

export const productsRouter = Router();
const requireManage = requireRestaurantRole('owner', 'manager');

function businessTypeOf(req) {
  if (!req.user.businessType) throw new HttpError(400, 'No business type configured for this restaurant');
  return req.user.businessType;
}

function ownerOnlyKeysFor(businessType) {
  return getBusinessType(businessType).productFields.filter((f) => f.ownerOnly).map((f) => f.key);
}

function sanitizeResponse(req, data) {
  return stripIfNotOwner(data, req.user.role, ownerOnlyKeysFor(businessTypeOf(req)));
}

function sanitizeBody(req) {
  if (req.user.role === 'owner') return req.body;
  const keys = ownerOnlyKeysFor(businessTypeOf(req));
  const body = { ...req.body };
  for (const key of keys) delete body[key];
  return body;
}

productsRouter.get(
  '/',
  asyncRoute(async (req, res) => {
    const { category_id, available } = req.query;
    const items = await listProducts(businessTypeOf(req), req.user.restaurantId, {
      category_id: category_id ? Number(category_id) : undefined,
      available: available === undefined ? undefined : available === 'true',
    });
    res.json(sanitizeResponse(req, items));
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
    const created = await createProduct(businessTypeOf(req), req.user.restaurantId, sanitizeBody(req));
    res.status(201).json(sanitizeResponse(req, created));
  })
);

productsRouter.get(
  '/:id',
  asyncRoute(async (req, res) => {
    const item = await getProduct(businessTypeOf(req), Number(req.params.id), req.user.restaurantId);
    if (!item) throw new HttpError(404, 'Product not found');
    res.json(sanitizeResponse(req, item));
  })
);

productsRouter.patch(
  '/:id',
  requireManage,
  asyncRoute(async (req, res) => {
    const updated = await updateProduct(businessTypeOf(req), Number(req.params.id), req.user.restaurantId, sanitizeBody(req));
    if (!updated) throw new HttpError(404, 'Product not found');
    res.json(sanitizeResponse(req, updated));
  })
);

productsRouter.patch(
  '/:id/availability',
  requireManage,
  asyncRoute(async (req, res) => {
    const updated = await setAvailability(businessTypeOf(req), Number(req.params.id), req.user.restaurantId, Boolean(req.body.is_available));
    if (!updated) throw new HttpError(404, 'Product not found');
    res.json(sanitizeResponse(req, updated));
  })
);

productsRouter.delete(
  '/:id',
  requireManage,
  asyncRoute(async (req, res) => {
    const deleted = await deleteProduct(businessTypeOf(req), Number(req.params.id), req.user.restaurantId);
    if (!deleted) throw new HttpError(404, 'Product not found');
    res.status(204).end();
  })
);
