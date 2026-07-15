import { Router } from 'express';
import { asyncRoute } from '../../middleware/errorHandler.js';
import { HttpError } from '../../middleware/httpError.js';
import {
  COOKIE_NAME,
  SESSION_DURATION_MS,
  verifyCredentials,
  createSession,
  findSessionWithUser,
  deleteSession,
} from './auth.repository.js';
import { resolveNavVisibility } from '../../lib/navItems.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncRoute(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) throw new HttpError(400, 'username and password are required');

    const user = await verifyCredentials(username, password);
    if (!user) throw new HttpError(401, 'Invalid username or password');

    const { token } = await createSession(user.id);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      maxAge: SESSION_DURATION_MS,
    });
    const session = await findSessionWithUser(token);
    res.json({
      id: session.user_id,
      username: session.username,
      role: session.role,
      restaurantId: session.restaurant_id,
      businessType: session.business_type ?? null,
      nav_visibility: resolveNavVisibility(session.role, session.nav_visibility),
    });
  })
);

authRouter.post(
  '/logout',
  asyncRoute(async (req, res) => {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) await deleteSession(token);
    res.clearCookie(COOKIE_NAME);
    res.status(204).end();
  })
);

authRouter.get(
  '/me',
  asyncRoute(async (req, res) => {
    const session = await findSessionWithUser(req.cookies?.[COOKIE_NAME]);
    if (!session) throw new HttpError(401, 'Not authenticated');
    res.json({
      id: session.user_id,
      username: session.username,
      role: session.role,
      restaurantId: session.restaurant_id,
      businessType: session.business_type ?? null,
      nav_visibility: resolveNavVisibility(session.role, session.nav_visibility),
    });
  })
);
