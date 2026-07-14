import { useEffect, useState } from 'react';
import { useToast } from '../../components/ui/ToastContext.jsx';
import { useSettings } from '../../lib/SettingsContext.jsx';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input, Switch } from '../../components/ui/Field.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { SubscriptionModal } from './SubscriptionModal.jsx';
import { StaffSection } from './StaffSection.jsx';
import { NavVisibilitySection } from './NavVisibilitySection.jsx';
import { TOGGLEABLE_MODULES } from '../../lib/modules.js';
import './settings.css';

const PLAN_NAMES = { starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' };

export function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const businessType = useCurrentBusinessType();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (settings && profile === null) {
      setProfile({
        restaurant_name: settings.restaurant_name ?? '',
        restaurant_address: settings.restaurant_address ?? '',
        restaurant_phone: settings.restaurant_phone ?? '',
      });
    }
  }, [settings, profile]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(profile);
      toast('Business profile saved', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleModule(key) {
    const current = settings.enabled_modules ?? [];
    const next = current.includes(key) ? current.filter((m) => m !== key) : [...current, key];
    try {
      await updateSettings({ enabled_modules: next });
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (!settings || !profile) {
    return (
      <div className="settings-grid">
        <Skeleton height="220px" />
        <Skeleton height="220px" />
      </div>
    );
  }

  return (
    <div>
      <div className="settings-grid">
        <Card>
          <div className="settings-section-title">Business profile</div>
          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Field label="Business name">
                <Input
                  value={profile.restaurant_name}
                  onChange={(e) => setProfile((p) => ({ ...p, restaurant_name: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Address">
                <Input
                  value={profile.restaurant_address}
                  onChange={(e) => setProfile((p) => ({ ...p, restaurant_address: e.target.value }))}
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={profile.restaurant_phone}
                  onChange={(e) => setProfile((p) => ({ ...p, restaurant_phone: e.target.value }))}
                />
              </Field>
              <Button type="submit" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                {saving ? 'Saving…' : 'Save profile'}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="settings-section-title">Modules</div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
            Choose which modules appear in the sidebar for this business.
          </p>
          {TOGGLEABLE_MODULES.map((mod) => (
            <div key={mod.key} className="module-toggle-row">
              <div>
                <div className="module-toggle-label">{mod.label}</div>
                <div className="module-toggle-desc">{mod.description}</div>
              </div>
              <Switch checked={(settings.enabled_modules ?? []).includes(mod.key)} onChange={() => handleToggleModule(mod.key)} />
            </div>
          ))}
        </Card>
      </div>

      <Card style={{ marginTop: 'var(--space-5)' }}>
        <div className="settings-section-title">Subscription</div>
        <div className="current-plan-row">
          <span>
            Current plan: <strong>{PLAN_NAMES[settings.subscription_plan] ?? 'Starter'}</strong>
          </span>
          <Button variant="secondary" onClick={() => setSubscriptionOpen(true)}>
            View plans
          </Button>
        </div>
        <div className="current-plan-row" style={{ marginTop: 'var(--space-3)' }}>
          <span>
            {businessType.tableNoun} used:{' '}
            <strong>
              {settings.table_count} / {settings.table_limit ?? 'Unlimited'}
            </strong>
          </span>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}>
          Plan changes are made by your platform administrator.
        </p>
      </Card>

      <SubscriptionModal open={subscriptionOpen} onClose={() => setSubscriptionOpen(false)} currentPlan={settings.subscription_plan} />

      <NavVisibilitySection />

      <StaffSection />
    </div>
  );
}
