/**
 * H2H Healthcare - End consultation for everyone
 * POST /api/video/end-consultation
 * Doctor (doctor_session cookie) or super admin (Supabase auth) can end the Daily room.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getDoctorFromRequest } from '@/lib/doctor-api';
import { getDailyRoomName } from '@/lib/daily';
import { NextRequest, NextResponse } from 'next/server';

const DAILY_API = 'https://api.daily.co/v1';

export async function POST(request: NextRequest) {
  try {
    const doctor = await getDoctorFromRequest();
    let isSuperAdmin = false;

    if (!doctor) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const adminClient = createAdminClient();
      const { data: userRow } = await (adminClient.from('users') as any)
        .select('role')
        .eq('id', user.id)
        .single();
      const role = (userRow?.role || '') as string;
      isSuperAdmin = role === 'super_admin' || role === 'admin';
    }

    if (!doctor && !isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const appointmentId = body?.appointmentId;
    if (!appointmentId || typeof appointmentId !== 'string') {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    const key = process.env.DAILY_API_KEY?.trim();
    if (!key || key.length < 20) {
      return NextResponse.json({ error: 'Daily not configured' }, { status: 503 });
    }

    const adminClient = createAdminClient();
    const { data: apt, error: aptError } = await (adminClient.from('appointments') as any)
      .select('id, doctor_id, mode, google_meet_link')
      .eq('id', appointmentId)
      .single();

    if (aptError || !apt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (apt.mode !== 'online' || !apt.google_meet_link?.includes('daily.co')) {
      return NextResponse.json({ error: 'Not a Daily consultation' }, { status: 400 });
    }

    const isDoctor = doctor ? doctor.doctorId === apt.doctor_id : false;
    if (!isSuperAdmin && !isDoctor) {
      return NextResponse.json({ error: 'Not authorized to end this consultation' }, { status: 403 });
    }

    const roomName = getDailyRoomName(appointmentId);

    // 1) Eject all participants first so they are immediately disconnected (no one left in lobby/call)
    try {
      const meetingsRes = await fetch(
        `${DAILY_API}/meetings?room=${encodeURIComponent(roomName)}&ongoing=true&limit=1`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json();
        const meetings = meetingsData?.data ?? [];
        const ongoing = meetings.find((m: { ongoing?: boolean }) => m.ongoing);
        if (ongoing) {
          let ids: string[] = [];
          const participants = ongoing.participants;
          if (participants && typeof participants === 'object') {
            if (Array.isArray(participants)) {
              ids = participants
                .map((p: { id?: string; session_id?: string; participant_id?: string }) =>
                  p?.id ?? p?.session_id ?? p?.participant_id
                )
                .filter(Boolean);
            } else {
              ids = Object.keys(participants);
            }
          }
          if (ids.length === 0 && ongoing.id) {
            const partRes = await fetch(`${DAILY_API}/meetings/${ongoing.id}/participants?limit=100`, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
              },
              signal: AbortSignal.timeout(5000),
            });
            if (partRes.ok) {
              const partData = await partRes.json();
              const list = partData?.participants ?? partData?.data ?? [];
              if (Array.isArray(list)) {
                ids = list
                  .map((p: { id?: string; session_id?: string }) => p?.id ?? p?.session_id)
                  .filter(Boolean);
              } else if (list && typeof list === 'object') {
                ids = Object.keys(list);
              }
            }
          }
          if (ids.length > 0) {
            const ejectRes = await fetch(`${DAILY_API}/rooms/${roomName}/eject`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`,
              },
              body: JSON.stringify({ ids }),
              signal: AbortSignal.timeout(8000),
            });
            if (!ejectRes.ok) {
              const errText = await ejectRes.text();
              console.error('[H2H Video] Eject participants failed:', ejectRes.status, errText);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[H2H Video] Eject step failed (continuing to delete room):', e);
    }

    // 2) Delete the room so it can't be rejoined and UI is accurate
    const res = await fetch(`${DAILY_API}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 404) {
      return NextResponse.json({ ok: true, message: 'Room already ended' });
    }
    if (!res.ok) {
      const text = await res.text();
      console.error('[H2H Video] End consultation failed:', res.status, text);
      return NextResponse.json({ error: 'Failed to end consultation' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Consultation ended for everyone' });
  } catch (e) {
    console.error('[H2H Video] End consultation error:', e);
    return NextResponse.json({ error: 'Failed to end consultation' }, { status: 500 });
  }
}
