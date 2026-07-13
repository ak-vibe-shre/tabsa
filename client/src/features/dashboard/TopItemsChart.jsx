import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../components/ui/Card.jsx';
import { formatCurrency } from '../../lib/format.js';
import { CHART_COLORS } from './chartTheme.js';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
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
      <div style={{ fontWeight: 700 }}>{item.name}</div>
      <div style={{ color: 'var(--color-text-muted)' }}>
        {item.quantity} sold · {formatCurrency(item.revenue)}
      </div>
    </div>
  );
}

export function TopItemsChart({ data }) {
  const hasData = data.length > 0;
  const chartHeight = Math.max(180, data.length * 34);

  return (
    <Card>
      <div className="chart-card-title">Top selling items</div>
      {!hasData ? (
        <div className="chart-empty">No sales in this range yet.</div>
      ) : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 12 }}>
            <CartesianGrid horizontal={false} stroke="var(--color-border)" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={84}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-alt)' }} />
            <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} maxBarSize={18}>
              <LabelList
                dataKey="revenue"
                position="right"
                formatter={(v) => formatCurrency(v)}
                style={{ fill: 'var(--color-text)', fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
