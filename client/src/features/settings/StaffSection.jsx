import { useEffect, useState } from 'react';
import { Users, Trash2 } from 'lucide-react';
import { api } from '../../lib/apiClient.js';
import { usePendingSet } from '../../lib/usePendingSet.js';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Select, Switch } from '../../components/ui/Field.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { StaffForm } from './StaffForm.jsx';

const ROLE_BADGE = { manager: 'primary', staff: 'neutral' };

export function StaffSection() {
  const [staff, setStaff] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const toast = useToast();
  const businessType = useCurrentBusinessType();
  const { isPending, withPending } = usePendingSet();

  const NAV_TOGGLES = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'products', label: businessType.productNoun.plural },
    { key: 'inventory', label: 'Inventory' },
  ];

  function reload() {
    api.get('/staff').then(setStaff).catch((err) => toast(err.message, 'error'));
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleAdd(payload) {
    try {
      const created = await api.post('/staff', payload);
      setCreatedCredentials(created);
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const handleRoleChange = (member, role) =>
    withPending(`role-${member.id}`, async () => {
      if (role === member.role) return;
      try {
        const updated = await api.patch(`/staff/${member.id}`, { role });
        setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        toast(`${member.username} is now ${role}`, 'success');
      } catch (err) {
        toast(err.message, 'error');
      }
    })();

  const handleToggleNav = (member, key) =>
    withPending(`nav-${member.id}-${key}`, async () => {
      const current = member.nav_visibility ?? [];
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      try {
        const updated = await api.patch(`/staff/${member.id}`, { nav_visibility: next });
        setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } catch (err) {
        toast(err.message, 'error');
      }
    })();

  async function handleDelete(member) {
    if (!confirm(`Remove staff account "${member.username}"?`)) return;
    await withPending(`del-${member.id}`, async () => {
      try {
        await api.del(`/staff/${member.id}`);
        setStaff((prev) => prev.filter((s) => s.id !== member.id));
        toast('Staff account removed', 'success');
      } catch (err) {
        toast(err.message, 'error');
      }
    })();
  }

  function closeModal() {
    setFormOpen(false);
    setCreatedCredentials(null);
  }

  return (
    <Card style={{ marginTop: 'var(--space-5)' }}>
      <div className="settings-section-title-row">
        <div className="settings-section-title" style={{ marginBottom: 0 }}>
          Staff
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          + Add staff
        </Button>
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', margin: 'var(--space-2) 0 var(--space-4)' }}>
        Settings is always owner-only and Orders is always visible. Toggle what each person can see below — it's set
        per person, not by their role.
      </p>

      {staff === null ? null : staff.length === 0 ? (
        <EmptyState icon={<Users size={28} />} title="No staff accounts yet" description="Add a manager or staff account to get started." />
      ) : (
        <div className="staff-list">
          {staff.map((member) => (
            <Card key={member.id} tight className="staff-card">
              <div className="staff-row">
                <span className="staff-row-name">{member.username}</span>
                <Select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member, e.target.value)}
                  disabled={isPending(`role-${member.id}`)}
                >
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </Select>
                <Badge variant={ROLE_BADGE[member.role] ?? 'neutral'}>{member.role}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="btn-icon"
                  onClick={() => handleDelete(member)}
                  loading={isPending(`del-${member.id}`)}
                  aria-label="Remove"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
              <div className="staff-permissions-row">
                {NAV_TOGGLES.map((item) => (
                  <label key={item.key} className="staff-permission-toggle">
                    <Switch
                      checked={(member.nav_visibility ?? []).includes(item.key)}
                      onChange={() => handleToggleNav(member, item.key)}
                      loading={isPending(`nav-${member.id}-${item.key}`)}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={closeModal} title={createdCredentials ? 'Staff account created' : 'Add staff'}>
        {createdCredentials ? (
          <div className="admin-credentials">
            <p>
              <strong>{createdCredentials.username}</strong> was added as {createdCredentials.role}. Share these login
              details — the password is shown only once.
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
          <StaffForm onSubmit={handleAdd} onCancel={closeModal} />
        )}
      </Modal>
    </Card>
  );
}
