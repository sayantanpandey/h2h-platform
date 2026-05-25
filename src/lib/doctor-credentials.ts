/**
 * Doctor onboarding — Supabase Auth account + welcome email with temporary password.
 */

import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  const bytes = crypto.randomBytes(14);
  let password = '';
  for (let i = 0; i < 14; i++) {
    password += chars[bytes[i]! % chars.length];
  }
  return password;
}

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
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

async function findAuthUserByEmail(
  adminClient: SupabaseClient,
  email: string
): Promise<{ id: string; email?: string } | null> {
  let page = 1;
  const perPage = 200;
  const target = email.toLowerCase();

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('listUsers error:', error);
      return null;
    }
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return { id: match.id, email: match.email };
    if (data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

export interface EnsureDoctorAuthResult {
  authUserId: string;
  temporaryPassword: string;
  authCreated: boolean;
}

/**
 * Ensures a Supabase Auth user exists for this doctor email and sets a fresh temporary password.
 */
export async function ensureDoctorAuthUser(
  adminClient: SupabaseClient,
  email: string,
  fullName: string,
  existingPublicUserId?: string
): Promise<EnsureDoctorAuthResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const temporaryPassword = generateTemporaryPassword();

  if (existingPublicUserId) {
    const { data: byId } = await adminClient.auth.admin.getUserById(existingPublicUserId);
    if (byId?.user) {
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(existingPublicUserId, {
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: 'doctor' },
      });
      if (updateErr) throw new Error(updateErr.message);
      return { authUserId: existingPublicUserId, temporaryPassword, authCreated: false };
    }
  }

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: normalizedEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'doctor' },
  });

  if (!createErr && created.user) {
    return { authUserId: created.user.id, temporaryPassword, authCreated: true };
  }

  const alreadyExists =
    createErr?.message?.toLowerCase().includes('already') ||
    createErr?.message?.toLowerCase().includes('registered') ||
    createErr?.status === 422;

  if (alreadyExists) {
    const existingAuth = await findAuthUserByEmail(adminClient, normalizedEmail);
    if (!existingAuth) {
      throw new Error('This email is already registered but could not be linked. Contact support.');
    }
    const { error: updateErr } = await adminClient.auth.admin.updateUserById(existingAuth.id, {
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'doctor' },
    });
    if (updateErr) throw new Error(updateErr.message);
    return { authUserId: existingAuth.id, temporaryPassword, authCreated: false };
  }

  throw new Error(createErr?.message || 'Failed to create doctor login account');
}

export async function sendDoctorWelcomeEmail(params: {
  email: string;
  fullName: string;
  temporaryPassword: string;
  loginUrl: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const { email, fullName, temporaryPassword, loginUrl } = params;
  const transporter = getTransporter();

  console.log('\n========================================');
  console.log('DOCTOR ACCOUNT CREATED');
  console.log(`Email: ${email}`);
  console.log(`Temporary password: ${temporaryPassword}`);
  console.log(`Login: ${loginUrl}`);
  console.log('========================================\n');

  if (!transporter) {
    return { sent: false, reason: 'SMTP not configured' };
  }

  try {
    await transporter.sendMail({
      from: `"H2H Healthcare" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your H2H Doctor Portal Account',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0;">H2H Healthcare</h1>
            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0;">Doctor Portal — Account Created</p>
          </div>
          <div style="background: white; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #475569; margin: 0 0 16px;">Hello ${fullName},</p>
            <p style="font-size: 14px; color: #475569; margin: 0 0 20px;">
              A super admin has created your doctor account. Use the credentials below to sign in. You can also request a one-time code from the same login page.
            </p>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">Email</p>
            <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 0 0 16px;">${email}</p>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em;">Temporary password</p>
            <div style="font-size: 18px; font-weight: 700; letter-spacing: 1px; color: #0891b2; background: #ecfeff; padding: 12px 16px; border-radius: 10px; font-family: monospace; margin: 0 0 20px;">
              ${temporaryPassword}
            </div>
            <p style="font-size: 12px; color: #94a3b8; margin: 0 0 20px;">Please change this password after your first login when that option is available. Do not share these details.</p>
            <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(to right, #0f172a, #1e293b); color: white; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;">Open Doctor Portal</a>
          </div>
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 16px 0 0;">If you did not expect this email, contact your clinic administrator.</p>
        </div>
      `,
    });
    console.log(`Doctor welcome email sent to ${email}`);
    return { sent: true };
  } catch (err) {
    console.error('Failed to send doctor welcome email:', err);
    return { sent: false, reason: err instanceof Error ? err.message : 'Send failed' };
  }
}
