const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nyxytiujazzddgijqvix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55eHl0aXVqYXp6ZGRnaWpxdml4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTE5OTQyNiwiZXhwIjoyMDk2Nzc1NDI2fQ.CwdbRm9_IPijp5SPyF2W1x_lrdScBkQ02Iy15l7HLuU',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function main() {
  const { data, error } = await supabase.storage.createBucket('creator-submissions', {
    public: true,
    fileSizeLimit: 104857600
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('? Bucket "creator-submissions" already exists');
    } else {
      console.error('? Error creating bucket:', error.message);
    }
  } else {
    console.log('? Bucket "creator-submissions" created:', data);
  }

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
      .single();

    if (!existing) {
      const { error: insertErr } = await supabase.from('categories').insert(cat);
      if (insertErr) {
        console.error(? Error seeding :, insertErr.message);
      } else {
        console.log(? Seeded category: );
      }
    } else {
      console.log(? Category already exists: );
    }
  }

  console.log('\n??  Setup complete!');
}

main().catch(console.error);
