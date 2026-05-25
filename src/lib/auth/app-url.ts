/**
 * Resolve the public app base URL for auth redirects.
 * OAuth callbacks must redirect back to the same host that received the callback.
 */

const LOCAL_APP_URL = 'http://localhost:3000';

/** Use in Route Handlers — always the host that hit /auth/callback (localhost vs beta). */
export function getRequestOrigin(request: Request): string {
  return new URL(request.url).origin;
}

/** Server Actions / emails — prefer the incoming request host when available. */
export async function getAppBaseUrl(): Promise<string> {
  const { headers } = await import('next/headers');
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');

  if (host) {
    const proto =
      h.get('x-forwarded-proto') ||
      (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || LOCAL_APP_URL;
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, '')}` : '') ||
    'https://beta.healtohealth.in'
  );
}

export function authCallbackUrl(baseUrl: string, params?: Record<string, string>): string {
  const url = new URL('/auth/callback', baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }
  return url.toString();
}
