import { useCallback, useState } from 'react';

// Tracks a set of in-flight action keys so lists/grids can show a per-row (or
// per-toggle) loading state without each caller re-deriving its own Set logic.
export function usePendingSet() {
  const [pending, setPending] = useState(() => new Set());

  const isPending = useCallback((key) => pending.has(key), [pending]);

  const withPending = useCallback((key, fn) => {
    return async (...args) => {
      setPending((prev) => new Set(prev).add(key));
      try {
        return await fn(...args);
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    };
  }, []);

  return { isPending, withPending };
}
