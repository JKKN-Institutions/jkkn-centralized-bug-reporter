-- Updated: 2025-11-03 - Triggers for centralized bug reporter

-- =============================================
-- AUTO-GENERATE BUG DISPLAY ID
-- =============================================

CREATE TRIGGER set_bug_display_id
  BEFORE INSERT ON bug_reports
  FOR EACH ROW
  WHEN (NEW.display_id IS NULL)
  EXECUTE FUNCTION generate_bug_display_id();

-- =============================================
-- AUTO-GENERATE APPLICATION API KEY
-- =============================================

CREATE TRIGGER set_app_api_key
  BEFORE INSERT ON applications
  FOR EACH ROW
  WHEN (NEW.api_key IS NULL OR NEW.api_key = '')
  EXECUTE FUNCTION generate_api_key();

-- =============================================
-- AUTO-ADD OWNER TO ORG MEMBERS
-- =============================================

CREATE TRIGGER add_owner_after_org_create
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_to_org_members();

-- =============================================
-- UPDATE TIMESTAMPS
-- =============================================

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bug_messages_updated_at
  BEFORE UPDATE ON bug_report_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
