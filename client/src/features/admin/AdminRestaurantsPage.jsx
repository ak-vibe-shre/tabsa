import { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { useBusinessTypes } from '../../lib/BusinessTypeContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Field, Input, Select } from '../../components/ui/Field.jsx';

export function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState(null);
  const [planOptions, setPlanOptions] = useState([]);
  const { businessTypes } = useBusinessTypes();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [businessTypeKey, setBusinessTypeKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const showToast = useToast();

  function reload() {
    api.get('/admin/restaurants').then(setRestaurants);
  }

  useEffect(() => {
    reload();
    api.get('/plans').then((plans) => setPlanOptions(plans.map((p) => ({ value: p.key, label: p.name }))));
  }, []);

  useEffect(() => {
    if (!businessTypeKey && businessTypes.length > 0) setBusinessTypeKey(businessTypes[0].key);
  }, [businessTypes, businessTypeKey]);

  function businessTypeLabelFor(key) {
    return businessTypes.find((bt) => bt.key === key)?.label ?? key;
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.post('/admin/restaurants', { name, username, business_type: businessTypeKey });
      setCreatedCredentials(created);
      setName('');
      setUsername('');
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(restaurant) {
    const nextStatus = restaurant.status === 'active' ? 'suspended' : 'active';
    await api.patch(`/admin/restaurants/${restaurant.id}`, { status: nextStatus });
    showToast(`${restaurant.name} is now ${nextStatus}`, 'success');
    reload();
  }

  async function handlePlanChange(restaurant, plan) {
    if (plan === restaurant.subscription_plan) return;
    try {
      await api.patch(`/admin/restaurants/${restaurant.id}`, { subscription_plan: plan });
      showToast(`${restaurant.name} moved to ${plan}`, 'success');
      reload();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function closeModal() {
    setModalOpen(false);
    setCreatedCredentials(null);
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Restaurants</h1>
          <p>Every restaurant account on the platform.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ New restaurant</Button>
      </div>

      <Card>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Restaurant</th>
              <th>Business type</th>
              <th>Owner login</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Tables</th>
              <th>Products</th>
              <th>Orders</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(restaurants ?? []).map((r) => {
              const atLimit = r.table_limit != null && r.table_count >= r.table_limit;
              return (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>
                    <Badge variant="neutral">{businessTypeLabelFor(r.business_type)}</Badge>
                  </td>
                  <td>{r.owner_username ?? '—'}</td>
                  <td className="admin-table-plan-cell">
                    <Select value={r.subscription_plan} onChange={(e) => handlePlanChange(r, e.target.value)}>
                      {planOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td>
                    <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge>
                  </td>
                  <td>
                    <span className={atLimit ? 'admin-table-usage at-limit' : 'admin-table-usage'}>
                      {r.table_count} / {r.table_limit ?? '∞'}
                    </span>
                  </td>
                  <td>{r.product_count}</td>
                  <td>{r.order_count}</td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(r)}>
                      {r.status === 'active' ? 'Suspend' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {restaurants && restaurants.length === 0 && <p className="admin-empty">No restaurants yet.</p>}
      </Card>

      <Modal open={modalOpen} onClose={closeModal} title="New restaurant">
        {createdCredentials ? (
          <div className="admin-credentials">
            <p>
              <strong>{createdCredentials.name}</strong> was created. Share these login details with the owner — the
              password is shown only once.
            </p>
            <div className="admin-credentials-box">
              <div>
                Username: <code>{createdCredentials.username}</code>
              </div>
              <div>
                Password: <code>{createdCredentials.password}</code>
              </div>
            </div>
            <Button onClick={closeModal}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="admin-create-form">
            <Field label="Restaurant name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="Business type">
              <Select value={businessTypeKey} onChange={(e) => setBusinessTypeKey(e.target.value)} required>
                {businessTypes.map((bt) => (
                  <option key={bt.key} value={bt.key}>
                    {bt.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Owner username">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </Field>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create restaurant'}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
