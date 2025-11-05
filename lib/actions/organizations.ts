'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { CreateOrganizationPayload, Organization } from '@bug-reporter/shared';

/**
 * Server Action to create organization
 * This runs on the server with proper auth context
 */
export async function createOrganizationAction(
  payload: CreateOrganizationPayload
): Promise<{ data: Organization | null; error: string | null }> {
  try {
    console.log('[Server Action] Creating organization:', payload.name);

    // Create Supabase client with cookies (server-side)
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Cookie setting might fail in Server Component
            }
          },
        },
      }
    );

    // Get authenticated user from server-side session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Server Action] Auth error:', authError);
      return { data: null, error: 'Not authenticated. Please log in again.' };
    }

    console.log('[Server Action] User authenticated:', user.id);

    // Check session to verify JWT token is available
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log('[Server Action] Session check:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      sessionError: sessionError?.message,
    });

    // Use SECURITY DEFINER function to bypass RLS issues
    console.log('[Server Action] Calling create_organization_with_owner function');

    const { data, error } = await supabase.rpc('create_organization_with_owner', {
      org_name: payload.name,
      org_slug: payload.slug,
      owner_id: user.id,
    });

    if (error) {
      console.error('[Server Action] RPC error:', {
        code: error.code,
        message: error.message,
        details: error.details,
      });

      // Handle specific error messages
      if (error.message?.includes('slug already exists')) {
        return { data: null, error: 'Organization slug already exists' };
      }

      if (error.message?.includes('User ID mismatch')) {
        return { data: null, error: 'Authentication error. Please try logging in again.' };
      }

      return { data: null, error: error.message || 'Failed to create organization' };
    }

    console.log('[Server Action] Created organization:', data?.slug || payload.slug);
    return { data: data as Organization, error: null };
  } catch (err) {
    console.error('[Server Action] Unexpected error:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}
