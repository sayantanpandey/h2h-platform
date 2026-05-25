/**
 * H2H Healthcare - Clinic Center Availability API
 * Get availability for a specific date or date range
 */

import { holdsSlot } from '@/lib/appointment-slot';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ centerId: string }>;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * GET /api/clinic-centers/[centerId]/availability
 * Query params:
 * - date: Specific date (YYYY-MM-DD)
 * - startDate: Start of range (YYYY-MM-DD)
 * - endDate: End of range (YYYY-MM-DD)
 * - days: Number of days from today (default: 14)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { centerId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const days = parseInt(searchParams.get('days') || '14');
    
    const supabase = await createClient();
    
    // Get center's weekly availability
    const { data: center, error: centerError } = await supabase
      .from('clinic_centers')
      .select(`
        id,
        name,
        availability:clinic_center_availability (
          day_of_week,
          is_open,
          open_time,
          close_time,
          break_start,
          break_end,
          max_appointments,
          current_bookings
        )
      `)
      .eq('id', centerId)
      .eq('is_active', true)
      .single();

    if (centerError || !center) {
      return NextResponse.json({
        success: false,
        error: 'Clinic center not found',
      }, { status: 404 });
    }

    const centerData = center as any;

    // Determine date range
    let start: Date;
    let end: Date;
    
    if (date) {
      // Single date
      start = new Date(date);
      end = new Date(date);
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // Default: next N days
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + days - 1);
    }

    // Get closures in the date range
    const { data: closures } = await supabase
      .from('clinic_center_closures')
      .select('*')
      .eq('center_id', centerId)
      .gte('closure_date', start.toISOString().split('T')[0])
      .lte('closure_date', end.toISOString().split('T')[0]);

    const closureMap = new Map(
      (closures || []).map((c: any) => [c.closure_date, c])
    );

    // Get existing appointments count per date
    const { data: appointmentCounts } = await supabase
      .from('appointments')
      .select('appointment_date, status, payment_status, created_at')
      .eq('location_id', centerId)
      .gte('appointment_date', start.toISOString().split('T')[0])
      .lte('appointment_date', end.toISOString().split('T')[0])
      .not('status', 'eq', 'cancelled');

    const appointmentCountMap = new Map<string, number>();
    (appointmentCounts || []).forEach((apt: any) => {
      if (!holdsSlot(apt)) return;
      const dateStr = apt.appointment_date;
      appointmentCountMap.set(dateStr, (appointmentCountMap.get(dateStr) || 0) + 1);
    });

    // Build availability for each date
    const availabilityByDate: any[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();
      
      const weeklyAvail = ((centerData.availability as any[]) || []).find(
        (a: any) => a.day_of_week === dayOfWeek
      );
      
      const closure = closureMap.get(dateStr);
      const bookedCount = appointmentCountMap.get(dateStr) || 0;
      const maxAppointments = weeklyAvail?.max_appointments || 0;
      
      let status: 'open' | 'closed' | 'full' | 'limited';
      let availableSlots = 0;
      
      if (closure?.is_full_day || !weeklyAvail?.is_open) {
        status = 'closed';
      } else {
        availableSlots = Math.max(0, maxAppointments - bookedCount);
        if (availableSlots === 0) {
          status = 'full';
        } else if (availableSlots <= maxAppointments * 0.2) {
          status = 'limited';
        } else {
          status = 'open';
        }
      }

      availabilityByDate.push({
        date: dateStr,
        dayOfWeek,
        dayName: DAY_NAMES[dayOfWeek],
        isOpen: weeklyAvail?.is_open && !closure?.is_full_day,
        status,
        openTime: weeklyAvail?.open_time?.substring(0, 5) || null,
        closeTime: weeklyAvail?.close_time?.substring(0, 5) || null,
        breakStart: weeklyAvail?.break_start?.substring(0, 5) || null,
        breakEnd: weeklyAvail?.break_end?.substring(0, 5) || null,
        maxAppointments,
        bookedCount,
        availableSlots,
        closureReason: closure?.reason || null,
        isPast: current < new Date(new Date().setHours(0, 0, 0, 0)),
      });

      current.setDate(current.getDate() + 1);
    }

    // Summary stats
    const openDays = availabilityByDate.filter(d => d.status === 'open' || d.status === 'limited');
    const totalAvailableSlots = availabilityByDate.reduce((sum, d) => sum + d.availableSlots, 0);

    return NextResponse.json({
      success: true,
      data: {
        centerId,
        centerName: centerData.name,
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          totalDays: availabilityByDate.length,
        },
        summary: {
          openDays: openDays.length,
          closedDays: availabilityByDate.filter(d => d.status === 'closed').length,
          fullDays: availabilityByDate.filter(d => d.status === 'full').length,
          limitedDays: availabilityByDate.filter(d => d.status === 'limited').length,
          totalAvailableSlots,
        },
        availability: availabilityByDate,
      },
    });
  } catch (error) {
    console.error('Error fetching center availability:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
