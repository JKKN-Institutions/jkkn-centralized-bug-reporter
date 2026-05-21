-- =====================================================
-- Migration: Bug reopen affordance
-- Date: 2026-05-21
-- Why: Reporters need to dispute "Resolved" bugs that don't actually resolve
--      the issue. Without a Reopen path, every "fix" that doesn't fix it
--      drifts to out-of-band channels (email/Slack/WhatsApp) and erodes trust
--      faster than no feedback loop at all. Director audit 2026-05-21 caught
--      the omission after Dhanasekar at Elevar reported BUG-377 type issues.
--
-- Consumers (per spec /wirefix Step 6.6 + /fixallbugs Step 2.4):
--   - POST /api/v1/public/bug-reports/[id]/reopen (added in this PR)
--   - Admin bug detail page renders REOPENED badge + reason when reopened_at IS NOT NULL
--   - /fixallbugs auto-triage agent HALTs and surfaces to human when reopen_count > 0
-- =====================================================

-- 1. Add reopen-tracking columns to bug_reports
ALTER TABLE bug_reports
  ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reopen_reason TEXT,
  ADD COLUMN IF NOT EXISTS reopen_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_resolved_at TIMESTAMPTZ;

COMMENT ON COLUMN bug_reports.reopened_at IS 'Timestamp of the most recent reopen by the reporter. NULL means never reopened.';
COMMENT ON COLUMN bug_reports.reopen_reason IS 'Free-text reason the reporter gave on the most recent reopen (min 10 chars enforced API-side).';
COMMENT ON COLUMN bug_reports.reopen_count IS 'Number of times the bug has been reopened. 0 = never reopened. >= 2 is a hard signal of misclassification — auto-triage refuses to attempt fixes.';
COMMENT ON COLUMN bug_reports.last_resolved_at IS 'Snapshot of resolved_at at the moment of the most recent reopen, so the prior fix attempt timeline is preserved.';

-- 2. Index on reopened_at for queue queries ("bugs the reporter has disputed")
CREATE INDEX IF NOT EXISTS idx_bug_reports_reopened_at
  ON bug_reports(reopened_at DESC)
  WHERE reopened_at IS NOT NULL;

-- 3. Status history audit table
-- Captures every status transition. The /reopen endpoint writes a row here
-- with actor_type='reporter'. Admin status updates should also write rows
-- (separate PR — out of scope for this migration but the table is sized for it).
CREATE TABLE IF NOT EXISTS bug_report_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_report_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('reporter', 'triager', 'agent', 'system')),
  from_status TEXT,
  to_status TEXT NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bug_status_history_bug
  ON bug_report_status_history(bug_report_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bug_status_history_actor_type
  ON bug_report_status_history(actor_type, created_at DESC);

COMMENT ON TABLE bug_report_status_history IS 'Append-only audit log of every bug_reports.status transition. Reopen actions land here with actor_type=reporter and reason=<reporter reason>.';

-- 4. RLS — service role bypasses; authenticated users can read history for bugs in their org
ALTER TABLE bug_report_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bug_status_history_select_org_members" ON bug_report_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bug_reports br
      JOIN organization_members om
        ON om.organization_id = br.organization_id
      WHERE br.id = bug_report_status_history.bug_report_id
        AND om.user_id = auth.uid()
    )
  );

-- Note: INSERT is service-role-only (no policy needed; service role bypasses RLS).
-- The API route uses SUPABASE_SERVICE_ROLE_KEY to insert.

-- 5. Verify the migration applied cleanly
DO $$
DECLARE
  cols_added INT;
  hist_table_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO cols_added
  FROM information_schema.columns
  WHERE table_name = 'bug_reports'
    AND column_name IN ('reopened_at', 'reopen_reason', 'reopen_count', 'last_resolved_at');

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'bug_report_status_history'
  ) INTO hist_table_exists;

  IF cols_added <> 4 THEN
    RAISE EXCEPTION 'Reopen migration failed: expected 4 new columns on bug_reports, found %', cols_added;
  END IF;

  IF NOT hist_table_exists THEN
    RAISE EXCEPTION 'Reopen migration failed: bug_report_status_history table not created';
  END IF;

  RAISE NOTICE 'Reopen migration applied successfully: 4 columns + 1 history table + 2 indexes + 1 RLS policy';
END $$;
