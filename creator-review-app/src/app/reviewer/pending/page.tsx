import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { FileVideo, Eye, Filter } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ language?: string; category?: string; content_type?: string }>;
}

export default async function PendingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: allCategories } = await admin
    .from('categories')
    .select('*')
    .eq('status', 'active')
    .order('name');

  const { data: { user } } = await supabase.auth.getUser();
  const { data: userLanguages } = await admin
    .from('user_language_assignments')
    .select('language')
    .eq('user_email', user!.email!);
  const assignedLanguages = (userLanguages || []).map((ul: any) => ul.language);

  const languages = assignedLanguages.length > 0
    ? assignedLanguages
    : Array.from(new Set((allCategories || []).map((c: any) => c.language)));

  const filteredCategories = assignedLanguages.length > 0
    ? (allCategories || []).filter((c: any) => assignedLanguages.includes(c.language))
    : (allCategories || []);

  const contentTypes: string[] = ['poster', 'video', 'both'];

  let query = admin
    .from('submissions')
    .select('*, category:categories(*)')
    .in('status', ['pending', 'drive_failed'])
    .order('created_at', { ascending: false });

  if (params.category) {
    query = query.eq('category_id', params.category);
  }

  let { data: submissions } = await query;

  if (submissions) {
    if (assignedLanguages.length > 0) {
      submissions = submissions.filter((s: any) => assignedLanguages.includes(s.category?.language));
    }
    if (params.language) {
      submissions = submissions.filter((s: any) => s.category?.language === params.language);
    }
    if (params.content_type) {
      submissions = submissions.filter((s: any) => {
        if (params.content_type === 'both') return s.category?.content_type === 'both';
        return (
          s.category?.content_type === params.content_type ||
          s.category?.content_type === 'both'
        );
      });
    }
  }

  const isImage = (fileType: string | null) => fileType && fileType.startsWith('image/');

  const buildFilterUrl = (key: string, value: string) => {
    const newParams = new URLSearchParams();
    if (key === 'language') {
      if (value) newParams.set('language', value);
      if (params.category) newParams.set('category', params.category);
      if (params.content_type) newParams.set('content_type', params.content_type);
    } else if (key === 'category') {
      if (params.language) newParams.set('language', params.language);
      if (value) newParams.set('category', value);
      if (params.content_type) newParams.set('content_type', params.content_type);
    } else if (key === 'content_type') {
      if (params.language) newParams.set('language', params.language);
      if (params.category) newParams.set('category', params.category);
      if (value) newParams.set('content_type', value);
    }
    const qs = newParams.toString();
    return `/reviewer/pending${qs ? '?' + qs : ''}`;
  };

  const hasFilters = params.language || params.category || params.content_type;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pending Submissions</h1>
        <p className="text-gray-500 mt-1">Review and approve or reject content</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
          {hasFilters && (
            <Link href="/reviewer/pending" className="text-xs text-indigo-600 hover:text-indigo-800 ml-auto">
              Clear all
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-6">
          {/* Language filter */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Language</p>
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={buildFilterUrl('language', '')}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  !params.language
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                All
              </Link>
              {languages.map((lang) => (
                <Link
                  key={lang}
                  href={buildFilterUrl('language', lang)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    params.language === lang
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {lang}
                </Link>
              ))}
            </div>
          </div>

          {/* Content Type filter */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Content Type</p>
            <div className="flex flex-wrap gap-1.5">
              <Link
                href={buildFilterUrl('content_type', '')}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  !params.content_type
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                All
              </Link>
              {contentTypes.map((ct) => (
                <Link
                  key={ct}
                  href={buildFilterUrl('content_type', ct)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors capitalize ${
                    params.content_type === ct
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {ct}
                </Link>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Category</p>
            <div className="flex flex-wrap gap-1.5 max-w-lg">
              <Link
                href={buildFilterUrl('category', '')}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  !params.category
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                All
              </Link>
              {filteredCategories?.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={buildFilterUrl('category', cat.id)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    params.category === cat.id
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">
        {submissions?.length || 0} submission
        {(submissions?.length || 0) !== 1 ? 's' : ''}
      </p>

      {/* Submissions grid */}
      {submissions && submissions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.map((s: any) => (
            <div
              key={s.id}
              className="bg-white rounded-lg border hover:border-indigo-300 transition-colors overflow-hidden"
            >
              {/* Preview */}
              <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                {isImage(s.file_type) ? (
                  <img
                    src={s.file_url}
                    alt={s.title || 'Preview'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <FileVideo className="w-12 h-12 text-gray-300" />
                )}
              </div>
              {/* Details */}
              <div className="p-4">
                <p className="font-medium text-gray-900 truncate">{s.title || 'Untitled'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.creator_email}</p>
                {s.status === 'drive_failed' && (
                  <p className="text-xs text-orange-600 mt-1">Drive sync failed - retry required</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {s.category?.name || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
                <Link
                  href={`/reviewer/submission/${s.id}`}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View &amp; Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-dashed p-12 text-center">
          <FileVideo className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No pending submissions</p>
          <p className="text-gray-400 text-sm mt-1">All caught up!</p>
        </div>
      )}
    </div>
  );
}
