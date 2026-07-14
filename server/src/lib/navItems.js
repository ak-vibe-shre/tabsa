// Nav tabs an owner can grant to an individual manager/staff account. Orders
// is always available to every role and Settings is always owner-only, so
// neither is configurable.
export const CONFIGURABLE_NAV_KEYS = ['dashboard', 'products', 'inventory'];

export const DEFAULT_NAV_VISIBILITY = {
  manager: ['dashboard', 'products', 'inventory'],
  staff: [],
};

// stored is that specific user's own users.nav_visibility JSON column value
// (a plain array of keys, or null to fall back to their role's default).
export function resolveNavVisibility(role, stored) {
  if (stored == null) return DEFAULT_NAV_VISIBILITY[role] ?? [];
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return DEFAULT_NAV_VISIBILITY[role] ?? [];
    return parsed.filter((key) => CONFIGURABLE_NAV_KEYS.includes(key));
  } catch {
    return DEFAULT_NAV_VISIBILITY[role] ?? [];
  }
}

export function isValidNavKeyArray(value) {
  return Array.isArray(value) && value.every((key) => CONFIGURABLE_NAV_KEYS.includes(key));
}
