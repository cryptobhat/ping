'use client';

import { useEffect, useState, useCallback } from 'react';
import { admin } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Modal from '@/components/modal';
import Pagination from '@/components/pagination';

const CONTENT_TYPES = [
  { value: 'QUOTE', label: 'Quote' },
  { value: 'STORY', label: 'Story' },
  { value: 'POEM', label: 'Poem' },
  { value: 'ARTICLE', label: 'Article' },
];

const LANGUAGES = [
  { value: 'kn', label: 'Kannada' },
  { value: 'hi', label: 'Hindi' },
  { value: 'en', label: 'English' },
];

const STATUS_BADGES: Record<string, string> = {
  UPCOMING: 'badge-yellow',
  ACTIVE: 'badge-green',
  JUDGING: 'badge-blue',
  COMPLETED: 'badge-red',
};

const emptyForm = {
  title: '',
  description: '',
  rules: '',
  theme: '',
  contentType: 'STORY',
  language: 'kn',
  prizePool: '',
  prizeFirst: '',
  prizeSecond: '',
  prizeThird: '',
  startDate: '',
  endDate: '',
  resultsDate: '',
  maxEntries: '',
  minWordCount: '',
  maxWordCount: '',
  bannerImage: '',
};

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...emptyForm });

  const fetchCompetitions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await admin.getCompetitions(page, 20);
      setCompetitions(res.data || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch competitions', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const res = await admin.uploadImage(file, 'banner');
      setForm((prev) => ({ ...prev, bannerImage: res.data?.url || res.url || '' }));
    } catch (err: any) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    try {
      const payload: any = {
        title: form.title,
        description: form.description || undefined,
        rules: form.rules || undefined,
        theme: form.theme || undefined,
        contentType: form.contentType,
        language: form.language,
        bannerImage: form.bannerImage || undefined,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        resultsDate: form.resultsDate ? new Date(form.resultsDate).toISOString() : undefined,
      };

      if (form.prizePool) payload.prizePool = Number(form.prizePool);
      if (form.prizeFirst) payload.prizeFirst = Number(form.prizeFirst);
      if (form.prizeSecond) payload.prizeSecond = Number(form.prizeSecond);
      if (form.prizeThird) payload.prizeThird = Number(form.prizeThird);
      if (form.maxEntries) payload.maxEntries = Number(form.maxEntries);
      if (form.minWordCount) payload.minWordCount = Number(form.minWordCount);
      if (form.maxWordCount) payload.maxWordCount = Number(form.maxWordCount);

      await admin.createCompetition(payload);
      setShowCreate(false);
      setForm({ ...emptyForm });
      fetchCompetitions();
    } catch (err: any) {
      setError(err.message || 'Failed to create competition');
    } finally {
      setCreateLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competitions</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage writing competitions</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          + New Competition
        </button>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : competitions.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228M18.75 4.236V2.721M16.27 9.728a7.454 7.454 0 01-.982 3.172M7.73 9.728a7.454 7.454 0 00.981 3.172" />
            </svg>
            <p>No competitions yet</p>
            <p className="text-xs text-gray-400">Create your first writing competition</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="table-header">Title</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Language</th>
                    <th className="table-header text-right">Prize Pool</th>
                    <th className="table-header text-right">Entries</th>
                    <th className="table-header">Start</th>
                    <th className="table-header">End</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {competitions.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          {c.bannerImage && (
                            <img src={c.bannerImage} alt="" className="h-8 w-12 rounded object-cover" />
                          )}
                          <span className="font-medium text-gray-900">{c.title}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={STATUS_BADGES[c.status] || 'badge-gray'}>{c.status}</span>
                      </td>
                      <td className="table-cell">
                        <span className="badge-blue">{c.contentType}</span>
                      </td>
                      <td className="table-cell">
                        {LANGUAGES.find((l) => l.value === c.language)?.label || c.language}
                      </td>
                      <td className="table-cell text-right font-medium">
                        {c.prizePool ? `Rs ${Number(c.prizePool).toLocaleString()}` : '-'}
                      </td>
                      <td className="table-cell text-right">
                        {c._count?.entries ?? c.entriesCount ?? '-'}
                        {c.maxEntries ? ` / ${c.maxEntries}` : ''}
                      </td>
                      <td className="table-cell">{c.startDate ? formatDate(c.startDate) : '-'}</td>
                      <td className="table-cell">{c.endDate ? formatDate(c.endDate) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Competition" size="2xl">
        <form onSubmit={handleCreate} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Title *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Flash Fiction Friday"
              value={form.title}
              onChange={set('title')}
              required
            />
          </div>

          {/* Content Type + Language */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Content Type *</label>
              <select className="input" value={form.contentType} onChange={set('contentType')} required>
                {CONTENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Language *</label>
              <select className="input" value={form.language} onChange={set('language')} required>
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Theme</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Monsoon, Love, Freedom"
              value={form.theme}
              onChange={set('theme')}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="What is this competition about..."
              value={form.description}
              onChange={set('description')}
            />
          </div>

          {/* Rules */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Rules</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Competition rules and guidelines..."
              value={form.rules}
              onChange={set('rules')}
            />
          </div>

          {/* Banner Image */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Banner Image</label>
            <div className="flex items-center gap-3">
              <label className="btn-secondary cursor-pointer text-sm">
                {uploadLoading ? 'Uploading...' : 'Choose File'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadLoading}
                />
              </label>
              {form.bannerImage && (
                <div className="flex items-center gap-2">
                  <img src={form.bannerImage} alt="Banner preview" className="h-10 w-16 rounded object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, bannerImage: '' }))}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Prizes */}
          <fieldset className="rounded-lg border border-gray-200 p-3">
            <legend className="px-1 text-sm font-medium text-gray-700">Prizes (INR)</legend>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Total Pool</label>
                <input type="number" className="input" placeholder="0" min="0" value={form.prizePool} onChange={set('prizePool')} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">1st Prize</label>
                <input type="number" className="input" placeholder="0" min="0" value={form.prizeFirst} onChange={set('prizeFirst')} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">2nd Prize</label>
                <input type="number" className="input" placeholder="0" min="0" value={form.prizeSecond} onChange={set('prizeSecond')} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">3rd Prize</label>
                <input type="number" className="input" placeholder="0" min="0" value={form.prizeThird} onChange={set('prizeThird')} />
              </div>
            </div>
          </fieldset>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" className="input" value={form.startDate} onChange={set('startDate')} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">End Date</label>
              <input type="date" className="input" value={form.endDate} onChange={set('endDate')} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Results Date</label>
              <input type="date" className="input" value={form.resultsDate} onChange={set('resultsDate')} />
            </div>
          </div>

          {/* Constraints */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Max Entries</label>
              <input type="number" className="input" placeholder="Unlimited" min="1" value={form.maxEntries} onChange={set('maxEntries')} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Min Words</label>
              <input type="number" className="input" placeholder="No min" min="0" value={form.minWordCount} onChange={set('minWordCount')} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Max Words</label>
              <input type="number" className="input" placeholder="No max" min="0" value={form.maxWordCount} onChange={set('maxWordCount')} />
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={createLoading} className="btn-primary">
              {createLoading ? 'Creating...' : 'Create Competition'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
