import bcrypt from 'bcrypt';
import prisma from './prisma.js';

const DEFAULT_PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price_label: '₹999/month',
    table_limit: 8,
    features: ['1 outlet', 'Up to 8 tables', 'Menu & Orders / Billing', 'Email support'],
    sort_order: 1,
  },
  {
    key: 'growth',
    name: 'Growth',
    price_label: '₹2,499/month',
    table_limit: 20,
    features: [
      'Everything in Starter',
      'Inventory management',
      'Dashboard & analytics',
      'Up to 20 tables',
      'Priority support',
    ],
    sort_order: 2,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price_label: 'Custom pricing',
    table_limit: null,
    features: ['Multi-outlet ready', 'Unlimited tables', 'Dedicated account manager', 'Custom integrations'],
    sort_order: 3,
  },
];

async function ensurePlans() {
  for (const plan of DEFAULT_PLANS) {
    const existing = await prisma.plan.findUnique({ where: { key: plan.key } });
    if (existing) continue;
    await prisma.plan.create({ data: plan });
  }
}

async function ensurePlatformAdmin() {
  const existing = await prisma.user.findFirst({ where: { role: 'platform_admin' } });
  if (existing) return;
  const passwordHash = bcrypt.hashSync('admin1234', 10);
  await prisma.user.create({
    data: { username: 'admin', password_hash: passwordHash, role: 'platform_admin' },
  });
}

export async function bootstrap() {
  await ensurePlans();
  await ensurePlatformAdmin();
}

await bootstrap();
