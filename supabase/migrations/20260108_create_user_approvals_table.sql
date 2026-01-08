-- =============================================
-- MIGRATION: Create User Approvals Table
-- DATE: 2026-01-08
-- PURPOSE: Add user approval workflow for new user registrations
-- =============================================

-- =============================================
-- 1. CREATE USER_APPROVALS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS user_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  rejected_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

CREATE INDEX idx_user_approvals_user ON user_approvals(user_id);
CREATE INDEX idx_user_approvals_status ON user_approvals(status);
CREATE INDEX idx_user_approvals_email ON user_approvals(email);

COMMENT ON TABLE user_approvals IS 'Tracks approval status for new user registrations';
COMMENT ON COLUMN user_approvals.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN user_approvals.email IS 'User email for display purposes';
COMMENT ON COLUMN user_approvals.status IS 'Approval status: pending, approved, or rejected';
COMMENT ON COLUMN user_approvals.approved_by IS 'Super admin who approved the user';
COMMENT ON COLUMN user_approvals.rejected_by IS 'Super admin who rejected the user';
COMMENT ON COLUMN user_approvals.rejection_reason IS 'Optional reason for rejection';

-- Enable RLS
ALTER TABLE user_approvals ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. RLS POLICIES FOR USER_APPROVALS TABLE
-- =============================================

-- Users can view their own approval status
CREATE POLICY "users_view_own_approval"
  ON user_approvals FOR SELECT
  USING (
    user_id = auth.uid()
  );

-- Super admins can view all approvals
CREATE POLICY "super_admins_view_all_approvals"
  ON user_approvals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- New users can create their own approval request (via trigger or app)
CREATE POLICY "users_create_own_approval"
  ON user_approvals FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Super admins can update approval status
CREATE POLICY "super_admins_update_approvals"
  ON user_approvals FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- Super admins can delete approvals
CREATE POLICY "super_admins_delete_approvals"
  ON user_approvals FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- =============================================
-- 3. CREATE UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_user_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_approvals_updated_at
  BEFORE UPDATE ON user_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_user_approvals_updated_at();

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed: user_approvals table created';
  RAISE NOTICE 'New table: user_approvals with RLS policies';
END $$;
