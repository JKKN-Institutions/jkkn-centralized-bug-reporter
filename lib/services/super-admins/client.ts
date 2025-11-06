import { createClient } from '@/lib/supabase/client';

/**
 * Super Admin Service (Client-side)
 * Manages platform-level administrators from browser
 */

export interface SuperAdmin {
  id: string;
  user_id: string;
  granted_by: string | null;
  granted_at: string;
  notes: string | null;
}

export interface CreateSuperAdminPayload {
  email: string;
  notes?: string;
}

export class SuperAdminClientService {
  /**
   * Check if current user is a super admin
   */
  static async checkCurrentUserIsSuperAdmin(): Promise<boolean> {
    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return false;
      }

      const { data, error } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[SuperAdminClientService] Error checking:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('[SuperAdminClientService] Unexpected error:', error);
      return false;
    }
  }

  /**
   * List all super admins (only accessible by super admins due to RLS)
   */
  static async listSuperAdmins(): Promise<SuperAdmin[]> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('super_admins')
        .select('*')
        .order('granted_at', { ascending: false });

      if (error) {
        console.error('[SuperAdminClientService] Error listing:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('[SuperAdminClientService] Error listing:', error);
      throw error;
    }
  }

  /**
   * Check if a specific user is a super admin
   */
  static async checkIsSuperAdmin(userId: string): Promise<boolean> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[SuperAdminClientService] Error checking:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('[SuperAdminClientService] Unexpected error:', error);
      return false;
    }
  }
}
