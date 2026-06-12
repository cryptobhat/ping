import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { StatusBadge } from '@/components/StatusBadge';
import Link from 'next/link';
import { Upload, FileText, FolderOpen } from 'lucide-react';

export default async function CreatorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const { data: userLanguages } = await admin
    .from('user_language_assignments')
    .select('language')
    .eq('user_email', user!.email!);
  const assignedLanguages = (userLanguages || []).map((ul: any) => ul.language);

  const { data: assignments } = await admin
    .from('creator_category_assignments')
    .select('*, category:categories(*)')
    .eq('creator_email', user!.email!);

  const filteredAssignments = assignedLanguages.length > 0
    ? (assignments || []).filter((a: any) => assignedLanguages.includes(a.category?.language))
    : (assignments || []);

  const { data: recentSubmissions } = await admin
    .from('submissions')
    .select('*, category:categories(*)')
    .eq('creator_email', user!.email!)
    .order('created_at', { ascending: false })
    .limit(5);

  const filteredSubmissions = assignedLanguages.length > 0
    ? (recentSubmissions || []).filter((s: any) => assignedLanguages.includes(s.category?.language))
    : (recentSubmissions || []);

  const categoryIds = (filteredAssignments || []).map((a: any) => a.category_id);

  const buildCountQuery = () => {
    let base = admin
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('creator_email', user!.email!);
    return base;
  };

  let pendingQuery = buildCountQuery().eq('status', 'pending');
  let acceptedQuery = buildCountQuery().eq('status', 'accepted');
  let rejectedQuery = buildCountQuery().eq('status', 'rejected');

  if (assignedLanguages.length > 0) {
    const scopedCategoryIds = categoryIds.length > 0
      ? categoryIds
      : ['00000000-0000-0000-0000-000000000000'];
    pendingQuery = pendingQuery.in('category_id', scopedCategoryIds);
    acceptedQuery = acceptedQuery.in('category_id', scopedCategoryIds);
    rejectedQuery = rejectedQuery.in('category_id', scopedCategoryIds);
  }

  const { count: pendingCount } = await pendingQuery;
  const { count: acceptedCount } = await acceptedQuery;
  const { count: rejectedCount } = await rejectedQuery;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Creator Dashboard</h1>
        <p className="text-gray-500 mt-1">Upload and manage your content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Accepted</p>
          <p className="text-2xl font-bold text-green-600">{acceptedCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{rejectedCount || 0}</p>
        </div>
      </div>

      {/* Assigned Categories */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            Assigned Categories
          </h2>
          {(filteredAssignments && filteredAssignments.length > 0) && (
            <Link
              href="/creator/upload"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Content
            </Link>
          )}
        </div>
        {filteredAssignments && filteredAssignments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAssignments.map((a: any) => (
              <div key={a.id} className="bg-white rounded-lg border p-4">
                <p className="font-medium text-gray-900">{a.category?.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {a.category?.language} • {a.category?.content_type}
                </p>
                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
                  a.category?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {a.category?.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-dashed p-8 text-center">
            <FolderOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No categories assigned yet. Contact your admin.</p>
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Recent Submissions
          </h2>
          {filteredSubmissions && filteredSubmissions.length > 0 && (
            <Link href="/creator/submissions" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View All
            </Link>
          )}
        </div>
        {filteredSubmissions && filteredSubmissions.length > 0 ? (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubmissions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-[150px] truncate">{s.title || 'Untitled'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.category?.name || '\u2014'}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-dashed p-8 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No submissions yet.</p>
            {filteredAssignments && filteredAssignments.length > 0 && (
              <Link href="/creator/upload" className="mt-3 inline-block text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Upload your first content
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
