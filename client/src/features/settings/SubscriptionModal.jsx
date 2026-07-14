import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { api } from '../../lib/apiClient.js';

// Read-only: plan changes are made by platform_admin only (see
// AdminRestaurantsPage), so this just lets an owner compare plans.
export function SubscriptionModal({ open, onClose, currentPlan }) {
  const [plans, setPlans] = useState(null);

  useEffect(() => {
    if (open && plans === null) {
      api.get('/plans').then(setPlans);
    }
  }, [open, plans]);

  return (
    <Modal open={open} onClose={onClose} title="Plans" wide>
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
            {currentPlan === plan.key && <Badge>Current plan</Badge>}
          </div>
        ))}
      </div>
    </Modal>
  );
}
