'use client';

import { createClient } from '@/lib/supabase/client';
import type {
  Organization,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
} from '@bug-reporter/shared';

export class OrganizationClientService {
  /**
   * Get all organizations for current user
   */
  static async getUserOrganizations(): Promise<Organization[]> {
    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Not authenticated');
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

      console.log('[organizations] Fetched user organizations:', data?.length);
      return data || [];
    } catch (error) {
      console.error('[organizations] Error fetching user organizations:', error);
      throw error;
    }
  }

  /**
   * Get organization by slug (client-side)
   */
  static async getOrganizationBySlug(slug: string): Promise<Organization | null> {
    try {
      const supabase = createClient();

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

      console.log('[organizations] Fetched organization by slug:', slug);
      return data;
    } catch (error) {
      console.error('[organizations] Error fetching organization by slug:', error);
      throw error;
    }
  }

  /**
   * Create new organization
   */
  static async createOrganization(
    payload: CreateOrganizationPayload
  ): Promise<Organization> {
    try {
      const supabase = createClient();

      // CRITICAL: Check both user and session
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('[organizations] Auth error:', authError);
        throw new Error('Not authenticated');
      }

      // Verify session exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('[organizations] Session error:', sessionError);
        throw new Error('No active session. Please log in again.');
      }

      console.log('[organizations] User authenticated:', user.id);
      console.log('[organizations] Session verified:', session.access_token ? 'Present' : 'Missing');

      // Check if slug is available
      const { data: existing } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', payload.slug)
        .maybeSingle();

      if (existing) {
        throw new Error('Organization slug already exists');
      }

      // Insert organization with explicit user ID
      console.log('[organizations] Attempting to create org with owner:', user.id);

      const { data, error } = await supabase
        .from('organizations')
        .insert([
          {
            ...payload,
            owner_user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('[organizations] Insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Provide more helpful error messages
        if (error.code === '42501') {
          throw new Error('Permission denied. Your session may have expired. Please try logging in again.');
        }

        throw error;
      }

      console.log('[organizations] Created organization:', data.slug);
      return data;
    } catch (error) {
      console.error('[organizations] Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Update organization
   */
  static async updateOrganization(
    payload: UpdateOrganizationPayload
  ): Promise<Organization> {
    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Verify user is owner
      const { data: org } = await supabase
        .from('organizations')
        .select('owner_user_id')
        .eq('id', payload.id)
        .single();

      if (!org || org.owner_user_id !== user.id) {
        throw new Error('Only organization owner can update');
      }

      // If updating slug, check availability
      if (payload.slug) {
        const { data: existing } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', payload.slug)
          .neq('id', payload.id)
          .maybeSingle();

        if (existing) {
          throw new Error('Organization slug already exists');
        }
      }

      const { id, ...updates } = payload;

      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('[organizations] Updated organization:', data.slug);
      return data;
    } catch (error) {
      console.error('[organizations] Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Delete organization
   */
  static async deleteOrganization(id: string): Promise<void> {
    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // Verify user is owner
      const { data: org } = await supabase
        .from('organizations')
        .select('owner_user_id')
        .eq('id', id)
        .single();

      if (!org || org.owner_user_id !== user.id) {
        throw new Error('Only organization owner can delete');
      }

      const { error } = await supabase.from('organizations').delete().eq('id', id);

      if (error) throw error;

      console.log('[organizations] Deleted organization:', id);
    } catch (error) {
      console.error('[organizations] Error deleting organization:', error);
      throw error;
    }
  }

  /**
   * Get organization statistics
   */
  static async getOrganizationStats(organizationId: string) {
    try {
      const supabase = createClient();

      // Count applications
      const { count: appsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      // Count bug reports
      const { count: bugsCount } = await supabase
        .from('bug_reports')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      // Count members
      const { count: membersCount } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      return {
        totalApps: appsCount || 0,
        totalBugs: bugsCount || 0,
        totalMembers: membersCount || 0,
      };
    } catch (error) {
      console.error('[organizations] Error fetching stats:', error);
      throw error;
    }
  }

  /**
   * Get all organizations with member counts (Super Admin only)
   */
  static async getAllOrganizationsWithMemberCounts(): Promise<(Organization & { member_count: number })[]> {
    try {
      const supabase = createClient();

      // Fetch all organizations with member counts
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          member_count:organization_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the data to include member_count as a number
      const organizations = (data || []).map((org: any) => ({
        ...org,
        member_count: org.member_count?.[0]?.count || 0,
      }));

      console.log('[organizations] Fetched all organizations with member counts:', organizations.length);
      return organizations;
    } catch (error) {
      console.error('[organizations] Error fetching all organizations:', error);
      throw error;
    }
  }
}
