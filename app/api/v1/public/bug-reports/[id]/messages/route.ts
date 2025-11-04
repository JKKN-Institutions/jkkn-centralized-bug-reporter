import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  withApiKeyAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/middleware/api-key-auth';
import type {
  SendBugReportMessageRequest,
  SendBugReportMessageResponse,
  ApiRequestContext,
  EnhancedBugReportMessage,
} from '@bug-reporter/shared';

/**
 * POST /api/v1/public/bug-reports/:id/messages
 * Send a message on a bug report
 * Requires API key authentication
 */
export const POST = withApiKeyAuth(
  async (
    request: NextRequest,
    context: ApiRequestContext,
    { params }: { params: { id: string } }
  ) => {
    try {
      const { id: bugReportId } = params;

      // Parse request body
      const body: SendBugReportMessageRequest = await request.json();

      // Validate required fields
      if (!body.message || body.message.trim().length === 0) {
        return createApiErrorResponse(
          'VALIDATION_ERROR',
          'Message text is required and cannot be empty',
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

      // Verify bug report exists and belongs to this application
      const { data: bugReport, error: bugError } = await supabase
        .from('bug_reports')
        .select('id, application_id')
        .eq('id', bugReportId)
        .eq('application_id', context.application.id)
        .single();

      if (bugError || !bugReport) {
        return createApiErrorResponse(
          'BUG_REPORT_NOT_FOUND',
          'Bug report not found or does not belong to this application',
          404
        );
      }

      // Create message
      // Note: sender_user_id is null for SDK-submitted messages (anonymous reporter)
      const messageData = {
        bug_report_id: bugReportId,
        sender_user_id: null, // SDK messages are from anonymous reporters
        message_text: body.message.trim(),
        message_type: 'text',
        is_internal: false,
      };

      const { data: message, error: createError } = await supabase
        .from('bug_report_messages')
        .insert(messageData)
        .select()
        .single();

      if (createError) {
        console.error('[BugReportAPI /messages] Create message error:', createError);
        return createApiErrorResponse(
          'INTERNAL_ERROR',
          'Failed to send message',
          500,
          { error: createError.message }
        );
      }

      // Handle attachments if provided
      if (body.attachments && body.attachments.length > 0) {
        const attachmentsToInsert = body.attachments.map((url) => ({
          message_id: message.id,
          file_url: url,
          file_name: url.split('/').pop() || 'attachment',
        }));

        const { error: attachmentError } = await supabase
          .from('bug_report_message_attachments')
          .insert(attachmentsToInsert);

        if (attachmentError) {
          console.error('[BugReportAPI /messages] Attachment error:', attachmentError);
          // Don't fail the request, message was created successfully
        }
      }

      // Fetch complete message with attachments
      const { data: completeMessage } = await supabase
        .from('bug_report_messages')
        .select(
          `
          *,
          attachments:bug_report_message_attachments(*),
          reactions:bug_report_message_metadata(*)
        `
        )
        .eq('id', message.id)
        .single();

      const enhancedMessage: EnhancedBugReportMessage = {
        id: completeMessage.id,
        bug_report_id: completeMessage.bug_report_id,
        sender_user_id: completeMessage.sender_user_id,
        message_text: completeMessage.message_text,
        message_type: completeMessage.message_type,
        created_at: completeMessage.created_at,
        updated_at: completeMessage.updated_at,
        attachments: completeMessage.attachments || [],
        reactions: completeMessage.reactions || [],
      };

      const response: SendBugReportMessageResponse = {
        message: enhancedMessage,
        success: true,
      };

      console.log('[BugReportAPI /messages] Message sent:', {
        bug_report_id: bugReportId,
        message_id: message.id,
        application: context.application.name,
      });

      return createApiSuccessResponse(response, 201);
    } catch (error) {
      console.error('[BugReportAPI /messages] Unexpected error:', error);
      return createApiErrorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred while sending message',
        500
      );
    }
  }
);
