/**
 * Signed doctor_session cookie — shared by OTP and password login.
 */

import crypto from 'crypto';
import { NextResponse } from 'next/server';

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'doctor-session-secret';

function signPayload(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
}

export interface DoctorSessionUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export function buildDoctorSessionToken(user: DoctorSessionUser): string {
  const sessionData = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: 'doctor',
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const payload = Buffer.from(JSON.stringify(sessionData)).toString('base64');
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function attachDoctorSessionCookie(
  response: NextResponse,
  user: DoctorSessionUser
): NextResponse {
  response.cookies.set('doctor_session', buildDoctorSessionToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
  return response;
}

export function createDoctorLoginResponse(user: DoctorSessionUser): NextResponse {
  const response = NextResponse.json({
    success: true,
    verified: true,
    message: 'Logged in successfully.',
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: 'doctor',
    },
  });
  return attachDoctorSessionCookie(response, user);
}
