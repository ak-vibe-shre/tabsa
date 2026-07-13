import { formatCurrency, formatDateShort, formatTime, splitGst } from './format.js';

const PAYMENT_LABEL = { cash: 'Cash', card: 'Card', upi: 'UPI' };

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function printReceipt(order, { business = {}, businessType } = {}) {
  const { cgst, sgst } = splitGst(order.tax_total);
  const tableNoun = businessType?.tableNoun?.slice(0, -1) || 'Table';
  const locationLine = order.table_label ? `${tableNoun}: ${escapeHtml(order.table_label)}` : 'Takeaway';

  const itemRows = order.items
    .map(
      (item) =>
        `<div class="row"><span>${escapeHtml(item.item_name_snapshot)} &times; ${item.quantity}</span><span>${formatCurrency(
          item.unit_price * item.quantity
        )}</span></div>`
    )
    .join('');

  const paymentLine = order.payment_method
    ? `<div class="row"><span>Paid via</span><span>${escapeHtml(PAYMENT_LABEL[order.payment_method] ?? order.payment_method)}</span></div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice #${order.id}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; margin: 0; padding: 16px; display: flex; justify-content: center; }
  .receipt { width: 300px; }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .big { font-size: 15px; }
  .small { font-size: 11px; color: #333; }
  .row { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; }
  .hr { border-top: 1px dashed #000; margin: 8px 0; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <div class="receipt">
    <div class="center bold big">${escapeHtml(business.restaurant_name || 'Store')}</div>
    ${business.restaurant_address ? `<div class="center small">${escapeHtml(business.restaurant_address)}</div>` : ''}
    ${business.restaurant_phone ? `<div class="center small">${escapeHtml(business.restaurant_phone)}</div>` : ''}
    <div class="hr"></div>
    <div class="row"><span>Invoice #${order.id}</span><span>${formatDateShort(order.created_at)}</span></div>
    <div class="row"><span>${locationLine}</span><span>${formatTime(order.created_at)}</span></div>
    <div class="hr"></div>
    ${itemRows}
    <div class="hr"></div>
    <div class="row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
    <div class="row"><span>CGST</span><span>${formatCurrency(cgst)}</span></div>
    <div class="row"><span>SGST</span><span>${formatCurrency(sgst)}</span></div>
    <div class="row bold big"><span>Total</span><span>${formatCurrency(order.grand_total)}</span></div>
    ${paymentLine}
    <div class="hr"></div>
    <div class="center small">Thank you! Visit again.</div>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=380,height=640');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
}
