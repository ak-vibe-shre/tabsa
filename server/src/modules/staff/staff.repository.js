import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import prisma from '../../db/prisma.js';
import { resolveNavVisibility } from '../../lib/navItems.js';

export const STAFF_ROLES = ['manager', 'staff'];

function generatePassword() {
  return crypto.randomBytes(6).toString('hex');
}

function present(row) {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    nav_visibility: resolveNavVisibility(row.role, row.nav_visibility),
    created_at: row.created_at,
  };
}

export async function listStaff(restaurantId) {
  const rows = await prisma.user.findMany({
    where: { restaurant_id: restaurantId, role: { not: 'owner' } },
    orderBy: { created_at: 'asc' },
  });
  return rows.map(present);
}

export async function createStaff(restaurantId, { username, role, nav_visibility }) {
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) throw new Error('That username is already taken');

  const password = generatePassword();
  const passwordHash = bcrypt.hashSync(password, 10);
  const created = await prisma.user.create({
    data: {
      restaurant_id: restaurantId,
      username,
      password_hash: passwordHash,
      role,
      nav_visibility: nav_visibility !== undefined ? nav_visibility : undefined,
    },
  });

  return { ...present(created), password };
}

export async function updateStaff(id, restaurantId, { role, nav_visibility }) {
  const current = await prisma.user.findFirst({ where: { id, restaurant_id: restaurantId, role: { not: 'owner' } } });
  if (!current) return null;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      role: role ?? current.role,
      nav_visibility: nav_visibility !== undefined ? nav_visibility : current.nav_visibility,
    },
  });

  return present(updated);
}

export async function deleteStaff(id, restaurantId) {
  const { count } = await prisma.user.deleteMany({ where: { id, restaurant_id: restaurantId, role: { not: 'owner' } } });
  return count > 0;
}
