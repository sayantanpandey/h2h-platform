/**
 * POST /api/payments/release-slot
 * Frees the appointment slot when checkout is cancelled or payment did not complete.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { releaseUnpaidAppointment, type ReleaseReason } from '@/lib/release-unpaid-appointment';
import { NextRequest, NextResponse } from 'next/server';

const VALID_REASONS: ReleaseReason[] = [
  'payment_cancelled',
  'checkout_dismissed',
  'checkout_error',
  'order_create_failed',
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const appointmentId = body?.appointmentId as string | undefined;
    const reason = (body?.reason as ReleaseReason) || 'checkout_dismissed';

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointmentId is required' }, { status: 400 });
    }

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Invalid release reason' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { data: apt } = await (adminClient.from('appointments') as any)
      .select('id, patient_id')
      .eq('id', appointmentId)
      .single();

    if (!apt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const { data: patientUser } = await (adminClient.from('users') as any)
      .select('id, email, phone')
      .eq('id', apt.patient_id)
      .single();

    const userEmail = user.email?.trim().toLowerCase() ?? '';
    const patientEmail = patientUser?.email?.trim().toLowerCase() ?? '';
    const emailMatches = userEmail.length > 0 && patientEmail === userEmail;
    const idMatches = apt.patient_id === user.id;

    const normPhone = (p: string | null | undefined) =>
      (p || '').replace(/\s/g, '').replace(/^\+91/, '').replace(/^91/, '');
    const userPhone = normPhone((user as { phone?: string }).phone);
    const patientPhone = normPhone(patientUser?.phone);
    const phoneMatches =
      userPhone.length >= 10 &&
      patientPhone.length >= 10 &&
      userPhone.slice(-10) === patientPhone.slice(-10);

    if (!emailMatches && !idMatches && !phoneMatches) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await releaseUnpaidAppointment(adminClient, appointmentId, reason);

    return NextResponse.json({
      success: true,
      released: result.released,
      message: result.message,
    });
  } catch (e) {
    console.error('[H2H] release-slot error:', e);
    return NextResponse.json({ error: 'Failed to release slot' }, { status: 500 });
  }
}
