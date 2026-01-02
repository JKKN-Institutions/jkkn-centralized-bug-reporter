'use client';

import { createClient } from '@/lib/supabase/client';
import type {
  OrganizationMember,
  OrganizationInvitation,
  InviteMemberPayload,
  UpdateMemberRolePayload,
  TeamStats,
} from '@boobalan_jkkn/shared';

export class TeamClientService {
  /**
   * Get all members for an organization
   */
  static async getOrganizationMembers(
    organizationId: string
  ): Promise<OrganizationMember[]> {
    try {
      const supabase = createClient();

      // Fetch organization members
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (membersError) throw membersError;

      if (!members || members.length === 0) {
        return [];
      }

      // Get all unique user IDs
      const userIds = [...new Set(members.map(m => m.user_id))];

      // Fetch all profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('[TeamClientService] Error fetching profiles:', profilesError);
        // Continue without profiles
      }

      // Create a map of profiles by user ID
      const profilesMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );

      // Merge members with their profiles
      const membersWithUsers = members.map((member) => {
        const profile = profilesMap.get(member.user_id);

        return {
          ...member,
          user: profile ? [profile] : [{
            id: member.user_id,
            email: 'Unknown User',
            full_name: null,
            avatar_url: null,
          }]
        };
      });

      console.log(`[TeamClientService] Fetched ${membersWithUsers.length} members with profiles`);
      return membersWithUsers;
    } catch (error) {
      console.error('[TeamClientService] Error fetching members:', error);
      // Return empty array if table doesn't exist or other errors
      return [];
    }
  }

  /**
   * Get current user's role in organization
   */
  static async getUserRole(organizationId: string, userId: string): Promise<string | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not a member
        }
        throw error;
      }

      return data.role;
    } catch (error) {
      console.error('[TeamClientService] Error fetching user role:', error);
      throw error;
    }
  }

  /**
   * Invite member to organization
   */
  static async inviteMember(payload: InviteMemberPayload): Promise<OrganizationInvitation> {
    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Create invitation
      const { data, error } = await supabase
        .from('organization_invitations')
        .insert([
          {
            organization_id: payload.organization_id,
            email: payload.email,
            role: payload.role,
            invited_by: user.id,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          },
        ])
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST205') {
          throw new Error('Invitations feature is not yet configured. Please contact support to enable team invitations.');
        }
        if (error.code === '23505') {
          throw new Error('An invitation has already been sent to this email');
        }
        throw new Error('Failed to send invitation. Please try again.');
      }

      console.log(`[TeamClientService] Sent invitation to ${payload.email}`);

      // TODO: Send invitation email
      // await sendInvitationEmail(payload.email, data.id);

      return data;
    } catch (error) {
      console.error('[TeamClientService] Error inviting member:', error);
      // Re-throw with user-friendly message
      if (error instanceof Error && error.message) {
        throw error;
      }
      throw new Error('Failed to send invitation. Please try again.');
    }
  }

  /**
   * Get pending invitations for organization
   */
  static async getInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString())
        .order('invited_at', { ascending: false });

      if (error) {
        // Silently return empty array if table doesn't exist
        if (error.code === 'PGRST205') {
          return [];
        }
        console.error('[TeamClientService] Error fetching invitations:', error);
        return [];
      }

      return data || [];
    } catch {
      // Catch any unexpected errors
      return [];
    }
  }

  /**
   * Revoke (delete) invitation
   */
  static async revokeInvitation(invitationId: string): Promise<void> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      console.log(`[TeamClientService] Revoked invitation: ${invitationId}`);
    } catch (error) {
      console.error('[TeamClientService] Error revoking invitation:', error);
      throw error;
    }
  }

  /**
   * Resend invitation email
   */
  static async resendInvitation(invitationId: string): Promise<void> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('organization_invitations')
        .select('email')
        .eq('id', invitationId)
        .single();

      if (error) throw error;

      // TODO: Send invitation email
      // await sendInvitationEmail(data.email, invitationId);

      console.log(`[TeamClientService] Resent invitation to ${data.email}`);
    } catch (error) {
      console.error('[TeamClientService] Error resending invitation:', error);
      throw error;
    }
  }

  /**
   * Accept invitation and join organization
   */
  static async acceptInvitation(invitationId: string): Promise<void> {
    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get invitation details
      const { data: invitation, error: invError } = await supabase
        .from('organization_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('email', user.email)
        .single();

      if (invError) throw new Error('Invitation not found or expired');

      // Check if already accepted
      if (invitation.accepted) {
        throw new Error('Invitation already accepted');
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Add user to organization
      const { error: memberError } = await supabase.from('organization_members').insert([
        {
          organization_id: invitation.organization_id,
          user_id: user.id,
          role: invitation.role,
        },
      ]);

      if (memberError) throw memberError;

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('organization_invitations')
        .update({
          accepted: true,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      console.log(`[TeamClientService] User joined organization via invitation ${invitationId}`);
    } catch (error) {
      console.error('[TeamClientService] Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    payload: UpdateMemberRolePayload
  ): Promise<OrganizationMember> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('organization_members')
        .update({ role: payload.role })
        .eq('id', payload.member_id)
        .select('*')
        .single();

      if (error) throw error;

      console.log(`[TeamClientService] Updated role for member ${payload.member_id}`);
      return data;
    } catch (error) {
      console.error('[TeamClientService] Error updating member role:', error);
      throw error;
    }
  }

  /**
   * Remove member from organization
   */
  static async removeMember(memberId: string): Promise<void> {
    try {
      const supabase = createClient();

      const { error } = await supabase.from('organization_members').delete().eq('id', memberId);

      if (error) throw error;

      console.log(`[TeamClientService] Removed member: ${memberId}`);
    } catch (error) {
      console.error('[TeamClientService] Error removing member:', error);
      throw error;
    }
  }

  /**
   * Get team statistics
   */
  static async getTeamStats(organizationId: string): Promise<TeamStats> {
    try {
      const supabase = createClient();

      // Get members
      const { data: members } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId);

      // Get pending invitations (if table exists)
      const { data: invitations } = await supabase
        .from('organization_invitations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString());

      const stats: TeamStats = {
        total_members: members?.length || 0,
        by_role: {
          owner: members?.filter((m) => m.role === 'owner').length || 0,
          admin: members?.filter((m) => m.role === 'admin').length || 0,
          developer: members?.filter((m) => m.role === 'developer').length || 0,
        },
        pending_invitations: invitations?.length || 0,
      };

      return stats;
    } catch (error) {
      console.error('[TeamClientService] Error fetching team stats:', error);
      // Return empty stats if error
      return {
        total_members: 0,
        by_role: {
          owner: 0,
          admin: 0,
          developer: 0,
        },
        pending_invitations: 0,
      };
    }
  }
}
