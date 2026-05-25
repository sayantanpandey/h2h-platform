/**
 * Cancels unpaid pending appointments past the payment hold window (frees slots).
 * Call every 5–10 minutes via Vercel cron or external scheduler.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { PAYMENT_HOLD_MINUTES } from '@/lib/appointment-slot';
import { releaseUnpaidAppointment } from '@/lib/release-unpaid-appointment';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const cutoff = new Date(Date.now() - PAYMENT_HOLD_MINUTES * 60 * 1000).toISOString();

    const { data: stale, error } = await (adminClient.from('appointments') as any)
      .select('id')
      .eq('status', 'pending')
      .eq('payment_status', 'pending')
      .is('razorpay_payment_id', null)
      .lt('created_at', cutoff)
      .limit(100);

    if (error) {
      console.error('[H2H] expire-pending-payments query error:', error);
      return NextResponse.json({ error: 'Query failed' }, { status: 500 });
    }

    let released = 0;
    for (const row of stale || []) {
      const result = await releaseUnpaidAppointment(
        adminClient,
        row.id as string,
        'payment_hold_expired'
      );
      if (result.released) released++;
    }

    return NextResponse.json({
      ok: true,
      scanned: stale?.length ?? 0,
      released,
      holdMinutes: PAYMENT_HOLD_MINUTES,
    });
  } catch (e) {
    console.error('[H2H] expire-pending-payments error:', e);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
