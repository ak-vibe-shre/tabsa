import { useState } from 'react';
import { Field, Input } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from '../../lib/AuthContext.jsx';

export function StockItemForm({ initialValues, onSubmit, onCancel, submitLabel = 'Save' }) {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const [form, setForm] = useState({
    name: initialValues?.name ?? '',
    unit: initialValues?.unit ?? 'kg',
    current_stock: initialValues?.current_stock ?? 0,
    low_stock_threshold: initialValues?.low_stock_threshold ?? 0,
    purchase_price: initialValues?.purchase_price ?? '',
  });
  const isEditing = !!initialValues;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      current_stock: Number(form.current_stock),
      low_stock_threshold: Number(form.low_stock_threshold),
      purchase_price: form.purchase_price === '' ? undefined : Number(form.purchase_price),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-grid-full">
          <Field label="Item name">
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} required autoFocus />
          </Field>
        </div>
        <Field label="Unit">
          <Input value={form.unit} onChange={(e) => update('unit', e.target.value)} placeholder="kg, ltr, pcs" required />
        </Field>
        <Field label="Low stock threshold">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.low_stock_threshold}
            onChange={(e) => update('low_stock_threshold', e.target.value)}
            required
          />
        </Field>
        {!isEditing && (
          <Field label="Starting stock">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.current_stock}
              onChange={(e) => update('current_stock', e.target.value)}
              required
            />
          </Field>
        )}
        {isOwner && (
          <Field label="Purchase price per unit (₹, optional)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.purchase_price}
              onChange={(e) => update('purchase_price', e.target.value)}
            />
          </Field>
        )}
      </div>
      <div className="modal-footer" style={{ padding: 0, marginTop: 'var(--space-6)', borderTop: 'none' }}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
