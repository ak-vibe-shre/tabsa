import { useState } from 'react';
import { Salad, Drumstick, Egg, Package } from 'lucide-react';

const FOOD_ICON = { veg: Salad, non_veg: Drumstick, egg: Egg };

export function ProductImage({ imageUrl, foodType, alt }) {
  const [errored, setErrored] = useState(false);

  if (imageUrl && !errored) {
    return (
      <div className="product-image-wrap">
        <img className="product-image" src={imageUrl} alt={alt} onError={() => setErrored(true)} />
      </div>
    );
  }

  const Icon = foodType ? FOOD_ICON[foodType] ?? Package : Package;
  const variant = foodType ?? 'default';

  return (
    <div className="product-image-wrap">
      <div className={`product-image-placeholder product-image-placeholder-${variant}`}>
        <Icon size={28} strokeWidth={1.75} />
      </div>
    </div>
  );
}
