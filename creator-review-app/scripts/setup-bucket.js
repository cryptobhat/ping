const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nyxytiujazzddgijqvix.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInRyIjoiVFJCLCJlbCI6InN1cGFiYXdlZSIsInJlZiI6Im55eHl0aXVqYXp6ZGRnaWpxdml4Iiwicm9sZSI6InNlcnZpY2VkX2NvblwiLCJpYXQiOjE3ODExOTk0MjYsImV4cCI6MjA5Njc3NTQyNn0.CwdbRm9_IPijp5SPyF2W1x_lrdScBkQ02Iy15l7HLuU',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function main() {
  const { data, error } = await supabase.storage.createBucket('creator-submissions', {
    public: true,
    fileSizeLimit: 104857600
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('\u2705 Bucket "creator-submissions" already exists');
    } else {
      console.error('\u274C Error creating bucket:', error.message);
    }
  } else {
    console.log('\u2705 Bucket "creator-submissions" created:', data);
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
        console.error('\u274C Error seeding ' + cat.name + ':', insertErr.message);
      } else {
        console.log('\u2705 Seeded category: ' + cat.name);
      }
    } else {
      console.log('\u2705 Category already exists: ' + cat.name);
    }
  }

  console.log('\n\uD83C\uDC89 Setup complete!');
}

main().catch(console.error);
