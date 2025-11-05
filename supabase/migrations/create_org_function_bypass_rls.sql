-- Create a SECURITY DEFINER function to bypass RLS for organization creation
-- Date: 2025-11-05
-- Purpose: Fix organization creation by bypassing RLS issues with JWT context

-- =============================================
-- CREATE ORGANIZATION FUNCTION (SECURITY DEFINER)
-- =============================================
CREATE OR REPLACE FUNCTION create_organization_with_owner(
  org_name TEXT,
  org_slug TEXT,
  owner_id UUID
)
RETURNS organizations
LANGUAGE plpgsql
SECURITY DEFINER  -- This makes it run with elevated privileges, bypassing RLS
SET search_path = public
AS $$
DECLARE
  new_org organizations;
BEGIN
  -- Validate that the calling user is the owner
  IF owner_id != auth.uid() THEN
    RAISE EXCEPTION 'User ID mismatch: caller must be the owner';
  END IF;

  -- Check if slug already exists
  IF EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug) THEN
    RAISE EXCEPTION 'Organization slug already exists';
  END IF;

  -- Insert the organization (bypassing RLS because of SECURITY DEFINER)
  INSERT INTO organizations (name, slug, owner_user_id)
  VALUES (org_name, org_slug, owner_id)
  RETURNING * INTO new_org;

  -- The trigger will automatically add the owner to organization_members

  RETURN new_org;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

COMMENT ON FUNCTION create_organization_with_owner IS 'Creates an organization with the specified owner. Uses SECURITY DEFINER to bypass RLS issues during initial creation.';
