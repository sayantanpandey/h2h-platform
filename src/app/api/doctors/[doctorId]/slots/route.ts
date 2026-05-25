/**
 * H2H Healthcare - Doctor Time Slots API
 * Get available time slots for a specific doctor on a specific date
 */

import { holdsSlot, timesOverlap } from '@/lib/appointment-slot';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Appointment {
  start_time: string;
  end_time: string;
}

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// Generate static time slots for demo/fallback
function generateStaticSlots(slotDuration: number = 30): { time: string; available: boolean }[] {
  const slots: { time: string; available: boolean }[] = [];
  
  // Morning slots: 9 AM - 1 PM
  for (let hour = 9; hour < 13; hour++) {
    for (let min = 0; min < 60; min += slotDuration) {
      if (hour === 12 && min >= 30) break;
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
        available: true,
      });
    }
  }
  
  // Afternoon slots: 2 PM - 7 PM
  for (let hour = 14; hour < 19; hour++) {
    for (let min = 0; min < 60; min += slotDuration) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
        available: true,
      });
    }
  }
  
  return slots;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params;
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const date = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Check if this is a static doctor ID (starts with 'doc-')
    if (doctorId.startsWith('doc-') || doctorId.startsWith('svc-')) {
      // Return static slots for demo doctors
      const slotDuration = 30;
      const slots = generateStaticSlots(slotDuration);
      
      return NextResponse.json({
        success: true,
        data: slots,
        date,
        doctorId,
        slotDuration,
        source: 'static',
      });
    }

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = new Date(date).getDay();

    // Get doctor's availability for this day
    const { data: availability, error: availError } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true) as { data: Availability[] | null; error: any };

    if (availError) {
      console.error('Error fetching availability:', availError);
      // Return static slots on error
      return NextResponse.json({
        success: true,
        data: generateStaticSlots(30),
        date,
        doctorId,
        slotDuration: 30,
        source: 'static_fallback',
      });
    }

    if (!availability || availability.length === 0) {
      // Return static slots if no availability found
      return NextResponse.json({
        success: true,
        data: generateStaticSlots(30),
        date,
        doctorId,
        slotDuration: 30,
        source: 'static_no_availability',
      });
    }

    // Get existing appointments for this doctor on this date
    const { data: existingAppointments, error: apptError } = await supabase
      .from('appointments')
      .select('start_time, end_time, status, payment_status, created_at')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .not('status', 'eq', 'cancelled') as { data: Appointment[] | null; error: any };

    if (apptError) {
      console.error('Error fetching appointments:', apptError);
    }

    // Get service duration
    let slotDuration = 30; // Default 30 minutes
    if (serviceId) {
      const { data: service } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', serviceId)
        .single() as { data: { duration_minutes: number } | null; error: any };
      
      if (service) {
        slotDuration = service.duration_minutes;
      }
    }

    // Generate time slots
    const slots: { time: string; available: boolean }[] = [];
    
    for (const avail of availability) {
      const startParts = avail.start_time.split(':').map(Number);
      const endParts = avail.end_time.split(':').map(Number);
      
      let currentMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];

      while (currentMinutes + slotDuration <= endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const mins = currentMinutes % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        
        // Check if slot is already booked
        const endMins = currentMinutes + slotDuration;
        const slotEndStr = `${Math.floor(endMins / 60).toString().padStart(2, '0')}:${(endMins % 60).toString().padStart(2, '0')}`;
        const isBooked =
          existingAppointments?.some((appt) => {
            if (!holdsSlot(appt as { status: string; payment_status?: string; created_at?: string })) {
              return false;
            }
            return timesOverlap(timeStr, slotEndStr, appt.start_time, appt.end_time);
          }) || false;

        slots.push({
          time: timeStr,
          available: !isBooked,
        });

        currentMinutes += slotDuration;
      }
    }

    return NextResponse.json({
      success: true,
      data: slots,
      date,
      doctorId,
      slotDuration,
    });
  } catch (error) {
    console.error('Error in slots API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
