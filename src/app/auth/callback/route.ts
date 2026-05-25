import { createClient } from '@/lib/supabase/server';
import { getRequestOrigin } from '@/lib/auth/app-url';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/dashboard';
  const redirect = searchParams.get('redirect');

  // Always redirect on the same host that received OAuth (localhost vs beta)
  const baseUrl = getRequestOrigin(request);

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      if (type === 'recovery') {
        return NextResponse.redirect(`${baseUrl}/reset-password`);
      }
      if (type === 'signup') {
        return NextResponse.redirect(`${baseUrl}/login?verified=true`);
      }
      const redirectPath = redirect || next;
      return NextResponse.redirect(`${baseUrl}${redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`}`);
    }

    console.error('Code exchange error:', exchangeError.message, exchangeError);
    return NextResponse.redirect(
      `${baseUrl}/login?error=auth_failed&error_description=${encodeURIComponent(exchangeError.message)}`
    );
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth_failed`);
}
