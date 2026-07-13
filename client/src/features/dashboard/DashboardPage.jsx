import { useEffect, useState } from 'react';
import { Wallet, Receipt, TrendingUp, PackageX } from 'lucide-react';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { KpiCard } from './KpiCard.jsx';
import { SalesTrendChart } from './SalesTrendChart.jsx';
import { TopItemsChart } from './TopItemsChart.jsx';
import { CategoryRevenueChart } from './CategoryRevenueChart.jsx';
import { LowStockBanner } from '../inventory/LowStockBanner.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { formatCurrency } from '../../lib/format.js';
import './dashboard.css';

const RANGES = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
];

function rangeToDates(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const iso = (d) => d.toISOString().slice(0, 10);
  return { from: iso(from), to: iso(to) };
}

export function DashboardPage() {
  const [rangeKey, setRangeKey] = useState('7d');
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const range = RANGES.find((r) => r.key === rangeKey);
    const { from, to } = rangeToDates(range.days);
    setLoading(true);

    Promise.all([
      api.get(`/reports/summary?from=${from}&to=${to}`),
      api.get(`/reports/sales-trend?from=${from}&to=${to}`),
      api.get(`/reports/top-items?from=${from}&to=${to}&limit=8`),
      api.get(`/reports/category-revenue?from=${from}&to=${to}`),
      api.get('/inventory?low_stock=true'),
    ])
      .then(([summaryData, trendData, topItemsData, categoryData, lowStock]) => {
        setSummary(summaryData);
        setTopItems(topItemsData);
        setCategoryRevenue(categoryData);
        setLowStockCount(lowStock.length);

        const byDay = new Map(trendData.map((d) => [d.day, d.revenue]));
        const days = [];
        const cursor = new Date(from);
        const end = new Date(to);
        while (cursor <= end) {
          const key = cursor.toISOString().slice(0, 10);
          days.push({
            label: cursor.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            revenue: byDay.get(key) ?? 0,
          });
          cursor.setDate(cursor.getDate() + 1);
        }
        setTrend(days);
      })
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [rangeKey]);

  return (
    <div>
      <div className="dashboard-toolbar">
        <p style={{ color: 'var(--color-text-muted)' }}>Overview of sales and stock health.</p>
        <div className="range-picker">
          {RANGES.map((r) => (
            <button key={r.key} className={rangeKey === r.key ? 'active' : ''} onClick={() => setRangeKey(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <LowStockBanner count={lowStockCount} />

      {loading || !summary ? (
        <div className="kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="96px" />
          ))}
        </div>
      ) : (
        <div className="kpi-grid">
          <KpiCard icon={<Wallet size={18} />} label="Revenue" value={formatCurrency(summary.revenue)} />
          <KpiCard icon={<Receipt size={18} />} label="Orders" value={summary.orders_count} />
          <KpiCard icon={<TrendingUp size={18} />} label="Avg order value" value={formatCurrency(summary.avg_order_value)} />
          <KpiCard icon={<PackageX size={18} />} label="Low stock items" value={lowStockCount} />
        </div>
      )}

      {!loading && (
        <>
          <SalesTrendChart data={trend} />
          <div className="chart-grid">
            <TopItemsChart data={topItems} />
            <CategoryRevenueChart data={categoryRevenue} />
          </div>
        </>
      )}
    </div>
  );
}
