import { useEffect, useState } from 'react';
import { Wallet, Receipt, TrendingUp } from 'lucide-react';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { KpiCard } from '../dashboard/KpiCard.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { formatCurrency } from '../../lib/format.js';
import '../dashboard/dashboard.css';

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

export function ProfitLossPage() {
  const [rangeKey, setRangeKey] = useState('7d');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const range = RANGES.find((r) => r.key === rangeKey);
    const { from, to } = rangeToDates(range.days);
    setLoading(true);
    api
      .get(`/reports/profit-loss?from=${from}&to=${to}`)
      .then(setReport)
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [rangeKey]);

  return (
    <div>
      <div className="dashboard-toolbar">
        <p style={{ color: 'var(--color-text-muted)' }}>Revenue, cost, and gross profit for the selected period.</p>
        <div className="range-picker">
          {RANGES.map((r) => (
            <button key={r.key} className={rangeKey === r.key ? 'active' : ''} onClick={() => setRangeKey(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !report ? (
        <div className="kpi-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="96px" />
          ))}
        </div>
      ) : (
        <div className="kpi-grid">
          <KpiCard icon={<Wallet size={18} />} label="Revenue" value={formatCurrency(report.revenue)} />
          <KpiCard icon={<Receipt size={18} />} label={report.cost_label} value={formatCurrency(report.cost)} />
          <KpiCard icon={<TrendingUp size={18} />} label="Gross profit" value={formatCurrency(report.gross_profit)} />
        </div>
      )}
    </div>
  );
}
