-- Updated: 2025-11-03 - Functions for centralized bug reporter

-- =============================================
-- GENERATE DISPLAY ID FOR BUG REPORTS
-- =============================================

CREATE OR REPLACE FUNCTION generate_bug_display_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  count INTEGER;
BEGIN
  -- Get count of existing bugs + 1
  SELECT COUNT(*) + 1 INTO count FROM bug_reports;

  -- Format as BUG-001, BUG-002, etc.
  new_id := 'BUG-' || LPAD(count::TEXT, 3, '0');

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM bug_reports WHERE display_id = new_id) LOOP
    count := count + 1;
    new_id := 'BUG-' || LPAD(count::TEXT, 3, '0');
  END LOOP;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- GENERATE API KEY FOR APPLICATIONS
-- =============================================

CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
DECLARE
  new_key TEXT;
  characters TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  key_length INTEGER := 32;
  i INTEGER;
BEGIN
  new_key := 'app_';

  FOR i IN 1..key_length LOOP
    new_key := new_key || substr(characters, floor(random() * length(characters) + 1)::INTEGER, 1);
  END LOOP;

  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM applications WHERE api_key = new_key) LOOP
    new_key := 'app_';
    FOR i IN 1..key_length LOOP
      new_key := new_key || substr(characters, floor(random() * length(characters) + 1)::INTEGER, 1);
    END LOOP;
  END LOOP;

  RETURN new_key;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AUTO-ADD OWNER TO ORGANIZATION MEMBERS
-- =============================================
-- Uses SECURITY DEFINER to bypass RLS when inserting first owner

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

COMMENT ON FUNCTION add_owner_to_org_members IS 'Automatically adds organization owner to organization_members table. Runs with SECURITY DEFINER to bypass RLS on first member insertion.';

-- =============================================
-- UPDATE UPDATED_AT TIMESTAMP
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- GET USER ORGANIZATION IDs (SECURITY DEFINER)
-- =============================================
-- This function breaks RLS recursion in organization_members policies
-- by running with elevated privileges (SECURITY DEFINER)

CREATE OR REPLACE FUNCTION get_user_organization_ids(user_uuid UUID)
RETURNS TABLE (organization_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = user_uuid;
END;
$$;

COMMENT ON FUNCTION get_user_organization_ids IS 'Returns organization IDs that a user is a member of. SECURITY DEFINER function used to break RLS recursion in organization_members policies.';
