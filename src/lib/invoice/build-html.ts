import type { InvoiceData } from './types';
import { escHtml, fmtCurrency, fmtDateLong, fmtDateShort, modeLabel } from './format';

/** Full-page printable invoice (Razorpay-style layout for print / dashboard download). */
export function buildInvoiceHtml(data: InvoiceData): string {
  const loc =
    data.location.name && data.location.city
      ? `${data.location.name}, ${data.location.city}`
      : data.location.name || modeLabel(data.appointment.mode);
  const paid = data.appointment.paymentStatus === 'paid';
  const summary = `${data.service.name} with Dr. ${data.service.doctor}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Invoice ${escHtml(data.invoiceNumber)} | H2H Healthcare</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#172b4d;background:#f4f6f8;line-height:1.5;-webkit-font-smoothing:antialiased}
.shell{max-width:720px;margin:32px auto;padding:0 16px 40px}
.card{background:#fff;border:1px solid #e3e8ee;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.top{padding:28px 32px 20px;display:flex;justify-content:space-between;align-items:flex-start;gap:24px;border-bottom:1px solid #eef2f6}
.biz-name{font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.02em}
.biz-tag{font-size:12px;color:#64748b;margin-top:4px}
.powered{text-align:right}
.powered .label{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8}
.powered .sub{font-size:11px;color:#64748b;margin-top:4px}
.meta{padding:24px 32px 8px;display:grid;grid-template-columns:1fr 1fr;gap:32px}
.field-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#528ff0;margin-bottom:8px}
.invoice-num{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px}
.summary{font-size:13px;color:#64748b;margin-bottom:20px;line-height:1.5}
.bill-name{font-size:15px;font-weight:700;color:#0f172a;margin-bottom:6px}
.bill-meta{font-size:12px;color:#64748b;line-height:1.6}
.date-val{font-size:13px;font-weight:600;color:#0f172a}
.appt-meta{font-size:12px;color:#475569;line-height:1.6;margin-top:4px}
.table-wrap{padding:16px 32px 8px}
table.items{width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:4px;overflow:hidden}
table.items thead th{background:#f8fafc;padding:11px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0}
table.items thead th:nth-child(2),table.items thead th:nth-child(3){text-align:center;width:72px}
table.items thead th:last-child{text-align:right;width:120px}
table.items tbody td{padding:16px 14px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9;vertical-align:top}
table.items tbody td strong{display:block;color:#0f172a;font-size:14px;font-weight:600;margin-bottom:4px}
table.items tbody td .sub{font-size:12px;color:#64748b}
table.items tbody td:nth-child(2),table.items tbody td:nth-child(3){text-align:center}
table.items tbody td:last-child{text-align:right;font-weight:700;color:#0f172a;font-size:15px}
.totals{padding:12px 32px 24px;display:flex;justify-content:flex-end}
.totals-box{min-width:260px}
.t-row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#64748b}
.t-row span:last-child{font-weight:600;color:#334155}
.t-grand{border-top:2px solid #528ff0;margin-top:10px;padding-top:12px}
.t-grand span:first-child{font-size:14px;font-weight:700;color:#0f172a}
.t-grand span:last-child{font-size:22px;font-weight:800;color:#528ff0}
.pay{padding:0 32px 24px}
.pay-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.pay-cell{background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:12px 14px}
.pay-cell .pl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:6px}
.pay-cell .pv{font-size:12px;font-weight:600;color:#0f172a}
.badge-paid{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;background:#dcfce7;color:#166534}
.badge-pending{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:700;background:#fef9c3;color:#854d0e}
.notes{padding:0 32px 20px}
.notes-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:14px;font-size:12px;color:#475569}
.foot{padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center}
.foot .fn{font-size:12px;font-weight:600;color:#475569;margin-bottom:6px}
.foot p{font-size:11px;color:#94a3b8;line-height:1.7}
.toolbar{max-width:720px;margin:0 auto 12px;display:flex;justify-content:flex-end;gap:8px;padding:0 16px}
.toolbar button{font-family:inherit;padding:8px 18px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid #e2e8f0;background:#fff;color:#334155}
.toolbar button.primary{background:#528ff0;color:#fff;border-color:#528ff0}
@media print{
  body{background:#fff}
  .shell{margin:0;padding:0;max-width:none}
  .toolbar{display:none}
  .card{border:none;box-shadow:none}
}
</style>
</head>
<body>
<div class="toolbar">
  <button type="button" onclick="window.print()">Print / Save as PDF</button>
  <button type="button" class="primary" onclick="window.print()">Download</button>
</div>
<div class="shell">
  <div class="card">
    <div class="top">
      <div>
        <div class="biz-name">${escHtml(data.company.name)}</div>
        <div class="biz-tag">Healthcare &amp; Physiotherapy Services</div>
      </div>
      <div class="powered">
        <div class="label">Tax Invoice</div>
        <div class="sub">Invoicing powered by H2H Healthcare</div>
      </div>
    </div>
    <div class="meta">
      <div>
        <div class="field-label">Invoice #</div>
        <div class="invoice-num">${escHtml(data.invoiceNumber)}</div>
        <div class="summary">${escHtml(summary)}</div>
        <div class="field-label">Bill To</div>
        <div class="bill-name">${escHtml(data.patient.name)}</div>
        <div class="bill-meta">
          ${data.patient.phone ? escHtml(data.patient.phone) + '<br/>' : ''}
          ${data.patient.email ? escHtml(data.patient.email) : ''}
        </div>
      </div>
      <div>
        <div class="field-label">Issue Date</div>
        <div class="date-val">${fmtDateShort(data.invoiceDate)}</div>
        <div style="height:20px"></div>
        <div class="field-label">Appointment</div>
        <div class="date-val">${fmtDateLong(data.appointment.date)}</div>
        <div class="appt-meta">${escHtml(data.appointment.time)}<br/>${escHtml(loc)}</div>
      </div>
    </div>
    <div class="table-wrap">
      <table class="items">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${escHtml(data.service.name)}</strong>
              <div class="sub">Dr. ${escHtml(data.service.doctor)} · ${data.service.duration} mins · ${escHtml(modeLabel(data.appointment.mode))}</div>
            </td>
            <td>1</td>
            <td>${fmtCurrency(data.billing.subtotal)}</td>
            <td>${fmtCurrency(data.billing.subtotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="totals">
      <div class="totals-box">
        <div class="t-row"><span>Subtotal</span><span>${fmtCurrency(data.billing.subtotal)}</span></div>
        <div class="t-row"><span>GST (included)</span><span>${fmtCurrency(data.billing.gst)}</span></div>
        <div class="t-row t-grand"><span>Total Amount</span><span>${fmtCurrency(data.billing.total)}</span></div>
      </div>
    </div>
    <div class="pay">
      <div class="pay-grid">
        <div class="pay-cell">
          <div class="pl">Payment Status</div>
          <div class="pv"><span class="${paid ? 'badge-paid' : 'badge-pending'}">${paid ? 'Paid' : 'Pending'}</span></div>
        </div>
        <div class="pay-cell">
          <div class="pl">Payment Method</div>
          <div class="pv">${escHtml(data.billing.paymentMethod)}</div>
        </div>
        <div class="pay-cell">
          <div class="pl">Transaction ID</div>
          <div class="pv" style="font-family:ui-monospace,Consolas,monospace;font-size:11px;word-break:break-all">${data.billing.transactionId ? escHtml(data.billing.transactionId) : '—'}</div>
        </div>
      </div>
    </div>
    ${data.notes ? `<div class="notes"><div class="field-label" style="margin-bottom:8px">Notes</div><div class="notes-box">${escHtml(data.notes)}</div></div>` : ''}
    <div class="foot">
      <div class="fn">${escHtml(data.company.name)}</div>
      <p>${escHtml(data.company.address)}<br/>GSTIN: ${escHtml(data.company.gstin)} · ${escHtml(data.company.phone)} · ${escHtml(data.company.email)}<br/>${escHtml(data.company.website)}</p>
    </div>
  </div>
</div>
</body>
</html>`;
}
