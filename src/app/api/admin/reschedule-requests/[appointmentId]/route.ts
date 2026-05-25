/**
 * H2H Healthcare - Admin Reschedule Request Action API
 * PUT /api/admin/reschedule-requests/[appointmentId] - Approve, reject, or reschedule
 * 
 * Actions:
 *  - approve: Accept patient's requested time (checks for collisions first)
 *  - reject: Reject the request
 *  - reschedule: Admin picks a custom date/time (checks for collisions)
 */

import { findSlotConflict } from '@/lib/appointment-slot';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ appointmentId: string }>;
}

async function getAdminUser(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const adminClient = createAdminClient();
  const { data: userData } = await (adminClient.from('users') as any)
    .select('id, full_name, role')
    .eq('email', user.email)
    .single();
  if (!userData || !['super_admin', 'admin'].includes((userData as any)?.role)) return null;
  return userData as any;
}

/**
 * Check if a doctor has any conflicting bookings at the given date/time.
 * Returns the conflicting appointment if found, or null if the slot is free.
 */
async function checkTimeCollision(
  adminClient: any,
  doctorId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId: string
): Promise<any | null> {
  const { data: conflicts } = await (adminClient.from('appointments') as any)
    .select('id, start_time, end_time, status, payment_status, created_at, patient:patient_id(full_name)')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', date)
    .not('status', 'eq', 'cancelled')
    .neq('id', excludeAppointmentId);

  return findSlotConflict(conflicts || [], startTime, endTime);
}

/**
 * Check if the doctor is available on the given day of week and the time falls within their schedule.
 */
