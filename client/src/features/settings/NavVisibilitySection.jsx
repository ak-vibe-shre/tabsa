import { useSettings } from '../../lib/SettingsContext.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Switch } from '../../components/ui/Field.jsx';

export function NavVisibilitySection() {
  const { settings, updateSettings } = useSettings();
  const businessType = useCurrentBusinessType();
  const toast = useToast();

  if (!settings) return null;

  const visibility = settings.nav_visibility ?? { manager: [], staff: [] };
  const items = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'products', label: businessType.productNoun.plural },
    { key: 'inventory', label: 'Inventory' },
  ];

  async function toggle(role, key) {
    const current = visibility[role] ?? [];
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    try {
      await updateSettings({ nav_visibility: { ...visibility, [role]: next } });
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <Card style={{ marginTop: 'var(--space-5)' }}>
      <div className="settings-section-title">Staff &amp; manager access</div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
        Choose which tabs managers and staff can see. Orders is always available to everyone; Settings is always owner-only.
      </p>
      <div className="nav-visibility-header">
        <span>Manager</span>
        <span>Staff</span>
      </div>
      {items.map((item) => (
        <div key={item.key} className="nav-visibility-row">
          <div className="module-toggle-label">{item.label}</div>
          <Switch checked={(visibility.manager ?? []).includes(item.key)} onChange={() => toggle('manager', item.key)} />
          <Switch checked={(visibility.staff ?? []).includes(item.key)} onChange={() => toggle('staff', item.key)} />
        </div>
      ))}
    </Card>
  );
}
