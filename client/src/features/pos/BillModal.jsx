import { useState } from 'react';
import { Banknote, CreditCard, Printer, Smartphone } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { formatCurrency, splitGst } from '../../lib/format.js';
import { printReceipt } from '../../lib/printReceipt.js';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';

const METHODS = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'upi', label: 'UPI', icon: Smartphone },
];

export function BillModal({ order, open, onClose, onConfirmPayment }) {
  const [method, setMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const { settings } = useSettings();
  const businessType = useCurrentBusinessType();

  if (!order) return null;

  const { cgst, sgst } = splitGst(order.tax_total);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirmPayment(method);
    } finally {
      setSubmitting(false);
    }
  }

  function handlePrint() {
    printReceipt(order, { business: settings ?? {}, businessType });
  }

  return (
    <Modal open={open} onClose={onClose} title={`Bill · Order #${order.id}`}>
      <div>
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

        <p style={{ fontWeight: 600, marginTop: 'var(--space-5)' }}>Payment method</p>
        <div className="payment-method-grid">
          {METHODS.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.value}
                className={`payment-method-option${method === m.value ? ' active' : ''}`}
                onClick={() => setMethod(m.value)}
              >
                <Icon size={16} /> {m.label}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={handlePrint}>
            <Printer size={16} /> Print
          </Button>
          <Button style={{ flex: 1 }} onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Processing…' : `Mark paid · ${formatCurrency(order.grand_total)}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
