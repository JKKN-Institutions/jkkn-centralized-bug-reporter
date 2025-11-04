'use client';

import { createClient } from '@/lib/supabase/client';
import type {
  OrganizationMember,
  OrganizationInvitation,
  InviteMemberPayload,
  UpdateMemberRolePayload,
  TeamStats,
} from '@bug-reporter/shared';

export class TeamClientService {
  /**
   * Get all members for an organization
   */
  static async getOrganizationMembers(
    organizationId: string
  ): Promise<OrganizationMember[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('organization_members')
        .select(
          `
          *,
          user:profiles(id, email, full_name, avatar_url)
        `
        )
        .eq('organization_id', organizationId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      console.log(`[TeamClientService] Fetched ${data?.length || 0} members`);
      return data || [];
    } catch (error) {
      console.error('[TeamClientService] Error fetching members:', error);
      throw error;
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
        .select(
          `
          *,
          inviter:profiles!invited_by(email, full_name)
        `
        )
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('An invitation has already been sent to this email');
        }
        throw error;
      }

      console.log(`[TeamClientService] Sent invitation to ${payload.email}`);

      // TODO: Send invitation email
      // await sendInvitationEmail(payload.email, data.id);

      return data;
    } catch (error) {
      console.error('[TeamClientService] Error inviting member:', error);
      throw error;
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
        .select(
          `
          *,
          inviter:profiles!invited_by(email, full_name)
        `
        )
        .eq('organization_id', organizationId)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString())
        .order('invited_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[TeamClientService] Error fetching invitations:', error);
      throw error;
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
        .select(
          `
          *,
          user:profiles(id, email, full_name, avatar_url)
        `
        )
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
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId);

      if (membersError) throw membersError;

      // Get pending invitations
      const { data: invitations, error: invError } = await supabase
        .from('organization_invitations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('accepted', false)
        .gt('expires_at', new Date().toISOString());

      if (invError) throw invError;

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
      throw error;
    }
  }
}
