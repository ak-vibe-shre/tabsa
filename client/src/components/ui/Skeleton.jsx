export function Skeleton({ width = '100%', height = '16px', style = {} }) {
  return <div className="skeleton" style={{ width, height, ...style }} />;
}
