-- =============================================
-- MIGRATION: Bootstrap Super Admin and Migrate Existing Data
-- DATE: 2025-01-06
-- PURPOSE: Create initial super admin and migrate existing users to new access control model
-- AUTHOR: System Migration
-- =============================================

-- =============================================
-- IMPORTANT: MANUAL CONFIGURATION REQUIRED
-- =============================================
-- Before running this migration:
-- 1. Set the INITIAL_SUPER_ADMIN_EMAIL environment variable
-- 2. Or replace 'admin@jkkn.ac.in' below with your super admin email
-- =============================================

DO $$
DECLARE
  v_super_admin_email TEXT := 'admin@jkkn.ac.in'; -- CHANGE THIS to your super admin email
  v_super_admin_id UUID;
  v_migration_count INTEGER;
BEGIN
  RAISE NOTICE 'Starting data migration...';

  -- =============================================
  -- 1. CREATE INITIAL SUPER ADMIN
  -- =============================================

  RAISE NOTICE 'Step 1: Creating initial super admin...';

  -- Find user by email
  SELECT id INTO v_super_admin_id
  FROM auth.users
  WHERE email = v_super_admin_email
  LIMIT 1;

  IF v_super_admin_id IS NOT NULL THEN
    -- Create super admin record
    INSERT INTO super_admins (user_id, granted_by, notes)
    VALUES (
      v_super_admin_id,
      v_super_admin_id,
      'Initial bootstrap super admin - created during migration'
    )
    ON CONFLICT (user_id) DO NOTHING;

    RAISE NOTICE 'Super admin created for user: %', v_super_admin_email;
  ELSE
    RAISE WARNING 'User with email % not found. Super admin not created. You will need to create one manually after first Google OAuth login.', v_super_admin_email;
  END IF;

  -- =============================================
  -- 2. OPTIONAL: MAKE ALL EXISTING OWNERS SUPER ADMINS
  -- =============================================
  -- Uncomment the following block if you want all existing organization owners
  -- to become platform super admins

  /*
  RAISE NOTICE 'Step 2: Making all existing owners super admins...';

  INSERT INTO super_admins (user_id, granted_by, notes)
  SELECT DISTINCT
    owner_user_id,
    owner_user_id,
    'Migrated from organization owner during data migration'
  FROM organizations
  WHERE owner_user_id IS NOT NULL
  ON CONFLICT (user_id) DO NOTHING;

  GET DIAGNOSTICS v_migration_count = ROW_COUNT;
  RAISE NOTICE 'Created % super admin records from existing owners', v_migration_count;
  */

  -- =============================================
  -- 3. AUTO-ASSIGN ALL ORG MEMBERS TO ALL APPS IN THEIR ORG
  -- =============================================
  -- This provides backward compatibility - everyone keeps their current access

  RAISE NOTICE 'Step 3: Assigning organization members to applications...';

  INSERT INTO application_members (application_id, user_id, role, added_by)
  SELECT
    a.id as application_id,
    om.user_id,
    CASE
      WHEN om.role = 'owner' THEN 'maintainer'
      WHEN om.role = 'admin' THEN 'maintainer'
      ELSE 'developer'
    END as role,
    a.created_by_user_id as added_by
  FROM applications a
  CROSS JOIN organization_members om
  WHERE a.organization_id = om.organization_id
  ON CONFLICT (application_id, user_id) DO NOTHING;

  GET DIAGNOSTICS v_migration_count = ROW_COUNT;
  RAISE NOTICE 'Created % application membership records', v_migration_count;

  -- =============================================
  -- 4. VERIFY MIGRATION
  -- =============================================

  RAISE NOTICE 'Step 4: Verifying migration...';

  -- Count super admins
  SELECT COUNT(*) INTO v_migration_count FROM super_admins;
  RAISE NOTICE 'Total super admins: %', v_migration_count;

  -- Count application members
  SELECT COUNT(*) INTO v_migration_count FROM application_members;
  RAISE NOTICE 'Total application memberships: %', v_migration_count;

  -- Show organizations without members
  SELECT COUNT(*) INTO v_migration_count
  FROM organizations o
  WHERE NOT EXISTS (
    SELECT 1 FROM organization_members om WHERE om.organization_id = o.id
  );

  IF v_migration_count > 0 THEN
    RAISE WARNING '% organizations have no members!', v_migration_count;
  ELSE
    RAISE NOTICE 'All organizations have members ✓';
  END IF;

  -- Show applications without members
  SELECT COUNT(*) INTO v_migration_count
  FROM applications a
  WHERE NOT EXISTS (
    SELECT 1 FROM application_members am WHERE am.application_id = a.id
  );

  IF v_migration_count > 0 THEN
    RAISE WARNING '% applications have no members!', v_migration_count;
  ELSE
    RAISE NOTICE 'All applications have members ✓';
  END IF;

  RAISE NOTICE 'Data migration completed successfully!';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Migration failed: %', SQLERRM;
