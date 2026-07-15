import { useEffect, useState } from 'react';
import { Receipt, Printer } from 'lucide-react';
import { api } from '../../lib/apiClient.js';
import { usePendingSet } from '../../lib/usePendingSet.js';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Select, Input } from '../../components/ui/Field.jsx';
import { OrderDetailModal } from './OrderDetailModal.jsx';
import { formatCurrency, formatTime } from '../../lib/format.js';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { printReceipt } from '../../lib/printReceipt.js';

const STATUS_VARIANT = { open: 'primary', billed: 'warning', paid: 'success', cancelled: 'danger' };

export function OrderHistory() {
  const businessType = useCurrentBusinessType();
  const { settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [detailOrder, setDetailOrder] = useState(null);
  const toast = useToast();
  const { isPending, withPending } = usePendingSet();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (dateFilter) params.set('date', dateFilter);
    api
      .get(`/orders${params.toString() ? `?${params}` : ''}`)
      .then(setOrders)
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [statusFilter, dateFilter]);

  const openDetail = (order) =>
    withPending(`open-${order.id}`, async () => {
      try {
        setDetailOrder(await api.get(`/orders/${order.id}`));
      } catch (err) {
        toast(err.message, 'error');
      }
    })();

  const handleQuickPrint = (order) =>
    withPending(`print-${order.id}`, async () => {
      try {
        const full = await api.get(`/orders/${order.id}`);
        printReceipt(full, { business: settings ?? {}, businessType });
      } catch (err) {
        toast(err.message, 'error');
      }
    })();

  return (
    <div>
      <div className="history-filters">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="billed">Billed</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </div>

      {loading ? (
        <div className="order-history-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="56px" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<Receipt size={28} />} title="No orders found" description="Try a different status or date filter." />
      ) : (
        <>
          <div className="order-history-header-row">
            <span>ID</span>
            <span>{businessType.tableNoun.slice(0, -1)}</span>
            <span>Time</span>
            <span>Items</span>
            <span>Status</span>
            <span>Total</span>
            <span></span>
          </div>
          <div className="order-history-list">
            {orders.map((order) => {
              const opening = isPending(`open-${order.id}`);
              const printing = isPending(`print-${order.id}`);
              return (
                <Card
                  key={order.id}
                  tight
                  interactive
                  className="order-history-row"
                  onClick={() => !opening && openDetail(order)}
                >
                  <span>#{order.id}</span>
                  <span>{order.table_label ?? 'Takeaway'}</span>
                  <span>{formatTime(order.created_at)}</span>
                  <span>{order.item_count} items</span>
                  <span>
                    <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
                  </span>
                  <span className="tabular-nums">{formatCurrency(order.grand_total)}</span>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="btn-icon"
                      loading={printing}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickPrint(order);
                      }}
                      aria-label="Print invoice"
                    >
                      <Printer size={14} />
                    </Button>
                  </span>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <OrderDetailModal order={detailOrder} open={!!detailOrder} onClose={() => setDetailOrder(null)} />
    </div>
  );
}
