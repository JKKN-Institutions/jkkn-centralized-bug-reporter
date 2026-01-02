import { NextRequest } from 'next/server';
import {
  withApiKeyAuth,
  createApiErrorResponse,
  createApiSuccessResponse
} from '@/lib/middleware/api-key-auth';
import type { ApiRequestContext } from '@boobalan_jkkn/shared';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/v1/public/leaderboard/[applicationId]
 * Get leaderboard for a specific application
 * Requires API key authentication
 *
 * Query parameters:
 * - period: 'all-time' | 'weekly' | 'monthly' (default: 'all-time')
 * - limit: number (default: 10, max: 100)
 */
export const GET = withApiKeyAuth(
  async (
    request: NextRequest,
    context: ApiRequestContext,
    routeContext?: { params: Promise<Record<string, string>> }
  ) => {
    try {
      const params = await routeContext?.params;
      const applicationId = params?.applicationId;

      if (!applicationId) {
        return createApiErrorResponse(
          'BAD_REQUEST',
          'Application ID is required',
          400
        );
      }

      // Validate application ID matches the authenticated application
      if (applicationId !== context.application.id) {
        return createApiErrorResponse(
          'FORBIDDEN',
          'API key does not have access to this application',
          403
        );
      }

      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const period = (searchParams.get('period') || 'all-time') as
        | 'all-time'
        | 'weekly'
        | 'monthly';
      const limit = Math.min(
        parseInt(searchParams.get('limit') || '10', 10),
        100
      );

      // Validate period
      if (!['all-time', 'weekly', 'monthly'].includes(period)) {
        return createApiErrorResponse(
          'VALIDATION_ERROR',
          'Invalid period. Must be one of: all-time, weekly, monthly',
          400
        );
      }

      // Get organization leaderboard config for point values
      const supabase = createAdminClient();
      const { data: config, error: configError } = await supabase
        .from('organization_leaderboard_config')
        .select('*')
        .eq('organization_id', context.organization.id)
        .single();

      if (configError || !config) {
        console.error('[LeaderboardAPI] Config error:', configError);
        return createApiErrorResponse(
          'INTERNAL_ERROR',
          'Failed to fetch leaderboard configuration',
          500
        );
      }

      // Check if leaderboard is enabled
      if (!config.is_enabled) {
        return createApiSuccessResponse({
          enabled: false,
          leaderboard: [],
          period,
          message: 'Leaderboard is disabled for this organization'
        });
      }

      // Calculate date range based on period
      let dateFilter = '';
      const now = new Date();

      if (period === 'weekly') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = weekStart.toISOString();
      } else if (period === 'monthly') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = monthStart.toISOString();
      }

      // Build query for bug reports
      let query = supabase
        .from('bug_reports')
        .select('reporter_id, priority, created_at')
        .eq('application_id', applicationId)
        .eq('status', 'resolved'); // Only count resolved bugs

      // Apply date filter if not all-time
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data: bugReports, error: bugsError } = await query;

      if (bugsError) {
        console.error('[LeaderboardAPI] Bugs query error:', bugsError);
        return createApiErrorResponse(
          'INTERNAL_ERROR',
          'Failed to fetch bug reports',
          500
        );
      }

      // Calculate points per reporter
      const reporterPoints = new Map<string, number>();
      const reporterBugCounts = new Map<string, number>();

      for (const bug of bugReports || []) {
        if (!bug.reporter_id) continue;

        const currentPoints = reporterPoints.get(bug.reporter_id) || 0;
        const currentCount = reporterBugCounts.get(bug.reporter_id) || 0;

        // Calculate points based on priority
        let points = 0;
        switch (bug.priority) {
          case 'low':
            points = config.points_low;
            break;
          case 'medium':
            points = config.points_medium;
            break;
          case 'high':
            points = config.points_high;
            break;
          case 'critical':
            points = config.points_critical;
            break;
          default:
            points = config.points_low; // Default to low
        }

        reporterPoints.set(bug.reporter_id, currentPoints + points);
        reporterBugCounts.set(bug.reporter_id, currentCount + 1);
      }

      // Get reporter profiles
      const reporterIds = Array.from(reporterPoints.keys());

      if (reporterIds.length === 0) {
        return createApiSuccessResponse({
          enabled: true,
          leaderboard: [],
          period,
          config: {
            points_low: config.points_low,
            points_medium: config.points_medium,
            points_high: config.points_high,
            points_critical: config.points_critical,
            weekly_prize_amount: config.weekly_prize_amount,
            monthly_prize_amount: config.monthly_prize_amount,
            prize_description: config.prize_description
          }
        });
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .in('id', reporterIds);

      if (profilesError) {
        console.error('[LeaderboardAPI] Profiles error:', profilesError);
        return createApiErrorResponse(
          'INTERNAL_ERROR',
          'Failed to fetch user profiles',
          500
        );
      }

      // Build leaderboard with profile data
      const leaderboard = (profiles || [])
        .map((profile) => ({
          user_id: profile.id,
          email: profile.email,
          full_name: profile.full_name || profile.email || 'Anonymous',
          avatar_url: profile.avatar_url,
          total_points: reporterPoints.get(profile.id) || 0,
          total_bugs: reporterBugCounts.get(profile.id) || 0
        }))
        .sort((a, b) => b.total_points - a.total_points) // Sort by points descending
        .slice(0, limit); // Limit results

      // Add rank
      const rankedLeaderboard = leaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

      console.log('[LeaderboardAPI] Leaderboard fetched:', {
        application: context.application.name,
        period,
        entries: rankedLeaderboard.length
      });

      return createApiSuccessResponse({
        enabled: true,
        leaderboard: rankedLeaderboard,
        period,
        config: {
          points_low: config.points_low,
          points_medium: config.points_medium,
          points_high: config.points_high,
          points_critical: config.points_critical,
          weekly_prize_amount: config.weekly_prize_amount,
          monthly_prize_amount: config.monthly_prize_amount,
          prize_description: config.prize_description
        }
      });
    } catch (error) {
      console.error('[LeaderboardAPI] Unexpected error:', error);
      return createApiErrorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred while processing your request',
        500
      );
    }
  }
);

/**
 * OPTIONS /api/v1/public/leaderboard/[applicationId]
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, x-api-key',
      'Access-Control-Max-Age': '86400'
    }
  });
}
