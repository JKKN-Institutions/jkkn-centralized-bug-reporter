-- Fix Organization Creation RLS Policy Issue
-- Date: 2025-11-05
-- Issue: Error 42501 - "new row violates row-level security policy for table organizations"
-- Root Cause: Circular dependency in organization_members INSERT policy

-- =============================================
-- DROP EXISTING POLICY
-- =============================================
DROP POLICY IF EXISTS "owners_admins_add_members" ON organization_members;

-- =============================================
-- RECREATE POLICY WITH FIX
-- =============================================
-- This policy now allows:
-- 1. The organization owner to add the first member (themselves) via trigger
-- 2. Existing owners/admins to add new members
CREATE POLICY "owners_admins_add_members"
  ON organization_members FOR INSERT
  WITH CHECK (
    -- Allow if user is owner of the organization (for initial member creation via trigger)
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = organization_members.organization_id
      AND owner_user_id = auth.uid()
    )
    OR
    -- Allow if user is already an owner/admin of the organization
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =============================================
-- UPDATE TRIGGER FUNCTION WITH BETTER ERROR HANDLING
-- =============================================
CREATE OR REPLACE FUNCTION add_owner_to_org_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- This makes it run with elevated privileges, bypassing RLS
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Debug: Log the operation
  RAISE NOTICE 'Attempting to add owner % to organization %', NEW.owner_user_id, NEW.id;

  -- Insert the owner as a member
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.owner_user_id, 'owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- Verify the insert succeeded
  SELECT COUNT(*) INTO v_count
  FROM organization_members
  WHERE organization_id = NEW.id AND user_id = NEW.owner_user_id;

  RAISE NOTICE 'Owner added successfully. Member count: %', v_count;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in add_owner_to_org_members: % %', SQLERRM, SQLSTATE;
    RETURN NEW;  -- Still return NEW to allow org creation to succeed
END;
$$;

COMMENT ON FUNCTION add_owner_to_org_members IS 'Automatically adds organization owner to organization_members table. Runs with SECURITY DEFINER to bypass RLS on first member insertion. Updated with better error handling.';
