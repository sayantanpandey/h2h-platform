import type { InvoiceData } from './types';
import { escHtml, fmtCurrency, fmtDateShort, modeLabel } from './format';

/** Email-safe inline invoice block (Razorpay-style, table layout for Gmail/Outlook). */
export function buildInvoiceEmailSection(data: InvoiceData): string {
  const loc =
    data.location.name && data.location.city
      ? `${data.location.name}, ${data.location.city}`
      : data.location.name || modeLabel(data.appointment.mode);
  const paid = data.appointment.paymentStatus === 'paid';
  const txn = data.billing.transactionId
    ? escHtml(data.billing.transactionId)
    : '—';

  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#ffffff;">
  <tr>
    <td style="padding:20px 24px 16px;border-bottom:1px solid #eef2f6;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="vertical-align:top;">
            <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;letter-spacing:-0.02em;">
              ${escHtml(data.company.name)}
            </p>
            <p style="margin:0;font-size:11px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              Healthcare &amp; Physiotherapy Services
            </p>
          </td>
          <td align="right" style="vertical-align:top;">
            <p style="margin:0 0 2px;font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Tax Invoice</p>
            <p style="margin:0;font-size:11px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Powered by H2H Healthcare</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:16px 24px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td width="50%" style="vertical-align:top;padding-right:12px;">
            <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#528ff0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Invoice #</p>
            <p style="margin:0 0 14px;font-size:15px;font-weight:700;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escHtml(data.invoiceNumber)}</p>
            <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#528ff0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Bill To</p>
            <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escHtml(data.patient.name)}</p>
            <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              ${data.patient.phone ? escHtml(data.patient.phone) + '<br/>' : ''}
              ${data.patient.email ? escHtml(data.patient.email) : ''}
            </p>
          </td>
          <td width="50%" style="vertical-align:top;padding-left:12px;border-left:1px solid #f1f5f9;">
            <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#528ff0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Issue Date</p>
            <p style="margin:0 0 14px;font-size:13px;font-weight:600;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${fmtDateShort(data.invoiceDate)}</p>
            <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#528ff0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Appointment</p>
            <p style="margin:0;font-size:12px;color:#334155;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              ${fmtDateShort(data.appointment.date)} · ${escHtml(data.appointment.time)}<br/>
              ${escHtml(loc)}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
        <thead>
          <tr style="background:#f8fafc;">
            <th align="left" style="padding:10px 12px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;border-bottom:1px solid #e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Description</th>
            <th align="center" style="padding:10px 8px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;border-bottom:1px solid #e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Qty</th>
            <th align="right" style="padding:10px 12px;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#64748b;border-bottom:1px solid #e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:14px 12px;font-size:13px;color:#0f172a;border-bottom:1px solid #f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <strong style="display:block;margin-bottom:4px;">${escHtml(data.service.name)}</strong>
              <span style="font-size:12px;color:#64748b;">Dr. ${escHtml(data.service.doctor)} · ${data.service.duration} mins · ${escHtml(modeLabel(data.appointment.mode))}</span>
            </td>
            <td align="center" style="padding:14px 8px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">1</td>
            <td align="right" style="padding:14px 12px;font-size:14px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${fmtCurrency(data.billing.subtotal)}</td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
  <tr>
    <td align="right" style="padding:16px 24px 8px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="min-width:220px;">
        <tr>
          <td style="padding:4px 0;font-size:12px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Subtotal</td>
          <td align="right" style="padding:4px 0 4px 24px;font-size:12px;font-weight:600;color:#334155;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${fmtCurrency(data.billing.subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;font-size:12px;color:#64748b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">GST (included)</td>
          <td align="right" style="padding:4px 0 4px 24px;font-size:12px;font-weight:600;color:#334155;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${fmtCurrency(data.billing.gst)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding-top:10px;border-top:2px solid #528ff0;"></td>
        </tr>
        <tr>
          <td style="padding:8px 0 0;font-size:13px;font-weight:700;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Total Amount</td>
          <td align="right" style="padding:8px 0 0 24px;font-size:20px;font-weight:800;color:#528ff0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${fmtCurrency(data.billing.total)}</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:8px 24px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
        <tr>
          <td style="padding:12px 14px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td width="33%" style="vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Payment</p>
                  <p style="margin:0;font-size:12px;font-weight:600;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                    <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;background:${paid ? '#dcfce7' : '#fef9c3'};color:${paid ? '#166534' : '#854d0e'};">${paid ? 'Paid' : 'Pending'}</span>
                  </p>
                </td>
                <td width="33%" style="vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Method</p>
                  <p style="margin:0;font-size:12px;font-weight:600;color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escHtml(data.billing.paymentMethod)}</p>
                </td>
                <td width="34%" style="vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Transaction ID</p>
                  <p style="margin:0;font-size:11px;font-weight:600;color:#0f172a;word-break:break-all;font-family:ui-monospace,Consolas,monospace;">${txn}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:12px 24px 18px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#475569;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escHtml(data.company.name)}</p>
      <p style="margin:0;font-size:10px;color:#94a3b8;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        ${escHtml(data.company.address)} · GSTIN ${escHtml(data.company.gstin)}<br/>
        ${escHtml(data.company.phone)} · ${escHtml(data.company.email)}
      </p>
    </td>
  </tr>
</table>`;
}
