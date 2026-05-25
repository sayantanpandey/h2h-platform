/**
 * Auth Me API - Get / update current user info
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, avatar_url, is_active')
      .eq('id', user.id)
      .single();

    const merged = userData
      ? { ...userData, email: userData.email || user.email }
      : { id: user.id, email: user.email, full_name: user.user_metadata?.full_name, phone: user.phone, role: null, avatar_url: user.user_metadata?.avatar_url, is_active: true };
    return NextResponse.json({ user: merged });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const avatarUrl =
      typeof body.avatar_url === 'string'
        ? body.avatar_url.trim()
        : typeof body.avatarUrl === 'string'
          ? body.avatarUrl.trim()
          : null;

    if (avatarUrl === null) {
      return NextResponse.json({ success: false, error: 'avatar_url required' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('users')
      .update({ avatar_url: avatarUrl || null })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatar_url: avatarUrl || null });
  } catch {
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 });
  }
}
