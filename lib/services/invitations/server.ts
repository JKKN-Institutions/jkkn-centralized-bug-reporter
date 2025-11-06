import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Server-side Invitation Service
 * Uses admin privileges to bypass RLS restrictions
 */
export class InvitationServerService {
  /**
   * Get pending invitations for a user by email
   * Used in OAuth callback - bypasses RLS since this is a secure server operation
   */
  static async getPendingInvitationsByEmail(email: string) {
    try {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('organization_invitations')
        .select(`
          id,
          organization_id,
          role,
          organizations!inner (
            id,
            slug,
            name
          )
        `)
        .eq('email', email)
        .eq('accepted', false);

      if (error) {
        console.error('[InvitationServerService] Error fetching invitations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[InvitationServerService] Unexpected error:', error);
      return [];
    }
  }
}
