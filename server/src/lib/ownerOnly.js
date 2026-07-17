// Removes the given keys from an object (or every object in an array) when
// the requesting user isn't an owner — used to keep cost/purchase-price
// fields out of API responses for managers/staff without touching the
// repository layer, which stays role-agnostic like the rest of the app.
export function stripIfNotOwner(data, role, keys) {
  if (role === 'owner' || data == null) return data;
  const strip = (row) => {
    const copy = { ...row };
    for (const key of keys) delete copy[key];
    return copy;
  };
  return Array.isArray(data) ? data.map(strip) : strip(data);
}
