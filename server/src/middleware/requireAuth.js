import { COOKIE_NAME, findSessionWithUser } from '../modules/auth/auth.repository.js';
import { HttpError } from './httpError.js';
import { resolveNavVisibility } from '../lib/navItems.js';

export async function requireAuth(req, res, next) {
  try {
    const session = await findSessionWithUser(req.cookies?.[COOKIE_NAME]);
    if (!session) return next(new HttpError(401, 'Not authenticated'));
    if (session.role !== 'platform_admin' && session.subscription_expires_at && session.subscription_expires_at < new Date()) {
      return next(new HttpError(403, 'Your subscription has expired. Please contact support to renew access.'));
    }
    req.user = {
      id: session.user_id,
      username: session.username,
      role: session.role,
      restaurantId: session.restaurant_id,
      businessType: session.business_type ?? null,
      navVisibility: resolveNavVisibility(session.role, session.nav_visibility),
    };
    next();
  } catch (err) {
    next(err);
  }
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
// access is gated by that individual user's own owner-configurable
// nav_visibility (see lib/navItems.js), not just their role.
export function requireNavAccess(navKey) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Not authenticated'));
    if (req.user.role === 'owner') return next();
    if (req.user.role !== 'manager' && req.user.role !== 'staff') return next(new HttpError(403, 'Forbidden'));
    if (!req.user.navVisibility.includes(navKey)) return next(new HttpError(403, 'Forbidden'));
    next();
  };
}
