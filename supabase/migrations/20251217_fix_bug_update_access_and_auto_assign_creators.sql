-- =============================================
-- MIGRATION: Fix Bug Update Access & Auto-Assign App Creators
-- DATE: 2025-12-17
-- PURPOSE:
--   1. Restore org-level bug update access for all organization members
--   2. Automatically assign application creators to their apps
--   3. Backfill missing app creators to application_members
-- AUTHOR: System Migration
-- =============================================

-- =============================================
-- PART 1: RESTORE ORG-LEVEL BUG UPDATE ACCESS
-- =============================================

-- Create policy: All organization members (including developers) can update bugs in their org
-- This works alongside the app-level policy (OR condition)
CREATE POLICY "org_members_update_all_bugs"
  ON bug_reports FOR UPDATE
  USING (
    -- Any organization member (developer, admin, or owner) can update bugs in their org
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

COMMENT ON POLICY "org_members_update_all_bugs" ON bug_reports IS
  'Allows all organization members (developers, admins, owners) to update bugs in their organization. Works alongside app-level access control.';

-- =============================================
-- PART 2: AUTO-ASSIGN APP CREATORS
-- =============================================

-- Create trigger function to automatically add app creator to application_members
CREATE OR REPLACE FUNCTION auto_add_app_creator_to_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Automatically add the app creator as a maintainer
  INSERT INTO application_members (
    application_id,
    user_id,
    role,
    added_by
  )
  VALUES (
    NEW.id,
    NEW.created_by_user_id,
    'maintainer',  -- Give creator full maintainer access
    NEW.created_by_user_id
  )
  ON CONFLICT (application_id, user_id) DO NOTHING;  -- Skip if already exists

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_add_app_creator_to_members IS
  'Automatically adds the application creator to application_members as maintainer when a new app is created';

-- Create trigger on applications table
DROP TRIGGER IF EXISTS trigger_auto_add_app_creator ON applications;

CREATE TRIGGER trigger_auto_add_app_creator
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_app_creator_to_members();

COMMENT ON TRIGGER trigger_auto_add_app_creator ON applications IS
  'Fires after app creation to automatically assign creator as maintainer';

-- =============================================
-- PART 3: BACKFILL MISSING APP CREATORS
-- =============================================

-- Add all app creators to their applications if they're not already members
-- This fixes the historical data issue
INSERT INTO application_members (
  application_id,
  user_id,
  role,
  added_by,
  added_at
)
SELECT
  a.id as application_id,
  a.created_by_user_id as user_id,
  'maintainer' as role,
  a.created_by_user_id as added_by,
  a.created_at as added_at  -- Use original app creation date
FROM applications a
WHERE NOT EXISTS (
  -- Only insert if they're not already a member
  SELECT 1
  FROM application_members am
  WHERE am.application_id = a.id
  AND am.user_id = a.created_by_user_id
)
AND a.created_by_user_id IS NOT NULL;

-- =============================================
-- PART 4: VERIFICATION & LOGGING
-- =============================================

-- Log the results of the migration
DO $$
DECLARE
  missing_creators_count INTEGER;
  total_apps INTEGER;
  affected_apps TEXT;
BEGIN
  -- Count how many creators were missing
  SELECT COUNT(*)
  INTO missing_creators_count
  FROM applications a
  WHERE a.created_by_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM application_members am
    WHERE am.application_id = a.id
    AND am.user_id = a.created_by_user_id
  );

  -- Get total apps
  SELECT COUNT(*) INTO total_apps FROM applications;

  -- Get list of affected apps
  SELECT string_agg(name, ', ')
  INTO affected_apps
  FROM applications a
  WHERE a.created_by_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM application_members am
    WHERE am.application_id = a.id
    AND am.user_id = a.created_by_user_id
  );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Policy Added: org_members_update_all_bugs';
  RAISE NOTICE '  - All org members can now update bugs in their organization';
  RAISE NOTICE '';
  RAISE NOTICE 'Trigger Created: trigger_auto_add_app_creator';
  RAISE NOTICE '  - New app creators will automatically get maintainer access';
  RAISE NOTICE '';
  RAISE NOTICE 'Backfill Results:';
  RAISE NOTICE '  - Total Applications: %', total_apps;
  RAISE NOTICE '  - Creators Added: %', missing_creators_count;
  IF affected_apps IS NOT NULL THEN
    RAISE NOTICE '  - Affected Apps: %', affected_apps;
  END IF;
  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- PART 5: VERIFICATION QUERY (FOR TESTING)
-- =============================================

-- Verify that all app creators are now members
DO $$
DECLARE
  verification_failed BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.created_by_user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM application_members am
      WHERE am.application_id = a.id
      AND am.user_id = a.created_by_user_id
    )
  ) INTO verification_failed;

  IF verification_failed THEN
    RAISE WARNING 'VERIFICATION FAILED: Some app creators are still not members!';
  ELSE
    RAISE NOTICE 'VERIFICATION PASSED: All app creators are now application members ✓';
  END IF;
END $$;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
