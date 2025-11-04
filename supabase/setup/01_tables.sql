-- Updated: 2025-11-03 - Initial schema for centralized bug reporter platform

-- =============================================
-- ORGANIZATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner ON organizations(owner_user_id);

-- =============================================
-- ORGANIZATION MEMBERS
-- =============================================

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'developer')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(organization_id, role);

-- =============================================
-- APPLICATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,

  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_applications_org ON applications(organization_id);
CREATE INDEX idx_applications_api_key ON applications(api_key);
CREATE INDEX idx_applications_creator ON applications(created_by_user_id);

-- =============================================
-- BUG REPORTS (Enhanced from existing)
-- =============================================

CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Multi-tenant fields (NEW)
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

  -- Reporter
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Bug details
  page_url TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT CHECK (category IN ('bug', 'feature_request', 'ui_design', 'performance', 'security', 'other')),
  screenshot_url TEXT,
  console_logs JSONB,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'seen', 'in_progress', 'resolved', 'wont_fix')),
  resolved_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Legacy fields (keep for compatibility, but not used in centralized platform)
  institution_id UUID,
  department_id UUID,
  institution_name TEXT,
  department_name TEXT,
  department_code TEXT
);

CREATE INDEX idx_bug_reports_org ON bug_reports(organization_id);
CREATE INDEX idx_bug_reports_app ON bug_reports(application_id);
CREATE INDEX idx_bug_reports_reporter ON bug_reports(reporter_user_id);
CREATE INDEX idx_bug_reports_status ON bug_reports(status);
CREATE INDEX idx_bug_reports_created ON bug_reports(created_at DESC);
CREATE INDEX idx_bug_reports_display_id ON bug_reports(display_id);

-- =============================================
-- BUG REPORT MESSAGES (Reuse existing)
-- =============================================

CREATE TABLE IF NOT EXISTS bug_report_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_report_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'user_message',
  attachment_url TEXT,
  attachment_type TEXT,
  is_internal BOOLEAN DEFAULT false,
  reply_to_message_id UUID REFERENCES bug_report_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false
);

CREATE INDEX idx_bug_messages_report ON bug_report_messages(bug_report_id);
CREATE INDEX idx_bug_messages_sender ON bug_report_messages(sender_user_id);
CREATE INDEX idx_bug_messages_created ON bug_report_messages(created_at);

-- =============================================
-- BUG REPORT PARTICIPANTS (Reuse existing)
-- =============================================

CREATE TABLE IF NOT EXISTS bug_report_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_report_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant',
  can_view_internal BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,

  UNIQUE(bug_report_id, user_id)
);

CREATE INDEX idx_bug_participants_report ON bug_report_participants(bug_report_id);
CREATE INDEX idx_bug_participants_user ON bug_report_participants(user_id);

-- =============================================
-- MESSAGE READ TRACKING (Reuse existing)
-- =============================================

CREATE TABLE IF NOT EXISTS bug_report_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES bug_report_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_reads_message ON bug_report_message_reads(message_id);
CREATE INDEX idx_message_reads_user ON bug_report_message_reads(user_id);
