export function formatCurrency(amount) {
  return `₹${Number(amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Indian GST convention for intra-state sales: total tax splits evenly into
// CGST + SGST. SGST absorbs the rounding remainder so the two always sum
// back to the exact tax total shown elsewhere on the bill.
export function splitGst(taxTotal) {
  const total = Number(taxTotal ?? 0);
  const cgst = Math.round((total / 2) * 100) / 100;
  const sgst = Math.round((total - cgst) * 100) / 100;
  return { cgst, sgst };
}

export function formatDateShort(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function formatTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
