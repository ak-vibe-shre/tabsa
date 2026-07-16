import { Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { TableIcon } from './TableIcon.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';

const STATUS_META = {
  available: { label: 'Available', badge: 'success' },
  occupied: { label: 'Occupied', badge: 'primary' },
  billed: { label: 'Bill ready', badge: 'warning' },
  locked: { label: 'Locked', badge: 'neutral' },
};

export function TableGrid({ tables, onSelect, onLock, onRelease, onOpenRequests, isPending }) {
  const businessType = useCurrentBusinessType();
  return (
    <div className="table-grid">
      {tables.map((table) => {
        const isLocked = table.status === 'locked';
        const isAvailable = table.status === 'available';
        const meta = STATUS_META[table.status];
        const pending = isPending?.(table.id);
        return (
          <Card
            key={table.id}
            interactive
            className={`table-card table-card-${table.status}${pending ? ' table-card-pending' : ''}`}
            onClick={() => !pending && (isLocked ? onRelease(table) : onSelect(table))}
          >
            {pending && (
              <div className="table-card-overlay">
                <Spinner size="md" />
              </div>
            )}
            {table.pending_request_count > 0 && (
              <button
                className="table-card-pending-badge"
                title={`${table.pending_request_count} customer request${table.pending_request_count === 1 ? '' : 's'} waiting`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenRequests(table);
                }}
              >
                {table.pending_request_count}
              </button>
            )}
            {isAvailable && (
              <button
                className="table-lock-btn"
                title="Lock table"
                disabled={pending}
                onClick={(e) => {
                  e.stopPropagation();
                  onLock(table);
                }}
              >
                <Lock size={13} />
              </button>
            )}
            <div className={`table-card-icon table-card-icon-${table.status}`}>
              <TableIcon seats={table.seats} showSeats={businessType.showSeats} />
            </div>
            <div className="table-card-label">{table.label}</div>
            {isLocked ? (
              <div className="table-card-seats table-card-lock-note">{table.lock_note || 'Locked'}</div>
            ) : (
              businessType.showSeats && <div className="table-card-seats-count">{table.seats}-seater</div>
            )}
            <Badge variant={meta.badge}>{meta.label}</Badge>
            {isLocked && <div className="table-card-hint">Tap to release</div>}
          </Card>
        );
      })}
    </div>
  );
}
