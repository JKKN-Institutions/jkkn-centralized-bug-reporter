import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  withApiKeyAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/middleware/api-key-auth';
import type {
  GetMyBugReportsResponse,
  ApiRequestContext,
  BugReport,
} from '@bug-reporter/shared';

/**
 * GET /api/v1/public/bug-reports/me
 * Get all bug reports submitted for this application
 * Requires API key authentication
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - status: Filter by status (open, in_progress, resolved, closed)
 * - category: Filter by category
 * - search: Search in title and description
 * - sort_by: Sort field (created_at, updated_at, priority) - default: created_at
 * - sort_order: Sort order (asc, desc) - default: desc
 */
export const GET = withApiKeyAuth(async (request: NextRequest, context: ApiRequestContext) => {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc';

    // Validate sort_by
    const allowedSortFields = ['created_at', 'updated_at', 'priority'];
    if (!allowedSortFields.includes(sortBy)) {
      return createApiErrorResponse(
        'VALIDATION_ERROR',
        `Invalid sort_by parameter. Allowed values: ${allowedSortFields.join(', ')}`,
        400
      );
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Build query
    let query = supabase
      .from('bug_reports')
      .select('*, application:applications(id, name, slug)', { count: 'exact' })
      .eq('application_id', context.application.id);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Execute query
    const { data: bugReports, error, count } = await query;

    if (error) {
      console.error('[BugReportAPI /me] Query error:', error);
      return createApiErrorResponse(
        'INTERNAL_ERROR',
        'Failed to fetch bug reports',
        500,
        { error: error.message }
      );
    }

    // Calculate pagination
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    const response: GetMyBugReportsResponse = {
      bug_reports: (bugReports as BugReport[]) || [],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };

    console.log('[BugReportAPI /me] Fetched bug reports:', {
      application: context.application.name,
      count: bugReports?.length || 0,
      total,
    });

    return createApiSuccessResponse(response, 200);
  } catch (error) {
    console.error('[BugReportAPI /me] Unexpected error:', error);
    return createApiErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred while fetching bug reports',
      500
    );
  }
});

/**
 * OPTIONS /api/v1/public/bug-reports/me
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, x-api-key',
      'Access-Control-Max-Age': '86400',
    }
  });
}
