import { createAdminClient } from '@/lib/supabase/admin';
import { LanguageAssignmentManager } from './LanguageAssignmentManager';

export default async function AdminLanguagesPage() {
  const supabase = createAdminClient();

  const { data: users } = await supabase
    .from('users')
    .select('email, role, name')
    .in('role', ['creator', 'reviewer'])
    .eq('status', 'active')
    .order('email');

  const { data: assignments } = await supabase
    .from('user_language_assignments')
    .select('*')
    .order('user_email');

  const { data: categories } = await supabase
    .from('categories')
    .select('language')
    .eq('status', 'active');

  const languages = Array.from(new Set((categories || []).map((c: any) => c.language))).sort();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Language Assignments</h1>
        <p className="text-gray-500 mt-1">Manage which languages creators and reviewers can access</p>
      </div>
      <LanguageAssignmentManager
        users={users || []}
        assignments={assignments || []}
        languages={languages}
      />
    </div>
  );
}
