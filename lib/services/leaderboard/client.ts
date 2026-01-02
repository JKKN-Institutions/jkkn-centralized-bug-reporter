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
        .select('reporter_user_id, metadata')
        .eq('organization_id', organizationId)
        .not('reporter_user_id', 'is', null);

      if (dateFilter) {
        query = query.gte('created_at', dateFilter.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by reporter and calculate totals
      const leaderboardMap = new Map<string, LeaderboardEntry>();

      // Fetch user details
      const userIds = Array.from(new Set(data?.map((bug) => bug.reporter_user_id) || []));
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      const userMap = new Map(users?.map((u) => [u.id, u]) || []);

      data?.forEach((bug) => {
        const userId = bug.reporter_user_id;
        if (!userId) return;

        const user = userMap.get(userId);
        const points = (bug.metadata as BugMetadata)?.points || 0;

        const existing = leaderboardMap.get(userId);
        if (existing) {
          existing.total_bugs += 1;
          existing.total_points += points;
        } else {
          leaderboardMap.set(userId, {
            reporter_email: user?.email || 'Unknown',
            reporter_name: user?.full_name,
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
