/**
 * H2H Healthcare - Bookings API
 * Create and manage appointment bookings with slot reservation
 */

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { findSlotConflict, paymentHoldExpiresAt } from '@/lib/appointment-slot';
import { generateJitsiLink } from '@/lib/video-link';
import { NextRequest, NextResponse } from 'next/server';

interface BookingInput {
  doctorId: string;
  serviceId: string;
  locationId?: string;
  centerId?: string; // Clinic center ID
  centerName?: string; // Clinic center name
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  mode: 'online' | 'offline' | 'home_visit';
  amount: number;
  notes?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
}

// Check if slot is available (confirmed + unpaid checkout within payment hold window only)
async function isSlotAvailable(
  supabase: any,
  doctorId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const { data: overlapping, error } = await supabase
    .from('appointments')
    .select('id, status, payment_status, created_at, start_time, end_time')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', date)
    .not('status', 'eq', 'cancelled')
    .or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

  if (error) {
    console.error('Error checking slot availability:', error);
    return false;
  }

  return !findSlotConflict(overlapping || [], startTime, endTime);
}

// GET - Fetch user's bookings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    // Get user's patient record
    const { data: userData } = await adminClient
      .from('users')
      .select('id')
      .eq('email', user.email as string)
      .single();

    if (!userData) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    let query = adminClient
      .from('appointments')
      .select(`
        *,
        doctor:doctors(
          id,
          consultation_fee,
          users:user_id(full_name, avatar_url)
        ),
        service:services(id, name, slug, duration_minutes),
        location:locations(id, name, city)
      `)
      .eq('patient_id', (userData as any).id)
      .order('appointment_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch bookings',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: bookings || [],
    });
  } catch (error) {
    console.error('Error in bookings GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// POST - Create new booking
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    const body: BookingInput = await request.json();

    const {
      doctorId,
      serviceId,
      locationId,
      centerId,
      centerName,
      date,
      startTime,
      endTime,
      mode,
      amount,
      notes,
      patientName,
      patientEmail,
      patientPhone,
    } = body;

    // Validate required fields
    if (!doctorId || !serviceId || !date || !startTime || !endTime || !mode) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: doctorId, serviceId, date, startTime, endTime, mode',
      }, { status: 400 });
    }

    // Validate date is not in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return NextResponse.json({
        success: false,
        error: 'Cannot book appointments for past dates',
      }, { status: 400 });
    }

    // Check slot availability (prevent double booking)
    const slotAvailable = await isSlotAvailable(adminClient, doctorId, date, startTime, endTime);
    
    if (!slotAvailable) {
      return NextResponse.json({
        success: false,
        error: 'This time slot is no longer available. Please select another slot.',
      }, { status: 409 }); // Conflict
    }

    // Get or create patient user
    let patientId: string;
    
    if (user) {
      // Logged in user - try by auth ID first, then by email
      const { data: existingById } = await adminClient
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (existingById) {
        patientId = (existingById as any).id;
      } else {
        // Check by email
        const { data: existingByEmail } = await adminClient
          .from('users')
          .select('id')
          .eq('email', user.email as string)
          .single();

        if (existingByEmail) {
          patientId = (existingByEmail as any).id;
        } else {
          // Create user record with auth user.id so IDs match
          const { data: newUser, error: userError } = await adminClient
            .from('users')
            .insert({
              id: user.id,
              email: user.email as string,
              full_name: user.user_metadata?.full_name || patientName || 'Patient',
              phone: patientPhone || null,
              role: 'patient',
              is_active: true,
            } as any)
            .select('id')
            .single();

          if (userError) {
            console.error('Error creating user:', userError);
            return NextResponse.json({
              success: false,
              error: 'Failed to create user record',
            }, { status: 500 });
          }

          patientId = (newUser as any).id;
        }
      }
    } else if (patientEmail) {
      // Guest booking with email
      const { data: existingUser } = await adminClient
        .from('users')
        .select('id')
        .eq('email', patientEmail)
        .single();

      if (existingUser) {
        patientId = (existingUser as any).id;
      } else {
        const { data: newUser, error: userError } = await adminClient
          .from('users')
          .insert({
            email: patientEmail,
            full_name: patientName || 'Guest Patient',
            phone: patientPhone || null,
            role: 'patient',
            is_active: true,
          } as any)
          .select('id')
          .single();

        if (userError) {
          console.error('Error creating guest user:', userError);
          return NextResponse.json({
            success: false,
            error: 'Failed to create user record',
          }, { status: 500 });
        }

        patientId = (newUser as any).id;
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Authentication or patient email required',
      }, { status: 401 });
    }

    // Sanitize locationId - must be a valid UUID or null
    // Online mode: no physical location; use null to avoid FK violation
    const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    let finalLocationId: string | null = null;
    if (mode !== 'online') {
      finalLocationId = (locationId && isValidUUID(locationId)) ? locationId : null;
      if (!finalLocationId) {
        const { data: doctor } = await adminClient
          .from('doctors')
          .select('location_id')
          .eq('id', doctorId)
          .single();
        const docLoc = (doctor as any)?.location_id;
        if (docLoc && isValidUUID(docLoc)) finalLocationId = docLoc;
      }
    }

    // Create the appointment
    const { data: appointment, error: appointmentError } = await adminClient
      .from('appointments')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        service_id: serviceId,
        location_id: finalLocationId || null,
        appointment_date: date,
        start_time: startTime,
        end_time: endTime,
        mode,
        status: 'pending', // Will be confirmed after payment
        payment_status: 'pending',
        amount: amount || 0,
        notes: notes || null,
        metadata: {
          booked_at: new Date().toISOString(),
          payment_hold_expires_at: paymentHoldExpiresAt(new Date().toISOString()).toISOString(),
          user_agent: request.headers.get('user-agent'),
          center_id: (centerId && isValidUUID(centerId)) ? centerId : null,
          center_name: centerName || null,
          patient_name: patientName || null,
          patient_phone: patientPhone || null,
        },
      } as any)
      .select(`
        *,
        doctor:doctors(
          id,
          consultation_fee,
          google_meet_enabled,
          users:user_id(full_name, email)
        ),
        service:services(id, name, duration_minutes),
        location:locations(id, name, city, address)
      `)
      .single();

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create appointment: ' + appointmentError.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: appointment,
      message: 'Appointment booked successfully. Please complete payment to confirm.',
    });
  } catch (error) {
    console.error('Error in bookings POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

// Generate a unique Google Meet-style link
function generateMeetLink(appointmentId: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const generateSegment = (len: number) => 
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  
  // Format: xxx-xxxx-xxx (like Google Meet)
  const meetCode = `${generateSegment(3)}-${generateSegment(4)}-${generateSegment(3)}`;
  return `https://meet.google.com/${meetCode}`;
}

// PUT - Update booking (confirm after payment, cancel, etc.)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    const body = await request.json();
    const { id, status, paymentStatus, razorpayOrderId, razorpayPaymentId, googleMeetLink, cancellationReason } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Appointment ID is required',
      }, { status: 400 });
    }

    // Get current appointment to check mode
    const { data: currentAppointment } = await adminClient
      .from('appointments')
      .select('mode, google_meet_link')
      .eq('id', id)
      .single();

    // Build update object
    const updates: any = { updated_at: new Date().toISOString() };
    
    if (status) updates.status = status;
    if (paymentStatus) updates.payment_status = paymentStatus;
    if (razorpayOrderId) updates.razorpay_order_id = razorpayOrderId;
    if (razorpayPaymentId) updates.razorpay_payment_id = razorpayPaymentId;
    if (googleMeetLink) updates.google_meet_link = googleMeetLink;
    if (cancellationReason) updates.cancellation_reason = cancellationReason;

    // If confirming booking after payment, update status
    if (paymentStatus === 'paid' && !status) {
      updates.status = 'confirmed';
      
      // Generate Google Meet link for online appointments if not already set
      const appointmentData = currentAppointment as any;
      if (appointmentData?.mode === 'online' && !appointmentData?.google_meet_link && !googleMeetLink) {
        updates.google_meet_link = generateJitsiLink(id);
      }
    }

    const { data: appointment, error } = await (adminClient
      .from('appointments') as any)
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        doctor:doctors(
          id,
          users:user_id(full_name, email)
        ),
        service:services(id, name),
        location:locations(id, name, city)
      `)
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to update appointment',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: appointment,
      message: status === 'cancelled' ? 'Appointment cancelled' : 'Appointment updated successfully',
    });
  } catch (error) {
    console.error('Error in bookings PUT:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
