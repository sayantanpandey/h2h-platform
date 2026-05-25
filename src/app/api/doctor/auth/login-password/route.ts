/**
 * POST /api/doctor/auth/login-password
 * Doctor login with email + temporary (or changed) password via Supabase Auth.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';
import { createDoctorLoginResponse } from '@/lib/doctor-session-cookie';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminClient = createAdminClient();

    const { data: userData } = await (adminClient.from('users') as any)
      .select('id, email, full_name, role')
      .eq('email', normalizedEmail)
      .eq('role', 'doctor')
      .single();

    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'No doctor account found with this email address.' },
        { status: 404 }
      );
    }

    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { error: signInError } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password: String(password),
    });

    if (signInError) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    return createDoctorLoginResponse({
      id: (userData as { id: string }).id,
      email: (userData as { email: string }).email,
      fullName: (userData as { full_name: string }).full_name,
      role: 'doctor',
    });
  } catch (error) {
    console.error('Doctor password login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
