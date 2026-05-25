/**
 * H2H Healthcare - Doctor OTP Verify API
 * POST /api/doctor/auth/verify-otp
 * Verifies the OTP and sets a secure doctor session cookie.
 * No Supabase Auth needed — uses a simple signed cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getOTP, incrementAttempts, deleteOTP } from '@/lib/otp-store';
import { createDoctorLoginResponse } from '@/lib/doctor-session-cookie';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const entry = getOTP(normalizedEmail);

    if (!entry) {
      return NextResponse.json({ success: false, error: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    // Check expiry
    if (Date.now() > entry.expiresAt) {
      deleteOTP(normalizedEmail);
      return NextResponse.json({ success: false, error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Check attempts (max 5)
    if (entry.attempts >= 5) {
      deleteOTP(normalizedEmail);
      return NextResponse.json({ success: false, error: 'Too many failed attempts. Please request a new OTP.' }, { status: 429 });
    }

    // Verify OTP
    if (entry.otp !== otp.trim()) {
      incrementAttempts(normalizedEmail);
      const remaining = 5 - (entry.attempts + 1);
      return NextResponse.json({
        success: false,
        error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      }, { status: 400 });
    }

    // OTP is valid - clean up
    deleteOTP(normalizedEmail);

    const adminClient = createAdminClient();

    // Get the doctor's record from our users table
    const { data: userData } = await (adminClient.from('users') as any)
      .select('id, email, full_name, role')
      .eq('email', normalizedEmail)
      .eq('role', 'doctor')
      .single();

    if (!userData) {
      return NextResponse.json({ success: false, error: 'Doctor account not found.' }, { status: 404 });
    }

    console.log(`✅ Doctor ${normalizedEmail} OTP verified. Session cookie set.`);

    return createDoctorLoginResponse({
      id: (userData as { id: string }).id,
      email: (userData as { email: string }).email,
      fullName: (userData as { full_name: string }).full_name,
      role: 'doctor',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