END $$;

-- =============================================
-- 5. CREATE FUNCTION TO ADD SUPER ADMIN MANUALLY
-- =============================================
-- This function allows super admins to add other super admins via SQL
-- Usage: SELECT add_super_admin_by_email('user@example.com', 'Reason for granting access');

CREATE OR REPLACE FUNCTION add_super_admin_by_email(
  p_email TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_super_admin_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_email;
  END IF;

  -- Check if already super admin
  SELECT id INTO v_super_admin_id
  FROM super_admins
  WHERE user_id = v_user_id;

  IF v_super_admin_id IS NOT NULL THEN
    RAISE NOTICE 'User % is already a super admin', p_email;
    RETURN v_super_admin_id;
  END IF;

  -- Create super admin record
  INSERT INTO super_admins (user_id, granted_by, notes)
  VALUES (
    v_user_id,
    auth.uid(), -- Current user granting access
    p_notes
  )
  RETURNING id INTO v_super_admin_id;

  RAISE NOTICE 'Successfully granted super admin access to %', p_email;
  RETURN v_super_admin_id;
END;
$$;

COMMENT ON FUNCTION add_super_admin_by_email IS 'Manually add a super admin by email. Can be called by existing super admins or via direct SQL.';

-- =============================================
-- 6. CREATE FUNCTION TO BOOTSTRAP SUPER ADMIN ON FIRST OAUTH LOGIN
-- =============================================
-- This function will be called from the OAuth callback to auto-create super admin
-- if the user's email matches the environment variable

CREATE OR REPLACE FUNCTION bootstrap_super_admin_if_needed(
  p_user_id UUID,
  p_email TEXT,
  p_bootstrap_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_super_admin_count INTEGER;
  v_is_bootstrap_email BOOLEAN;
BEGIN
  -- Check if this is the bootstrap email
  v_is_bootstrap_email := (p_email = p_bootstrap_email);

  IF NOT v_is_bootstrap_email THEN
    RETURN FALSE;
  END IF;

  -- Check if user is already super admin
  SELECT COUNT(*) INTO v_existing_super_admin_count
  FROM super_admins
  WHERE user_id = p_user_id;

  IF v_existing_super_admin_count > 0 THEN
    -- Already a super admin
    RETURN TRUE;
  END IF;

  -- Create super admin record
  INSERT INTO super_admins (user_id, granted_by, notes)
  VALUES (
    p_user_id,
    p_user_id,
    'Auto-created from bootstrap email on first OAuth login'
  );

  RAISE NOTICE 'Bootstrap super admin created for user: %', p_email;
  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to bootstrap super admin: %', SQLERRM;
    RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION bootstrap_super_admin_if_needed IS 'Auto-creates super admin on first OAuth login if email matches bootstrap email. Called from OAuth callback.';

-- =============================================
-- MIGRATION NOTES
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE - IMPORTANT NOTES';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Initial super admin has been created (if user exists)';
  RAISE NOTICE '2. All organization members have been assigned to all apps in their orgs';
  RAISE NOTICE '3. Existing users maintain their current access level';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Configure Google OAuth in Supabase dashboard';
  RAISE NOTICE '2. Set INITIAL_SUPER_ADMIN_EMAIL environment variable';
  RAISE NOTICE '3. Deploy OAuth callback handler code';
  RAISE NOTICE '4. Test super admin access';
  RAISE NOTICE '5. Start assigning users to specific applications';
  RAISE NOTICE '';
  RAISE NOTICE 'MANUAL SUPER ADMIN MANAGEMENT:';
  RAISE NOTICE '  Add super admin: SELECT add_super_admin_by_email(''user@example.com'', ''Reason'');';
  RAISE NOTICE '  List super admins: SELECT u.email, sa.granted_at FROM super_admins sa JOIN auth.users u ON u.id = sa.user_id;';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
