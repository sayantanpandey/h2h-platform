/**
 * H2H Healthcare - Create Razorpay Order API
 * Creates a payment order for an appointment booking
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Lazy initialization to prevent build errors
let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

interface AppointmentData {
  id: string;
  amount: number;
  patient_id: string;
  razorpay_order_id: string | null;
  service: { name: string } | { name: string }[] | null;
}

interface UserData {
  full_name: string;
  email: string;
  phone: string | null;
}

function serviceNameFromAppointment(appointment: AppointmentData): string {
  const s = appointment.service;
  if (!s) return 'Healthcare Service';
  if (Array.isArray(s)) return s[0]?.name || 'Healthcare Service';
  return s.name || 'Healthcare Service';
}

/** Razorpay requires receipt ≤40 chars and unique per order (duplicate receipt same day → API error). */
function uniqueReceipt(appointmentId: string): string {
  const uuidCompact = appointmentId.replace(/-/g, '');
  const stamp = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  const raw = `${uuidCompact}${stamp}`;
  return raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
}

function razorpayErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const err = e.error as Record<string, unknown> | undefined;
    const desc =
      (typeof err?.description === 'string' && err.description) ||
      (typeof e.description === 'string' && e.description) ||
      (typeof e.message === 'string' && e.message);
    if (desc) return desc;
  }
  if (error instanceof Error) return error.message;
  return 'Failed to create order';
}

export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET ||
      !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    ) {
      console.error(
        'Razorpay env missing: set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and NEXT_PUBLIC_RAZORPAY_KEY_ID'
      );
      return NextResponse.json(
        { error: 'Payment provider is not configured. Please try again later or contact support.' },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Fetch appointment with service details (use admin client to bypass RLS)
    const { data: appointment, error: appointmentError } = await adminClient
      .from('appointments')
      .select(`
        id, amount, patient_id, razorpay_order_id,
        service:services(name)
      `)
      .eq('id', appointmentId)
      .single() as { data: AppointmentData | null; error: any };

    if (appointmentError || !appointment) {
      console.error('Appointment fetch error:', appointmentError);
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Verify the logged-in user owns this appointment (email, phone, or auth id === patient row)
    const { data: patientUser } = await adminClient
      .from('users')
      .select('id, email, phone')
      .eq('id', appointment.patient_id)
      .single() as { data: { id: string; email: string | null; phone: string | null } | null; error: any };

    const userEmail = user.email?.trim().toLowerCase() ?? '';
    const patientEmail = patientUser?.email?.trim().toLowerCase() ?? '';
    const emailMatches = userEmail.length > 0 && patientEmail === userEmail;
    const idMatches = appointment.patient_id === user.id;

    const normPhone = (p: string | null | undefined) =>
      (p || '').replace(/\s/g, '').replace(/^\+91/, '').replace(/^91/, '');
    const userPhone = normPhone((user as { phone?: string }).phone);
    const patientPhone = normPhone(patientUser?.phone);
    const phoneMatches =
      userPhone.length >= 10 &&
      patientPhone.length >= 10 &&
      userPhone.slice(-10) === patientPhone.slice(-10);

    if (!patientUser || (!emailMatches && !idMatches && !phoneMatches)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch user details for prefill
    const { data: userData } = await adminClient
      .from('users')
      .select('full_name, email, phone')
      .eq('id', appointment.patient_id)
      .single() as { data: UserData | null; error: any };

    const svcName = serviceNameFromAppointment(appointment);
    const amountPaise = Math.max(100, Math.round(Number(appointment.amount) * 100)); // min ₹1 (100 paise)

    // Idempotent: booking already has a Razorpay order (retry / double submit) — return same checkout payload
    if (appointment.razorpay_order_id) {
      return NextResponse.json({
        success: true,
        orderId: appointment.razorpay_order_id,
        amount: amountPaise,
        currency: 'INR',
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        prefill: {
          name: userData?.full_name || '',
          email: userData?.email || user.email || '',
          contact: userData?.phone || '',
        },
        notes: {
          service: svcName,
        },
      });
    }

    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: uniqueReceipt(appointmentId),
      notes: {
        appointmentId,
        userId: user.id,
        service: svcName,
      },
    };

    let order: { id: string; amount: number | string; currency: string };
    try {
      order = (await getRazorpay().orders.create(options)) as {
        id: string;
        amount: number | string;
        currency: string;
      };
    } catch (rzErr) {
      console.error('Razorpay orders.create failed:', rzErr);
      const rzMsg = razorpayErrorMessage(rzErr);
      const hint =
        rzMsg.toLowerCase().includes('authentication') && process.env.NODE_ENV === 'development'
          ? ' Check RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env match your Razorpay Test keys, then restart npm run dev.'
          : '';
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'development'
              ? rzMsg + hint
              : 'Could not start payment. Please try again in a moment.',
        },
        { status: 502 }
      );
    }

    // Update appointment with order ID
    const { error: apptErr } = await (adminClient
      .from('appointments') as any)
      .update({ razorpay_order_id: order.id })
      .eq('id', appointmentId);

    if (apptErr) {
      console.error('Failed to attach razorpay_order_id to appointment:', apptErr);
      return NextResponse.json({ error: 'Failed to save payment reference' }, { status: 500 });
    }

    // Create payment record (non-fatal: order exists + appointment updated — user can still pay)
    const { error: payErr } = await (adminClient
      .from('payments') as any)
      .insert({
        appointment_id: appointmentId,
        user_id: appointment.patient_id,
        amount: appointment.amount,
        currency: 'INR',
        razorpay_order_id: order.id,
        status: 'pending',
      });

    if (payErr && payErr.code !== '23505') {
      console.error('payments insert error (checkout still allowed):', payErr);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      prefill: {
        name: userData?.full_name || '',
        email: userData?.email || user.email || '',
        contact: userData?.phone || '',
      },
      notes: {
        service: svcName,
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    const message = razorpayErrorMessage(error);
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : 'Failed to create order' },
      { status: 500 }
    );
  }
}
