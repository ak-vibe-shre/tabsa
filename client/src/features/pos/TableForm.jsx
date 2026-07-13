import { useState } from 'react';
import { Field, Input } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';

export function TableForm({ initialValues, onSubmit, onCancel, submitLabel = 'Save' }) {
  const businessType = useCurrentBusinessType();
  const [form, setForm] = useState({
    label: initialValues?.label ?? '',
    seats: initialValues?.seats ?? 4,
  });

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { label: form.label };
    if (businessType.showSeats) payload.seats = Number(form.seats);
    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-grid-full">
          <Field label={`${businessType.tableNoun.slice(0, -1)} label`}>
            <Input value={form.label} onChange={(e) => update('label', e.target.value)} placeholder="T1" required autoFocus />
          </Field>
        </div>
        {businessType.showSeats && (
          <Field label="Seats">
            <Input type="number" min="1" step="1" value={form.seats} onChange={(e) => update('seats', e.target.value)} required />
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
