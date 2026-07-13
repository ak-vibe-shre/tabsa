import { useState } from 'react';
import { Field, Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { formatDateShort, formatTime } from '../../lib/format.js';

const TYPE_LABELS = {
  stock_in: 'Stock in',
  stock_out: 'Stock out',
  adjustment: 'Set exact quantity',
};

export function StockTransactionModal({ item, transactions, onSubmit, onCancel }) {
  const [type, setType] = useState('stock_in');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (quantity === '' || Number(quantity) < 0) return;
    onSubmit({ type, quantity: Number(quantity), note: note || undefined });
    setQuantity('');
    setNote('');
  }

  return (
    <div>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
        Current stock: <strong className="tabular-nums">{item.current_stock}</strong> {item.unit}
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <Field label="Transaction type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={type === 'adjustment' ? `New quantity (${item.unit})` : `Quantity (${item.unit})`}>
            <Input type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </Field>
          <div className="form-grid-full">
            <Field label="Note (optional)">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. weekly supplier delivery" />
            </Field>
          </div>
        </div>
        <div className="modal-footer" style={{ padding: 0, marginTop: 'var(--space-5)', borderTop: 'none' }}>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Close
          </Button>
          <Button type="submit">Record transaction</Button>
        </div>
      </form>

      {transactions.length > 0 && (
        <div className="tx-history">
          {transactions.map((tx) => (
            <div key={tx.id} className="tx-row">
              <span>
                {TYPE_LABELS[tx.type]} · {tx.quantity} {item.unit}
                {tx.note ? ` — ${tx.note}` : ''}
              </span>
              <span style={{ color: 'var(--color-text-faint)' }}>
                {formatDateShort(tx.created_at)} {formatTime(tx.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
