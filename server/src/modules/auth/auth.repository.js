import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import prisma from '../../db/prisma.js';

export const COOKIE_NAME = 'sid';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function verifyCredentials(username, password) {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { restaurant: { select: { subscription_expires_at: true } } },
  });
  if (!user) return null;
  return bcrypt.compareSync(password, user.password_hash) ? user : null;
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.session.create({ data: { token, user_id: userId, expires_at: expiresAt } });
  return { token, expiresAt };
}

export async function findSessionWithUser(token) {
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: { include: { restaurant: { select: { business_type: true, subscription_expires_at: true } } } },
    },
  });
  if (!session) return null;
  if (session.expires_at < new Date()) {
    await deleteSession(token);
    return null;
  }
  return {
    token: session.token,
    expires_at: session.expires_at,
    user_id: session.user.id,
    username: session.user.username,
    role: session.user.role,
    restaurant_id: session.user.restaurant_id,
    nav_visibility: session.user.nav_visibility,
    business_type: session.user.restaurant?.business_type ?? null,
    subscription_expires_at: session.user.restaurant?.subscription_expires_at ?? null,
  };
}

export async function deleteSession(token) {
  await prisma.session.deleteMany({ where: { token } });
}
