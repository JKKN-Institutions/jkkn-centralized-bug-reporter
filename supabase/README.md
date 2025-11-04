# Database Schema Setup

This directory contains the complete database schema for the Centralized Bug Reporter Platform.

## Schema Files

Apply these SQL files **in order** to your Supabase project:

1. `setup/01_tables.sql` - Table definitions
2. `setup/02_functions.sql` - Database functions
3. `setup/03_policies.sql` - Row Level Security (RLS) policies
4. `setup/04_triggers.sql` - Database triggers
5. `setup/05_views.sql` - Database views

## How to Apply

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of each file in order
5. Click **Run** for each file
6. Verify no errors occurred

### Method 2: Supabase CLI (Advanced)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

## Storage Bucket Setup

After applying the schema, create a storage bucket for bug screenshots:

1. Go to **Storage** in Supabase Dashboard
2. Click **Create bucket**
3. Name: `bug-reports`
4. Set as **Public bucket** ✓
5. Add policy: Allow INSERT for authenticated users

### Storage Policy (Run in SQL Editor):

```sql
-- Allow authenticated users to upload bug screenshots
CREATE POLICY "Authenticated users can upload bug screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'bug-reports'
    AND auth.role() = 'authenticated'
  );

-- Anyone can view bug screenshots
CREATE POLICY "Anyone can view bug screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bug-reports');
```

## Verify Schema

After applying all files, verify the schema:

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables:
-- - organizations
-- - organization_members
-- - applications
-- - bug_reports
-- - bug_report_messages
-- - bug_report_participants
-- - bug_report_message_reads

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true
```

## Environment Setup

After schema is applied:

1. Copy `.env.example` to `.env.local` in the root directory
2. Get your Supabase credentials:
   - Project URL: Settings → API → Project URL
   - Anon Key: Settings → API → Project API keys → anon public
   - Service Role Key: Settings → API → Project API keys → service_role (keep secret!)
3. Update `.env.local` with your values

## Important Notes

### Multi-Tenancy
- All data is scoped by `organization_id`
- RLS policies enforce data isolation
- Test with multiple organizations to verify isolation

### Security
- **NEVER** commit `.env.local` to git
- **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- Always use RLS policies for data access control

### Testing RLS Policies

After setup, test RLS policies:

1. Create a test organization
2. Create a test user
3. Verify the user can only see their organization's data
4. Create a second organization and verify isolation

## Troubleshooting

### Error: relation "auth.users" does not exist
- Supabase Auth is not enabled. Enable it in Authentication settings.

### Error: permission denied
- RLS policies might be too restrictive. Review policy definitions in `03_policies.sql`

### Policies not working
- Ensure RLS is enabled on all tables: `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
- Check if policies are created: `SELECT * FROM pg_policies WHERE schemaname = 'public';`

## Next Steps

After successful schema setup:
1. ✅ Verify all tables created
2. ✅ Verify RLS enabled on all tables
3. ✅ Create storage bucket
4. ✅ Set up environment variables
5. → Proceed to SDK package development (Phase 3)
