import { formatCurrency, formatTime, splitGst } from './format.js';

const PAYMENT_LABEL = { cash: 'Cash', card: 'Card', upi: 'UPI' };

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatFullDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function printInvoiceA4(order, { business = {}, businessType } = {}) {
  const { cgst, sgst } = splitGst(order.tax_total);
  const tableNoun = businessType?.tableNoun?.slice(0, -1) || 'Table';
  const locationLine = order.table_label ? `${tableNoun}: ${escapeHtml(order.table_label)}` : 'Takeaway';
  const hasCustomer = Boolean(order.customer_name || order.customer_phone);

  const itemRows = order.items
    .map(
      (item, i) => `
      <tr>
        <td class="idx">${i + 1}</td>
        <td>${escapeHtml(item.item_name_snapshot)}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatCurrency(item.unit_price)}</td>
        <td class="num">${formatCurrency(item.unit_price * item.quantity)}</td>
      </tr>`
    )
    .join('');

  const customerBlock = hasCustomer
    ? `
    <div class="bill-to">
      <div class="section-label">Bill To</div>
      ${order.customer_name ? `<div>${escapeHtml(order.customer_name)}</div>` : ''}
      ${order.customer_phone ? `<div>${escapeHtml(order.customer_phone)}</div>` : ''}
    </div>`
    : '';

  const paymentLine = order.payment_method
    ? `<div class="meta-row"><span>Payment method</span><span>${escapeHtml(PAYMENT_LABEL[order.payment_method] ?? order.payment_method)}</span></div>
       <div class="meta-row"><span>Paid at</span><span>${formatTime(order.paid_at)}</span></div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice #${order.id}</title>
<style>
  * { box-sizing: border-box; }
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; margin: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 20px; }
  .business-name { font-size: 20px; font-weight: 700; }
  .business-meta { font-size: 12px; color: #555; margin-top: 4px; }
  .invoice-title { font-size: 22px; font-weight: 700; text-align: right; letter-spacing: 1px; }
  .invoice-meta { text-align: right; font-size: 12px; color: #555; margin-top: 6px; }
  .bill-to { margin-bottom: 20px; }
  .section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 4px; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  table.items th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.03em; color: #888; border-bottom: 1px solid #ccc; padding: 6px 8px; }
  table.items td { padding: 8px; border-bottom: 1px solid #eee; }
  table.items .idx { width: 28px; color: #999; }
  table.items .num { text-align: right; white-space: nowrap; }
  .totals { margin-left: auto; width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 4px 8px; }
  .totals-row.grand { font-weight: 700; font-size: 16px; border-top: 2px solid #1a1a1a; margin-top: 4px; padding-top: 8px; }
  .meta-row { display: flex; justify-content: space-between; padding: 3px 8px; font-size: 12px; color: #555; }
  .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="business-name">${escapeHtml(business.restaurant_name || 'Store')}</div>
      ${business.restaurant_address ? `<div class="business-meta">${escapeHtml(business.restaurant_address)}</div>` : ''}
      ${business.restaurant_phone ? `<div class="business-meta">${escapeHtml(business.restaurant_phone)}</div>` : ''}
    </div>
    <div>
      <div class="invoice-title">TAX INVOICE</div>
      <div class="invoice-meta">
        Invoice #${order.id}<br />
        ${formatFullDate(order.created_at)}<br />
        ${locationLine}
      </div>
    </div>
  </div>

  ${customerBlock}

  <table class="items">
    <thead>
      <tr>
        <th class="idx">#</th>
        <th>Item</th>
        <th class="num">Qty</th>
        <th class="num">Rate</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(order.subtotal)}</span></div>
    <div class="totals-row"><span>CGST</span><span>${formatCurrency(cgst)}</span></div>
    <div class="totals-row"><span>SGST</span><span>${formatCurrency(sgst)}</span></div>
    <div class="totals-row grand"><span>Total</span><span>${formatCurrency(order.grand_total)}</span></div>
  </div>

  ${paymentLine}

  <div class="footer">This is a computer-generated invoice.</div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=1000');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
}
