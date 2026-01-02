import { createClient } from '@/lib/supabase/server';
import type { OrganizationMember, TeamStats } from '@boobalan_jkkn/shared';

export class TeamServerService {
  /**
   * Get all members for an organization
   */
  static async getOrganizationMembers(
    organizationId: string
  ): Promise<OrganizationMember[]> {
    try {
      const supabase = await createClient();

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

      console.log(`[TeamServerService] Fetched ${data?.length || 0} members`);
      return data || [];
    } catch (error) {
      console.error('[TeamServerService] Error fetching members:', error);
      throw error;
    }
  }

  /**
   * Get team statistics
   */
  static async getTeamStats(organizationId: string): Promise<TeamStats> {
    try {
      const supabase = await createClient();

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
      console.error('[TeamServerService] Error fetching team stats:', error);
      throw error;
    }
  }
}
