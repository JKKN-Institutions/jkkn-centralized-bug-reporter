'use client';

import { createClient } from '@/lib/supabase/client';
import type {
  LeaderboardEntry,
  LeaderboardConfig,
  UpdateLeaderboardConfigPayload,
  LeaderboardTimePeriod,
} from '@boobalan_jkkn/shared';

interface BugMetadata {
  points?: number;
}

type Priority = 'critical' | 'high' | 'medium' | 'low';

export class LeaderboardClientService {
  /**
   * Get leaderboard entries for organization
   */
  static async getLeaderboard(
    organizationId: string,
    timePeriod: LeaderboardTimePeriod = 'all-time',
    limit = 100
  ): Promise<LeaderboardEntry[]> {
    try {
      const supabase = createClient();

      // Build date filter based on time period
      let dateFilter: Date | null = null;
      if (timePeriod === 'week') {
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (timePeriod === 'month') {
        dateFilter = new Date();
        dateFilter.setMonth(dateFilter.getMonth() - 1);
      }

      let query = supabase
        .from('bug_reports')
        .select('reporter_user_id, metadata, status')
        .eq('organization_id', organizationId);

      if (dateFilter) {
        query = query.gte('created_at', dateFilter.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by reporter and calculate totals
      const leaderboardMap = new Map<string, LeaderboardEntry>();

      // Fetch user details for bugs with reporter_user_id
      const userIds = Array.from(new Set(data?.filter(bug => bug.reporter_user_id).map((bug) => bug.reporter_user_id) || []));
      let userMap = new Map<string, any>();

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        userMap = new Map(users?.map((u) => [u.id, u]) || []);
      }

      data?.forEach((bug) => {
        // Try to get reporter info from user_id first, then from metadata
        let reporterEmail: string;
        let reporterName: string | undefined;

        if (bug.reporter_user_id) {
          const user = userMap.get(bug.reporter_user_id);
          reporterEmail = user?.email || 'Unknown';
          reporterName = user?.full_name;
        } else {
          // Get from metadata
          const metadata = bug.metadata as any;
          reporterEmail = metadata?.reporter_email || 'Anonymous';
          reporterName = metadata?.reporter_name;
        }

        // Skip anonymous reporters
        if (reporterEmail === 'Anonymous') return;

        // Calculate points - default 10 points per bug, or use metadata points if available
        const metadataPoints = (bug.metadata as BugMetadata)?.points;
        const points = metadataPoints || 10;

        const existing = leaderboardMap.get(reporterEmail);
        if (existing) {
          existing.total_bugs += 1;
          existing.total_points += points;
        } else {
          leaderboardMap.set(reporterEmail, {
            reporter_email: reporterEmail,
            reporter_name: reporterName,
            total_bugs: 1,
            total_points: points,
            rank: 0,
          });
        }
      });

      // Convert to array and sort by points
      const leaderboard = Array.from(leaderboardMap.values())
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, limit);

      // Assign ranks
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      console.log(
        `[LeaderboardClientService] Fetched ${leaderboard.length} entries for ${timePeriod}`
      );
      return leaderboard;
    } catch (error) {
      console.error('[LeaderboardClientService] Error fetching leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get top 3 for podium display
   */
  static async getTopThree(
    organizationId: string,
    timePeriod: LeaderboardTimePeriod = 'week'
  ): Promise<LeaderboardEntry[]> {
    const leaderboard = await this.getLeaderboard(organizationId, timePeriod, 3);
    return leaderboard;
  }

  /**
   * Get leaderboard configuration for organization
   */
  static async getLeaderboardConfig(
    organizationId: string
  ): Promise<LeaderboardConfig | null> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('organization_leaderboard_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (error) throw error;

      console.log('[LeaderboardClientService] Fetched config');
      return data;
    } catch (error) {
      console.error('[LeaderboardClientService] Error fetching config:', error);
      throw error;
    }
  }

  /**
   * Create or update leaderboard configuration
   */
  static async upsertLeaderboardConfig(
    payload: UpdateLeaderboardConfigPayload
  ): Promise<LeaderboardConfig> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('organization_leaderboard_config')
        .upsert(
          {
            ...payload,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'organization_id',
          }
        )
        .select()
        .single();

      if (error) throw error;

      console.log(`[LeaderboardClientService] Updated config for org ${payload.organization_id}`);
      return data;
    } catch (error) {
      console.error('[LeaderboardClientService] Error updating config:', error);
      throw error;
    }
  }

  /**
   * Calculate points for a bug based on priority
   */
  static async calculateBugPoints(
    organizationId: string,
    priority: string
  ): Promise<number> {
    try {
      const config = await this.getLeaderboardConfig(organizationId);

      if (!config) {
        // Default points if no config
        const defaultPoints: Record<Priority, number> = {
          critical: 50,
          high: 30,
          medium: 20,
          low: 10,
        };
        return defaultPoints[priority as Priority] || 10;
      }

      const pointsMap: Record<Priority, number> = {
        critical: config.points_critical,
        high: config.points_high,
        medium: config.points_medium,
        low: config.points_low,
      };

      return pointsMap[priority as Priority] || config.points_low;
    } catch (error) {
      console.error('[LeaderboardClientService] Error calculating points:', error);
      return 10; // Fallback
    }
  }
}
