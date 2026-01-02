-- Migration: AI Similarity Detection for Bug Reports
-- Date: 2025-12-31
-- Purpose: Enable pgvector, add embedding columns, create similarity feedback table

-- =============================================
-- ENABLE PGVECTOR EXTENSION
-- =============================================
-- text-embedding-3-small produces 1536-dimensional vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- ADD EMBEDDING COLUMNS TO BUG_REPORTS
-- =============================================
ALTER TABLE bug_reports
ADD COLUMN IF NOT EXISTS embedding vector(1536);

ALTER TABLE bug_reports
ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMPTZ;

-- Create IVFFlat index for efficient similarity search
-- lists = 100 is suitable for datasets up to ~100k bugs
-- For larger datasets, increase lists (sqrt of total rows is a good heuristic)
CREATE INDEX IF NOT EXISTS idx_bug_reports_embedding
ON bug_reports
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- =============================================
-- SIMILARITY FEEDBACK TABLE
-- Stores dismissed suggestions for implicit negative signal learning
-- =============================================
CREATE TABLE IF NOT EXISTS similarity_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The bug being viewed when suggestion was dismissed
  bug_report_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,

  -- The suggested bug that was dismissed
  suggested_bug_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,

  -- Similarity score at time of dismissal (for threshold analysis)
  similarity_score FLOAT NOT NULL,

  -- Type of suggestion: 'duplicate' (>0.9) or 'related' (0.7-0.9)
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('duplicate', 'related')),

  -- Dismissal metadata
  dismissed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  dismissed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Organization for RLS and filtering
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Prevent duplicate dismissals
  UNIQUE(bug_report_id, suggested_bug_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_similarity_feedback_org
ON similarity_feedback(organization_id);

CREATE INDEX IF NOT EXISTS idx_similarity_feedback_bug
ON similarity_feedback(bug_report_id);

CREATE INDEX IF NOT EXISTS idx_similarity_feedback_dismissed
ON similarity_feedback(dismissed_at DESC);

-- =============================================
-- RLS POLICIES FOR SIMILARITY_FEEDBACK
-- =============================================
ALTER TABLE similarity_feedback ENABLE ROW LEVEL SECURITY;

-- Organization members can view feedback in their org
CREATE POLICY "org_members_view_feedback"
  ON similarity_feedback FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM get_user_organization_ids(auth.uid())
    )
  );

-- Organization members can create feedback (dismiss suggestions)
CREATE POLICY "org_members_create_feedback"
  ON similarity_feedback FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM get_user_organization_ids(auth.uid())
    )
    AND dismissed_by_user_id = auth.uid()
  );

-- Users can delete their own feedback
CREATE POLICY "users_delete_own_feedback"
  ON similarity_feedback FOR DELETE
  USING (dismissed_by_user_id = auth.uid());

-- Super admins can view and manage all feedback
CREATE POLICY "super_admins_manage_feedback"
  ON similarity_feedback FOR ALL
  USING (is_super_admin(auth.uid()));

-- =============================================
-- HELPER FUNCTION FOR SIMILARITY SEARCH
-- =============================================
-- Function to find similar bugs using cosine similarity
CREATE OR REPLACE FUNCTION find_similar_bugs(
  target_bug_id UUID,
  min_similarity FLOAT DEFAULT 0.7,
  max_results INT DEFAULT 10
)
RETURNS TABLE (
  bug_id UUID,
  display_id TEXT,
  title TEXT,
  description TEXT,
  status TEXT,
  application_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_embedding vector(1536);
  target_org_id UUID;
BEGIN
  -- Get the target bug's embedding and organization
  SELECT br.embedding, br.organization_id
  INTO target_embedding, target_org_id
  FROM bug_reports br
  WHERE br.id = target_bug_id;

  -- Return empty if no embedding exists
  IF target_embedding IS NULL THEN
    RETURN;
  END IF;

  -- Find similar bugs in the same organization
  RETURN QUERY
  SELECT
    br.id AS bug_id,
    br.display_id,
    br.metadata->>'title' AS title,
    br.description,
    br.status,
    br.application_id,
    1 - (br.embedding <=> target_embedding) AS similarity
  FROM bug_reports br
  WHERE br.id != target_bug_id
    AND br.organization_id = target_org_id
    AND br.embedding IS NOT NULL
    AND 1 - (br.embedding <=> target_embedding) >= min_similarity
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_similar_bugs TO authenticated;
