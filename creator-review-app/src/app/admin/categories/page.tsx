import { createAdminClient } from '@/lib/supabase/admin';
import { AddCategoryForm } from './AddCategoryForm';
import { CategoryList } from './CategoryList';

export default async function AdminCategoriesPage() {
  const supabase = createAdminClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
        <p className="text-gray-500 mt-1">Create and manage content categories</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <AddCategoryForm />
        </div>
        <div className="lg:col-span-2">
          <CategoryList categories={categories || []} />
        </div>
      </div>
    </div>
  );
}
