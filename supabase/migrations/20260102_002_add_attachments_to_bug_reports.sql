-- =============================================
-- MIGRATION: Add Attachments Column to Bug Reports
-- Version: 1.0.0
-- Date: 2026-01-02
-- Description: Add support for file attachments in bug reports
-- =============================================

-- Add attachments column to bug_reports table
ALTER TABLE public.bug_reports
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- =============================================
-- INDEXES: For performance optimization
-- =============================================

-- GIN index for JSONB queries (searching within attachments array)
CREATE INDEX IF NOT EXISTS idx_bug_reports_attachments
  ON public.bug_reports USING GIN (attachments);

-- Index for checking if bug has attachments
CREATE INDEX IF NOT EXISTS idx_bug_reports_has_attachments
  ON public.bug_reports ((jsonb_array_length(attachments) > 0))
  WHERE jsonb_array_length(attachments) > 0;

-- =============================================
-- COMMENTS: Documentation
-- =============================================

COMMENT ON COLUMN public.bug_reports.attachments IS
  'Array of file attachment objects with filename, filesize, filetype, and url. Format: [{"filename": "error.log", "filesize": 1024, "filetype": "text/plain", "url": "https://..."}]';

-- =============================================
-- VALIDATION: Example of valid attachments structure
-- =============================================

-- Valid example:
-- [
--   {
--     "filename": "screenshot.png",
--     "filesize": 102400,
--     "filetype": "image/png",
--     "url": "https://storage.supabase.co/..."
--   },
--   {
--     "filename": "error.log",
--     "filesize": 2048,
--     "filetype": "text/plain",
--     "url": "https://storage.supabase.co/..."
--   }
-- ]
