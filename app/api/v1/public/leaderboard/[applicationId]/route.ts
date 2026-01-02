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
      // Include metadata for reporter info (SDK stores reporter_email/name in metadata)
      let query = supabase
        .from('bug_reports')
        .select('reporter_user_id, category, created_at, metadata')
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
      // Use email as the unique identifier (from metadata or reporter_user_id lookup)
      const reporterPoints = new Map<string, number>();
      const reporterBugCounts = new Map<string, number>();
      const reporterNames = new Map<string, string>();

      for (const bug of bugReports || []) {
        // Get reporter identifier - prefer metadata.reporter_email, fallback to reporter_user_id
        const metadata = bug.metadata as { reporter_email?: string; reporter_name?: string } | null;
        const reporterEmail = metadata?.reporter_email;
        const reporterName = metadata?.reporter_name;

        // Skip if no reporter identifier
        if (!reporterEmail && !bug.reporter_user_id) continue;

        // Use email as key, or fallback to user_id
        const reporterKey = reporterEmail || bug.reporter_user_id;
        if (!reporterKey) continue;

        const currentPoints = reporterPoints.get(reporterKey) || 0;
        const currentCount = reporterBugCounts.get(reporterKey) || 0;

        // Store reporter name for display
        if (reporterName && !reporterNames.has(reporterKey)) {
          reporterNames.set(reporterKey, reporterName);
        }

        // Calculate points based on category
        // Security bugs get critical points, performance gets high, others get medium
        let points = config.points_medium; // Default points per bug
        switch (bug.category) {
          case 'security':
            points = config.points_critical;
            break;
          case 'performance':
            points = config.points_high;
            break;
          case 'bug':
          case 'ui_design':
            points = config.points_medium;
            break;
          case 'feature_request':
          case 'other':
            points = config.points_low;
            break;
          default:
            points = config.points_medium;
        }

        reporterPoints.set(reporterKey, currentPoints + points);
        reporterBugCounts.set(reporterKey, currentCount + 1);
      }

      // Get reporter keys
      const reporterKeys = Array.from(reporterPoints.keys());

      if (reporterKeys.length === 0) {
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

      // Build leaderboard directly from collected data
      // (No need to fetch profiles since reporter info comes from metadata)
      const leaderboard = reporterKeys
        .map((key) => ({
          user_id: key, // Use email as identifier
          email: key.includes('@') ? key : null, // Only set email if it looks like an email
          full_name: reporterNames.get(key) || key.split('@')[0] || 'Anonymous',
          avatar_url: null,
          total_points: reporterPoints.get(key) || 0,
          total_bugs: reporterBugCounts.get(key) || 0
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
