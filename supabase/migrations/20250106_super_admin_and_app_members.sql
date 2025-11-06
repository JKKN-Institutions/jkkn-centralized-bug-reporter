-- =============================================
-- MIGRATION: Super Admin and Application Members
-- DATE: 2025-01-06
-- PURPOSE: Add super admin support and application-level access control
-- AUTHOR: System Migration
-- =============================================

-- =============================================
-- 1. CREATE SUPER_ADMINS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  notes TEXT,
  UNIQUE(user_id)
);

CREATE INDEX idx_super_admins_user ON super_admins(user_id);

COMMENT ON TABLE super_admins IS 'Platform-level administrators who can create organizations and manage all resources';
COMMENT ON COLUMN super_admins.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN super_admins.granted_by IS 'Who granted super admin access';
COMMENT ON COLUMN super_admins.notes IS 'Optional notes about why super admin was granted';

-- Enable RLS
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. CREATE APPLICATION_MEMBERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS application_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('maintainer', 'developer', 'viewer')),
  added_by UUID NOT NULL REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(application_id, user_id)
);

CREATE INDEX idx_app_members_app ON application_members(application_id);
CREATE INDEX idx_app_members_user ON application_members(user_id);
CREATE INDEX idx_app_members_role ON application_members(application_id, role);

COMMENT ON TABLE application_members IS 'Application-level access control - users must be explicitly assigned to apps';
COMMENT ON COLUMN application_members.role IS 'maintainer: full access + member management, developer: bug CRUD, viewer: read-only';

-- Enable RLS
ALTER TABLE application_members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. CREATE HELPER FUNCTIONS
-- =============================================

-- Function: Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM super_admins WHERE user_id = user_uuid
  );
$$;

COMMENT ON FUNCTION is_super_admin IS 'Returns true if user is a platform super admin. SECURITY DEFINER to bypass RLS.';

-- Function: Get user's application IDs
CREATE OR REPLACE FUNCTION get_user_application_ids(user_uuid UUID)
RETURNS TABLE (application_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT am.application_id
  FROM application_members am
  WHERE am.user_id = user_uuid;
END;
$$;

COMMENT ON FUNCTION get_user_application_ids IS 'Returns application IDs that a user is a member of. SECURITY DEFINER to break RLS recursion.';

-- =============================================
-- 4. RLS POLICIES FOR SUPER_ADMINS TABLE
-- =============================================

-- Only super admins can view other super admins
CREATE POLICY "super_admins_view_super_admins"
  ON super_admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Only super admins can add other super admins
CREATE POLICY "super_admins_add_super_admins"
  ON super_admins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- Only super admins can remove other super admins
CREATE POLICY "super_admins_delete_super_admins"
  ON super_admins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM super_admins WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- 5. RLS POLICIES FOR APPLICATION_MEMBERS TABLE
-- =============================================

-- Users can view their own app memberships, super admins see all, maintainers see their app's members
CREATE POLICY "users_view_app_memberships"
  ON application_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM application_members am
      WHERE am.application_id = application_members.application_id
      AND am.user_id = auth.uid()
      AND am.role = 'maintainer'
    )
  );

-- Super admins and app maintainers can add members
CREATE POLICY "admins_add_app_members"
  ON application_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM application_members am
      WHERE am.application_id = application_members.application_id
      AND am.user_id = auth.uid()
      AND am.role = 'maintainer'
    )
  );

-- Super admins and app maintainers can update member roles
CREATE POLICY "admins_update_app_members"
  ON application_members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM application_members am
      WHERE am.application_id = application_members.application_id
      AND am.user_id = auth.uid()
      AND am.role = 'maintainer'
    )
  );

-- Super admins and app maintainers can remove members
CREATE POLICY "admins_remove_app_members"
  ON application_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM application_members am
      WHERE am.application_id = application_members.application_id
      AND am.user_id = auth.uid()
      AND am.role = 'maintainer'
    )
  );

-- =============================================
-- 6. UPDATE EXISTING ORGANIZATION POLICIES
-- =============================================

-- DROP old policy that allowed any user to create organizations
DROP POLICY IF EXISTS "users_create_org" ON organizations;

-- CREATE new policy: Only super admins can create organizations
CREATE POLICY "super_admins_create_org"
  ON organizations FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- UPDATE view policy to include super admin bypass
DROP POLICY IF EXISTS "org_members_view_org" ON organizations;

CREATE POLICY "org_members_view_org_v2"
  ON organizations FOR SELECT
  USING (
    -- Super admins see everything
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    -- Regular users see assigned orgs
    id IN (
      SELECT organization_id
      FROM get_user_organization_ids(auth.uid())
    )
  );

