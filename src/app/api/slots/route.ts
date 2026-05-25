/**
 * H2H Healthcare - Enhanced Time Slots API
 * Generates available time slots based on:
 * - Doctor availability (separate online/offline hours)
 * - Multiple slot durations (15, 30, 45, 60 min)
 * - Custom pricing per slot type
 * - Break times and blocked slots
 * - Existing bookings
 */

import { holdsSlot, timesOverlap } from '@/lib/appointment-slot';
import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface TimeSlot {
  time: string;
  endTime: string;
  available: boolean;
  duration: number;
  price?: number;
}

interface SlotType {
  id: string;
  duration_minutes: number;
  mode: string;
  price: number;
  label: string;
  description?: string;
}

interface DoctorAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  mode: string;
  break_start?: string;
  break_end?: string;
}

// Convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}

// Convert minutes to time string
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Check if time is within break period
function isDuringBreak(
  slotStart: number,
  slotEnd: number,
  breakStart?: string,
  breakEnd?: string
): boolean {
  if (!breakStart || !breakEnd) return false;
  const breakStartMins = timeToMinutes(breakStart.substring(0, 5));
  const breakEndMins = timeToMinutes(breakEnd.substring(0, 5));
  return slotStart < breakEndMins && slotEnd > breakStartMins;
}

