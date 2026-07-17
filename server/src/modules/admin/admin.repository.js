import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import prisma from '../../db/prisma.js';
import { allProductDelegates, delegateForTable } from '../../db/productDelegates.js';
import { getBusinessType } from '../../lib/businessTypes.js';

function generatePassword() {
  return crypto.randomBytes(6).toString('hex');
}

const BILLING_CYCLE_MONTHS = { monthly: 1, half_yearly: 6, yearly: 12 };

function computeExpiry(cycle) {
  const months = BILLING_CYCLE_MONTHS[cycle];
  if (!months) return null;
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
}

export async function listRestaurants() {
  const restaurants = await prisma.restaurant.findMany({
    include: { users: { where: { role: 'owner' }, take: 1 } },
    orderBy: { created_at: 'desc' },
  });
  const plans = await prisma.plan.findMany({ select: { key: true, table_limit: true } });
  const tableLimitByPlan = Object.fromEntries(plans.map((p) => [p.key, p.table_limit]));

  return Promise.all(
    restaurants.map(async (r) => {
      const { table } = getBusinessType(r.business_type);
      const [product_count, table_count, order_count] = await Promise.all([
        delegateForTable(table).count({ where: { restaurant_id: r.id } }),
        prisma.diningTable.count({ where: { restaurant_id: r.id } }),
        prisma.order.count({ where: { restaurant_id: r.id } }),
      ]);
      return {
        id: r.id,
        name: r.name,
        status: r.status,
        subscription_plan: r.subscription_plan,
        business_type: r.business_type,
        billing_cycle: r.billing_cycle,
        subscription_expires_at: r.subscription_expires_at,
        created_at: r.created_at,
        owner_username: r.users[0]?.username ?? null,
        product_count,
        table_count,
        order_count,
        table_limit: tableLimitByPlan[r.subscription_plan] ?? null,
      };
    })
  );
}

export async function createRestaurantWithOwner({ name, username, business_type, billing_cycle }) {
  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) throw new Error('That username is already taken');

  const password = generatePassword();
  const passwordHash = bcrypt.hashSync(password, 10);

  const restaurant = await prisma.restaurant.create({
    data: {
      name,
      business_type,
      billing_cycle: billing_cycle ?? null,
      subscription_expires_at: billing_cycle ? computeExpiry(billing_cycle) : null,
    },
  });
  await prisma.user.create({
    data: { restaurant_id: restaurant.id, username, password_hash: passwordHash, role: 'owner' },
  });

  return { id: restaurant.id, name, username, password };
}

export async function getPlatformStats() {
  const [total, active, suspended, staff_count, table_count, order_count, planDistribution, businessTypeDistribution] =
    await Promise.all([
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { status: 'active' } }),
      prisma.restaurant.count({ where: { status: 'suspended' } }),
      prisma.user.count({ where: { restaurant_id: { not: null } } }),
      prisma.diningTable.count(),
      prisma.order.count(),
      prisma.restaurant.groupBy({ by: ['subscription_plan'], _count: { _all: true } }),
      prisma.restaurant.groupBy({ by: ['business_type'], _count: { _all: true } }),
    ]);

  const productCounts = await Promise.all(allProductDelegates().map((d) => d.count()));
  const product_count = productCounts.reduce((sum, c) => sum + c, 0);

  return {
    restaurants: { total, active, suspended },
    staff_count,
    table_count,
    product_count,
    order_count,
    plan_distribution: planDistribution.map((p) => ({ plan: p.subscription_plan, count: p._count._all })),
    business_type_distribution: businessTypeDistribution.map((b) => ({
      business_type: b.business_type,
      count: b._count._all,
    })),
  };
}

export async function updateRestaurant(id, { status, subscription_plan, business_type, billing_cycle }) {
  const current = await prisma.restaurant.findUnique({ where: { id } });
  if (!current) return null;
  const data = {
    status: status ?? current.status,
    subscription_plan: subscription_plan ?? current.subscription_plan,
    business_type: business_type ?? current.business_type,
  };
  // Renewing/changing the cycle always restarts the clock from now; setting
  // it to null explicitly clears the expiry (unlimited access). Omitting the
  // field entirely leaves whatever cycle/expiry the restaurant already has.
  if (billing_cycle !== undefined) {
    data.billing_cycle = billing_cycle;
    data.subscription_expires_at = billing_cycle ? computeExpiry(billing_cycle) : null;
  }
  return prisma.restaurant.update({ where: { id }, data });
}
