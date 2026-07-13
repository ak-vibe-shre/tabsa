export function Badge({ variant = 'neutral', children, className = '' }) {
  return <span className={['badge', `badge-${variant}`, className].filter(Boolean).join(' ')}>{children}</span>;
}

export function FoodTypeDot({ foodType }) {
  return <span className={`badge-dot badge-dot-${foodType}`} title={foodType.replace('_', ' ')} />;
}
