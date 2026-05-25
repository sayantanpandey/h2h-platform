/**
 * H2H Healthcare - Verify Razorpay Payment API
 * Verifies payment signature and updates appointment status
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createVideoRoomUrls } from '@/lib/video-link';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendAppointmentConfirmationEmails } from '@/lib/email';
import { invoiceDataFromAppointment } from '@/lib/invoice';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // Verify environment variable exists
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('RAZORPAY_KEY_SECRET not configured');
      return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error('Invalid Razorpay signature', { razorpay_order_id, razorpay_payment_id });
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Update payment record
    const { error: paymentError } = await (adminClient
      .from('payments') as any)
      .update({
        razorpay_payment_id,
        status: 'pending', // DB only allows: pending, failed, refunded
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (paymentError) {
      console.error('Payment update error:', paymentError);
    }

    // Fetch appointment for video room creation (needs doctor name, date, time)
    const { data: preAppointment } = await (adminClient
      .from('appointments') as any)
      .select(`
        id, mode, google_meet_link, appointment_date, start_time, end_time, metadata,
        doctor:doctor_id(users:user_id(full_name))
      `)
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    const updates: any = {
      razorpay_payment_id,
      payment_status: 'paid',
      status: 'confirmed',
    };

    // Create video room for online appointments (Daily.co = doctor host, else Jitsi fallback)
    if (preAppointment?.mode === 'online' && !preAppointment?.google_meet_link && preAppointment?.id) {
      try {
        const doctorName = preAppointment?.doctor?.users?.full_name || 'Doctor';
        const urls = await createVideoRoomUrls({
          appointmentId: preAppointment.id,
          doctorName,
          appointmentDate: preAppointment.appointment_date,
          startTime: preAppointment.start_time,
          endTime: preAppointment.end_time,
        });
        updates.google_meet_link = urls.patientUrl;
        const existingMeta = preAppointment.metadata && typeof preAppointment.metadata === 'object' && !Array.isArray(preAppointment.metadata)
          ? { ...(preAppointment.metadata as Record<string, unknown>) }
          : {};
        updates.metadata = {
          ...existingMeta,
          doctor_video_url: urls.doctorUrl,
          admin_video_url: urls.adminUrl,
        };
      } catch (err) {
        console.error('Video room creation failed, using Jitsi fallback:', err);
        const { generateJitsiLink } = await import('@/lib/video-link');
        updates.google_meet_link = generateJitsiLink(preAppointment.id);
      }
    }

    // Update appointment status to confirmed after payment
    const { data: appointment, error: appointmentError } = await (adminClient
      .from('appointments') as any)
      .update(updates)
      .eq('razorpay_order_id', razorpay_order_id)
      .select(`
        *,
        doctor:doctor_id(id, users:user_id(full_name, email)),
        service:service_id(id, name, duration_minutes),
        location:location_id(id, name, city, address),
        patient:patient_id(id, full_name, email, phone)
      `)
      .single();

    if (appointmentError) {
      console.error('Appointment update error:', appointmentError);
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
    }

    // Build Google Calendar "Add to Calendar" URL
    let calendarUrl: string | null = null;
    if (appointment) {
      const apt = appointment as any;
      const startDT = `${apt.appointment_date.replace(/-/g, '')}T${apt.start_time.replace(/:/g, '')}00`;
      const endDT = `${apt.appointment_date.replace(/-/g, '')}T${apt.end_time.replace(/:/g, '')}00`;
      const doctorName = apt.doctor?.users?.full_name || 'Doctor';
      const serviceName = apt.service?.name || 'Appointment';
      const locationText = apt.mode === 'online'
        ? (apt.google_meet_link || 'Online')
        : `${apt.location?.name || ''}, ${apt.location?.city || ''}`;
      const details = `H2H Healthcare Appointment\nService: ${serviceName}\nDoctor: ${doctorName}\nMode: ${apt.mode === 'online' ? 'Video Consultation' : 'In-Clinic'}\n${apt.google_meet_link ? 'Meet Link: ' + apt.google_meet_link : ''}`;

      calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`H2H: ${serviceName} with ${doctorName}`)}&dates=${startDT}/${endDT}&ctz=Asia/Kolkata&details=${encodeURIComponent(details)}&location=${encodeURIComponent(locationText)}`;
    }

    // Send confirmation emails (non-blocking - don't fail payment if email fails)
    if (appointment) {
      const apt = appointment as Record<string, unknown>;
      const doctorName =
        (apt.doctor as { users?: { full_name?: string } })?.users?.full_name || 'Doctor';
      const cleanDoctorName = String(doctorName).replace(/^Dr\.?\s*/i, '');

      let paymentMethodLabel = 'Razorpay (Online)';
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const rz = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });
          const pay = await rz.payments.fetch(razorpay_payment_id);
          const method = (pay as { method?: string }).method;
          if (method) paymentMethodLabel = `Razorpay (${String(method).toUpperCase()})`;
        } catch {
          /* use default label */
        }
      }

      const aptForInvoice = {
        ...apt,
        razorpay_payment_id,
        payment_method_label: paymentMethodLabel,
      };
      const patientEmail = String(
        (apt.patient as { email?: string })?.email || user.email || ''
      ).trim();
      const invoicePayload = patientEmail
        ? invoiceDataFromAppointment(aptForInvoice)
        : null;

      sendAppointmentConfirmationEmails({
        appointmentId: String(apt.id),
        patientName: String((apt.patient as { full_name?: string })?.full_name || 'Patient'),
        patientEmail,
        doctorName: cleanDoctorName,
        doctorEmail: String((apt.doctor as { users?: { email?: string } })?.users?.email || ''),
        serviceName: String((apt.service as { name?: string })?.name || 'Consultation'),
        appointmentDate: String(apt.appointment_date),
        startTime: String(apt.start_time),
        endTime: String(apt.end_time),
        mode: apt.mode as 'online' | 'offline' | 'home_visit',
        amount: parseFloat(String(apt.amount)) || 0,
        locationName: (apt.location as { name?: string })?.name || undefined,
        locationCity: (apt.location as { city?: string })?.city || undefined,
        googleMeetLink: (apt.google_meet_link as string) || null,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        invoicePayload,
      }).catch(err => console.error('Email sending failed:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      appointmentId: appointment?.id,
      googleMeetLink: (appointment as any)?.google_meet_link || null,
      calendarUrl,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
