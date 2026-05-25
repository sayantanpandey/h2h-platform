/**
 * H2H Healthcare - Server Actions for Authentication
 * Industry-standard Supabase authentication with proper error handling
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AuthResult, AuthUser, UserRole } from './types';
import { authCallbackUrl, getAppBaseUrl } from './app-url';

/**
 * Register a new user with email and password
 */
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  phone?: string
): Promise<AuthResult<{ userId: string }>> {
  try {
    const supabase = await createClient();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists',
        code: 'USER_EXISTS',
      };
    }

    // Create auth user
    const baseUrl = await getAppBaseUrl();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          role: 'patient' as UserRole,
        },
        emailRedirectTo: authCallbackUrl(baseUrl, { type: 'signup' }),
      },
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      
      if (authError.message.includes('already registered')) {
        return {
          success: false,
          error: 'An account with this email already exists',
          code: 'USER_EXISTS',
        };
      }
      
      return {
        success: false,
        error: authError.message,
        code: 'SERVER_ERROR',
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create account',
        code: 'SERVER_ERROR',
      };
    }

    return {
      success: true,
      data: { userId: authData.user.id },
    };
  } catch (error) {
    console.error('Register error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Sign in with email and password
 */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult<AuthUser>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error) {
      console.error('Login error:', error);
      
      if (error.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
        };
      }
      
      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Please verify your email before signing in',
          code: 'EMAIL_NOT_VERIFIED',
        };
      }
      
      return {
        success: false,
        error: error.message,
        code: 'SERVER_ERROR',
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Login failed',
        code: 'SERVER_ERROR',
      };
    }

    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email!,
      fullName: data.user.user_metadata?.full_name || null,
      phone: data.user.user_metadata?.phone || null,
      avatarUrl: data.user.user_metadata?.avatar_url || null,
      role: data.user.user_metadata?.role || 'patient',
      emailVerified: !!data.user.email_confirmed_at,
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at || data.user.created_at,
    };

    revalidatePath('/', 'layout');
    
    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Sign out the current user
 */
export async function logoutUser(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message,
        code: 'SERVER_ERROR',
      };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const baseUrl = await getAppBaseUrl();

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase(),
      {
        redirectTo: authCallbackUrl(baseUrl, { type: 'recovery' }),
      }
    );

    if (error) {
      console.error('Password reset error:', error);
      // Don't reveal if email exists or not for security
      return {
        success: true, // Always return success for security
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: true, // Always return success for security
    };
  }
}

/**
 * Update user password (after reset)
 */
export async function updatePassword(
  newPassword: string
): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: error.message,
        code: 'SERVER_ERROR',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      fullName: user.user_metadata?.full_name || null,
      phone: user.user_metadata?.phone || null,
      avatarUrl: user.user_metadata?.avatar_url || null,
      role: user.user_metadata?.role || 'patient',
      emailVerified: !!user.email_confirmed_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at || user.created_at,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  data: {
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
  }
): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: data.fullName,
        phone: data.phone,
        avatar_url: data.avatarUrl,
      },
    });

    if (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message,
        code: 'SERVER_ERROR',
      };
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(
  email: string
): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const baseUrl = await getAppBaseUrl();

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: authCallbackUrl(baseUrl, { type: 'signup' }),
      },
    });

    if (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        error: error.message,
        code: 'SERVER_ERROR',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Resend verification error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Sign in with OAuth provider
 */
export async function signInWithOAuth(
  provider: 'google' | 'github',
  redirectTo?: string
): Promise<AuthResult<{ url: string }>> {
  try {
    const supabase = await createClient();

    const appUrl = await getAppBaseUrl();
    const callbackUrl = authCallbackUrl(
      appUrl,
      redirectTo ? { redirect: redirectTo } : undefined
    );
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('OAuth error:', error);
      return {
        success: false,
        error: error.message,
        code: 'SERVER_ERROR',
      };
    }

    if (!data.url) {
      return {
        success: false,
        error: 'Failed to get OAuth URL',
        code: 'SERVER_ERROR',
      };
    }

    return {
      success: true,
      data: { url: data.url },
    };
  } catch (error) {
    console.error('OAuth error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Redirect helper for protected routes
 */
export async function requireAuth(redirectTo: string = '/login') {
  const user = await getCurrentUser();
  if (!user) {
    redirect(redirectTo);
  }
  return user;
}

/**
 * Redirect helper for guest routes (login, register)
 */
export async function requireGuest(redirectTo: string = '/dashboard') {
  const user = await getCurrentUser();
  if (user) {
    redirect(redirectTo);
  }
}
