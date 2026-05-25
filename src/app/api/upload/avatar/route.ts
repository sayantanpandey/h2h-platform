import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { uploadAvatar } from '@/lib/cloudinary';
import { getDoctorFromRequest } from '@/lib/doctor-api';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function resolveAuth(targetUserId?: string | null) {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: 'Unauthorized' };

  const { data: row } = await adminClient
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single();

  const role = (row as { role?: string } | null)?.role;
  const isAdmin = role === 'super_admin' || role === 'location_admin';

  if (isAdmin) {
    return {
      ok: true as const,
      userId: targetUserId?.trim() || user.id,
      adminClient,
    };
  }

  const doctor = await getDoctorFromRequest();
  if (doctor) {
    const { data: doctorRow } = await adminClient
      .from('doctors')
      .select('user_id')
      .eq('id', doctor.doctorId)
      .single();
    const ownUserId = (doctorRow as { user_id?: string } | null)?.user_id ?? user.id;
    if (targetUserId && targetUserId !== ownUserId) {
      return { ok: false as const, status: 403, error: 'Cannot upload for another user' };
    }
    return { ok: true as const, userId: ownUserId, adminClient };
  }

  if (role === 'patient' && (!targetUserId || targetUserId === user.id)) {
    return { ok: true as const, userId: user.id, adminClient };
  }

  return { ok: false as const, status: 403, error: 'Forbidden' };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const targetUserId = formData.get('userId')?.toString() ?? null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Use JPEG, PNG, or WebP (max 5MB)' },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'File must be under 5MB' }, { status: 400 });
    }

    const auth = await resolveAuth(targetUserId);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    const uploaded = await uploadAvatar(dataUri, auth.userId);
    if (!uploaded?.url) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Photo upload is not configured. Pick a photo from the gallery or add Cloudinary keys to .env.',
        },
        { status: 503 }
      );
    }

    const { error: dbErr } = await auth.adminClient
      .from('users')
      .update({ avatar_url: uploaded.url })
      .eq('id', auth.userId);

    if (dbErr) {
      console.error('Avatar DB update error:', dbErr);
      return NextResponse.json({ success: false, error: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: uploaded.url,
      publicId: uploaded.publicId,
    });
  } catch (e) {
    console.error('Avatar upload route error:', e);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}
