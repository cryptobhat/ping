'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { admin } from '@/lib/api';
import Modal from '@/components/modal';

type BannerRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  deepLink?: string | null;
  link?: string | null;
  sortOrder: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
};

const emptyForm = {
  title: '',
  subtitle: '',
  imageUrl: '',
  deepLink: '',
  link: '',
  sortOrder: 0,
  isActive: true,
  startDate: '',
  endDate: '',
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toInputDate(dateStr?: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [deleteTarget, setDeleteTarget] = useState<BannerRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await admin.getBanners();
      setBanners((res.data || []) as BannerRow[]);
    } catch (e: any) {
      setError(e.message || 'Failed to load banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: banners.length });
    setModalOpen(true);
  };

  const openEdit = (b: BannerRow) => {
    setEditing(b);
    setForm({
      title: b.title,
      subtitle: b.subtitle || '',
      imageUrl: b.imageUrl || '',
      deepLink: b.deepLink || '',
      link: b.link || '',
      sortOrder: b.sortOrder,
      isActive: b.isActive,
      startDate: toInputDate(b.startDate),
      endDate: toInputDate(b.endDate),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, any> = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        deepLink: form.deepLink.trim() || null,
        link: form.link.trim() || null,
        sortOrder: Number(form.sortOrder),
        isActive: form.isActive,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      if (editing) {
        await admin.updateBanner(editing.id, body);
      } else {
        await admin.createBanner(body);
      }
      closeModal();
      await load();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: BannerRow) => {
    setError(null);
    try {
      await admin.updateBanner(b.id, { isActive: !b.isActive });
      await load();
    } catch (e: any) {
      setError(e.message || 'Toggle failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await admin.deleteBanner(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await admin.uploadImage(file, 'banner');
      if (res?.data?.url) {
        setForm((f) => ({ ...f, imageUrl: res.data.url }));
      } else if (res?.url) {
        setForm((f) => ({ ...f, imageUrl: res.url }));
      }
    } catch (e: any) {
      setError(e.message || 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promotional banners</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage carousel banners shown on the home screen. Only active banners within valid date ranges are displayed.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Add banner
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
      )}

      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : banners.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No banners yet. Click &quot;Add banner&quot; to create one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="table-header text-left">Image</th>
                  <th className="table-header text-left">Title</th>
                  <th className="table-header text-left">Deep link</th>
                  <th className="table-header text-center">Order</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-left">Start</th>
                  <th className="table-header text-left">End</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {banners
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="table-cell w-20">
                        {b.imageUrl ? (
                          <img
                            src={b.imageUrl}
                            alt={b.title}
                            className="h-10 w-16 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-16 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                            No img
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <p className="font-medium text-gray-900 truncate max-w-[180px]">{b.title}</p>
                        {b.subtitle && (
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">{b.subtitle}</p>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className="text-xs text-gray-500 truncate block max-w-[140px]">
                          {b.deepLink || b.link || '-'}
                        </span>
                      </td>
                      <td className="table-cell text-center tabular-nums">{b.sortOrder}</td>
                      <td className="table-cell text-center">
                        <button
                          type="button"
                          onClick={() => toggleActive(b)}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                            b.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {b.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="table-cell text-xs text-gray-500">{formatDate(b.startDate)}</td>
                      <td className="table-cell text-xs text-gray-500">{formatDate(b.endDate)}</td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(b)}
                            className="text-brand-600 hover:underline text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(b)}
                            className="text-red-500 hover:underline text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit banner' : 'New banner'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Banner title"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
            <input
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Optional subtitle text"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Image</label>
            <div className="flex items-center gap-3">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="https://... or upload"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Preview"
                className="mt-2 h-24 w-auto rounded-lg object-cover border border-gray-200"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Deep link (mobile)</label>
              <input
                value={form.deepLink}
                onChange={(e) => setForm((f) => ({ ...f, deepLink: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="e.g. /content/abc123"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Link (web)</label>
              <input
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sort order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            Active (visible in app)
          </label>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || !form.title.trim()}
              onClick={save}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editing ? 'Update banner' : 'Create banner'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete banner"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete <strong>&quot;{deleteTarget?.title}&quot;</strong>? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={confirmDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