// Generate time slots from start to end with given duration, excluding breaks
function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  breakStart?: string,
  breakEnd?: string
): { time: string; endTime: string }[] {
  const slots: { time: string; endTime: string }[] = [];
  
  let currentMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  while (currentMinutes + durationMinutes <= endMinutes) {
    const slotEndMinutes = currentMinutes + durationMinutes;
    
    // Skip if slot overlaps with break time
    if (!isDuringBreak(currentMinutes, slotEndMinutes, breakStart, breakEnd)) {
      slots.push({
        time: minutesToTime(currentMinutes),
        endTime: minutesToTime(slotEndMinutes),
      });
    }
    
    currentMinutes += durationMinutes;
  }
  
  return slots;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const serviceId = searchParams.get('serviceId');
    const mode = searchParams.get('mode') || 'both'; // 'online', 'offline', or 'both'
    const duration = parseInt(searchParams.get('duration') || '30'); // Default 30 min slots
    const slotTypeId = searchParams.get('slotTypeId'); // Optional specific slot type

    if (!doctorId || !date) {
      return NextResponse.json({
        success: false,
        error: 'doctorId and date are required',
      }, { status: 400 });
    }

    // Parse the date and get day of week
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Don't allow booking for past dates
    if (selectedDate < today) {
      return NextResponse.json({
        success: true,
        data: {
          date,
          dayOfWeek,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
          slots: [],
          message: 'Cannot book appointments for past dates',
        },
      });
    }

    // Get doctor's slot types (available durations with pricing)
    const { data: slotTypes } = await supabase
      .from('consultation_slot_types')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('is_active', true);

    // Filter slot types by mode if specified
    let availableSlotTypes = (slotTypes as any[] || []).filter((st: any) => 
      mode === 'both' || st.mode === 'both' || st.mode === mode
    );

    // If no custom slot types, use default durations with mode-specific pricing
    if (availableSlotTypes.length === 0) {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('consultation_fee')
        .eq('id', doctorId)
        .single();
      
      const baseFee = (doctor as any)?.consultation_fee || 1000;
      availableSlotTypes = [
        { 
          id: 'default-15', 
          duration_minutes: 15, 
          online_price: baseFee * 0.4, 
          offline_price: baseFee * 0.5, 
          home_visit_price: baseFee * 0.5 + 300,
          home_visit_additional_charge: 300,
          label: 'Quick Consultation' 
        },
        { 
          id: 'default-30', 
          duration_minutes: 30, 
          online_price: baseFee * 0.8, 
          offline_price: baseFee, 
          home_visit_price: baseFee + 500,
          home_visit_additional_charge: 500,
          label: 'Standard Session' 
        },
        { 
          id: 'default-45', 
          duration_minutes: 45, 
          online_price: baseFee * 1.2, 
          offline_price: baseFee * 1.5, 
          home_visit_price: baseFee * 1.5 + 700,
          home_visit_additional_charge: 700,
          label: 'Extended Session' 
        },
        { 
          id: 'default-60', 
          duration_minutes: 60, 
          online_price: baseFee * 1.6, 
          offline_price: baseFee * 2, 
          home_visit_price: baseFee * 2 + 1000,
          home_visit_additional_charge: 1000,
          label: 'Comprehensive Session' 
        },
      ];
    }

    // Get doctor's availability for this day
    // Note: mode column may not exist if migration hasn't been run yet
    const { data: availability, error: availError } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true);

    if (availError) {
      console.error('Error fetching availability:', availError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch doctor availability',
      }, { status: 500 });
    }

    if (!availability || availability.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          date,
          dayOfWeek,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
          mode,
          slotTypes: availableSlotTypes,
          slots: [],
          message: `Doctor is not available for ${mode === 'both' ? 'any' : mode} consultations on this day`,
        },
      });
    }

    // Get blocked slots for this date
    const { data: blockedSlots } = await supabase
      .from('blocked_slots')
      .select('start_time, end_time')
      .eq('doctor_id', doctorId)
      .eq('blocked_date', date);

    // Get date-specific overrides (approved unavailability for this specific date)
    let dateOverrides: any[] = [];
    try {
      const { data: overrides } = await supabase
        .from('doctor_date_overrides')
        .select('start_time, end_time, is_available')
        .eq('doctor_id', doctorId)
        .eq('override_date', date)
        .eq('is_available', false);
      dateOverrides = overrides ?? [];
    } catch {
      // table may not exist yet
    }

    // If there's a whole-day override (start_time is null), doctor is fully unavailable
    const wholeDayBlocked = dateOverrides.some((o: any) => !o.start_time && !o.end_time);
    if (wholeDayBlocked) {
      return NextResponse.json({
        success: true,
        data: {
          date,
          dayOfWeek,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
          mode,
          slots: [],
          message: 'Doctor is unavailable on this date',
        },
      });
    }

    // Determine slot duration to use - ALWAYS use the duration parameter from frontend
    let slotDuration = duration;
    let selectedSlotType: any = null;
    
    // Find matching slot type for the selected duration (for pricing)
    selectedSlotType = availableSlotTypes.find((st: any) => st.duration_minutes === duration);
    
    // If no exact match, use closest available
    if (!selectedSlotType && availableSlotTypes.length > 0) {
      selectedSlotType = availableSlotTypes[0];
    }
    
    console.log('Slots API - Duration requested:', duration, 'Using slotDuration:', slotDuration);

    // Generate all possible slots from availability windows
    // Slot increment matches the selected duration (30 min = 7:00, 7:30; 60 min = 7:00, 8:00)
    let allSlots: { time: string; endTime: string }[] = [];
    
    for (const avail of availability as any[]) {
      const startTime = avail.start_time.substring(0, 5); // HH:MM
      const endTime = avail.end_time.substring(0, 5);
      const breakStart = avail.break_start?.substring(0, 5);
      const breakEnd = avail.break_end?.substring(0, 5);
      
      // Generate slots at duration-based increments
      let currentMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      
      while (currentMinutes + slotDuration <= endMinutes) {
        const slotEndMinutes = currentMinutes + slotDuration;
        
        // Skip if slot overlaps with break time
        if (!isDuringBreak(currentMinutes, slotEndMinutes, breakStart, breakEnd)) {
          allSlots.push({
            time: minutesToTime(currentMinutes),
            endTime: minutesToTime(slotEndMinutes),
          });
        }
        
        // Move by the selected duration (not 15 min)
        currentMinutes += slotDuration;
      }
    }

    // Sort slots by time
    allSlots.sort((a, b) => a.time.localeCompare(b.time));

    // Get existing bookings for this doctor on this date
    const { data: bookings, error: bookingsError } = await supabase
      .from('appointments')
      .select('start_time, end_time, status, payment_status, created_at')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .not('status', 'eq', 'cancelled');

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }

    // Mark slots as available or booked
    const slotsWithAvailability: TimeSlot[] = allSlots.map(slot => {
      const slotStart = slot.time;
      const slotEnd = slot.endTime;
      const slotStartMins = timeToMinutes(slotStart);
      const slotEndMins = timeToMinutes(slotEnd);
      
      const isBooked = (bookings as any[])?.some((booking: any) => {
        if (!holdsSlot(booking)) return false;
        return timesOverlap(slotStart, slotEnd, booking.start_time, booking.end_time);
      });

      // Check if slot is blocked (legacy blocked_slots table)
      const isBlocked = (blockedSlots as any[])?.some((blocked: any) => {
        const blockedStart = blocked.start_time.substring(0, 5);
        const blockedEnd = blocked.end_time.substring(0, 5);
        return slotStart < blockedEnd && slotEnd > blockedStart;
      });

      // Check date-specific overrides (partial time blocks)
      const isDateOverridden = dateOverrides.some((o: any) => {
        if (!o.start_time || !o.end_time) return false;
        const oStart = o.start_time.substring(0, 5);
        const oEnd = o.end_time.substring(0, 5);
        return slotStart < oEnd && slotEnd > oStart;
      });

      // For today, filter out past time slots
      let isPast = false;
      if (date === today.toISOString().split('T')[0]) {
        const now = new Date();
        const [slotHour, slotMin] = slotStart.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(slotHour, slotMin, 0, 0);
        isPast = slotTime <= now;
      }

      // Get price based on mode
      let slotPrice = 0;
      if (selectedSlotType) {
        if (mode === 'online') {
          slotPrice = selectedSlotType.online_price || selectedSlotType.price || 0;
        } else if (mode === 'home_visit') {
          slotPrice = selectedSlotType.home_visit_price || (selectedSlotType.offline_price || 0) + (selectedSlotType.home_visit_additional_charge || 500);
        } else {
          slotPrice = selectedSlotType.offline_price || selectedSlotType.price || 0;
        }
      }

      return {
        time: slotStart,
        endTime: slotEnd,
        duration: slotDuration,
        price: slotPrice,
        available: !isBooked && !isBlocked && !isDateOverridden && !isPast,
      };
    });

    // Get doctor info for response
    const { data: doctor } = await supabase
      .from('doctors')
      .select(`
        id,
        consultation_fee,
        google_meet_enabled,
        users:user_id (full_name)
      `)
      .eq('id', doctorId)
      .single();

    // Calculate mode-specific prices for slot types
    const slotTypesWithModePrice = availableSlotTypes.map((st: any) => {
      let price = 0;
      if (mode === 'online') {
        price = st.online_price || st.price || 0;
      } else if (mode === 'home_visit') {
        price = st.home_visit_price || (st.offline_price || 0) + (st.home_visit_additional_charge || 500);
      } else {
        price = st.offline_price || st.price || 0;
      }
      return {
        ...st,
        price, // Current mode price
        online_price: st.online_price,
        offline_price: st.offline_price,
        home_visit_price: st.home_visit_price,
        home_visit_additional_charge: st.home_visit_additional_charge,
      };
    });

    // Get selected slot type with mode-specific price
    const selectedSlotTypeWithPrice = selectedSlotType ? {
      id: selectedSlotType.id,
      duration: selectedSlotType.duration_minutes,
      label: selectedSlotType.label,
      online_price: selectedSlotType.online_price,
      offline_price: selectedSlotType.offline_price,
      home_visit_price: selectedSlotType.home_visit_price,
      home_visit_additional_charge: selectedSlotType.home_visit_additional_charge,
      price: mode === 'online' 
        ? (selectedSlotType.online_price || selectedSlotType.price) 
        : mode === 'home_visit'
          ? (selectedSlotType.home_visit_price || (selectedSlotType.offline_price || 0) + (selectedSlotType.home_visit_additional_charge || 500))
          : (selectedSlotType.offline_price || selectedSlotType.price),
    } : null;

    const doctorData = doctor as any;
    return NextResponse.json({
      success: true,
      data: {
        date,
        dayOfWeek,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
        mode,
        doctor: doctorData ? {
          id: doctorData.id,
          name: doctorData.users?.full_name,
          consultationFee: doctorData.consultation_fee,
          googleMeetEnabled: doctorData.google_meet_enabled,
        } : null,
        slotTypes: slotTypesWithModePrice,
        selectedSlotType: selectedSlotTypeWithPrice,
        slotDuration,
        totalSlots: slotsWithAvailability.length,
        availableSlots: slotsWithAvailability.filter(s => s.available).length,
        slots: slotsWithAvailability,
      },
    });
  } catch (error) {
    console.error('Error in slots API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
