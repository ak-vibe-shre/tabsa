import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../components/ui/Card.jsx';
import { formatCurrency } from '../../lib/format.js';
import { CHART_COLORS } from './chartTheme.js';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 12px',
        boxShadow: 'var(--shadow-md)',
        fontSize: 'var(--text-sm)',
      }}
    >
      <div style={{ color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{formatCurrency(payload[0].value)}</div>
    </div>
  );
}

export function SalesTrendChart({ data }) {
  const hasData = data.some((d) => d.revenue > 0);

  return (
    <Card>
      <div className="chart-card-title">Sales trend</div>
      {!hasData ? (
        <div className="chart-empty">Not enough data yet for this range.</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.28} />
                <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              fill="url(#salesFill)"
              dot={{ r: 3, fill: CHART_COLORS.primary, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
