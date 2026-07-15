// Nav tabs an owner can grant to an individual manager/staff account. Orders
// is always available to every role and Settings is always owner-only, so
// neither is configurable.
export const CONFIGURABLE_NAV_KEYS = ['dashboard', 'products', 'inventory'];

export const DEFAULT_NAV_VISIBILITY = {
  manager: ['dashboard', 'products', 'inventory'],
  staff: [],
};

// stored is that specific user's own users.nav_visibility JSON column value,
// already parsed by Prisma into a plain array of keys, or null to fall back
// to their role's default.
export function resolveNavVisibility(role, stored) {
  if (!Array.isArray(stored)) return DEFAULT_NAV_VISIBILITY[role] ?? [];
  return stored.filter((key) => CONFIGURABLE_NAV_KEYS.includes(key));
}

export function isValidNavKeyArray(value) {
  return Array.isArray(value) && value.every((key) => CONFIGURABLE_NAV_KEYS.includes(key));
}
