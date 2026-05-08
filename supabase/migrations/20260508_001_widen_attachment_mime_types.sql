-- =============================================
-- MIGRATION: Widen Attachment MIME Types — add Office docs
-- Version: 1.0.0
-- Date: 2026-05-08
-- Description: Add xlsx, xls, docx, doc to bug-attachments bucket policy
--              so users can attach Excel and Word files to bug reports.
-- =============================================

-- Update the bug-attachments storage bucket to allow Microsoft Office MIME types
-- in addition to the existing images, PDF, plain text, CSV, JSON, and log types.
--
-- Note: storage.buckets.allowed_mime_types is the canonical gate enforced by
-- Supabase Storage at upload time. Any MIME outside this array is rejected
-- with HTTP 400 regardless of the application code's checks.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  -- Images
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  -- Documents
  'application/pdf',
  'text/plain',
  'text/csv',
  -- Microsoft Office (NEW)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  -- .xlsx
  'application/vnd.ms-excel',                                            -- .xls
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
  'application/msword',                                                  -- .doc
  -- Logs
  'application/json',
  'text/x-log',
  'application/x-log'
]
WHERE name = 'bug-attachments';

-- Verify the update applied (will appear in migration logs)
DO $$
DECLARE
  bucket_exists BOOLEAN;
  mime_count INT;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE name = 'bug-attachments')
    INTO bucket_exists;

  IF NOT bucket_exists THEN
    RAISE NOTICE 'bug-attachments bucket does not exist yet. Will be created with the new MIME list when first attachment is uploaded (see lib/storage/attachments.ts ensureBucketExists).';
    RETURN;
  END IF;

  SELECT array_length(allowed_mime_types, 1)
    FROM storage.buckets
    WHERE name = 'bug-attachments'
    INTO mime_count;

  RAISE NOTICE 'bug-attachments bucket now allows % MIME types (was 13, expected 17).', mime_count;
END $$;
