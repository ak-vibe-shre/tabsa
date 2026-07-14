import { COOKIE_NAME, findSessionWithUser } from '../modules/auth/auth.repository.js';
import { HttpError } from './httpError.js';
import db from '../db/client.js';
import { resolveNavVisibility } from '../lib/navItems.js';

export function requireAuth(req, res, next) {
  const session = findSessionWithUser(req.cookies?.[COOKIE_NAME]);
  if (!session) return next(new HttpError(401, 'Not authenticated'));
  req.user = {
    id: session.user_id,
    username: session.username,
    role: session.role,
    restaurantId: session.restaurant_id,
    businessType: session.business_type ?? null,
  };
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return next(new HttpError(403, 'Forbidden'));
    next();
  };
}

export function requireRestaurantRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new HttpError(403, 'Forbidden'));
    next();
  };
}

// Like requireRestaurantRole('owner', 'manager', 'staff'), but manager/staff
// access is gated by the restaurant's owner-configurable nav_visibility
// (see lib/navItems.js) instead of being unconditional.
export function requireNavAccess(navKey) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Not authenticated'));
    if (req.user.role === 'owner') return next();
    if (req.user.role !== 'manager' && req.user.role !== 'staff') return next(new HttpError(403, 'Forbidden'));

    const row = db.prepare('SELECT nav_visibility FROM restaurants WHERE id = ?').get(req.user.restaurantId);
    const visibility = resolveNavVisibility(row?.nav_visibility);
    if (!(visibility[req.user.role] ?? []).includes(navKey)) return next(new HttpError(403, 'Forbidden'));
    next();
  };
}