-- UPDATE update policy to include super admin bypass
DROP POLICY IF EXISTS "owners_update_org" ON organizations;

CREATE POLICY "owners_update_org_v2"
  ON organizations FOR UPDATE
  USING (
    -- Super admins can update any org
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    -- Owners can update their org
    id IN (
      SELECT om.organization_id
      FROM get_user_organization_ids(auth.uid()) AS uoi
      JOIN organization_members om ON om.organization_id = uoi.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- UPDATE delete policy to include super admin bypass
DROP POLICY IF EXISTS "owners_delete_org" ON organizations;

CREATE POLICY "owners_delete_org_v2"
  ON organizations FOR DELETE
  USING (
    -- Super admins can delete any org
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    -- Owners can delete their org
    id IN (
      SELECT om.organization_id
      FROM get_user_organization_ids(auth.uid()) AS uoi
      JOIN organization_members om ON om.organization_id = uoi.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- =============================================
-- 7. UPDATE APPLICATION POLICIES
-- =============================================

-- Add policy: Users can only see apps they're assigned to (or super admin)
CREATE POLICY "view_assigned_applications"
  ON applications FOR SELECT
  USING (
    -- Super admins see all applications
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    -- Users see apps they're members of
    id IN (
      SELECT application_id FROM get_user_application_ids(auth.uid())
    )
  );

-- Add policy: Only super admins can create applications
CREATE POLICY "super_admins_create_apps"
  ON applications FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- Add policy: Super admins and app maintainers can update applications
CREATE POLICY "admins_update_apps"
  ON applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM application_members am
      WHERE am.application_id = applications.id
      AND am.user_id = auth.uid()
      AND am.role = 'maintainer'
    )
  );

-- Add policy: Super admins can delete applications
CREATE POLICY "super_admins_delete_apps"
  ON applications FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
  );

-- =============================================
-- 8. UPDATE BUG REPORTS POLICIES (CRITICAL)
-- =============================================

-- Add policy: Users can view bugs only if they have app access
CREATE POLICY "view_bugs_by_app_membership"
  ON bug_reports FOR SELECT
  USING (
    -- Super admin sees all bugs
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    -- User is assigned to the application
    application_id IN (
      SELECT application_id FROM get_user_application_ids(auth.uid())
    )
    OR
    -- User is the bug reporter (for SDK submissions and their own bugs)
    reporter_user_id = auth.uid()
  );

-- Add policy: App members and super admins can update bugs
CREATE POLICY "update_bugs_by_app_membership"
  ON bug_reports FOR UPDATE
  USING (
    -- Super admins can update any bug
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    -- Maintainers and developers can update bugs in their apps
    EXISTS (
      SELECT 1
      FROM application_members am
      WHERE am.application_id = bug_reports.application_id
      AND am.user_id = auth.uid()
      AND am.role IN ('maintainer', 'developer')
    )
  );

-- Add policy: Super admins and maintainers can delete bugs
CREATE POLICY "delete_bugs_by_app_membership"
  ON bug_reports FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    EXISTS (
      SELECT 1
      FROM application_members am
      WHERE am.application_id = bug_reports.application_id
      AND am.user_id = auth.uid()
      AND am.role = 'maintainer'
    )
  );

-- =============================================
-- 9. UPDATE BUG REPORT MESSAGES POLICIES
-- =============================================

-- Users can view messages if they have access to the bug report
CREATE POLICY "view_messages_by_bug_access"
  ON bug_report_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    bug_report_id IN (
      SELECT br.id
      FROM bug_reports br
      WHERE br.application_id IN (
        SELECT application_id FROM get_user_application_ids(auth.uid())
      )
    )
    OR
    -- User can see messages in their own bug reports
    bug_report_id IN (
      SELECT id FROM bug_reports WHERE reporter_user_id = auth.uid()
    )
  );

-- Users can create messages if they have access to the bug report
CREATE POLICY "create_messages_by_bug_access"
  ON bug_report_messages FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM super_admids WHERE user_id = auth.uid())
    OR
    bug_report_id IN (
      SELECT br.id
      FROM bug_reports br
      WHERE br.application_id IN (
        SELECT application_id FROM get_user_application_ids(auth.uid())
      )
    )
    OR
    bug_report_id IN (
      SELECT id FROM bug_reports WHERE reporter_user_id = auth.uid()
    )
  );

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Super admin and application members tables created';
  RAISE NOTICE 'New tables: super_admins, application_members';
  RAISE NOTICE 'Helper functions: is_super_admin(), get_user_application_ids()';
  RAISE NOTICE 'RLS policies updated for: organizations, applications, bug_reports, bug_report_messages';
END $$;
