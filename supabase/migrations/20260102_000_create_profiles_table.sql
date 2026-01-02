-- =============================================
-- MIGRATION: Create Profiles Table
-- Version: 1.0.0
-- Date: 2026-01-02
-- Description: Create profiles table to store user information for leaderboard
-- =============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read all profiles (needed for leaderboard display)
CREATE POLICY profiles_select_policy ON public.profiles
  FOR SELECT
  USING (true);

-- Policy: Users can update their own profile
CREATE POLICY profiles_update_policy ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY profiles_insert_policy ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================
-- TRIGGER: Auto-create profile when user signs up
-- =============================================

CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_user();

-- =============================================
-- BACKFILL: Migrate existing users to profiles
-- =============================================

INSERT INTO public.profiles (id, email, full_name)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', '') as full_name
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- INDEXES: For performance optimization
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_profiles_full_name
  ON public.profiles(full_name);

-- =============================================
-- COMMENTS: Documentation
-- =============================================

COMMENT ON TABLE public.profiles IS
  'User profiles for displaying names and info in leaderboard and bug reports';

COMMENT ON COLUMN public.profiles.id IS
  'User ID from auth.users';

COMMENT ON COLUMN public.profiles.email IS
  'User email address';

COMMENT ON COLUMN public.profiles.full_name IS
  'User full name for display purposes';

COMMENT ON COLUMN public.profiles.avatar_url IS
  'Optional profile picture URL';
