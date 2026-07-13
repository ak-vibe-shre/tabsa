import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { api } from '../../lib/apiClient.js';

export function SubscriptionModal({ open, onClose, currentPlan, onSelectPlan }) {
  const [plans, setPlans] = useState(null);
  const [submittingKey, setSubmittingKey] = useState(null);

  useEffect(() => {
    if (open && plans === null) {
      api.get('/plans').then(setPlans);
    }
  }, [open, plans]);

  async function handleSelect(key) {
    setSubmittingKey(key);
    try {
      await onSelectPlan(key);
    } finally {
      setSubmittingKey(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Choose a plan" wide>
      <div className="plan-grid">
        {(plans ?? []).map((plan) => (
          <div key={plan.key} className={`plan-card${plan.key === 'growth' ? ' highlight' : ''}${currentPlan === plan.key ? ' current' : ''}`}>
            {plan.key === 'growth' && <div className="plan-badge">Most popular</div>}
            <div className="plan-name">{plan.name}</div>
            <div className="plan-price">{plan.price_label}</div>
            <ul className="plan-features">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Button
              variant={currentPlan === plan.key ? 'secondary' : 'primary'}
              style={{ width: '100%' }}
              disabled={currentPlan === plan.key || submittingKey === plan.key}
              onClick={() => handleSelect(plan.key)}
            >
              {currentPlan === plan.key ? 'Current plan' : submittingKey === plan.key ? 'Switching…' : 'Select plan'}
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
