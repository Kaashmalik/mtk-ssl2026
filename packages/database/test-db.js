const postgres = require('postgres');

async function test() {
  console.log('Connecting to Supabase Pooler...');
  const sql = postgres({
    host: 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.anxstufkbqnjkxgksfkn',
    password: 'KaashMalik297$',
    database: 'postgres',
    ssl: 'require'
  });
  try {
    const result = await sql`
      SELECT id, name 
      FROM public.tenants
    `;
    console.log('Tenants:');
    console.log(result.map(row => `${row.id}: ${row.name}`).join('\n'));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sql.end();
  }
}

test();
