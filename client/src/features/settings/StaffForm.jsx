import { useState } from 'react';
import { Field, Input, Select } from '../../components/ui/Field.jsx';
import { Button } from '../../components/ui/Button.jsx';

export function StaffForm({ onSubmit, onCancel }) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('staff');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ username, role });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-grid-full">
          <Field label="Username">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          </Field>
        </div>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </Select>
        </Field>
      </div>
      <div className="modal-footer" style={{ padding: 0, marginTop: 'var(--space-6)', borderTop: 'none' }}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add staff'}
        </Button>
      </div>
    </form>
  );
}
