import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileVideo, Calendar, User, FolderOpen, Tag, Info, HardDrive } from 'lucide-react';
import { ReviewActions } from './ReviewActions';

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: submission } = await admin
    .from('submissions')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single();

  if (!submission) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: userLanguages } = await admin
    .from('user_language_assignments')
    .select('language')
    .eq('user_email', user!.email!);
  const assignedLanguages = (userLanguages || []).map((ul: any) => ul.language);

  if (assignedLanguages.length > 0 && submission.category?.language) {
    if (!assignedLanguages.includes(submission.category.language)) {
      redirect('/reviewer/pending');
    }
  }

  const isImage = (fileType: string | null) => fileType && fileType.startsWith('image/');
  const isVideo = (fileType: string | null) => fileType && fileType.startsWith('video/');
  const isPending = submission.status === 'pending' || submission.status === 'drive_failed';
  const alreadyReviewed = !isPending;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/reviewer/pending"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pending
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Review Submission</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              {submission.status === 'accepted' ? (
                <div className="text-center">
                  <HardDrive className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">File synced to Google Drive</p>
                  {submission.google_drive_file_id && (
                    <a
                      href={`https://drive.google.com/file/d/${submission.google_drive_file_id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 text-sm hover:text-indigo-300 mt-2 inline-block"
                    >
                      View in Drive
                    </a>
                  )}
                </div>
              ) : submission.status === 'drive_failed' ? (
                <div className="text-center">
                  <HardDrive className="w-12 h-12 text-orange-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Google Drive sync failed</p>
                </div>
              ) : isImage(submission.file_type) ? (
                <img
                  src={submission.file_url}
                  alt={submission.title || 'Preview'}
                  className="max-w-full max-h-full object-contain"
                />
              ) : isVideo(submission.file_type) ? (
                <video controls className="max-w-full max-h-full" preload="metadata">
                  <source src={submission.file_url} type={submission.file_type} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center">
                  <FileVideo className="w-16 h-16 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Preview not available</p>
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 text-sm hover:text-indigo-300 mt-2 inline-block"
                  >
                    Open file in new tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata & Actions panel */}
        <div className="space-y-4">
          {/* Metadata */}
          <div className="bg-white rounded-lg border p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submission Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-gray-400 uppercase flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Title
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">{submission.title || 'Untitled'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Creator
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">{submission.creator_email}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase flex items-center gap-1.5">
                  <FolderOpen className="w-3 h-3" /> Category
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">{submission.category?.name || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Details
                </dt>
                <dd className="text-sm text-gray-600 mt-0.5 space-y-0.5">
                  <p>Language: {submission.category?.language || '\u2014'}</p>
                  <p>Content Type: {submission.category?.content_type || '\u2014'}</p>
                  <p>File: {submission.file_type || 'unknown'}</p>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Uploaded
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {new Date(submission.created_at).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400 uppercase">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      submission.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : submission.status === 'accepted'
                          ? 'bg-green-100 text-green-800 border-green-200'
                          : submission.status === 'rejected'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-orange-100 text-orange-800 border-orange-200'
                    }`}
                  >
                    {submission.status === 'pending'
                      ? 'Pending'
                      : submission.status === 'accepted'
                        ? 'Accepted'
                        : submission.status === 'rejected'
                          ? 'Rejected'
                          : 'Drive Failed'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Review Actions */}
          <ReviewActions
            submissionId={submission.id}
            isPending={isPending}
            alreadyReviewed={alreadyReviewed}
            reviewedStatus={submission.status}
          />
        </div>
      </div>
    </div>
  );
}
