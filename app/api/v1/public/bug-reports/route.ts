import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  withApiKeyAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/middleware/api-key-auth';
import type {
  SubmitBugReportRequest,
  SubmitBugReportResponse,
  ApiRequestContext,
} from '@bug-reporter/shared';

/**
 * POST /api/v1/public/bug-reports
 * Submit a bug report via SDK
 * Requires API key authentication
 */
export const POST = withApiKeyAuth(async (request: NextRequest, context: ApiRequestContext) => {
  try {
    // Parse request body
    const body: SubmitBugReportRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.description || !body.page_url) {
      return createApiErrorResponse(
        'VALIDATION_ERROR',
        'Missing required fields: title, description, and page_url are required',
        400,
        {
          required_fields: ['title', 'description', 'page_url'],
        }
      );
    }

    // Create Supabase client with service role for bypassing RLS
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

    // Handle screenshot upload if provided
    let screenshot_url: string | null = null;
    if (body.screenshot_data_url) {
      try {
        // Extract base64 data
        const matches = body.screenshot_data_url.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          // Generate unique filename
          const filename = `bug-screenshot-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
          const filePath = `${context.organization.id}/${context.application.id}/${filename}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('bug-attachments')
            .upload(filePath, buffer, {
              contentType,
              cacheControl: '3600',
            });

          if (uploadError) {
            console.error('[BugReportAPI] Screenshot upload error:', uploadError);
            // Continue without screenshot rather than failing
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from('bug-attachments')
              .getPublicUrl(filePath);
            screenshot_url = urlData.publicUrl;
          }
        }
      } catch (screenshotError) {
        console.error('[BugReportAPI] Screenshot processing error:', screenshotError);
        // Continue without screenshot
      }
    }

    // Create bug report data matching actual schema
    const bugReportData = {
      organization_id: context.organization.id,
      application_id: context.application.id,
      page_url: body.page_url,
      description: body.description,
      category: body.category || 'bug',
      screenshot_url,
      console_logs: body.console_logs || null,
      status: 'new' as const,
      metadata: {
        title: body.title,
        reporter_name: body.reporter_name || null,
        reporter_email: body.reporter_email || null,
        browser_info: body.browser_info || body.metadata?.userAgent || null,
        system_info: body.system_info || null,
        viewport: body.metadata?.viewport || null,
        screen_resolution: body.metadata?.screenResolution || null,
        timestamp: body.metadata?.timestamp || new Date().toISOString(),
      },
    };

    const { data: bugReport, error: createError } = await supabase
      .from('bug_reports')
      .insert(bugReportData)
      .select()
      .single();

    if (createError) {
      console.error('[BugReportAPI] Create error:', createError);
      return createApiErrorResponse(
        'INTERNAL_ERROR',
        'Failed to create bug report',
        500,
        { error: createError.message }
      );
    }

    console.log('[BugReportAPI] Bug report created:', {
      id: bugReport.id,
      application: context.application.name,
      organization: context.organization.name,
    });

    const response: SubmitBugReportResponse = {
      bug_report: bugReport,
      message: 'Bug report submitted successfully. Thank you for your report!',
    };

    return createApiSuccessResponse(response, 201);
  } catch (error) {
    console.error('[BugReportAPI] Unexpected error:', error);
    return createApiErrorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred while processing your request',
      500
    );
  }
});

/**
 * OPTIONS /api/v1/public/bug-reports
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

/**
 * GET /api/v1/public/bug-reports
 * Not implemented - use /me endpoint instead
 */
export async function GET() {
  return createApiErrorResponse(
    'INVALID_REQUEST',
    'This endpoint does not support GET requests. Use /api/v1/public/bug-reports/me instead.',
    405
  );
}