async function checkDoctorAvailability(
  adminClient: any,
  doctorId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<{ available: boolean; reason?: string }> {
  const dayOfWeek = new Date(date).getDay();

  const { data: availability } = await adminClient
    .from('doctor_availability')
    .select('start_time, end_time, is_available')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true);

  if (!availability || availability.length === 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return { available: false, reason: `Doctor is not available on ${dayNames[dayOfWeek]}s` };
  }

  const reqStart = startTime.substring(0, 5);
  const reqEnd = endTime.substring(0, 5);

  const fitsInWindow = availability.some((slot: any) => {
    const slotStart = (slot.start_time || '').substring(0, 5);
    const slotEnd = (slot.end_time || '').substring(0, 5);
    return reqStart >= slotStart && reqEnd <= slotEnd;
  });

  if (!fitsInWindow) {
    const windows = availability.map((s: any) =>
      `${(s.start_time || '').substring(0, 5)} - ${(s.end_time || '').substring(0, 5)}`
    ).join(', ');
    return { available: false, reason: `Requested time is outside doctor's hours (${windows})` };
  }

  return { available: true };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { appointmentId } = await params;
    const supabase = await createClient();
    const adminUser = await getAdminUser(supabase);

    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const adminClient = createAdminClient();
    const body = await request.json();
    const { action, adminNote, customDate, customStartTime, customEndTime } = body;

    if (!action || !['approve', 'reject', 'reschedule'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action. Must be "approve", "reject", or "reschedule".' }, { status: 400 });
    }

    // Get the full appointment with doctor_id
    const { data: appointment, error: fetchError } = await (adminClient.from('appointments') as any)
      .select('id, doctor_id, appointment_date, start_time, end_time, mode, metadata, service:service_id(duration_minutes)')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    const apt = appointment as any;
    const metadata = apt.metadata || {};
    const rescheduleReq = metadata.reschedule_request;

    if (!rescheduleReq) {
      return NextResponse.json({ success: false, error: 'No reschedule request found for this appointment' }, { status: 404 });
    }

    if (rescheduleReq.status !== 'pending') {
      return NextResponse.json({ success: false, error: `Request already ${rescheduleReq.status}` }, { status: 400 });
    }

    // ─── APPROVE ───
    if (action === 'approve') {
      const targetDate = rescheduleReq.requested_date;
      const targetStart = rescheduleReq.requested_start_time;
      const targetEnd = rescheduleReq.requested_end_time;

      // 1. Check doctor availability on that day
      const availCheck = await checkDoctorAvailability(adminClient, apt.doctor_id, targetDate, targetStart, targetEnd);
      if (!availCheck.available) {
        return NextResponse.json({
          success: false,
          error: `Cannot approve: ${availCheck.reason}`,
          collision: false,
          availabilityIssue: true,
        }, { status: 409 });
      }

      // 2. Check for time collisions with other bookings
      const collision = await checkTimeCollision(adminClient, apt.doctor_id, targetDate, targetStart, targetEnd, appointmentId);
      if (collision) {
        const patientName = collision.patient?.full_name || 'another patient';
        return NextResponse.json({
          success: false,
          error: `Time collision: Doctor already has a booking with ${patientName} from ${collision.start_time?.substring(0, 5)} to ${collision.end_time?.substring(0, 5)} on this date.`,
          collision: true,
          conflictingAppointment: {
            id: collision.id,
            startTime: collision.start_time,
            endTime: collision.end_time,
            patient: patientName,
          },
        }, { status: 409 });
      }

      // 3. All clear — approve and update
      const updatedMetadata = {
        ...metadata,
        reschedule_request: {
          ...rescheduleReq,
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.full_name || 'Admin',
          reviewed_by_id: adminUser.id,
          admin_note: adminNote || null,
        },
        reschedule_history: [
          ...(metadata.reschedule_history || []),
          {
            from_date: apt.appointment_date,
            from_start_time: apt.start_time,
            from_end_time: apt.end_time,
            to_date: targetDate,
            to_start_time: targetStart,
            to_end_time: targetEnd,
            reason: rescheduleReq.reason,
            approved_by: adminUser.full_name,
            approved_at: new Date().toISOString(),
          },
        ],
      };

      const { error: updateError } = await (adminClient.from('appointments') as any)
        .update({
          appointment_date: targetDate,
          start_time: targetStart,
          end_time: targetEnd,
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      if (updateError) {
        console.error('Approve reschedule error:', updateError);
        return NextResponse.json({ success: false, error: 'Failed to approve reschedule' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Reschedule approved. Appointment updated.',
        data: { status: 'approved', newDate: targetDate, newStartTime: targetStart, newEndTime: targetEnd },
      });
    }

    // ─── RESCHEDULE (admin picks custom time) ───
    if (action === 'reschedule') {
      if (!customDate || !customStartTime) {
        return NextResponse.json({ success: false, error: 'customDate and customStartTime are required for reschedule action.' }, { status: 400 });
      }

      // Calculate end time if not provided
      const durationMinutes = apt.service?.duration_minutes || 30;
      let targetEnd = customEndTime;
      if (!targetEnd) {
        const [h, m] = customStartTime.split(':').map(Number);
        const endDate = new Date(2000, 0, 1, h, m + durationMinutes);
        targetEnd = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;
      }
      const targetStart = customStartTime.includes(':') && customStartTime.split(':').length === 2
        ? `${customStartTime}:00` : customStartTime;

      // 1. Check doctor availability
      const availCheck = await checkDoctorAvailability(adminClient, apt.doctor_id, customDate, targetStart, targetEnd);
      if (!availCheck.available) {
        return NextResponse.json({
          success: false,
          error: `Cannot reschedule: ${availCheck.reason}`,
          availabilityIssue: true,
        }, { status: 409 });
      }

      // 2. Check for time collisions
      const collision = await checkTimeCollision(adminClient, apt.doctor_id, customDate, targetStart, targetEnd, appointmentId);
      if (collision) {
        const patientName = collision.patient?.full_name || 'another patient';
        return NextResponse.json({
          success: false,
          error: `Time collision: Doctor has a booking with ${patientName} from ${collision.start_time?.substring(0, 5)} to ${collision.end_time?.substring(0, 5)}.`,
          collision: true,
        }, { status: 409 });
      }

      // 3. Update appointment with admin-chosen time
      const updatedMetadata = {
        ...metadata,
        reschedule_request: {
          ...rescheduleReq,
          status: 'approved',
          admin_rescheduled: true,
          admin_chosen_date: customDate,
          admin_chosen_start_time: targetStart,
          admin_chosen_end_time: targetEnd,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.full_name || 'Admin',
          reviewed_by_id: adminUser.id,
          admin_note: adminNote || `Rescheduled by admin to ${customDate} ${targetStart.substring(0, 5)}`,
        },
        reschedule_history: [
          ...(metadata.reschedule_history || []),
          {
            from_date: apt.appointment_date,
            from_start_time: apt.start_time,
            from_end_time: apt.end_time,
            to_date: customDate,
            to_start_time: targetStart,
            to_end_time: targetEnd,
            reason: `Admin reschedule: ${adminNote || rescheduleReq.reason || 'Schedule adjustment'}`,
            approved_by: adminUser.full_name,
            approved_at: new Date().toISOString(),
          },
        ],
      };

      const { error: updateError } = await (adminClient.from('appointments') as any)
        .update({
          appointment_date: customDate,
          start_time: targetStart,
          end_time: targetEnd,
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointmentId);

      if (updateError) {
        console.error('Admin reschedule error:', updateError);
        return NextResponse.json({ success: false, error: 'Failed to reschedule appointment' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Appointment rescheduled by admin.',
        data: { status: 'approved', newDate: customDate, newStartTime: targetStart, newEndTime: targetEnd },
      });
    }

    // ─── REJECT ───
    // When admin rejects, mark reschedule as rejected and cancel the appointment
    const updatedMetadata = {
      ...metadata,
      reschedule_request: {
        ...rescheduleReq,
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.full_name || 'Admin',
        reviewed_by_id: adminUser.id,
        admin_note: adminNote || null,
      },
    };

    const { error: updateError } = await (adminClient.from('appointments') as any)
      .update({
        status: 'cancelled',
        metadata: updatedMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Reject reschedule error:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to reject reschedule' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Reschedule request rejected. Appointment has been cancelled.',
      data: { status: 'rejected', appointmentStatus: 'cancelled' },
    });
  } catch (error) {
    console.error('Reschedule action error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
