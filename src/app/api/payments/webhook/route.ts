/**
 * H2H Healthcare - Razorpay Webhook Handler
 * Handles payment events from Razorpay (payment.captured, payment.failed, refund.created)
 */

import { releaseUnpaidAppointment } from '@/lib/release-unpaid-appointment';
import { createAdminClient } from '@/lib/supabase/server';
import { createVideoRoomUrls } from '@/lib/video-link';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendPaymentSuccessEmail } from '@/lib/resend';
import { format } from 'date-fns';

// Disable body parsing for webhook
export const runtime = 'nodejs';

interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
        description: string;
        email: string;
        contact: string;
        notes: {
          appointmentId?: string;
          userId?: string;
        };
        created_at: number;
      };
    };
    refund?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        payment_id: string;
        status: string;
        created_at: number;
      };
    };
  };
  created_at: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error('Missing Razorpay signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook secret is configured
    if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid Razorpay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload: RazorpayWebhookPayload = JSON.parse(body);
    const supabase = createAdminClient();

    console.log('=== RAZORPAY WEBHOOK RECEIVED ===');
    console.log('Event:', payload.event);

    switch (payload.event) {
      case 'payment.captured': {
        const payment = payload.payload.payment?.entity;
        if (!payment) {
          console.error('No payment entity in webhook payload');
          break;
        }

        console.log('Payment ID:', payment.id);
        console.log('Order ID:', payment.order_id);
        console.log('Amount:', payment.amount / 100);
        console.log('Email:', payment.email);

        // Update payment record
        const { error: paymentUpdateError } = await (supabase as any)
          .from('payments')
          .update({
            razorpay_payment_id: payment.id,
            status: 'success',
            payment_method: payment.method,
          })
          .eq('razorpay_order_id', payment.order_id);

        if (paymentUpdateError) {
          console.error('Error updating payment record:', paymentUpdateError);
        } else {
          console.log('✓ Payment record updated');
        }

        // Fetch appointment for video room creation
        const { data: preApt } = await supabase
          .from('appointments')
          .select(`
            id, mode, google_meet_link, appointment_date, start_time, end_time, metadata,
            doctor:doctor_id(users:user_id(full_name))
          `)
          .eq('razorpay_order_id', payment.order_id)
          .single();

        const updates: Record<string, unknown> = {
          razorpay_payment_id: payment.id,
          payment_status: 'paid',
          status: 'confirmed',
        };

        // Create video room for online (Daily.co = doctor host, else Jitsi fallback)
        const pre = preApt as { id?: string; mode?: string; google_meet_link?: string; appointment_date?: string; start_time?: string; end_time?: string; metadata?: Record<string, unknown>; doctor?: { users?: { full_name?: string } } } | null;
        if (pre?.mode === 'online' && !pre?.google_meet_link && pre?.id) {
          try {
            const doctorName = pre?.doctor?.users?.full_name || 'Doctor';
            const urls = await createVideoRoomUrls({
              appointmentId: pre.id,
              doctorName,
              appointmentDate: pre.appointment_date || '',
              startTime: pre.start_time,
              endTime: pre.end_time,
            });
            updates.google_meet_link = urls.patientUrl;
            const existingMeta = pre.metadata && typeof pre.metadata === 'object' && !Array.isArray(pre.metadata)
              ? { ...(pre.metadata as Record<string, unknown>) }
              : {};
            updates.metadata = {
              ...existingMeta,
              doctor_video_url: urls.doctorUrl,
              admin_video_url: urls.adminUrl,
            };
          } catch (err) {
            console.error('Video room creation failed, using Jitsi fallback:', err);
            const { generateJitsiLink } = await import('@/lib/video-link');
            updates.google_meet_link = generateJitsiLink(pre.id);
          }
        }

        const { error: appointmentUpdateError } = await (supabase as any)
          .from('appointments')
          .update(updates)
          .eq('razorpay_order_id', payment.order_id);

        if (appointmentUpdateError) {
          console.error('Error updating appointment:', appointmentUpdateError);
        } else {
          console.log('✓ Appointment status updated to confirmed');
        }

        // Fetch appointment details for email
        const { data: appointment, error: appointmentError } = await supabase
          .from('appointments')
          .select(`
            id,
            patient_id,
            doctor_id,
            service_id,
            location_id,
            appointment_date,
            start_time,
            end_time,
            mode,
            amount,
            google_meet_link
          `)
          .eq('razorpay_order_id', payment.order_id)
          .single();

        // Fetch related data separately to avoid foreign key issues
        let doctorName = 'Doctor';
        let serviceName = 'Healthcare Service';
        let locationData: { name: string; city: string; address: string } | null = null;

        if (appointment) {
          // Get doctor name
          if ((appointment as any).doctor_id) {
            const { data: doctor } = await supabase
              .from('doctors')
              .select('user_id')
              .eq('id', (appointment as any).doctor_id)
              .single();
            
            if ((doctor as any)?.user_id) {
              const { data: doctorUser } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', (doctor as any).user_id)
                .single();
              doctorName = (doctorUser as any)?.full_name || 'Doctor';
            }
          }

          // Get service name
          if ((appointment as any).service_id) {
            const { data: service } = await supabase
              .from('services')
              .select('name')
              .eq('id', (appointment as any).service_id)
              .single();
            serviceName = (service as any)?.name || 'Healthcare Service';
          }

          // Get location
          if ((appointment as any).location_id) {
            const { data: location } = await supabase
              .from('locations')
              .select('name, city, address')
              .eq('id', (appointment as any).location_id)
              .single();
            locationData = location as any;
          }
        }

        // Fetch patient details separately
        let patientData: { full_name: string; email: string } | null = null;
        if ((appointment as any)?.patient_id) {
          const { data: patient } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', (appointment as any).patient_id)
            .single();
          patientData = patient as { full_name: string; email: string } | null;
        }

        if (appointmentError) {
          console.error('Error fetching appointment for email:', appointmentError);
        }

        // Send confirmation email
        if (appointment) {
          const patientEmail = patientData?.email || payment.email;
          const patientName = patientData?.full_name || 'Valued Patient';
          const locationText = (appointment as any).mode === 'online' 
            ? 'Online Video Consultation' 
            : locationData 
              ? `${locationData.name}, ${locationData.city}` 
              : 'H2H Healthcare Clinic';

          console.log('Preparing to send email...');
          console.log('Patient Email:', patientEmail);
          console.log('Patient Name:', patientName);
          console.log('Doctor Name:', doctorName);
          console.log('Service:', serviceName);
          console.log('Location:', locationText);

          if (patientEmail) {
            try {
              const emailResult = await sendPaymentSuccessEmail(patientEmail, {
                patientName,
                serviceName,
                doctorName,
                date: format(new Date((appointment as any).appointment_date), 'EEEE, MMMM d, yyyy'),
                time: (appointment as any).start_time?.substring(0, 5) || '00:00',
                location: locationText,
                amount: Number((appointment as any).amount) || payment.amount / 100,
                meetLink: (appointment as any).mode === 'online' ? (appointment as any).google_meet_link : undefined,
              });
              console.log('✓ Confirmation email sent to:', patientEmail);
              console.log('Email result:', emailResult);
            } catch (emailError) {
              console.error('✗ Failed to send confirmation email:', emailError);
            }
          } else {
            console.log('✗ No patient email found, skipping email');
          }
        } else {
          console.log('✗ No appointment found for order:', payment.order_id);
        }
        
        console.log('=== PAYMENT CAPTURED COMPLETE ===');
        console.log('Payment ID:', payment.id);
        break;
      }

      case 'payment.failed': {
        const payment = payload.payload.payment?.entity;
        if (!payment) break;

        await (supabase as any)
          .from('payments')
          .update({
            razorpay_payment_id: payment.id,
            status: 'failed',
          })
          .eq('razorpay_order_id', payment.order_id);

        const { data: failedApt } = await (supabase as any)
          .from('appointments')
          .select('id, metadata')
          .eq('razorpay_order_id', payment.order_id)
          .single();

        if (failedApt?.id) {
          await releaseUnpaidAppointment(supabase, failedApt.id, 'payment_failed');
        } else {
          await (supabase as any)
            .from('appointments')
            .update({ payment_status: 'failed', status: 'cancelled' })
            .eq('razorpay_order_id', payment.order_id);
        }

        console.log('Payment failed — slot released:', payment.id);
        break;
      }

      case 'refund.created': {
        const refund = payload.payload.refund?.entity;
        if (!refund) break;

        // Update payment record
        await (supabase as any)
          .from('payments')
          .update({
            status: 'refunded',
          })
          .eq('razorpay_payment_id', refund.payment_id);

        // Update appointment payment status
        const { data: payment } = await supabase
          .from('payments')
          .select('appointment_id')
          .eq('razorpay_payment_id', refund.payment_id)
          .single() as { data: { appointment_id: string } | null; error: any };

        if (payment?.appointment_id) {
          await (supabase as any)
            .from('appointments')
            .update({
              payment_status: 'refunded',
              status: 'cancelled',
            })
            .eq('id', payment.appointment_id);
        }

        console.log('Refund created:', refund.id);
        break;
      }

      default:
        console.log('Unhandled webhook event:', payload.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
