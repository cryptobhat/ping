const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nyxytiujazzddgijqvix.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55eHl0aXVqYXp6ZGRnaWpxdml4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE5OTQyNiwiZXhwIjoyMDk2Nzc1NDI2fQ.CwdbRm9_IPijp5SPyF2W1x_lrdScBkQ02Iy15l7HLuU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('🔌 Testing Supabase connection...');

  const { data: testData, error: testError } = await supabase.from('categories').select('count', { count: 'exact', head: true });

  if (testError) {
    console.log('⚠️  Categories table not found. Running migration...');

    const sqlPath = path.join(__dirname, '..', 'migrations', '001_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const statements = sql.split(';').filter(s => s.trim().length > 0);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'apikey': SERVICE_KEY
          },
          body: JSON.stringify({ sql: stmt + ';' })
        });

        if (!response.ok) {
          const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/nyxytiujazzddgijqvix/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SERVICE_KEY}`
            },
            body: JSON.stringify({ query: stmt + ';' })
          });

          if (i === 0) {
            console.log('  (Trying alternative method...)');
          }
        }
      } catch (e) {
        if (i === 0) console.log('  SQL execution via API not available. User must run migration manually.');
        break;
      }
    }
  } else {
    console.log('✅ Categories table exists! Tables already set up.');
    console.log('   Count:', testData);
  }

  console.log('\n📦 Setting up storage bucket...');
  const { error: bucketError } = await supabase.storage.createBucket('creator-submissions', {
    public: true,
    fileSizeLimit: 104857600
  });

  if (bucketError) {
    if (bucketError.message.includes('already exists') || bucketError.message.includes('Duplicate')) {
      console.log('✅ Bucket "creator-submissions" already exists');
    } else {
      console.log('⚠️  Bucket creation:', bucketError.message);
    }
  } else {
    console.log('✅ Bucket "creator-submissions" created');
  }

  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('   Existing buckets:', (buckets || []).map(b => b.name).join(', ') || 'none');

  console.log('\n🌱 Seeding categories...');
  const categories = [
    { name: 'Good Morning', language: 'Hindi', content_type: 'both', status: 'active' },
    { name: 'Good Night', language: 'Hindi', content_type: 'both', status: 'active' },
    { name: 'Motivation', language: 'Hindi', content_type: 'both', status: 'active' },
    { name: 'Devotion', language: 'Hindi', content_type: 'both', status: 'active' },
    { name: 'Suvichar', language: 'Hindi', content_type: 'both', status: 'active' }
  ];

  for (const cat of categories) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', cat.name)
      .maybeSingle();

    if (!existing) {
      const { error: insertErr } = await supabase.from('categories').insert(cat).select();
      if (insertErr) {
        console.log(`   ⚠️  ${cat.name}: ${insertErr.message}`);
      } else {
        console.log(`   ✅ ${cat.name} seeded`);
      }
    } else {
      console.log(`   ✅ ${cat.name} (exists)`);
    }
  }

  console.log('\n📋 Final status check:');

  const { data: catList } = await supabase.from('categories').select('id, name, language, content_type, status', { count: 'exact' });
  if (catList) {
    console.log(`   Categories: ${catList.length} rows`);
    catList.forEach(c => console.log(`     - ${c.name} (${c.language}, ${c.content_type}, ${c.status})`));
  }

  console.log('\n🎉 Setup script complete!');
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  console.error(err);
});
