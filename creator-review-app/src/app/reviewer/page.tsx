import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default async function ReviewerDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const { data: userLanguages } = await admin
    .from('user_language_assignments')
    .select('language')
    .eq('user_email', user!.email!);
  const assignedLanguages = (userLanguages || []).map((ul: any) => ul.language);

  const { data: langCategories } = await admin
    .from('categories')
    .select('id, language')
    .eq('status', 'active');
  const categoryIds = assignedLanguages.length > 0 && langCategories
    ? langCategories.filter((c: any) => assignedLanguages.includes(c.language)).map((c: any) => c.id)
    : [];

  let pendingQuery = admin
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  let acceptedQuery = admin
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted');

  let rejectedQuery = admin
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'rejected');

  let driveFailedQuery = admin
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'drive_failed');

  if (assignedLanguages.length > 0) {
    const scopedCategoryIds = categoryIds.length > 0
      ? categoryIds
      : ['00000000-0000-0000-0000-000000000000'];
    pendingQuery = pendingQuery.in('category_id', scopedCategoryIds);
    acceptedQuery = acceptedQuery.in('category_id', scopedCategoryIds);
    rejectedQuery = rejectedQuery.in('category_id', scopedCategoryIds);
    driveFailedQuery = driveFailedQuery.in('category_id', scopedCategoryIds);
  }

  const { count: pendingCount } = await pendingQuery;
  const { count: acceptedCount } = await acceptedQuery;
  const { count: rejectedCount } = await rejectedQuery;
  const { count: driveFailedCount } = await driveFailedQuery;

  let recentReviewsQuery = admin
    .from('submissions')
    .select('*, category:categories(*)')
    .eq('reviewer_email', user!.email!)
    .order('reviewed_at', { ascending: false })
    .limit(5);

  if (assignedLanguages.length > 0) {
    recentReviewsQuery = recentReviewsQuery.in(
      'category_id',
      categoryIds.length > 0
        ? categoryIds
        : ['00000000-0000-0000-0000-000000000000']
    );
  }

  const { data: recentReviews } = await recentReviewsQuery;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reviewer Dashboard</h1>
        <p className="text-gray-500 mt-1">Review and manage content submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-yellow-50">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Accepted</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{acceptedCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-red-50">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-sm text-gray-500">Rejected</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{rejectedCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-orange-50">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-sm text-gray-500">Drive Failed</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{driveFailedCount || 0}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-8">
        <Link
          href="/reviewer/pending"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
        >
          <Clock className="w-5 h-5" />
          Review Pending Submissions ({pendingCount || 0})
        </Link>
      </div>

      {/* Recent Reviews */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          Your Recent Reviews
        </h2>
        {recentReviews && recentReviews.length > 0 ? (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviewed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentReviews.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{s.title || 'Untitled'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.creator_email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.category?.name || '\u2014'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          s.status === 'accepted'
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : s.status === 'rejected'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-orange-100 text-orange-800 border-orange-200'
                        }`}
                      >
                        {s.status === 'accepted'
                          ? 'Accepted'
                          : s.status === 'rejected'
                            ? 'Rejected'
                            : 'Drive Failed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                      {s.reviewed_at ? new Date(s.reviewed_at).toLocaleDateString() : '\u2014'}
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
            <p className="text-gray-500 text-sm">No reviews yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
