-- Updated: 2025-11-03 - RLS policies for multi-tenant bug reporter

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_report_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_report_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_report_message_reads ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ORGANIZATIONS POLICIES
-- =============================================

-- Users can view organizations they're members of
-- Uses security definer function to prevent RLS recursion
CREATE POLICY "org_members_view_org"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id
      FROM get_user_organization_ids(auth.uid())
    )
  );

-- Users can create organizations (they become owner)
CREATE POLICY "users_create_org"
  ON organizations FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

-- Only owners can update organizations
-- Uses security definer function to prevent RLS recursion
CREATE POLICY "owners_update_org"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT om.organization_id
      FROM get_user_organization_ids(auth.uid()) AS uoi
      JOIN organization_members om ON om.organization_id = uoi.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- Only owners can delete organizations
-- Uses security definer function to prevent RLS recursion
CREATE POLICY "owners_delete_org"
  ON organizations FOR DELETE
  USING (
    id IN (
      SELECT om.organization_id
      FROM get_user_organization_ids(auth.uid()) AS uoi
      JOIN organization_members om ON om.organization_id = uoi.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- =============================================
-- ORGANIZATION MEMBERS POLICIES
-- =============================================

-- Members can view other members in their orgs
-- Uses security definer function to break RLS recursion
CREATE POLICY "members_view_members"
  ON organization_members FOR SELECT
  USING (
    -- Users can see their own membership records
    user_id = auth.uid()
    OR
    -- Users can see other members in organizations they belong to
    organization_id IN (
      SELECT organization_id
      FROM get_user_organization_ids(auth.uid())
    )
  );

-- Owners and admins can add members
CREATE POLICY "owners_admins_add_members"
  ON organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Owners and admins can update members
CREATE POLICY "owners_admins_update_members"
  ON organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Owners and admins can remove members (but not themselves)
CREATE POLICY "owners_admins_remove_members"
  ON organization_members FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    AND user_id != auth.uid()
  );

-- =============================================
-- APPLICATIONS POLICIES
-- =============================================

-- Members can view apps in their organization
-- Developers see only their own apps
-- Admins and owners see all apps
CREATE POLICY "members_view_apps"
  ON applications FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND (
      -- Admins/Owners see all
      EXISTS (
        SELECT 1 FROM organization_members
        WHERE user_id = auth.uid()
        AND organization_id = applications.organization_id
        AND role IN ('owner', 'admin')
      )
      -- Developers see only their apps
      OR created_by_user_id = auth.uid()
    )
  );

-- Members can create apps in their organization
CREATE POLICY "members_create_apps"
  ON applications FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND created_by_user_id = auth.uid()
  );

-- App creators and admins/owners can update apps
CREATE POLICY "creators_admins_update_apps"
  ON applications FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND (
      created_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE user_id = auth.uid()
        AND organization_id = applications.organization_id
        AND role IN ('owner', 'admin')
      )
    )
  );

-- App creators and admins/owners can delete apps
CREATE POLICY "creators_admins_delete_apps"
  ON applications FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
    AND (
      created_by_user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM organization_members
        WHERE user_id = auth.uid()
        AND organization_id = applications.organization_id
        AND role IN ('owner', 'admin')
      )
    )
  );

-- =============================================
-- BUG REPORTS POLICIES
-- =============================================

-- Members can view bugs from their organization
CREATE POLICY "members_view_bugs"
  ON bug_reports FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Anyone can create bugs (for SDK submissions)
-- This will be further restricted by API key validation in application code
CREATE POLICY "public_create_bugs"
  ON bug_reports FOR INSERT
  WITH CHECK (true);

-- Members can update bugs in their organization
CREATE POLICY "members_update_bugs"
  ON bug_reports FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Only admins and owners can delete bugs
CREATE POLICY "admins_delete_bugs"
  ON bug_reports FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =============================================
-- BUG REPORT MESSAGES POLICIES
-- =============================================

-- Participants can view messages for bugs in their org
CREATE POLICY "participants_view_messages"
  ON bug_report_messages FOR SELECT
  USING (
    bug_report_id IN (
      SELECT id FROM bug_reports
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Participants can create messages
CREATE POLICY "participants_create_messages"
  ON bug_report_messages FOR INSERT
  WITH CHECK (
    bug_report_id IN (
      SELECT id FROM bug_reports
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
    AND sender_user_id = auth.uid()
  );

-- Senders can update their own messages
CREATE POLICY "senders_update_messages"
  ON bug_report_messages FOR UPDATE
  USING (sender_user_id = auth.uid());

-- Senders can delete their own messages
CREATE POLICY "senders_delete_messages"
  ON bug_report_messages FOR DELETE
  USING (sender_user_id = auth.uid());

-- =============================================
-- BUG REPORT PARTICIPANTS POLICIES
-- =============================================

-- Org members can view participants
CREATE POLICY "members_view_participants"
  ON bug_report_participants FOR SELECT
  USING (
    bug_report_id IN (
      SELECT id FROM bug_reports
      WHERE organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Anyone can become a participant (auto-added when messaging)
CREATE POLICY "public_create_participants"
  ON bug_report_participants FOR INSERT
  WITH CHECK (true);

-- Users can update their own participant record
CREATE POLICY "users_update_own_participant"
  ON bug_report_participants FOR UPDATE
  USING (user_id = auth.uid());

-- =============================================
-- MESSAGE READS POLICIES
-- =============================================

-- Users can view read status for messages they can see
CREATE POLICY "users_view_reads"
  ON bug_report_message_reads FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM bug_report_messages
      WHERE bug_report_id IN (
        SELECT id FROM bug_reports
        WHERE organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Users can mark messages as read
CREATE POLICY "users_create_reads"
  ON bug_report_message_reads FOR INSERT
  WITH CHECK (user_id = auth.uid());
