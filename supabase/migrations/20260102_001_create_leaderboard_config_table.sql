-- =============================================
-- MIGRATION: Create Organization Leaderboard Config Table
-- Version: 1.0.0
-- Date: 2026-01-02
-- Description: Create organization_leaderboard_config table for leaderboard settings and prizes
-- =============================================

-- Create organization_leaderboard_config table
CREATE TABLE IF NOT EXISTS public.organization_leaderboard_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  weekly_prize_amount DECIMAL(10,2) DEFAULT 0,
  monthly_prize_amount DECIMAL(10,2) DEFAULT 0,
  prize_description TEXT,
  points_low INTEGER DEFAULT 10,
  points_medium INTEGER DEFAULT 20,
  points_high INTEGER DEFAULT 30,
  points_critical INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_org_leaderboard_config UNIQUE(organization_id)
);

-- Enable Row Level Security
ALTER TABLE public.organization_leaderboard_config ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Policy: Organization members can read their org's leaderboard config
CREATE POLICY org_leaderboard_config_select ON public.organization_leaderboard_config
  FOR SELECT
  USING (
    organization_id IN (
      SELECT unnest(get_user_organization_ids(auth.uid()))
    )
  );

-- Policy: Organization owners and admins can insert/update/delete config
CREATE POLICY org_leaderboard_config_all ON public.organization_leaderboard_config
  FOR ALL
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

-- =============================================
-- INDEXES: For performance optimization
-- =============================================

CREATE INDEX IF NOT EXISTS idx_leaderboard_config_org
  ON public.organization_leaderboard_config(organization_id);

CREATE INDEX IF NOT EXISTS idx_leaderboard_config_enabled
  ON public.organization_leaderboard_config(is_enabled)
  WHERE is_enabled = true;

-- =============================================
-- BACKFILL: Create default configs for existing organizations
-- =============================================

INSERT INTO public.organization_leaderboard_config (organization_id)
SELECT id FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;

-- =============================================
-- TRIGGER: Auto-update updated_at timestamp
-- =============================================

CREATE OR REPLACE FUNCTION public.update_leaderboard_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leaderboard_config_timestamp ON public.organization_leaderboard_config;
CREATE TRIGGER update_leaderboard_config_timestamp
  BEFORE UPDATE ON public.organization_leaderboard_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leaderboard_config_updated_at();

-- =============================================
-- COMMENTS: Documentation
-- =============================================

COMMENT ON TABLE public.organization_leaderboard_config IS
  'Leaderboard configuration and prize settings per organization';

COMMENT ON COLUMN public.organization_leaderboard_config.organization_id IS
  'Reference to the organization this config belongs to (unique)';

COMMENT ON COLUMN public.organization_leaderboard_config.is_enabled IS
  'Whether the leaderboard is enabled for this organization';

COMMENT ON COLUMN public.organization_leaderboard_config.weekly_prize_amount IS
  'Prize amount for weekly leaderboard winners';

COMMENT ON COLUMN public.organization_leaderboard_config.monthly_prize_amount IS
  'Prize amount for monthly leaderboard winners';

COMMENT ON COLUMN public.organization_leaderboard_config.prize_description IS
  'Custom description of prizes or rewards';

COMMENT ON COLUMN public.organization_leaderboard_config.points_low IS
  'Points awarded for low priority bugs (default: 10)';

COMMENT ON COLUMN public.organization_leaderboard_config.points_medium IS
  'Points awarded for medium priority bugs (default: 20)';

COMMENT ON COLUMN public.organization_leaderboard_config.points_high IS
  'Points awarded for high priority bugs (default: 30)';

COMMENT ON COLUMN public.organization_leaderboard_config.points_critical IS
  'Points awarded for critical priority bugs (default: 50)';
