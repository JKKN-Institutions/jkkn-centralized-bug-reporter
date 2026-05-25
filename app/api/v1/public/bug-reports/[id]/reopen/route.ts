import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  withApiKeyAuth,
  createApiErrorResponse,
  createApiSuccessResponse,
} from '@/lib/middleware/api-key-auth';
import type {
  ReopenBugReportRequest,
  ReopenBugReportResponse,
  ApiRequestContext,
  BugReport,
} from '@boobalan_jkkn/shared';

const MIN_REASON_LENGTH = 10;
const REOPENABLE_STATUSES = new Set(['resolved', 'closed']);

/**
 * PATCH /api/v1/public/bug-reports/:id/reopen
 *
 * Lets the original reporter dispute a Resolved/Closed status. Server flips
 * status back to 'open', records reopened_at + reason, increments reopen_count.
 *
 * Auth: SDK X-API-Key header (validated by withApiKeyAuth).
 *
 * Identity gate: reporter_email in the body MUST match bug.reporter_email.
 * Anonymous bugs (reporter_email IS NULL) CANNOT be reopened — without an
 * identity to verify, any holder of the SDK api_key could reopen any bug
 * from any other user. Safer to require explicit identity.
 *
 * Cross-tenant safety: the bug MUST belong to the application that owns
 * the api_key. Otherwise an API key from App A could be used to reopen
 * bugs in App B.
 *
 * Body: { reason: string (min 10 chars), reporter_email: string }
 *
 * Returns 200 with the updated bug, or 4xx with a clear error code.
 */
export const PATCH = withApiKeyAuth(
  async (
    request: NextRequest,
    context: ApiRequestContext,
    routeContext?: { params: Promise<Record<string, string>> }
  ) => {
    try {
      const params = await routeContext!.params;
      const { id } = params;

      if (!id) {
        return createApiErrorResponse(
          'MISSING_BUG_ID',
          'Bug ID is required in the URL path.',
          400
        );
      }

      // Parse + validate body
      let body: ReopenBugReportRequest;
      try {
        body = (await request.json()) as ReopenBugReportRequest;
      } catch {
        return createApiErrorResponse(
          'INVALID_JSON',
          'Request body must be valid JSON.',
          400
        );
      }

      const reason = (body.reason ?? '').trim();
      // 2026-05-25 — was `reporter_email` (TEXT). Switched to
      // `reporter_user_id` (UUID) because the bug_reports table has
      // reporter_user_id (FK to auth.users), NOT reporter_email. The
      // previous code's SELECT errored at the DB level (column does
      // not exist) and the error was masked as BUG_NOT_FOUND.
      const reporterUserId = (body.reporter_user_id ?? '').trim();

      if (reason.length < MIN_REASON_LENGTH) {
        return createApiErrorResponse(
          'REASON_TOO_SHORT',
          `Reason must be at least ${MIN_REASON_LENGTH} characters. Tell the team what's still broken.`,
          400
        );
      }

      // UUID v4 sanity check — anything else can't possibly match a real
      // auth.users id, so reject early with a clear error.
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!reporterUserId || !UUID_RE.test(reporterUserId)) {
        return createApiErrorResponse(
          'MISSING_REPORTER_USER_ID',
          'reporter_user_id is required and must be the UUID of the original reporter (from the consumer app\'s Supabase auth.users.id). Anonymous bugs cannot be reopened.',
          400
        );
      }

      // Service-role Supabase client — needed to bypass RLS for the
      // identity-checked update (RLS for bug_reports gates by org/app
      // membership, not by reporter identity).
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

      // Fetch the bug + verify cross-tenant safety in one query.
      // NOTE on columns: bug_reports has `status` (text) + `resolved_at`
      // (timestamptz) + `reporter_user_id` (uuid). It does NOT have
      // `is_resolved` or `reporter_email` — referencing those was the
      // PR #5 mistake. Status alone determines resolution state.
      const { data: bug, error: fetchError } = await supabase
        .from('bug_reports')
        .select(
          'id, application_id, status, reporter_user_id, reopen_count, resolved_at'
        )
        .eq('id', id)
        .single();

      // Distinguish "row missing" from "query failed" — the previous
      // BUG_NOT_FOUND was returned for both, hiding column-mismatch errors.
      if (fetchError) {
        if ((fetchError as { code?: string }).code === 'PGRST116') {
          // PGRST116 = no rows returned by .single()
          return createApiErrorResponse(
            'BUG_NOT_FOUND',
            'Bug report not found.',
            404
          );
        }
        console.error('[reopen] DB fetch failed', fetchError);
        return createApiErrorResponse(
          'DB_FETCH_FAILED',
          'Internal database error while looking up the bug. The team has been notified.',
          500
        );
      }
      if (!bug) {
        return createApiErrorResponse(
          'BUG_NOT_FOUND',
          'Bug report not found.',
          404
        );
      }

      // Cross-tenant: bug must belong to the app the api_key belongs to
      if (bug.application_id !== context.application.id) {
        return createApiErrorResponse(
          'BUG_WRONG_APPLICATION',
          'This bug does not belong to your application.',
          403
        );
      }

      // Identity gate: reporter_user_id must match
      if (!bug.reporter_user_id) {
        return createApiErrorResponse(
          'BUG_IS_ANONYMOUS',
          'This bug was submitted anonymously and cannot be reopened. Submit a fresh bug report instead.',
          403
        );
      }
      if (bug.reporter_user_id !== reporterUserId) {
        return createApiErrorResponse(
          'REPORTER_MISMATCH',
          'Only the original reporter can reopen this bug.',
          403
        );
      }

      // State gate: must be resolved or closed
      if (!REOPENABLE_STATUSES.has(bug.status)) {
        return createApiErrorResponse(
          'BUG_NOT_REOPENABLE',
          `Bug is currently '${bug.status}' — only resolved or closed bugs can be reopened.`,
          409
        );
      }

      // Apply the reopen. `is_resolved` dropped from the update body
      // (column does not exist; status='open' + resolved_at=null is the
      // canonical signal of un-resolution).
      const nowIso = new Date().toISOString();
      const { data: updated, error: updateError } = await supabase
        .from('bug_reports')
        .update({
          status: 'open',
          resolved_at: null,
          reopened_at: nowIso,
          reopen_reason: reason,
          reopen_count: (bug.reopen_count ?? 0) + 1,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (updateError || !updated) {
        console.error('[reopen] DB update failed', updateError);
        return createApiErrorResponse(
          'REOPEN_FAILED',
          'Failed to reopen the bug. Try again or contact support.',
          500
        );
      }

      const response: ReopenBugReportResponse = {
        bug_report: updated as BugReport,
        message: `Bug reopened (count: ${updated.reopen_count}). The team has been notified.`,
      };
      return createApiSuccessResponse(response);
    } catch (err) {
      console.error('[reopen] Unhandled error', err);
      return createApiErrorResponse(
        'INTERNAL_ERROR',
        'An unexpected error occurred.',
        500
      );
    }
  }
);
