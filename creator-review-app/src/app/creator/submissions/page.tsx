import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { StatusBadge } from '@/components/StatusBadge';
import { ResubmitButton } from '@/components/ResubmitButton';
import Link from 'next/link';
import { ArrowLeft, FileVideo, ImageIcon, CheckCircle, HardDrive } from 'lucide-react';

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const { data: userLanguages } = await admin
    .from('user_language_assignments')
    .select('language')
    .eq('user_email', user!.email!);
  const assignedLanguages = (userLanguages || []).map((ul: any) => ul.language);

  const { data: submissions } = await admin
    .from('submissions')
    .select('*, category:categories(*)')
    .eq('creator_email', user!.email!)
    .order('created_at', { ascending: false });

  const filteredSubmissions = assignedLanguages.length > 0
    ? (submissions || []).filter((s: any) => assignedLanguages.includes(s.category?.language))
    : (submissions || []);

  const isImage = (fileType: string | null) => {
    return fileType && fileType.startsWith('image/');
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/creator" className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
        <p className="text-gray-500 mt-1">View all your submitted content</p>
      </div>

      {filteredSubmissions && filteredSubmissions.length > 0 ? (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">Preview</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rejection Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubmissions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {s.status === 'accepted' ? (
                        <div className="w-12 h-12 bg-green-50 rounded border border-green-100 flex items-center justify-center">
                          <HardDrive className="w-5 h-5 text-green-500" />
                        </div>
                      ) : s.status === 'drive_failed' ? (
                        <div className="w-12 h-12 bg-orange-50 rounded border border-orange-100 flex items-center justify-center">
                          <HardDrive className="w-5 h-5 text-orange-500" />
                        </div>
                      ) : isImage(s.file_type) ? (
                        <img
                          src={s.file_url}
                          alt={s.title || 'Preview'}
                          className="w-12 h-12 object-cover rounded border"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                          <FileVideo className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{s.title || 'Untitled'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{s.category?.name || '\u2014'}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate">
                      {s.rejection_reason || '\u2014'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {s.status === 'rejected' && (
                        <ResubmitButton
                          submissionId={s.id}
                          currentTitle={s.title}
                          rejectionReason={s.rejection_reason}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-dashed p-12 text-center">
          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">No submissions yet</p>
          <Link
            href="/creator/upload"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            Upload Your First Content
          </Link>
        </div>
      )}
    </div>
  );
}
