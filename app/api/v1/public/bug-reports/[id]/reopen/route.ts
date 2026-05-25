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
      // Dual-identity: accept reporter_user_id (UUID, for SDK 1.4.0+
      // when it forwards userContext.userId) AND/OR reporter_email
      // (text, for SDK 1.3.x which forwards email via
      // metadata.reporter_email on submit). At least one must be
      // present + must match either the bug's reporter_user_id column
      // OR its metadata.reporter_email respectively.
      const reporterUserIdRaw = (body.reporter_user_id ?? '').trim();
      const reporterEmailRaw = (body.reporter_email ?? '').trim().toLowerCase();

      if (reason.length < MIN_REASON_LENGTH) {
        return createApiErrorResponse(
          'REASON_TOO_SHORT',
          `Reason must be at least ${MIN_REASON_LENGTH} characters. Tell the team what's still broken.`,
          400
        );
      }

      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const hasValidUserId = reporterUserIdRaw && UUID_RE.test(reporterUserIdRaw);
      const hasValidEmail = reporterEmailRaw && reporterEmailRaw.includes('@');

      if (!hasValidUserId && !hasValidEmail) {
        return createApiErrorResponse(
          'MISSING_REPORTER_IDENTITY',
          'Either reporter_user_id (UUID of the consumer app\'s auth.users.id) or reporter_email (email of the original reporter) is required. Anonymous bugs cannot be reopened.',
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
      // Pulls metadata to access reporter_email (jsonb) for the
      // SDK-1.3.x identity check fallback.
      const { data: bug, error: fetchError } = await supabase
        .from('bug_reports')
        .select(
          'id, application_id, status, reporter_user_id, reopen_count, resolved_at, metadata'
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

      // Identity gate — dual-path. Either matches → authorized:
      //   Path A (SDK 1.4.0+): bug.reporter_user_id matches body.reporter_user_id
      //   Path B (SDK 1.3.x):  bug.metadata.reporter_email matches body.reporter_email
      // Today most bugs are Path B because SDK 1.3.x forwards email only.
      // When SDK forwards user.id too, bugs become identifiable by both.
      const bugMetaEmail = ((bug.metadata as { reporter_email?: string } | null)?.reporter_email ?? '').trim().toLowerCase();

      const matchByUserId = hasValidUserId && bug.reporter_user_id && bug.reporter_user_id === reporterUserIdRaw;
      const matchByEmail = hasValidEmail && bugMetaEmail && bugMetaEmail === reporterEmailRaw;

      if (!bug.reporter_user_id && !bugMetaEmail) {
        return createApiErrorResponse(
          'BUG_IS_ANONYMOUS',
          'This bug was submitted with no recorded reporter identity and cannot be reopened. Submit a fresh bug report instead.',
          403
        );
      }

      if (!matchByUserId && !matchByEmail) {
        return createApiErrorResponse(
          'REPORTER_MISMATCH',
          'Only the original reporter can reopen this bug. The reporter_user_id/reporter_email you provided does not match the bug\'s recorded reporter.',
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
