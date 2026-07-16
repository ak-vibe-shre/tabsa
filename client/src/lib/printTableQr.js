import QRCode from 'qrcode';

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export async function printTableQr(table, { restaurantName } = {}) {
  const url = `${window.location.origin}/order/${table.qr_token}`;
  const dataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>QR - ${escapeHtml(table.label)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 32px; display: flex; justify-content: center; }
  .card { width: 320px; text-align: center; }
  .restaurant { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
  .table-label { font-size: 28px; font-weight: 700; margin: 12px 0; }
  img { width: 100%; height: auto; }
  .hint { font-size: 13px; color: #555; margin-top: 12px; }
  .url { font-size: 11px; color: #999; margin-top: 8px; word-break: break-all; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
  <div class="card">
    <div class="restaurant">${escapeHtml(restaurantName || '')}</div>
    <div class="table-label">${escapeHtml(table.label)}</div>
    <img src="${dataUrl}" alt="QR code" />
    <div class="hint">Scan to view the menu and order</div>
    <div class="url">${escapeHtml(url)}</div>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=420,height=560');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 300);
}
