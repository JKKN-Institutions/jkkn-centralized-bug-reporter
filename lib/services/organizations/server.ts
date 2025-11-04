import { createClient } from '@/lib/supabase/server';
import type { Organization } from '@bug-reporter/shared';

export class OrganizationServerService {
  /**
   * Get all organizations for current user (server-side)
   */
  static async getUserOrganizations(): Promise<Organization[]> {
    try {
      const supabase = await createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return [];
      }

      // Get organization IDs where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const orgIds = memberships?.map((m) => m.organization_id) || [];

      if (orgIds.length === 0) {
        return [];
      }

      // Get organizations
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds)
        .order('name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[organizations] Error fetching user organizations:', error);
      return [];
    }
  }

  /**
   * Get organization by ID
   */
  static async getOrganizationById(id: string): Promise<Organization | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[organizations] Error fetching organization by ID:', error);
      return null;
    }
  }

  /**
   * Get organization by slug
   */
  static async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[organizations] Error fetching organization by slug:', error);
      return null;
    }
  }

  /**
   * Get organization statistics
   */
  static async getOrganizationStats(organizationId: string) {
    try {
      const supabase = await createClient();

      // Get counts in parallel
      const [appsResult, bugsResult, membersResult] = await Promise.all([
        supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabase
          .from('bug_reports')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
        supabase
          .from('organization_members')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId),
      ]);

      return {
        totalApps: appsResult.count || 0,
        totalBugs: bugsResult.count || 0,
        totalMembers: membersResult.count || 0,
      };
    } catch (error) {
      console.error('[organizations] Error fetching stats:', error);
      return {
        totalApps: 0,
        totalBugs: 0,
        totalMembers: 0,
      };
    }
  }

  /**
   * Get user's role in organization
   */
  static async getUserRole(
    organizationId: string,
    userId: string
  ): Promise<string | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return data?.role || null;
    } catch (error) {
      console.error('[organizations] Error fetching user role:', error);
      return null;
    }
  }

  /**
   * Check if user is owner
   */
  static async isOwner(organizationId: string, userId: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { data } = await supabase
        .from('organizations')
        .select('owner_user_id')
        .eq('id', organizationId)
        .single();

      return data?.owner_user_id === userId;
    } catch (error) {
      console.error('[organizations] Error checking owner status:', error);
      return false;
    }
  }
}
