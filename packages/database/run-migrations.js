const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

const connectionString = 'postgresql://postgres.anxstufkbqnjkxgksfkn:KaashMalik297$@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

const migrationsDir = path.join(__dirname, '../../supabase/migrations');
const filesToRun = [
  '009_fantasy_cricket.sql',
  '010_event_store_cqrs.sql',
  '011_sync_drizzle_tables.sql',
  '012_fix_indexes_and_fks.sql',
  '013_fix_rls_gaps.sql',
  '014_unify_rls_strategy.sql',
  '015_create_commentary_events.sql',
  '016_fix_trigger_undo_balls.sql',
  '017_create_materialized_views_and_performance_indexes.sql'
];

async function run() {
  console.log('Connecting to Supabase to run migrations...');
  const sql = postgres(connectionString);
  
  try {
    // Insert system default tenant to prevent FK violations in fantasy cricket migrations
    console.log('Ensuring system default tenant exists...');
    await sql`
      INSERT INTO public.tenants (id, name, slug, owner_id)
      VALUES ('00000000-0000-0000-0000-000000000000', 'System Default Tenant', 'system-default', '00000000-0000-0000-0000-000000000000')
      ON CONFLICT (id) DO NOTHING
    `;
    console.log('System default tenant ensured.');

    for (const file of filesToRun) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`Running migration: ${file}...`);
        const content = fs.readFileSync(filePath, 'utf8');
        // Use sql.unsafe to execute multiple statements in one query
        await sql.unsafe(content);
        console.log(`Successfully applied ${file}`);
      } else {
        console.warn(`Warning: File ${file} not found, skipping.`);
      }
    }
    console.log('🎉 All migrations applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await sql.end();
  }
}

run();
