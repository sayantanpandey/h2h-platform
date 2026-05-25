/**
 * H2H Healthcare - Email Service
 * Sends appointment confirmation emails to patients and doctors
 */

import nodemailer from 'nodemailer';
import { buildInvoiceEmailSection } from '@/lib/invoice';
import type { InvoiceData } from '@/lib/invoice';

// Create transporter - uses env vars for SMTP config
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('SMTP credentials not configured. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

interface AppointmentEmailData {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorEmail: string;
  serviceName: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  mode: 'online' | 'offline' | 'home_visit';
  amount: number;
  locationName?: string;
  locationCity?: string;
  googleMeetLink?: string | null;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  /** When set, embeds a Razorpay-style tax invoice in the patient email body */
  invoicePayload?: InvoiceData | null;
}

const EMAIL_FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    online: 'Online Video Consultation',
    offline: 'Clinic Visit',
    home_visit: 'Home Visit',
  };
  return labels[mode] || mode;
}

function buildPatientEmailHTML(data: AppointmentEmailData): string {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://h2hhealthcare.com'}/patient/appointments`;
  const invoiceSection = data.invoicePayload
    ? `
      <tr>
        <td style="padding:0 30px 8px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0f172a;font-family:${EMAIL_FONT};">Your tax invoice</p>
          ${buildInvoiceEmailSection(data.invoicePayload)}
        </td>
      </tr>`
    : '';

  const meetSection = data.googleMeetLink
    ? `
    <tr>
      <td style="padding:20px 30px;background:#ecfdf5;border-radius:12px;margin:10px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#065f46;">🎥 Video Call Link</p>
              <p style="margin:0 0 12px;font-size:13px;color:#047857;">Join your appointment via Google Meet:</p>
              <a href="${data.googleMeetLink}" style="display:inline-block;padding:12px 28px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
                Join Video Call
              </a>
              <p style="margin:10px 0 0;font-size:12px;color:#6b7280;font-family:monospace;">${data.googleMeetLink}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:16px"></td></tr>`
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:${EMAIL_FONT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);border:1px solid #e3e8ee;">
      <tr>
        <td style="padding:28px 30px;text-align:center;background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);">
          <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:700;font-family:${EMAIL_FONT};letter-spacing:-0.02em;">Payment Successful! ✓</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 30px 16px;">
          <p style="margin:0 0 8px;font-size:15px;color:#0f172a;line-height:1.6;font-family:${EMAIL_FONT};">
            Hi <strong>${data.patientName}</strong>,
          </p>
          <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;font-family:${EMAIL_FONT};">
            Your payment of <strong style="color:#0f172a;">${formatCurrency(data.amount)}</strong> has been received and your appointment is confirmed.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 30px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#528ff0;font-family:${EMAIL_FONT};">Appointment Details</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;width:120px;font-family:${EMAIL_FONT};">Service</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;font-family:${EMAIL_FONT};">${data.serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Doctor</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">Dr. ${data.doctorName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Date</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${formatDate(data.appointmentDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Time</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${formatTime(data.startTime)} - ${formatTime(data.endTime)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Mode</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${getModeLabel(data.mode)}</td>
                  </tr>
                  ${data.locationName && data.mode !== 'online' ? `
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Location</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${data.locationName}${data.locationCity ? ', ' + data.locationCity : ''}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Amount Paid</td>
                    <td style="padding:6px 0;font-size:14px;color:#0891b2;font-weight:700;">${formatCurrency(data.amount)}</td>
                  </tr>
                  ${data.razorpayPaymentId ? `
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Razorpay Payment ID</td>
                    <td style="padding:6px 0;font-size:12px;color:#0f172a;font-weight:600;font-family:monospace;">${data.razorpayPaymentId}</td>
                  </tr>` : ''}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${meetSection}
      ${invoiceSection}
      <tr>
        <td style="padding:0 30px 20px;">
          <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;text-align:center;font-family:${EMAIL_FONT};">
            Save or print the invoice above. You can download it anytime from your
            <a href="${dashboardUrl}" style="color:#528ff0;font-weight:600;text-decoration:none;">patient dashboard</a>.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 30px 24px;text-align:center;">
          <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:#528ff0;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;font-family:${EMAIL_FONT};">
            View in Dashboard
          </a>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding:20px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;">H2H Healthcare</p>
          <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated confirmation email. Please do not reply.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function buildDoctorEmailHTML(data: AppointmentEmailData): string {
  const meetSection = data.googleMeetLink
    ? `
    <tr>
      <td style="padding:20px 30px;background:#ecfdf5;border-radius:12px;margin:10px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#065f46;">🎥 Video Call Link</p>
              <p style="margin:0 0 12px;font-size:13px;color:#047857;">Use this Google Meet link for the consultation:</p>
              <a href="${data.googleMeetLink}" style="display:inline-block;padding:12px 28px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
                Join Video Call
              </a>
              <p style="margin:10px 0 0;font-size:12px;color:#6b7280;font-family:monospace;">${data.googleMeetLink}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:16px"></td></tr>`
    : '';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <!-- Header -->
      <tr><td style="height:5px;background:linear-gradient(90deg,#0891b2,#06b6d4,#22d3ee);"></td></tr>
      <tr>
        <td style="padding:30px 30px 20px;text-align:center;">
          <h1 style="margin:0 0 4px;font-size:22px;color:#0891b2;font-weight:800;">H2H Healthcare</h1>
          <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">Doctor Notification</p>
        </td>
      </tr>
      <!-- Greeting -->
      <tr>
        <td style="padding:0 30px 20px;">
          <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a;">New Appointment Booked 📋</h2>
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
            Hi <strong>Dr. ${data.doctorName}</strong>, a new appointment has been confirmed. Here are the details:
          </p>
        </td>
      </tr>
      <!-- Patient Info -->
      <tr>
        <td style="padding:0 30px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#3b82f6;">Patient Details</p>
                <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0f172a;">${data.patientName}</p>
                <p style="margin:0;font-size:13px;color:#64748b;">${data.patientEmail}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Appointment Details -->
      <tr>
        <td style="padding:0 30px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;width:120px;">Service</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${data.serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Date</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${formatDate(data.appointmentDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Time</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${formatTime(data.startTime)} - ${formatTime(data.endTime)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Mode</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${getModeLabel(data.mode)}</td>
                  </tr>
                  ${data.locationName && data.mode !== 'online' ? `
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Location</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${data.locationName}${data.locationCity ? ', ' + data.locationCity : ''}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Fee</td>
                    <td style="padding:6px 0;font-size:14px;color:#0891b2;font-weight:700;">${formatCurrency(data.amount)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Meet Link -->
      ${meetSection}
      <!-- Footer -->
      <tr>
        <td style="padding:20px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;">H2H Healthcare</p>
          <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated notification. Please do not reply.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ─── Reminder Emails ───────────────────────────────────────────────

export interface ReminderEmailData {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  serviceName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  googleMeetLink: string;
  reminderType: '3hr' | '1.5hr' | '30min';
}

function getReminderLabel(type: string): string {
  switch (type) {
    case '3hr': return '3 hours';
    case '1.5hr': return '1 hour 30 minutes';
    case '30min': return '30 minutes';
    default: return type;
  }
}

function getReminderEmoji(type: string): string {
  switch (type) {
    case '3hr': return '🔔';
    case '1.5hr': return '⏰';
    case '30min': return '🚨';
    default: return '🔔';
  }
}

function getReminderUrgencyColor(type: string): { bg: string; border: string; text: string; accent: string } {
  switch (type) {
    case '3hr': return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', accent: '#3b82f6' };
    case '1.5hr': return { bg: '#fefce8', border: '#fde68a', text: '#92400e', accent: '#f59e0b' };
    case '30min': return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', accent: '#ef4444' };
    default: return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', accent: '#3b82f6' };
  }
}

function buildReminderEmailHTML(data: ReminderEmailData): string {
  const label = getReminderLabel(data.reminderType);
  const emoji = getReminderEmoji(data.reminderType);
  const colors = getReminderUrgencyColor(data.reminderType);

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:30px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      <!-- Header -->
      <tr><td style="height:5px;background:linear-gradient(90deg,#0891b2,#06b6d4,#22d3ee);"></td></tr>
      <tr>
        <td style="padding:30px 30px 20px;text-align:center;">
          <h1 style="margin:0 0 4px;font-size:22px;color:#0891b2;font-weight:800;">H2H Healthcare</h1>
          <p style="margin:0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">Appointment Reminder</p>
        </td>
      </tr>
      <!-- Urgency Banner -->
      <tr>
        <td style="padding:0 30px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:${colors.bg};border:2px solid ${colors.border};border-radius:12px;">
            <tr>
              <td style="padding:20px;text-align:center;">
                <p style="margin:0 0 6px;font-size:32px;">${emoji}</p>
                <p style="margin:0 0 4px;font-size:18px;font-weight:800;color:${colors.text};">
                  Your appointment starts in ${label}!
                </p>
                <p style="margin:0;font-size:13px;color:${colors.text};opacity:0.8;">
                  Please be ready for your video consultation
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Greeting -->
      <tr>
        <td style="padding:0 30px 20px;">
          <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
            Hi <strong>${data.patientName}</strong>, this is a friendly reminder about your upcoming online appointment.
          </p>
        </td>
      </tr>
      <!-- Details Card -->
      <tr>
        <td style="padding:0 30px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;width:100px;">Service</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${data.serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Doctor</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">Dr. ${data.doctorName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Date</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${formatDate(data.appointmentDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;">Time</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${formatTime(data.startTime)} - ${formatTime(data.endTime)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Meet Link - Prominent -->
      <tr>
        <td style="padding:0 30px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:2px solid #6ee7b7;border-radius:12px;">
            <tr>
              <td style="padding:20px;text-align:center;">
                <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#065f46;">🎥 Join Your Video Consultation</p>
                <a href="${data.googleMeetLink}" style="display:inline-block;padding:14px 40px;background:#059669;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;letter-spacing:0.3px;">
                  Join Google Meet Now
                </a>
                <p style="margin:12px 0 0;font-size:12px;color:#6b7280;font-family:monospace;">${data.googleMeetLink}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <!-- Tips -->
      <tr>
        <td style="padding:0 30px 20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;">Quick Tips:</p>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="padding:3px 0;font-size:12px;color:#64748b;">✅ Ensure stable internet connection</td></tr>
            <tr><td style="padding:3px 0;font-size:12px;color:#64748b;">✅ Test your camera and microphone</td></tr>
            <tr><td style="padding:3px 0;font-size:12px;color:#64748b;">✅ Find a quiet, well-lit space</td></tr>
            <tr><td style="padding:3px 0;font-size:12px;color:#64748b;">✅ Keep any relevant reports handy</td></tr>
          </table>
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="padding:20px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#64748b;font-weight:600;">H2H Healthcare</p>
          <p style="margin:0;font-size:11px;color:#94a3b8;">This is an automated reminder. Please do not reply.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export async function sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('SMTP not configured. Skipping reminder email.');
    return false;
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@h2hhealthcare.com';
  const label = getReminderLabel(data.reminderType);

  try {
    await transporter.sendMail({
      from: `"H2H Healthcare" <${fromAddress}>`,
      to: data.patientEmail,
      subject: `⏰ Reminder: Your appointment starts in ${label} - ${data.serviceName}`,
      html: buildReminderEmailHTML(data),
    });
    console.log(`✅ Reminder (${data.reminderType}) sent to ${data.patientEmail} for appointment ${data.appointmentId}`);
    return true;
  } catch (err) {
    console.error(`Failed to send ${data.reminderType} reminder to ${data.patientEmail}:`, err);
    return false;
  }
}

export async function sendAppointmentConfirmationEmails(data: AppointmentEmailData): Promise<{ patientSent: boolean; doctorSent: boolean }> {
  const transporter = getTransporter();
  const result = { patientSent: false, doctorSent: false };

  if (!transporter) {
    console.warn('Email transporter not configured. Skipping email notifications.');
    return result;
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@h2hhealthcare.com';

  // Send to patient
  if (data.patientEmail) {
    try {
      await transporter.sendMail({
        from: `"H2H Healthcare" <${fromAddress}>`,
        to: data.patientEmail,
        subject: `Payment Successful - ${data.serviceName} | H2H Healthcare`,
        html: buildPatientEmailHTML(data),
      });
      result.patientSent = true;
      console.log(`✅ Patient email sent to ${data.patientEmail}`);
    } catch (err) {
      console.error('Failed to send patient email:', err);
    }
  }

  // Send to doctor
  if (data.doctorEmail) {
    try {
      await transporter.sendMail({
        from: `"H2H Healthcare" <${fromAddress}>`,
        to: data.doctorEmail,
        subject: `New Appointment: ${data.patientName} - ${data.serviceName}`,
        html: buildDoctorEmailHTML(data),
      });
      result.doctorSent = true;
      console.log(`✅ Doctor email sent to ${data.doctorEmail}`);
    } catch (err) {
      console.error('Failed to send doctor email:', err);
    }
  }

  return result;
}
