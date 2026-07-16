import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import { findTableByToken, createTableOrderRequest, listRecentRequestsForTable } from '../tables/tableRequests.repository.js';
import { listCategories } from '../categories/categories.repository.js';
import { listProducts, getProduct } from '../products/products.repository.js';

export const publicRouter = Router();

async function loadTableOrThrow(token) {
  const table = await findTableByToken(token);
  if (!table) throw new HttpError(404, 'Table not found');
  return table;
}

publicRouter.get(
  '/tables/:token',
  asyncRoute(async (req, res) => {
    const table = await loadTableOrThrow(req.params.token);
    const { restaurant } = table;

    if (restaurant.status === 'suspended') {
      return res.json({
        restaurant_name: restaurant.name,
        table_label: table.label,
        table_status: table.status,
        restaurant_suspended: true,
        categories: [],
        products: [],
      });
    }

    const [categories, products] = await Promise.all([
      listCategories(restaurant.id),
      listProducts(restaurant.business_type, restaurant.id, { available: true }),
    ]);

    res.json({
      restaurant_name: restaurant.name,
      business_type: restaurant.business_type,
      table_label: table.label,
      table_status: table.status,
      restaurant_suspended: false,
      categories,
      products,
    });
  })
);

publicRouter.post(
  '/tables/:token/requests',
  asyncRoute(async (req, res) => {
    const table = await loadTableOrThrow(req.params.token);
    const { restaurant } = table;
    if (restaurant.status === 'suspended') throw new HttpError(400, 'This restaurant is not currently accepting orders');
    if (table.status === 'locked') throw new HttpError(400, 'This table is currently locked; please ask staff');

    const { product_id, quantity, notes } = req.body;
    if (!product_id || !quantity || Number(quantity) < 1) {
      throw new HttpError(400, 'product_id and a positive quantity are required');
    }

    const product = await getProduct(restaurant.business_type, Number(product_id), restaurant.id);
    if (!product || !product.is_available) throw new HttpError(404, 'Product not found or unavailable');

    const request = await createTableOrderRequest(restaurant.id, table.id, {
      product_id: product.id,
      item_name_snapshot: product.name,
      unit_price: product.price,
      tax_percent: product.tax_percent,
      quantity: Number(quantity),
      notes,
    });

    res.status(201).json(request);
  })
);

publicRouter.get(
  '/tables/:token/requests',
  asyncRoute(async (req, res) => {
    const table = await loadTableOrThrow(req.params.token);
    res.json(await listRecentRequestsForTable(table.id));
  })
);
