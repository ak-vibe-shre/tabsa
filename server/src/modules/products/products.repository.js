import prisma from '../../db/prisma.js';
import { getBusinessType } from '../../lib/businessTypes.js';
import { delegateForTable } from '../../db/productDelegates.js';

const CORE_FIELDS = ['category_id', 'name', 'description', 'price', 'tax_percent', 'image_url'];

function delegateFor(businessType, client) {
  const { table } = getBusinessType(businessType);
  return delegateForTable(table, client);
}

export async function listProducts(businessType, restaurantId, { category_id, available } = {}, client = prisma) {
  const delegate = delegateFor(businessType, client);
  return delegate.findMany({
    where: {
      restaurant_id: restaurantId,
      ...(category_id ? { category_id } : {}),
      ...(available !== undefined ? { is_available: available } : {}),
    },
    orderBy: { name: 'asc' },
  });
}

export async function getProduct(businessType, id, restaurantId, client = prisma) {
  const delegate = delegateFor(businessType, client);
  return delegate.findFirst({ where: { id, restaurant_id: restaurantId } });
}

export async function createProduct(businessType, restaurantId, data, client = prisma) {
  const delegate = delegateFor(businessType, client);
  const { productFields } = getBusinessType(businessType);
  const verticalKeys = productFields.map((f) => f.key);
  const fields = [...CORE_FIELDS, ...verticalKeys];
  const values = {};
  for (const field of fields) {
    if (field === 'tax_percent') values[field] = data.tax_percent ?? 5;
    else if (field === 'safety_certified') values[field] = Boolean(data.safety_certified);
    else values[field] = data[field] ?? null;
  }
  return delegate.create({ data: { restaurant_id: restaurantId, ...values } });
}

export async function updateProduct(businessType, id, restaurantId, data, client = prisma) {
  const delegate = delegateFor(businessType, client);
  const current = await getProduct(businessType, id, restaurantId, client);
  if (!current) return null;
  const { productFields } = getBusinessType(businessType);
  const verticalKeys = productFields.map((f) => f.key);
  const editableFields = [...CORE_FIELDS, 'is_available', ...verticalKeys];
  const values = {};
  for (const field of editableFields) {
    if (field === 'safety_certified' && data.safety_certified !== undefined) values[field] = Boolean(data.safety_certified);
    else if (field === 'is_available' && data.is_available !== undefined) values[field] = Boolean(data.is_available);
    else values[field] = data[field] ?? current[field];
  }
  return delegate.update({ where: { id }, data: values });
}

export async function setAvailability(businessType, id, restaurantId, isAvailable, client = prisma) {
  const delegate = delegateFor(businessType, client);
  const current = await getProduct(businessType, id, restaurantId, client);
  if (!current) return null;
  return delegate.update({ where: { id }, data: { is_available: isAvailable } });
}

export async function deleteProduct(businessType, id, restaurantId, client = prisma) {
  const delegate = delegateFor(businessType, client);
  const { count } = await delegate.deleteMany({ where: { id, restaurant_id: restaurantId } });
  return count > 0;
}
