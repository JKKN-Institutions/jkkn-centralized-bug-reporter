-- =============================================
-- MIGRATION: Bug Reopen by Reporter — schema columns + audit
-- Version: 1.0.0
-- Date: 2026-05-21
-- Description: Adds reopen tracking to bug_reports so reporters can
--              dispute a wrong "Resolved" status via the SDK widget.
--              Closes the full feedback loop (Phase 2.1 of /wirefix
--              Step 6.6). Paired with the new PATCH endpoint at
--              /api/v1/public/bug-reports/[id]/reopen.
--
--              State model: when a reporter reopens a Resolved/Closed
--              bug, status flips back to 'open', is_resolved flips to
--              false, resolved_at clears, and the three new columns
--              capture WHO/WHEN/WHY/HOW-MANY-TIMES. The auto-triage
--              skills (/fixallbugs Step 2.4, /fixmyjkkn Step 2.4) read
--              reopened_at + reopen_count to HALT before re-attempting
--              a fix on a bug whose prior fix already failed.
-- =============================================

BEGIN;

-- 1. Add the three reopen-tracking columns. All nullable / zero-defaulted
--    so the migration is fully backward-compatible (existing 350+ bugs
--    keep their current shape; reopen_count defaults to 0).

ALTER TABLE bug_reports
  ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS reopen_reason TEXT NULL,
  ADD COLUMN IF NOT EXISTS reopen_count INTEGER NOT NULL DEFAULT 0;

-- 2. Comments document semantics so future readers don't have to
--    guess what the columns mean.

COMMENT ON COLUMN bug_reports.reopened_at IS
  'Timestamp the most recent reopen event happened. NULL = never reopened. Set by PATCH /api/v1/public/bug-reports/[id]/reopen.';

COMMENT ON COLUMN bug_reports.reopen_reason IS
  'The reporter''s text explanation submitted with the most recent reopen. Required (>=10 chars). Older reopen reasons are NOT preserved here — only the most recent one.';

COMMENT ON COLUMN bug_reports.reopen_count IS
  'How many times this bug has been reopened by the reporter. Auto-triage skills HALT on reopen_count >= 1 to prevent shipping a second wrong fix on top of the first. reopen_count >= 2 indicates almost certain misclassification (feature request, env issue, or user-flow misunderstanding).';

-- 3. Index for the auto-triage skills' Step 2.4 detection — they query
--    "WHERE reopened_at IS NOT NULL OR reopen_count > 0" frequently;
--    a partial index makes that O(log N) over the reopened subset
--    rather than a full table scan.

CREATE INDEX IF NOT EXISTS idx_bug_reports_reopened
  ON bug_reports (reopened_at DESC)
  WHERE reopened_at IS NOT NULL;

COMMIT;

-- =============================================
-- Smoke verification (SELECT-only, no mutation):
-- =============================================
-- SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'bug_reports'
--     AND column_name IN ('reopened_at', 'reopen_reason', 'reopen_count')
--   ORDER BY column_name;
--
-- Expected: 3 rows (reopen_count default '0', others NULL-able).
--
-- SELECT indexname FROM pg_indexes
--   WHERE tablename = 'bug_reports' AND indexname = 'idx_bug_reports_reopened';
--
-- Expected: 1 row.
