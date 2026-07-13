import { Pencil, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { FoodTypeDot } from '../../components/ui/Badge.jsx';
import { Switch } from '../../components/ui/Field.jsx';
import { ProductImage } from './ProductImage.jsx';
import { formatCurrency } from '../../lib/format.js';
import { useCurrentBusinessType } from '../../lib/BusinessTypeContext.jsx';

export function ProductCard({ item, onEdit, onDelete, onToggleAvailability }) {
  const businessType = useCurrentBusinessType();
  const isRestaurant = businessType.key === 'restaurant';

  return (
    <Card tight className="product-card" style={{ opacity: item.is_available ? 1 : 0.55 }}>
      <ProductImage imageUrl={item.image_url} foodType={isRestaurant ? item.food_type : null} alt={item.name} />
      <div className="product-card-top">
        <div className="product-name">
          {isRestaurant && <FoodTypeDot foodType={item.food_type} />}
          {item.name}
        </div>
        <Switch checked={!!item.is_available} onChange={() => onToggleAvailability(item)} label="Available" />
      </div>
      <p className="product-description">{item.description || ''}</p>
      <div className="product-price-row">
        <span className="product-price tabular-nums">{formatCurrency(item.price)}</span>
        <span className="product-tax">{item.tax_percent}% tax</span>
      </div>
      <div className="product-actions">
        <span className="product-tax">{item.is_available ? 'Available' : 'Unavailable'}</span>
        <div className="product-actions-buttons">
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(item)} aria-label="Edit">
            <Pencil size={14} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDelete(item)} aria-label="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Card>
  );
}
