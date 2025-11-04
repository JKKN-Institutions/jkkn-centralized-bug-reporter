-- Updated: 2025-11-03 - Views for centralized bug reporter

-- =============================================
-- BUG REPORTS WITH DETAILS (Enhanced with org/app)
-- =============================================

CREATE OR REPLACE VIEW bug_reports_with_details AS
SELECT
  br.*,
  COALESCE(
    jsonb_build_object(
      'id', p.id,
      'email', p.email,
      'full_name', p.full_name
    ),
    NULL
  ) as reporter,
  COALESCE(
    jsonb_build_object(
      'id', app.id,
      'name', app.name,
      'slug', app.slug
    ),
    NULL
  ) as application,
  COALESCE(
    jsonb_build_object(
      'id', org.id,
      'name', org.name,
      'slug', org.slug
    ),
    NULL
  ) as organization
FROM bug_reports br
LEFT JOIN auth.users u ON br.reporter_user_id = u.id
LEFT JOIN (
  SELECT id, email,
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name
  FROM auth.users
) p ON br.reporter_user_id = p.id
LEFT JOIN applications app ON br.application_id = app.id
LEFT JOIN organizations org ON br.organization_id = org.id;

-- =============================================
-- BUG REPORTERS LEADERBOARD (Per Organization)
-- =============================================

CREATE OR REPLACE VIEW bug_reporters_leaderboard_org AS
SELECT
  br.organization_id,
  br.reporter_user_id as user_id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as user_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  COUNT(br.id) as total_bugs_count,
  COUNT(CASE WHEN br.status = 'resolved' THEN 1 END) as resolved_bugs_count,
  RANK() OVER (
    PARTITION BY br.organization_id
    ORDER BY COUNT(br.id) DESC
  ) as rank
FROM bug_reports br
LEFT JOIN auth.users u ON br.reporter_user_id = u.id
GROUP BY br.organization_id, br.reporter_user_id, u.raw_user_meta_data, u.email
ORDER BY br.organization_id, total_bugs_count DESC;

-- =============================================
-- APPLICATION STATS
-- =============================================

CREATE OR REPLACE VIEW application_stats AS
SELECT
  app.id as application_id,
  app.organization_id,
  app.name as application_name,
  COUNT(br.id) as total_bugs,
  COUNT(CASE WHEN br.status = 'resolved' THEN 1 END) as resolved_bugs,
  COUNT(CASE WHEN br.status IN ('new', 'seen', 'in_progress') THEN 1 END) as pending_bugs,
  COUNT(CASE WHEN br.status = 'wont_fix' THEN 1 END) as wont_fix_bugs,
  MAX(br.created_at) as last_bug_at
FROM applications app
LEFT JOIN bug_reports br ON app.id = br.application_id
GROUP BY app.id, app.organization_id, app.name;

-- =============================================
-- ORGANIZATION STATS
-- =============================================

CREATE OR REPLACE VIEW organization_stats AS
SELECT
  org.id as organization_id,
  org.name as organization_name,
  COUNT(DISTINCT app.id) as total_applications,
  COUNT(DISTINCT om.user_id) as total_members,
  COUNT(br.id) as total_bugs,
  COUNT(CASE WHEN br.status = 'resolved' THEN 1 END) as resolved_bugs,
  COUNT(CASE WHEN br.status IN ('new', 'seen', 'in_progress') THEN 1 END) as pending_bugs
FROM organizations org
LEFT JOIN applications app ON org.id = app.organization_id
LEFT JOIN organization_members om ON org.id = om.organization_id
LEFT JOIN bug_reports br ON org.id = br.organization_id
GROUP BY org.id, org.name;
