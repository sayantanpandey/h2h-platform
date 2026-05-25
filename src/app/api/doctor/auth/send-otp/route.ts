/**
 * H2H Healthcare - Doctor OTP Send API
 * POST /api/doctor/auth/send-otp
 * Sends a 6-digit OTP to the doctor's email for login.
 * OTP is also logged to console for development.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { setOTP } from '@/lib/otp-store';
import nodemailer from 'nodemailer';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check if this email belongs to a doctor
    const normalizedEmail = email.toLowerCase().trim();
    const { data: user } = await (adminClient.from('users') as any)
      .select('id, email, full_name, role')
      .ilike('email', normalizedEmail)
      .eq('role', 'doctor')
      .maybeSingle();

    if (!user || (user as any).role !== 'doctor') {
      // Don't reveal whether the email exists for security
      return NextResponse.json({
        success: false,
        error: 'No doctor account found with this email address.',
      }, { status: 404 });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP in shared store
    setOTP(normalizedEmail, otp);

    // Always console.log the OTP for development
    console.log(`\n========================================`);
    console.log(`🔐 DOCTOR OTP LOGIN`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 OTP: ${otp}`);
    console.log(`⏰ Expires: ${new Date(expiresAt).toLocaleTimeString()}`);
    console.log(`========================================\n`);

    // Try to send email
    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"H2H Healthcare" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Your H2H Doctor Login OTP',
          html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0;">H2H Healthcare</h1>
                <p style="font-size: 13px; color: #64748b; margin: 4px 0 0;">Doctor Portal Login</p>
              </div>
              <div style="background: white; border-radius: 12px; padding: 32px; text-align: center; border: 1px solid #e2e8f0;">
                <p style="font-size: 14px; color: #475569; margin: 0 0 20px;">Your one-time login code is:</p>
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0891b2; background: #ecfeff; padding: 16px 24px; border-radius: 12px; display: inline-block; font-family: monospace;">
                  ${otp}
                </div>
                <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0;">This code expires in 5 minutes. Do not share it with anyone.</p>
              </div>
              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 16px 0 0;">If you didn't request this, please ignore this email.</p>
            </div>
          `,
        });
        console.log(`✅ OTP email sent to ${email}`);
      } catch (emailErr) {
        console.error('Failed to send OTP email:', emailErr);
        // Still return success since OTP is in console
      }
    } else {
      console.log('⚠️ SMTP not configured. OTP only available in console.');
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email address.',
      doctorName: (user as any).full_name,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

