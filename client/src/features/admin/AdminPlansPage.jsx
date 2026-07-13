import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input, Textarea } from '../../components/ui/Field.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

function planToForm(plan) {
  return {
    name: plan.name,
    price_label: plan.price_label,
    table_limit: plan.table_limit ?? '',
    features: plan.features.join('\n'),
  };
}

function PlanEditCard({ plan, onSave }) {
  const [form, setForm] = useState(planToForm(plan));
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(plan.key, {
        name: form.name,
        price_label: form.price_label,
        table_limit: form.table_limit === '' ? null : Number(form.table_limit),
        features: form.features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-grid-full">
            <Field label="Plan name">
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </Field>
          </div>
          <Field label="Price label">
            <Input value={form.price_label} onChange={(e) => update('price_label', e.target.value)} required />
          </Field>
          <Field label="Table limit (blank = unlimited)">
            <Input
              type="number"
              min="1"
              step="1"
              value={form.table_limit}
              onChange={(e) => update('table_limit', e.target.value)}
              placeholder="Unlimited"
            />
          </Field>
          <div className="form-grid-full">
            <Field label="Features (one per line)">
              <Textarea rows={5} value={form.features} onChange={(e) => update('features', e.target.value)} />
            </Field>
          </div>
        </div>
        <div className="modal-footer" style={{ padding: 0, marginTop: 'var(--space-5)', borderTop: 'none', justifyContent: 'flex-start' }}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save plan'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AdminPlansPage() {
  const [plans, setPlans] = useState(null);
  const toast = useToast();

  function reload() {
    api.get('/plans').then(setPlans);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleSave(key, payload) {
    try {
      const updated = await api.patch(`/plans/${key}`, payload);
      setPlans((prev) => prev.map((p) => (p.key === key ? updated : p)));
      toast(`${updated.name} plan updated`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Plans</h1>
          <p>Edit pricing, table limits, and features for each subscription plan.</p>
        </div>
      </div>

      {!plans ? (
        <div className="admin-plans-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="280px" />
          ))}
        </div>
      ) : (
        <div className="admin-plans-grid">
          {plans.map((plan) => (
            <PlanEditCard key={plan.key} plan={plan} onSave={handleSave} />
          ))}
        </div>
      )}
    </div>
  );
}
