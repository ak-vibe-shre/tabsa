const SIZES = { sm: 14, md: 20, lg: 28 };

export function Spinner({ size = 'sm' }) {
  const px = SIZES[size] ?? SIZES.sm;
  return <span className="spinner" style={{ width: px, height: px }} aria-hidden="true" />;
}
