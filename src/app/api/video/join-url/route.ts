/**
 * POST /api/video/join-url
 * Returns a fresh Daily.co host/patient URL (super admin, doctor, or patient).
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getDoctorFromRequest } from '@/lib/doctor-api';
import { issueDailyJoinUrl, type DailyJoinRole } from '@/lib/daily';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const appointmentId = body?.appointmentId as string | undefined;
    const role = body?.role as DailyJoinRole | undefined;

    if (!appointmentId || !role || !['admin', 'doctor', 'patient'].includes(role)) {
      return NextResponse.json({ error: 'appointmentId and role (admin|doctor|patient) required' }, { status: 400 });
    }

    const key = process.env.DAILY_API_KEY?.trim();
    if (!key || key.length < 20) {
      return NextResponse.json({ error: 'Daily.co is not configured' }, { status: 503 });
    }

    const doctor = await getDoctorFromRequest();
    let isPlatformHost = false;
    let authUserId: string | null = null;

    if (!doctor) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      authUserId = user.id;
      const adminClient = createAdminClient();
      const { data: userRow } = await (adminClient.from('users') as any)
        .select('role')
        .eq('id', user.id)
        .single();
      const role = (userRow?.role || '') as string;
      isPlatformHost = role === 'super_admin' || role === 'admin';
    }

    const adminClient = createAdminClient();
    const { data: apt, error: aptError } = await (adminClient.from('appointments') as any)
      .select(
        `
        id, patient_id, doctor_id, mode, google_meet_link, appointment_date, start_time, end_time, metadata,
        doctor:doctor_id(users:user_id(full_name))
      `
      )
      .eq('id', appointmentId)
      .single();

    if (aptError || !apt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (apt.mode !== 'online') {
      return NextResponse.json({ error: 'Not an online consultation' }, { status: 400 });
    }

    if (!apt.google_meet_link?.includes('daily.co')) {
      return NextResponse.json({
        url: apt.google_meet_link,
        provider: 'jitsi',
        message: 'Using fallback video link',
      });
    }

    if (role === 'admin' && !isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admin can use admin host link' }, { status: 403 });
    }

    if (role === 'doctor') {
      if (!doctor) {
        return NextResponse.json({ error: 'Doctor session required' }, { status: 401 });
      }
      if (doctor.doctorId !== apt.doctor_id) {
        return NextResponse.json({ error: 'Not your appointment' }, { status: 403 });
      }
    }

    if (role === 'patient') {
      if (!authUserId) {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        authUserId = user.id;
      }
      if (apt.patient_id !== authUserId && !isPlatformHost) {
        return NextResponse.json({ error: 'Not your appointment' }, { status: 403 });
      }
    }

    if (apt.status === 'cancelled') {
      return NextResponse.json({ error: 'This appointment was cancelled' }, { status: 400 });
    }

    const doctorName =
      apt.doctor?.users?.full_name || (apt.metadata as { doctor_name?: string })?.doctor_name || 'Doctor';

    const url = await issueDailyJoinUrl({
      appointmentId,
      role,
      doctorName,
      appointmentDate: apt.appointment_date,
      startTime: apt.start_time,
      endTime: apt.end_time,
    });

    const metaKey = role === 'admin' ? 'admin_video_url' : role === 'doctor' ? 'doctor_video_url' : null;
    if (metaKey) {
      const existingMeta =
        apt.metadata && typeof apt.metadata === 'object' && !Array.isArray(apt.metadata)
          ? { ...(apt.metadata as Record<string, unknown>) }
          : {};
      await (adminClient.from('appointments') as any)
        .update({
          metadata: { ...existingMeta, [metaKey]: url },
        })
        .eq('id', appointmentId);
    }

    return NextResponse.json({ ok: true, url, provider: 'daily', role });
  } catch (e) {
    console.error('[H2H Video] join-url error:', e);
    const msg = e instanceof Error ? e.message : 'Failed to create join link';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
