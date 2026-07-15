import { Printer, FileText } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { formatCurrency, formatDateShort, formatTime, splitGst } from '../../lib/format.js';
import { printReceipt } from '../../lib/printReceipt.js';
import { printInvoiceA4 } from '../../lib/printInvoiceA4.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';

const STATUS_VARIANT = { open: 'primary', billed: 'warning', paid: 'success', cancelled: 'danger' };
const PAYMENT_LABEL = { cash: 'Cash', card: 'Card', upi: 'UPI' };

export function OrderDetailModal({ order, open, onClose }) {
  const { settings } = useSettings();
  const businessType = useCurrentBusinessType();

  if (!order) return null;

  const { cgst, sgst } = splitGst(order.tax_total);

  function handlePrint() {
    printReceipt(order, { business: settings ?? {}, businessType });
  }

  function handlePrintA4() {
    printInvoiceA4(order, { business: settings ?? {}, businessType });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Order #${order.id}`}
      footer={
        <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%' }}>
          <Button variant="secondary" onClick={handlePrint} style={{ flex: 1 }}>
            <Printer size={16} /> Print
          </Button>
          <Button variant="secondary" onClick={handlePrintA4} style={{ flex: 1 }}>
            <FileText size={16} /> Print A4
          </Button>
        </div>
      }
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <Badge variant={STATUS_VARIANT[order.status]}>{order.status}</Badge>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {order.table_label ?? 'Takeaway'} · {formatDateShort(order.created_at)}{' '}
            {formatTime(order.created_at)}
          </span>
        </div>

        {order.items.map((item) => (
          <div className="receipt-line" key={item.id}>
            <span>
              {item.item_name_snapshot} × {item.quantity}
            </span>
            <span className="tabular-nums">{formatCurrency(item.unit_price * item.quantity)}</span>
          </div>
        ))}

        <div className="order-totals">
          <div className="order-total-row">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="order-total-row">
            <span>CGST</span>
            <span className="tabular-nums">{formatCurrency(cgst)}</span>
          </div>
          <div className="order-total-row">
            <span>SGST</span>
            <span className="tabular-nums">{formatCurrency(sgst)}</span>
          </div>
          <div className="order-total-row grand">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(order.grand_total)}</span>
          </div>
        </div>

        {(order.customer_name || order.customer_phone) && (
          <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
            {[order.customer_name, order.customer_phone].filter(Boolean).join(' · ')}
          </p>
        )}
        {order.payment_method && (
          <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
            Paid via {PAYMENT_LABEL[order.payment_method] ?? order.payment_method} at {formatTime(order.paid_at)}
          </p>
        )}
        {order.status === 'cancelled' && (
          <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
            Cancelled at {formatTime(order.cancelled_at)}
          </p>
        )}
      </div>
    </Modal>
  );
}
