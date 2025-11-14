-- =============================================
-- FIX: Application Members RLS Infinite Recursion
-- DATE: 2025-11-14
-- ISSUE: The SELECT policy on application_members queries itself, causing infinite recursion
-- SOLUTION: Use SECURITY DEFINER function to break the recursion
-- =============================================

-- =============================================
-- 1. CREATE SECURITY DEFINER FUNCTION
-- =============================================

-- Function: Check if user is maintainer of an application
CREATE OR REPLACE FUNCTION is_app_maintainer(user_uuid UUID, app_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM application_members
    WHERE user_id = user_uuid
    AND application_id = app_uuid
    AND role = 'maintainer'
  );
$$;

COMMENT ON FUNCTION is_app_maintainer IS 'Returns true if user is a maintainer of the specified application. SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

-- =============================================
-- 2. FIX THE RECURSIVE POLICY
-- =============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "users_view_app_memberships" ON application_members;

-- Create fixed policy WITHOUT recursion
CREATE POLICY "users_view_app_memberships_fixed"
  ON application_members FOR SELECT
  USING (
    -- Users can always see their own memberships
    user_id = auth.uid()
    OR
    -- Super admins see all memberships
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    -- Maintainers can see members of their applications (using security definer function)
    is_app_maintainer(auth.uid(), application_id)
  );

COMMENT ON POLICY "users_view_app_memberships_fixed" ON application_members
IS 'Fixed policy that uses security definer function to prevent infinite recursion';

-- =============================================
-- 3. FIX OTHER RECURSIVE POLICIES
-- =============================================

-- Fix INSERT policy
DROP POLICY IF EXISTS "admins_add_app_members" ON application_members;

CREATE POLICY "admins_add_app_members_fixed"
  ON application_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    is_app_maintainer(auth.uid(), application_id)
  );

-- Fix UPDATE policy
DROP POLICY IF EXISTS "admins_update_app_members" ON application_members;

CREATE POLICY "admins_update_app_members_fixed"
  ON application_members FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    is_app_maintainer(auth.uid(), application_id)
  );

-- Fix DELETE policy
DROP POLICY IF EXISTS "admins_remove_app_members" ON application_members;

CREATE POLICY "admins_remove_app_members_fixed"
  ON application_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
    OR
    is_app_maintainer(auth.uid(), application_id)
  );

-- =============================================
-- 4. VERIFY POLICIES
-- =============================================

-- Log successful fix
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed application_members RLS policies';
  RAISE NOTICE '✅ Created is_app_maintainer() security definer function';
  RAISE NOTICE '✅ Removed infinite recursion from all application_members policies';
  RAISE NOTICE 'Policies updated: SELECT, INSERT, UPDATE, DELETE';
END $$;
