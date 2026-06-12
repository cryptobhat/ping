import { createAdminClient } from '@/lib/supabase/admin';
import { AddAssignmentForm } from './AddAssignmentForm';
import { AssignmentList } from './AssignmentList';

export default async function AdminAssignmentsPage() {
  const supabase = createAdminClient();

  const [{ data: assignments }, { data: creators }, { data: categories }] = await Promise.all([
    supabase
      .from('creator_category_assignments')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('email')
      .eq('role', 'creator')
      .eq('status', 'active')
      .order('email'),
    supabase
      .from('categories')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Assignments</h1>
        <p className="text-gray-500 mt-1">Assign categories to creators</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AddAssignmentForm creators={creators || []} categories={categories || []} />
        </div>
        <div className="lg:col-span-2">
          <AssignmentList assignments={assignments || []} />
        </div>
      </div>
    </div>
  );
}
