export const BUSINESS_TYPES = {
  restaurant: {
    key: 'restaurant',
    label: 'Restaurant',
    table: 'products_restaurant',
    productNoun: { singular: 'Menu Item', plural: 'Menu' },
    orderNoun: 'Orders',
    tableNoun: 'Tables',
    showSeats: true,
    productFields: [{ key: 'food_type', label: 'Food Type', type: 'select', options: ['veg', 'non_veg', 'egg'] }],
  },
  toy_store: {
    key: 'toy_store',
    label: 'Toy Store',
    table: 'products_toy_store',
    productNoun: { singular: 'Toy', plural: 'Toys' },
    orderNoun: 'Sales',
    tableNoun: 'Counters',
    showSeats: false,
    productFields: [
      { key: 'age_range', label: 'Age Range', type: 'text' },
      { key: 'safety_certified', label: 'Safety Certified', type: 'boolean' },
    ],
  },
  electronics_store: {
    key: 'electronics_store',
    label: 'Electronics Store',
    table: 'products_electronics',
    productNoun: { singular: 'Product', plural: 'Products' },
    orderNoun: 'Sales',
    tableNoun: 'Counters',
    showSeats: false,
    productFields: [
      { key: 'serial_number', label: 'Serial Number', type: 'text' },
      { key: 'warranty_months', label: 'Warranty (months)', type: 'number' },
      { key: 'brand', label: 'Brand', type: 'text' },
    ],
  },
  general_retail: {
    key: 'general_retail',
    label: 'General Retail',
    table: 'products_general_retail',
    productNoun: { singular: 'Item', plural: 'Items' },
    orderNoun: 'Sales',
    tableNoun: 'Counters',
    showSeats: false,
    productFields: [{ key: 'brand', label: 'Brand', type: 'text' }],
  },
};

export const BUSINESS_TYPE_KEYS = Object.keys(BUSINESS_TYPES);

export function getBusinessType(key) {
  const businessType = BUSINESS_TYPES[key];
  if (!businessType) throw new Error(`Unknown business type: ${key}`);
  return businessType;
}

export function listBusinessTypes() {
  return Object.values(BUSINESS_TYPES).map(({ table, ...publicFields }) => publicFields);
}
