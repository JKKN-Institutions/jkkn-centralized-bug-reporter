import { createClient } from '@/lib/supabase/client';

/**
 * Application Members Service (Client-side)
 * Manages application-level access control from browser
 */

export type ApplicationMemberRole = 'maintainer' | 'developer' | 'viewer';

export interface ApplicationMember {
  id: string;
  application_id: string;
  user_id: string;
  role: ApplicationMemberRole;
  added_by: string;
  added_at: string;
}

export class ApplicationMemberClientService {
  /**
   * Get all applications current user has access to
   */
  static async getCurrentUserApplications(): Promise<string[]> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('application_members')
        .select('application_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('[ApplicationMemberClientService] Error fetching apps:', error);
        throw new Error(error.message);
      }

      return (data || []).map((item) => item.application_id);
    } catch (error) {
      console.error('[ApplicationMemberClientService] Error fetching apps:', error);
      throw error;
    }
  }

  /**
   * Get all members of an application
   */
  static async getApplicationMembers(
    applicationId: string
  ): Promise<ApplicationMember[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('application_members')
        .select('*')
        .eq('application_id', applicationId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('[ApplicationMemberClientService] Error fetching members:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('[ApplicationMemberClientService] Error fetching members:', error);
      throw error;
    }
  }

  /**
   * Check if current user has access to an application
   */
  static async checkCurrentUserHasAppAccess(
    applicationId: string
  ): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('application_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('application_id', applicationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[ApplicationMemberClientService] Error checking access:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('[ApplicationMemberClientService] Error checking access:', error);
      return false;
    }
  }

  /**
   * Get current user's role in an application
   */
  static async getCurrentUserRoleInApp(
    applicationId: string
  ): Promise<ApplicationMemberRole | null> {
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('application_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('application_id', applicationId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[ApplicationMemberClientService] Error fetching role:', error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error('[ApplicationMemberClientService] Error fetching role:', error);
      return null;
    }
  }
}
