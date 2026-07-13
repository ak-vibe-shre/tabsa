import { AlertTriangle } from 'lucide-react';

export function LowStockBanner({ count }) {
  if (count === 0) return null;
  return (
    <div className="low-stock-banner">
      <AlertTriangle size={16} /> {count} item{count > 1 ? 's' : ''} running low on stock — restock soon.
    </div>
  );
}
