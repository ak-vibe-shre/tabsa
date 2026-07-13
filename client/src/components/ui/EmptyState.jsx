import { UtensilsCrossed } from 'lucide-react';

export function EmptyState({ icon = <UtensilsCrossed size={28} />, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
