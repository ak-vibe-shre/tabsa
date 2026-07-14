// Nav tabs an owner can grant to manager/staff. Orders is always available to
// every role and Settings is always owner-only, so neither is configurable.
export const CONFIGURABLE_NAV_KEYS = ['dashboard', 'products', 'inventory'];

export const DEFAULT_NAV_VISIBILITY = {
  manager: ['dashboard', 'products', 'inventory'],
  staff: [],
};

export function resolveNavVisibility(stored) {
  const parsed = (() => {
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  })();

  return {
    manager: parsed.manager ?? DEFAULT_NAV_VISIBILITY.manager,
    staff: parsed.staff ?? DEFAULT_NAV_VISIBILITY.staff,
  };
}
