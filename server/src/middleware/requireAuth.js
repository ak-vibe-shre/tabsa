import { COOKIE_NAME, findSessionWithUser } from '../modules/auth/auth.repository.js';
import { HttpError } from './httpError.js';

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
