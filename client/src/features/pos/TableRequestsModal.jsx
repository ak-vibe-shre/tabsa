import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { api } from '../../lib/apiClient.js';
import { usePendingSet } from '../../lib/usePendingSet.js';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { formatCurrency } from '../../lib/format.js';

export function TableRequestsModal({ table, open, onClose, onResolved }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { isPending, withPending } = usePendingSet();

  useEffect(() => {
    if (!open || !table) return;
    setLoading(true);
    api
      .get(`/tables/${table.id}/requests`)
      .then(setRequests)
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [open, table]);

  const handleApprove = (request) =>
    withPending(`approve-${request.id}`, async () => {
      try {
        await api.post(`/tables/${table.id}/requests/${request.id}/approve`);
        setRequests((prev) => prev.filter((r) => r.id !== request.id));
        toast('Added to order', 'success');
        onResolved?.();
      } catch (err) {
        toast(err.message, 'error');
      }
    })();

  const handleReject = (request) =>
    withPending(`reject-${request.id}`, async () => {
      try {
        await api.post(`/tables/${table.id}/requests/${request.id}/reject`);
        setRequests((prev) => prev.filter((r) => r.id !== request.id));
        toast('Request declined', 'success');
        onResolved?.();
      } catch (err) {
        toast(err.message, 'error');
      }
    })();

  return (
    <Modal open={open} onClose={onClose} title={table ? `${table.label} · Customer requests` : 'Customer requests'}>
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
      ) : requests.length === 0 ? (
        <EmptyState title="No pending requests" description="Nothing to approve for this table right now." />
      ) : (
        <div className="table-requests-list">
          {requests.map((request) => {
            const approving = isPending(`approve-${request.id}`);
            const rejecting = isPending(`reject-${request.id}`);
            return (
              <div key={request.id} className="table-requests-row">
                <div className="table-requests-row-info">
                  <div className="table-requests-row-name">
                    {request.item_name_snapshot} × {request.quantity}
                  </div>
                  <div className="table-requests-row-meta">
                    <span className="tabular-nums">{formatCurrency(request.unit_price * request.quantity)}</span>
                    {request.notes && <span> · {request.notes}</span>}
                  </div>
                </div>
                <div className="table-requests-row-actions">
                  <Button
                    variant="danger"
                    size="sm"
                    className="btn-icon"
                    onClick={() => handleReject(request)}
                    loading={rejecting}
                    disabled={approving}
                    aria-label="Reject"
                  >
                    <X size={14} />
                  </Button>
                  <Button
                    size="sm"
                    className="btn-icon"
                    onClick={() => handleApprove(request)}
                    loading={approving}
                    disabled={rejecting}
                    aria-label="Approve"
                  >
                    <Check size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
