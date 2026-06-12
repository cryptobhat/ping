import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: userRecord } = await admin
    .from('users')
    .select('role, status')
    .eq('email', user.email)
    .single();

  if (!userRecord || userRecord.role !== 'creator' || userRecord.status !== 'active') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const [{ data: languageAssignments }, { data: assignments, error }] = await Promise.all([
    admin
      .from('user_language_assignments')
      .select('language')
      .eq('user_email', user.email),
    admin
      .from('creator_category_assignments')
      .select('*, category:categories(*)')
      .eq('creator_email', user.email)
  ]);

  if (error) {
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }

  const languages = new Set((languageAssignments || []).map(item => item.language));
  const categories = (assignments || []).filter(assignment =>
    assignment.category?.status === 'active' &&
    (languages.size === 0 || languages.has(assignment.category.language))
  );

  return NextResponse.json({ categories });
}
