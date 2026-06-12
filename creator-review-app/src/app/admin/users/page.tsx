import { createAdminClient } from '@/lib/supabase/admin';
import { AddUserForm } from './AddUserForm';
import { UserList } from './UserList';

export default async function AdminUsersPage() {
  const supabase = createAdminClient();

  const [{ data: users }, { data: categories }, { data: languageAssignments }] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('status', 'active')
      .order('language')
      .order('name'),
    supabase
      .from('user_language_assignments')
      .select('*')
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-gray-500 mt-1">Add and manage platform users</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AddUserForm categories={categories || []} />
        </div>
        <div className="lg:col-span-2">
          <UserList users={users || []} languageAssignments={languageAssignments || []} />
        </div>
      </div>
    </div>
  );
}
