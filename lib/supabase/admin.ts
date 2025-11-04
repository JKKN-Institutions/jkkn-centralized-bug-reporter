import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client with service role key
 * ⚠️ IMPORTANT: Only use on the server side
 * This client bypasses Row Level Security (RLS) policies
 * Use only when you need full database access for administrative tasks
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for admin client');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
