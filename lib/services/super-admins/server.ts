import { createClient } from '@/lib/supabase/server';

/**
 * Super Admin Service (Server-side)
 * Manages platform-level administrators
 */

export interface SuperAdmin {
  id: string;
  user_id: string;
  granted_by: string | null;
  granted_at: string;
  notes: string | null;
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  granted_by_user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface CreateSuperAdminPayload {
  email: string;
  notes?: string;
}

export class SuperAdminServerService {
  /**
   * Check if a user is a super admin
   */
  static async checkIsSuperAdmin(userId: string): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine
        console.error('[SuperAdminService] Error checking super admin:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('[SuperAdminService] Unexpected error:', error);
      return false;
    }
  }

  /**
   * Check if current authenticated user is a super admin
   */
  static async checkCurrentUserIsSuperAdmin(): Promise<boolean> {
    try {
      const supabase = await createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return false;
      }

      return await this.checkIsSuperAdmin(user.id);
    } catch (error) {
      console.error('[SuperAdminService] Error checking current user:', error);
      return false;
    }
  }

  /**
   * List all super admins
   */
  static async listSuperAdmins(): Promise<SuperAdmin[]> {
    try {
      const supabase = await createClient();

      // Use raw SQL query to properly join with profiles for both user and granter
      const { data, error } = await supabase.rpc('get_super_admins_with_profiles');

      if (error) {
        console.error('[SuperAdminService] Error listing super admins:', error);

        // Fallback to basic query without granter info if function doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('super_admins')
          .select(
            `
            id,
            user_id,
            granted_by,
            granted_at,
            notes,
            profiles!user_id (
              id,
              email,
              full_name,
              avatar_url
            )
          `
          )
          .order('granted_at', { ascending: false });

        if (fallbackError) {
          throw new Error(fallbackError.message);
        }

        // Map fallback format
        return (fallbackData || []).map((sa: any) => ({
          id: sa.id,
          user_id: sa.user_id,
          granted_by: sa.granted_by,
          granted_at: sa.granted_at,
          notes: sa.notes,
          user: sa.profiles
            ? {
                id: sa.profiles.id,
                email: sa.profiles.email || '',
                user_metadata: {
                  full_name: sa.profiles.full_name,
                  avatar_url: sa.profiles.avatar_url,
                },
              }
            : undefined,
        }));
      }

      // Map to expected format with granter info
      return (data || []).map((sa: any) => ({
        id: sa.id,
        user_id: sa.user_id,
        granted_by: sa.granted_by,
        granted_at: sa.granted_at,
        notes: sa.notes,
        user: {
          id: sa.user_id,
          email: sa.user_email || '',
          user_metadata: {
            full_name: sa.user_full_name,
            avatar_url: sa.user_avatar_url,
          },
        },
        granted_by_user: sa.granted_by
          ? {
              id: sa.granted_by,
              email: sa.granter_email || '',
              user_metadata: {
                full_name: sa.granter_full_name,
                avatar_url: sa.granter_avatar_url,
              },
            }
          : undefined,
      }));
    } catch (error) {
      console.error('[SuperAdminService] Error listing super admins:', error);
      throw error;
    }
  }

  /**
   * Add a super admin by email
   */
  static async addSuperAdmin(
    payload: CreateSuperAdminPayload
  ): Promise<SuperAdmin> {
    try {
      const supabase = await createClient();

      // Get current user (must be super admin)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Verify current user is super admin
      const isSuperAdmin = await this.checkIsSuperAdmin(user.id);
      if (!isSuperAdmin) {
        throw new Error('Only super admins can grant super admin access');
      }

      // Use the helper function to add super admin
      const { data, error } = await supabase.rpc('add_super_admin_by_email', {
        p_email: payload.email,
        p_notes: payload.notes || null,
      });

      if (error) {
        console.error('[SuperAdminService] Error adding super admin:', error);
        throw new Error(error.message);
      }

      // Fetch the created super admin
      const { data: newSuperAdmin, error: fetchError } = await supabase
        .from('super_admins')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError || !newSuperAdmin) {
        throw new Error('Failed to fetch created super admin');
      }

      return newSuperAdmin;
    } catch (error) {
      console.error('[SuperAdminService] Error adding super admin:', error);
      throw error;
    }
  }

  /**
   * Remove a super admin
   */
  static async removeSuperAdmin(superAdminId: string): Promise<void> {
    try {
      const supabase = await createClient();

      // Get current user (must be super admin)
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Verify current user is super admin
      const isSuperAdmin = await this.checkIsSuperAdmin(user.id);
      if (!isSuperAdmin) {
        throw new Error('Only super admins can remove super admin access');
      }

      // Prevent removing self
      const { data: targetSuperAdmin } = await supabase
        .from('super_admins')
        .select('user_id')
        .eq('id', superAdminId)
        .single();

      if (targetSuperAdmin && targetSuperAdmin.user_id === user.id) {
        throw new Error('Cannot remove your own super admin access');
      }

      // Delete super admin
      const { error } = await supabase
        .from('super_admins')
        .delete()
        .eq('id', superAdminId);

      if (error) {
        console.error('[SuperAdminService] Error removing super admin:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('[SuperAdminService] Error removing super admin:', error);
      throw error;
    }
  }

  /**
   * Get super admin by user ID
   */
  static async getSuperAdminByUserId(
    userId: string
  ): Promise<SuperAdmin | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('super_admins')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[SuperAdminService] Error fetching super admin:', error);
        throw new Error(error.message);
      }

      return data || null;
    } catch (error) {
      console.error('[SuperAdminService] Error fetching super admin:', error);
      throw error;
    }
  }

  /**
   * Bootstrap super admin on first OAuth login
   * Called from OAuth callback
   */
  static async bootstrapSuperAdminIfNeeded(
    userId: string,
    email: string,
    bootstrapEmail: string
  ): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.rpc(
        'bootstrap_super_admin_if_needed',
        {
          p_user_id: userId,
          p_email: email,
          p_bootstrap_email: bootstrapEmail,
        }
      );

      if (error) {
        console.error('[SuperAdminService] Bootstrap error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('[SuperAdminService] Bootstrap error:', error);
      return false;
    }
  }

  /**
   * List all available users who are not super admins
   * Only approved users with profiles
   */
  static async listAvailableUsers(): Promise<
    Array<{ id: string; email: string; full_name: string | null }>
  > {
    try {
      const supabase = await createClient();

      // Get all user IDs who are already super admins
      const { data: superAdmins, error: superAdminsError } = await supabase
        .from('super_admins')
        .select('user_id');

      if (superAdminsError) {
        console.error(
          '[SuperAdminService] Error fetching super admins:',
          superAdminsError
        );
        throw new Error(superAdminsError.message);
      }

      const superAdminUserIds = (superAdmins || []).map((sa) => sa.user_id);

      // Get all users with profiles who are not super admins
      let query = supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email', { ascending: true });

      // Filter out super admins if there are any
      if (superAdminUserIds.length > 0) {
        query = query.not('id', 'in', `(${superAdminUserIds.join(',')})`);
      }

      const { data: users, error: usersError } = await query;

      if (usersError) {
        console.error(
          '[SuperAdminService] Error fetching users:',
          usersError
        );
        throw new Error(usersError.message);
      }

      return users || [];
    } catch (error) {
      console.error('[SuperAdminService] Error listing available users:', error);
      throw error;
    }
  }
}
