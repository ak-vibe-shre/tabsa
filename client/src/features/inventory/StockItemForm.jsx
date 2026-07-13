import { useState } from 'react';
import { Field, Input } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';

export function StockItemForm({ initialValues, onSubmit, onCancel, submitLabel = 'Save' }) {
  const [form, setForm] = useState({
    name: initialValues?.name ?? '',
    unit: initialValues?.unit ?? 'kg',
    current_stock: initialValues?.current_stock ?? 0,
    low_stock_threshold: initialValues?.low_stock_threshold ?? 0,
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
