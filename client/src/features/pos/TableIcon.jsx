import { Store } from 'lucide-react';

export function TableIcon({ size = 30, seats = 4, showSeats = true }) {
  if (!showSeats) {
    return <Store size={size} strokeWidth={1.75} />;
  }

  const chairCount = Math.min(Math.max(Math.round(seats), 2), 8);
  const radius = 18;
  const chairSize = 8;
  const chairs = Array.from({ length: chairCount }, (_, i) => {
    const angle = (i / chairCount) * 2 * Math.PI - Math.PI / 2;
    const cx = 24 + radius * Math.cos(angle);
    const cy = 24 + radius * Math.sin(angle);
    return (
      <rect
        key={i}
        x={cx - chairSize / 2}
        y={cy - chairSize / 2}
        width={chairSize}
        height={chairSize}
        rx="2.5"
        fill="currentColor"
        opacity="0.45"
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {chairs}
      <circle cx="24" cy="24" r="12.5" fill="currentColor" />
    </svg>
  );
}
