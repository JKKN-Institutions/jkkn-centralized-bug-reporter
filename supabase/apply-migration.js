#!/usr/bin/env node

/**
 * Apply SQL migration to Supabase
 * Usage: node apply-migration.js <migration-file>
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

async function applyMigration(migrationFile) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read migration file
  const migrationPath = path.join(__dirname, 'migrations', migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log(`\nApplying migration: ${migrationFile}`);
  console.log('=' .repeat(50));

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('\n❌ Migration failed:');
      console.error(error);
      process.exit(1);
    }

    console.log('\n✅ Migration applied successfully!');
    console.log(data);
  } catch (err) {
    console.error('\n❌ Error applying migration:');
    console.error(err);
    process.exit(1);
  }
}

// Get migration file from command line
const migrationFile = process.argv[2] || 'fix_organization_creation_rls.sql';

applyMigration(migrationFile).catch(console.error);
