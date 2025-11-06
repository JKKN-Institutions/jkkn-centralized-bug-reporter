'use server';

import { InvitationServerService } from '@/lib/services/invitations/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface Invitation {
  id: string;
  organization_id: string;
  role: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

/**
 * Fetch pending invitations for a user by email
 * Uses admin client to bypass RLS
 */
export async function fetchPendingInvitations(email: string): Promise<Invitation[]> {
  try {
    const invitations = await InvitationServerService.getPendingInvitationsByEmail(email);

    return invitations.map((inv: any) => ({
      id: inv.id,
      organization_id: inv.organization_id,
      role: inv.role,
      organization: {
        id: inv.organizations.id,
        name: inv.organizations.name,
        slug: inv.organizations.slug,
      },
    }));
  } catch (error) {
    console.error('[Accept Invitations Actions] Error fetching invitations:', error);
    return [];
  }
}

/**
 * Accept a single invitation
 * Uses admin client to bypass RLS for inserting organization member
 */
export async function acceptInvitation(invitationId: string, orgSlug: string) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get the invitation details using admin client
    const { data: invitation, error: fetchError } = await adminClient
      .from('organization_invitations')
      .select('organization_id, role, email')
      .eq('id', invitationId)
      .eq('accepted', false)
      .single();

    if (fetchError || !invitation) {
      return { success: false, error: 'Invitation not found or already accepted' };
    }

    // Verify the invitation is for the current user
    if (invitation.email !== user.email) {
      return { success: false, error: 'Invitation is not for this user' };
    }

    // Add user to organization_members using admin client (bypasses RLS)
    const { error: memberError } = await adminClient
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
      });

    if (memberError) {
      console.error('[Accept Invitations Actions] Error adding member:', memberError);
      return { success: false, error: memberError.message };
    }

    // Mark invitation as accepted using admin client
    const { error: updateError } = await adminClient
      .from('organization_invitations')
      .update({
        accepted: true,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('[Accept Invitations Actions] Error updating invitation:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('[Accept Invitations Actions] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept invitation'
    };
  }
}

/**
 * Accept all invitations for a user
 * Uses admin client to bypass RLS for inserting organization members
 */
export async function acceptAllInvitations(email: string) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated', redirectSlug: null };
    }

    // Verify email matches
    if (user.email !== email) {
      return { success: false, error: 'Email mismatch', redirectSlug: null };
    }

    // Get all pending invitations
    const invitations = await InvitationServerService.getPendingInvitationsByEmail(email);

    if (!invitations || invitations.length === 0) {
      return { success: false, error: 'No invitations found', redirectSlug: null };
    }

    let firstOrgSlug: string | null = null;

    // Accept all invitations
    for (const invitation of invitations) {
      try {
        // Store first org slug for redirect
        if (!firstOrgSlug && invitation.organizations) {
          firstOrgSlug = (invitation.organizations as any).slug;
        }

        // Add user to organization_members using admin client (bypasses RLS)
        const { error: memberError } = await adminClient
          .from('organization_members')
          .insert({
            organization_id: invitation.organization_id,
            user_id: user.id,
            role: invitation.role,
          });

        if (memberError) {
          console.error(
            `[Accept Invitations Actions] Error adding member for invitation ${invitation.id}:`,
            memberError
          );
          continue;
        }

        // Mark invitation as accepted using admin client
        const { error: updateError } = await adminClient
          .from('organization_invitations')
          .update({
            accepted: true,
            accepted_at: new Date().toISOString(),
          })
          .eq('id', invitation.id);

        if (updateError) {
          console.error(
            `[Accept Invitations Actions] Error updating invitation ${invitation.id}:`,
            updateError
          );
        }
      } catch (invError) {
        console.error(
          `[Accept Invitations Actions] Error processing invitation ${invitation.id}:`,
          invError
        );
      }
    }

    return { success: true, error: null, redirectSlug: firstOrgSlug };
  } catch (error) {
    console.error('[Accept Invitations Actions] Error accepting all invitations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept invitations',
      redirectSlug: null
    };
  }
}
