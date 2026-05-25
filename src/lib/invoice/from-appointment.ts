import { APP_CONFIG } from '@/constants/config';
import type { InvoiceData } from './types';

/** Build printable invoice payload from a joined appointment row (verify/webhook shape). */
export function invoiceDataFromAppointment(apt: Record<string, unknown>): InvoiceData {
  const id = String(apt.id || '');
  const patient = (apt.patient as Record<string, unknown>) || {};
  const metadata = (apt.metadata as Record<string, unknown>) || {};
  const doctorUser =
    (apt.doctor as { users?: { full_name?: string } })?.users ||
    (apt.doctor as { user?: { full_name?: string } })?.user;
  const rawDoctorName = doctorUser?.full_name || 'Doctor';
  const doctorName = String(rawDoctorName).replace(/^Dr\.?\s*/i, '');
  const service = (apt.service as { name?: string; duration_minutes?: number }) || {};
  const location = (apt.location as { name?: string; city?: string; address?: string }) || {};
  const subtotal = Number(apt.amount) || 0;

  return {
    invoiceNumber: `H2H-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}`,
    invoiceDate: new Date().toISOString(),
    company: {
      name: 'H2H Healthcare Pvt. Ltd.',
      address: 'Tower B, DLF Cyber City, Gurgaon, Haryana 122002',
      phone: APP_CONFIG.phone,
      email: 'support@healtohealth.com',
      gstin: '06AABCH1234A1Z5',
      website: 'www.h2hhealthcare.com',
    },
    patient: {
      name: String(patient.full_name || metadata.patient_name || 'Patient'),
      phone: String(patient.phone || metadata.patient_phone || ''),
      email: String(patient.email || ''),
    },
    appointment: {
      id,
      date: String(apt.appointment_date || ''),
      time: `${String(apt.start_time || '').slice(0, 5)} - ${String(apt.end_time || '').slice(0, 5)}`,
      mode: String(apt.mode || 'offline'),
      status: String(apt.status || 'confirmed'),
      paymentStatus: String(apt.payment_status || 'paid'),
    },
    service: {
      name: String(service.name || 'Consultation'),
      duration: Number(service.duration_minutes) || 30,
      doctor: doctorName,
    },
    location: {
      name: String(metadata.center_name || location.name || ''),
      city: String(location.city || ''),
      address: String(location.address || ''),
    },
    billing: {
      subtotal,
      gst: Math.round(subtotal * 0.18),
      total: subtotal,
      currency: 'INR',
      paymentMethod: String(apt.payment_method_label || 'Razorpay (Online)'),
      transactionId: (apt.razorpay_payment_id as string) || null,
      razorpayOrderId: (apt.razorpay_order_id as string) || null,
    },
    notes: (apt.notes as string) || null,
  };
}
