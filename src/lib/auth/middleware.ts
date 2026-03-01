/**
 * H2H Healthcare - Role-Based Authentication Middleware
 * Production-grade middleware for route protection
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ROLES, ROLE_DASHBOARDS, canAccessRoute, type UserRole } from './roles';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/services',
  '/locations',
  '/booking',
  '/coming-soon',
  '/maintenance',
  '/super-admin/login',
];

// Auth routes (login, register, etc.)
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/doctor/login',
];

// API routes that should be excluded from middleware
const API_ROUTES = [
  '/api',
  '/auth/callback',
];

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    API_ROUTES.some(route => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user - wrapped in try-catch to handle network failures gracefully
  let user = null;
  let error = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    error = result.error;
  } catch (e) {
    // Network error (fetch failed) - treat as unauthenticated
    // This commonly happens in Edge Runtime when Supabase is unreachable
    console.warn('Middleware: Failed to fetch user session:', e);
    error = e;
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if route is auth route
  const isAuthRoute = AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Doctor routes use their own cookie-based auth (not Supabase Auth)
  if (pathname.startsWith('/doctor') && !isAuthRoute) {
    const doctorSession = request.cookies.get('doctor_session')?.value;
    if (!doctorSession) {
      return NextResponse.redirect(new URL('/doctor/login', request.url));
    }
    // Cookie exists — allow access (full verification happens in layout)
    return response;
  }

  // If user is not authenticated (non-doctor routes)
  if (error || !user) {
    // Allow access to public and auth routes
    if (isPublicRoute || isAuthRoute) {
      return response;
    }
    
    // Redirect to login for protected routes
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // User is authenticated
  const userRole = (user.user_metadata?.role as UserRole) || ROLES.PATIENT;

  // Redirect authenticated users away from auth routes
  if (isAuthRoute) {
    // Don't redirect doctors away from /doctor/login — they use separate auth
    if (pathname === '/doctor/login') return response;
    const dashboardUrl = new URL(ROLE_DASHBOARDS[userRole], request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Check if user is accessing /dashboard without specific role path
  if (pathname === '/dashboard') {
    const dashboardUrl = new URL(ROLE_DASHBOARDS[userRole], request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Super admin must use /super-admin, not /admin
  if (userRole === ROLES.SUPER_ADMIN && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/super-admin', request.url));
  }

  // Check role-based access for dashboard routes
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/location-admin') ||
    pathname.startsWith('/patient')
  ) {
    if (!canAccessRoute(userRole, pathname)) {
      // Redirect to user's appropriate dashboard
      const dashboardUrl = new URL(ROLE_DASHBOARDS[userRole], request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return response;
}

// Helper to get user role from request (for use in server components)
export async function getUserFromRequest(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email!,
    fullName: user.user_metadata?.full_name || null,
    role: (user.user_metadata?.role as UserRole) || ROLES.PATIENT,
    avatarUrl: user.user_metadata?.avatar_url || null,
  };
}
