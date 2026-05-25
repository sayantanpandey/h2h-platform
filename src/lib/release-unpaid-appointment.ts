import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type ReleaseReason =
  | 'payment_cancelled'
  | 'payment_failed'
  | 'checkout_dismissed'
  | 'checkout_error'
  | 'order_create_failed'
  | 'payment_hold_expired'
  | 'verify_abandoned';

export interface ReleaseResult {
  released: boolean;
  appointmentId: string;
  message: string;
}

/**
 * Cancel an unpaid appointment so the time slot is free again.
 * Never cancels if payment already captured.
 */
export async function releaseUnpaidAppointment(
  adminClient: SupabaseClient<Database>,
  appointmentId: string,
  reason: ReleaseReason
): Promise<ReleaseResult> {
  const { data: apt, error } = await adminClient
    .from('appointments')
    .select('id, status, payment_status, razorpay_payment_id, metadata')
    .eq('id', appointmentId)
    .single();

  if (error || !apt) {
    return { released: false, appointmentId, message: 'Appointment not found' };
  }

  const row = apt as {
    status: string;
    payment_status: string;
    razorpay_payment_id: string | null;
    metadata?: Record<string, unknown> | null;
  };

  if (row.payment_status === 'paid' || row.razorpay_payment_id) {
    return { released: false, appointmentId, message: 'Payment already completed' };
  }

  if (row.status === 'cancelled') {
    return { released: false, appointmentId, message: 'Already cancelled' };
  }

  if (row.status === 'confirmed' || row.status === 'completed') {
    return { released: false, appointmentId, message: 'Appointment already confirmed' };
  }

  const existingMeta =
    row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
      ? { ...row.metadata }
      : {};

  const { error: updateErr } = await adminClient
    .from('appointments')
    .update({
      status: 'cancelled',
      payment_status: 'failed',
      cancellation_reason: reason,
      metadata: {
        ...existingMeta,
        slot_released_at: new Date().toISOString(),
        slot_release_reason: reason,
      },
    })
    .eq('id', appointmentId)
    .eq('payment_status', 'pending')
    .is('razorpay_payment_id', null);

  if (updateErr) {
    console.error('[H2H] releaseUnpaidAppointment failed:', updateErr);
    return { released: false, appointmentId, message: 'Failed to release slot' };
  }

  await adminClient
    .from('payments')
    .update({ status: 'failed' })
    .eq('appointment_id', appointmentId)
    .eq('status', 'pending');

  return { released: true, appointmentId, message: 'Slot released' };
}
