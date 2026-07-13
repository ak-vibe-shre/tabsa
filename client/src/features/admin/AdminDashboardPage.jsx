import { useEffect, useState } from 'react';
import { Building2, Store, Users, Grid3x3, Package, Receipt } from 'lucide-react';
import { api } from '../../lib/apiClient.js';
import { useBusinessTypes } from '../../lib/BusinessTypeContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

const PLAN_NAMES = { starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' };

export function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const { businessTypes } = useBusinessTypes();

  useEffect(() => {
    api.get('/admin/stats').then(setStats);
  }, []);

  function businessTypeLabelFor(key) {
    return businessTypes.find((bt) => bt.key === key)?.label ?? key;
  }

  if (!stats) {
    return (
      <div>
        <div className="admin-page-header">
          <div>
            <h1>Platform overview</h1>
            <p>Usage and growth across every restaurant on Tabsa.</p>
          </div>
        </div>
        <div className="admin-stat-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height="96px" />
          ))}
        </div>
      </div>
    );
  }

  const maxPlanCount = Math.max(1, ...stats.plan_distribution.map((p) => p.count));
  const maxBusinessTypeCount = Math.max(1, ...stats.business_type_distribution.map((b) => b.count));

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Platform overview</h1>
          <p>Usage and growth across every restaurant on Tabsa.</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <Card className="admin-stat-card">
          <span className="admin-stat-label">
            <Building2 size={16} /> Restaurants
          </span>
          <span className="admin-stat-value tabular-nums">{stats.restaurants.total}</span>
          <span className="admin-stat-sub">
            {stats.restaurants.active} active · {stats.restaurants.suspended} suspended
          </span>
        </Card>
        <Card className="admin-stat-card">
          <span className="admin-stat-label">
            <Users size={16} /> Staff users
          </span>
          <span className="admin-stat-value tabular-nums">{stats.staff_count}</span>
          <span className="admin-stat-sub">Owners, managers &amp; staff</span>
        </Card>
        <Card className="admin-stat-card">
          <span className="admin-stat-label">
            <Grid3x3 size={16} /> Tables
          </span>
          <span className="admin-stat-value tabular-nums">{stats.table_count}</span>
          <span className="admin-stat-sub">Across all restaurants</span>
        </Card>
        <Card className="admin-stat-card">
          <span className="admin-stat-label">
            <Package size={16} /> Products
          </span>
          <span className="admin-stat-value tabular-nums">{stats.product_count}</span>
          <span className="admin-stat-sub">Across all restaurants</span>
        </Card>
        <Card className="admin-stat-card">
          <span className="admin-stat-label">
            <Receipt size={16} /> Orders
          </span>
          <span className="admin-stat-value tabular-nums">{stats.order_count}</span>
          <span className="admin-stat-sub">All-time, all restaurants</span>
        </Card>
        <Card className="admin-stat-card">
          <span className="admin-stat-label">
            <Store size={16} /> Plans in use
          </span>
          <span className="admin-stat-value tabular-nums">{stats.plan_distribution.length}</span>
          <span className="admin-stat-sub">Distinct plans active</span>
        </Card>
      </div>

      <Card style={{ marginTop: 'var(--space-6)' }}>
        <div className="admin-section-title">Plan distribution</div>
        <div className="plan-distribution">
          {stats.plan_distribution.map((row) => (
            <div key={row.plan} className="plan-distribution-row">
              <span className="plan-distribution-label">{PLAN_NAMES[row.plan] ?? row.plan}</span>
              <div className="plan-distribution-bar-track">
                <div className="plan-distribution-bar" style={{ width: `${(row.count / maxPlanCount) * 100}%` }} />
              </div>
              <span className="plan-distribution-count tabular-nums">{row.count}</span>
            </div>
          ))}
          {stats.plan_distribution.length === 0 && <p className="admin-empty">No restaurants yet.</p>}
        </div>
      </Card>

      <Card style={{ marginTop: 'var(--space-6)' }}>
        <div className="admin-section-title">Business type distribution</div>
        <div className="plan-distribution">
          {stats.business_type_distribution.map((row) => (
            <div key={row.business_type} className="plan-distribution-row">
              <span className="plan-distribution-label">{businessTypeLabelFor(row.business_type)}</span>
              <div className="plan-distribution-bar-track">
                <div className="plan-distribution-bar" style={{ width: `${(row.count / maxBusinessTypeCount) * 100}%` }} />
              </div>
              <span className="plan-distribution-count tabular-nums">{row.count}</span>
            </div>
          ))}
          {stats.business_type_distribution.length === 0 && <p className="admin-empty">No restaurants yet.</p>}
        </div>
      </Card>
    </div>
  );
}
