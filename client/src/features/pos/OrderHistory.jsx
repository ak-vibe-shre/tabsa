import { useEffect, useState } from 'react';
import { Receipt, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
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

const PAGE_SIZE = 20;

export function OrderHistory() {
  const businessType = useCurrentBusinessType();
  const { settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [detailOrder, setDetailOrder] = useState(null);
  const toast = useToast();
  const { isPending, withPending } = usePendingSet();

  // Any filter change starts back at page 1 — a stale page number past the
  // new result set would otherwise silently show an empty list.
  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateFilter, invoiceSearch]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (dateFilter) params.set('date', dateFilter);
    if (invoiceSearch) params.set('invoice_number', invoiceSearch);
    params.set('page', page);
    params.set('pageSize', PAGE_SIZE);
    api
      .get(`/orders?${params}`)
      .then((res) => {
        setOrders(res.orders);
        setTotal(res.total);
      })
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [statusFilter, dateFilter, invoiceSearch, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
        <Input
          type="text"
          inputMode="numeric"
          value={invoiceSearch}
          onChange={(e) => setInvoiceSearch(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="Search invoice #"
        />
      </div>

      {loading ? (
        <div className="order-history-list">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="56px" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<Receipt size={28} />} title="No orders found" description="Try a different status, date, or invoice number." />
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

          <div className="order-history-pagination">
            <span className="order-history-pagination-summary">
              {total} order{total === 1 ? '' : 's'} · page {page} of {totalPages}
            </span>
            <div className="order-history-pagination-controls">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </>
      )}

      <OrderDetailModal order={detailOrder} open={!!detailOrder} onClose={() => setDetailOrder(null)} />
    </div>
  );
}
