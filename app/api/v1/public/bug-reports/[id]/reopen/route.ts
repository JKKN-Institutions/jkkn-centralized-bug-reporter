import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  withApiKeyAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/middleware/api-key-auth';
import type { ApiRequestContext } from '@boobalan_jkkn/shared';

/**
 * POST /api/v1/public/bug-reports/:id/reopen
 *
 * Reopen a resolved/closed bug report. Used by the SDK's MyBugsPanel (or the
 * consumer app's /my-bug-reports page) to let the reporter dispute a "Resolved"
 * status that didn't actually resolve the issue.
 *
 * Auth: API key (verifies the bug belongs to the requesting application).
 * Side effects:
 *   - Sets bug.status = 'seen' (re-enters the triage queue)
 *   - Snapshots resolved_at into last_resolved_at
 *   - Increments reopen_count
 *   - Stamps reopened_at + reopen_reason
 *   - Writes a bug_report_status_history row with actor_type='reporter'
 *
 * Body: { reason: string }  // min 10 chars, max 2000 chars
 *
 * Couples to:
 *   - /fixallbugs Step 2.4 (skill HALTs when reopen_count > 0)
 *   - /fixmyjkkn Step 2.4 (same — for MyJKKN's native /admin/bug-reports)
 *   - /wirefix Step 6.6 (canonical recipe for consumer-side Reopen button)
 *
 * @see Migration: supabase/migrations/20260521_001_bug_reopen_affordance.sql
 */

interface ReopenRequestBody {
  reason: string;
}

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 2000;
const REOPENABLE_STATUSES = ['resolved', 'wont_fix'] as const;
const REOPEN_DESTINATION_STATUS = 'seen' as const;

export const POST = withApiKeyAuth(
  async (
    request: NextRequest,
    context: ApiRequestContext,
    routeContext?: { params: Promise<Record<string, string>> }
  ) => {
    try {
      const params = await routeContext!.params;
      const { id: bugReportId } = params;

      if (!bugReportId) {
        return createApiErrorResponse(
          'VALIDATION_ERROR',
          'Bug report ID is required',
          400
        );
      }

      // Parse and validate body
      let body: ReopenRequestBody;
      try {
        body = await request.json();
      } catch {
        return createApiErrorResponse(
          'VALIDATION_ERROR',
          'Request body must be valid JSON',
          400
        );
      }

      const reason = (body?.reason ?? '').trim();

      if (reason.length < MIN_REASON_LENGTH) {
        return createApiErrorResponse(
          'VALIDATION_ERROR',
          `Reason is required and must be at least ${MIN_REASON_LENGTH} characters. Tell the team what's still broken.`,
          400
        );
      }

      if (reason.length > MAX_REASON_LENGTH) {
        return createApiErrorResponse(
          'VALIDATION_ERROR',
          `Reason must be ${MAX_REASON_LENGTH} characters or less`,
          400
        );
      }

      // Service-role client (RLS bypassed; we enforce app scoping manually)
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

      // Verify bug exists, belongs to the requesting application, and is in a reopenable state
      const { data: bug, error: bugError } = await supabase
        .from('bug_reports')
        .select(
          'id, display_id, application_id, status, resolved_at, reopen_count, reporter_user_id'
        )
        .eq('id', bugReportId)
        .eq('application_id', context.application.id)
        .single();

      if (bugError || !bug) {
        return createApiErrorResponse(
          'BUG_REPORT_NOT_FOUND',
          'Bug report not found or does not belong to this application',
          404
        );
      }

      if (!REOPENABLE_STATUSES.includes(bug.status as (typeof REOPENABLE_STATUSES)[number])) {
        return createApiErrorResponse(
          'INVALID_STATE',
          `Bug status is '${bug.status}'. Only resolved or wont_fix bugs can be reopened.`,
          409
        );
      }

      const fromStatus = bug.status;
      const priorResolvedAt = bug.resolved_at;
      const newReopenCount = (bug.reopen_count ?? 0) + 1;
      const nowIso = new Date().toISOString();

      // Update the bug record
      const { data: updated, error: updateError } = await supabase
        .from('bug_reports')
        .update({
          status: REOPEN_DESTINATION_STATUS,
          reopened_at: nowIso,
          reopen_reason: reason,
          reopen_count: newReopenCount,
          last_resolved_at: priorResolvedAt,
          resolved_at: null,
        })
        .eq('id', bugReportId)
        .select()
        .single();

      if (updateError || !updated) {
        console.error('[BugReport /reopen] update error:', updateError);
        return createApiErrorResponse(
          'INTERNAL_ERROR',
          'Failed to reopen bug report',
          500
        );
      }

      // Append to status history (best-effort — failures here don't block the reopen)
      const { error: historyError } = await supabase
        .from('bug_report_status_history')
        .insert({
          bug_report_id: bugReportId,
          actor_user_id: bug.reporter_user_id,
          actor_type: 'reporter',
          from_status: fromStatus,
          to_status: REOPEN_DESTINATION_STATUS,
          reason,
          metadata: {
            reopen_count_after: newReopenCount,
            prior_resolved_at: priorResolvedAt,
          },
        });

      if (historyError) {
        // Don't fail the whole reopen — the source-of-truth update succeeded.
        // Log the audit gap so it can be backfilled.
        console.error(
          '[BugReport /reopen] status history insert failed (non-fatal):',
          historyError
        );
      }

      return createApiSuccessResponse({
        bug_report: updated,
        message: `Bug reopened. The team has been notified.${
          newReopenCount >= 2
            ? ' This bug has been reopened multiple times — flagged for manual review.'
            : ''
        }`,
        reopen_count: newReopenCount,
      });
    } catch (error) {
      console.error('[BugReport /reopen] unexpected error:', error);
      return createApiErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
    }
  }
);
