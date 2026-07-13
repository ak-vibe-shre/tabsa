import { Card } from '../../components/ui/Card.jsx';

export function KpiCard({ icon, label, value }) {
  return (
    <Card className="kpi-card">
      <span className="kpi-card-label">
        <span>{icon}</span> {label}
      </span>
      <span className="kpi-card-value tabular-nums">{value}</span>
    </Card>
  );
}
