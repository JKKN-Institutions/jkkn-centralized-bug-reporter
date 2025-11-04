import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  withApiKeyAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/middleware/api-key-auth';
import type {
  GetBugReportDetailsResponse,
  ApiRequestContext,
  BugReport,
  EnhancedBugReportMessage,
} from '@bug-reporter/shared';

/**
 * GET /api/v1/public/bug-reports/:id
 * Get details of a specific bug report
 * Requires API key authentication
 *
 * Query parameters:
 * - include_messages: Include messages (default: true)
 */
export const GET = withApiKeyAuth(
  async (
    request: NextRequest,
    context: ApiRequestContext,
    { params }: { params: { id: string } }
  ) => {
    try {
      const { id } = params;
      const { searchParams } = new URL(request.url);
      const includeMessages = searchParams.get('include_messages') !== 'false';

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

      // Fetch bug report
      const { data: bugReport, error: bugError } = await supabase
        .from('bug_reports')
        .select(
          `
          *,
          application:applications(id, name, slug),
          organization:organizations(id, name)
        `
        )
        .eq('id', id)
        .eq('application_id', context.application.id) // Ensure bug belongs to this app
        .single();

      if (bugError) {
        if (bugError.code === 'PGRST116') {
          return createApiErrorResponse(
            'BUG_REPORT_NOT_FOUND',
            'Bug report not found or does not belong to this application',
            404
          );
        }
        console.error('[BugReportAPI /:id] Fetch error:', bugError);
        return createApiErrorResponse(
          'INTERNAL_ERROR',
          'Failed to fetch bug report',
          500,
          { error: bugError.message }
        );
      }

      // Fetch messages if requested
      let messages: EnhancedBugReportMessage[] = [];
      if (includeMessages) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('bug_report_messages')
          .select(
            `
            *,
            sender:profiles(id, email, full_name, avatar_url),
            attachments:bug_report_message_attachments(*),
            reactions:bug_report_message_metadata(*)
          `
          )
          .eq('bug_report_id', id)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('[BugReportAPI /:id] Messages fetch error:', messagesError);
          // Don't fail the request, just log and continue with empty messages
        } else {
          messages = (messagesData as any[])?.map((msg) => ({
            id: msg.id,
            bug_report_id: msg.bug_report_id,
            sender_user_id: msg.sender_user_id,
            message_text: msg.message_text,
            message_type: msg.message_type,
            created_at: msg.created_at,
            updated_at: msg.updated_at,
            attachments: msg.attachments || [],
            reactions: msg.reactions || [],
            sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
          })) || [];
        }
      }

      const response: GetBugReportDetailsResponse = {
        bug_report: bugReport as BugReport,
        messages: includeMessages ? messages : undefined,
      };

      console.log('[BugReportAPI /:id] Fetched bug report:', {
        id,
        application: context.application.name,
        messages_count: messages.length,
      });

      return createApiSuccessResponse(response, 200);
    } catch (error) {
      console.error('[BugReportAPI /:id] Unexpected error:', error);
      return createApiErrorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred while fetching bug report',
        500
      );
    }
  }
);
