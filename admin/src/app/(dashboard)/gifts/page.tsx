'use client';

import { useCallback, useEffect, useState } from 'react';
import { admin } from '@/lib/api';

type GiftRow = {
  id: string;
  name: string;
  description?: string | null;
  coinPrice: number;
  iconEmoji?: string | null;
  imageUrl?: string | null;
  animationUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
};

const emptyForm = {
  name: '',
  description: '',
  coinPrice: 50,
  iconEmoji: '',
  imageUrl: '',
  animationUrl: '',
  sortOrder: 0,
  isActive: true,
};

export default function AdminGiftsPage() {
  const [gifts, setGifts] = useState<GiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<GiftRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await admin.gifts.list();
      setGifts((res.data || []) as GiftRow[]);
    } catch (e: any) {
      setError(e.message || 'Failed to load gems');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: gifts.length });
  };

  const openEdit = (g: GiftRow) => {
    setEditing(g);
    setForm({
      name: g.name,
      description: g.description || '',
      coinPrice: g.coinPrice,
      iconEmoji: g.iconEmoji || '',
      imageUrl: g.imageUrl || '',
      animationUrl: g.animationUrl || '',
      sortOrder: g.sortOrder,
      isActive: g.isActive,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gem? This action cannot be undone.')) return;
    setDeleting(id);
    setError(null);
    try {
      await admin.gifts.delete(id);
      if (editing?.id === id) {
        setEditing(null);
        setForm(emptyForm);
      }
      await load();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        coinPrice: Number(form.coinPrice),
        iconEmoji: form.iconEmoji.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
        animationUrl: form.animationUrl.trim() || null,
        sortOrder: Number(form.sortOrder),
        isActive: form.isActive,
      };
      if (editing) {
        await admin.gifts.update(editing.id, body);
      } else {
        await admin.gifts.create(body);
      }
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gems catalog</h1>
          <p className="mt-1 text-sm text-gray-500">
            Name, icon (emoji), image URL, and Point cost. Only active gems show on the web app.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Add gem
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card !p-0 overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="table-header text-left">Icon</th>
                  <th className="table-header text-left">Name</th>
                  <th className="table-header text-right">Points</th>
                  <th className="table-header text-right">Rs</th>
                  <th className="table-header text-left">Active</th>
                  <th className="table-header" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gifts.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="table-cell w-14 text-2xl">{g.iconEmoji || '-'}</td>
                    <td className="table-cell font-medium text-gray-900">{g.name}</td>
                    <td className="table-cell text-right tabular-nums">{g.coinPrice}</td>
                    <td className="table-cell text-right tabular-nums text-gray-400">{(g.coinPrice / 10).toFixed(0)}</td>
                    <td className="table-cell">{g.isActive ? 'Yes' : 'No'}</td>
                    <td className="table-cell text-right space-x-3">
                      <button type="button" onClick={() => openEdit(g)} className="text-brand-600 hover:underline text-xs font-medium">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(g.id)}
                        disabled={deleting === g.id}
                        className="text-red-500 hover:underline text-xs font-medium disabled:opacity-50"
                      >
                        {deleting === g.id ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card !p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editing ? 'Edit gem' : 'New gem'}</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. Diamond"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Short line shown under the name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Point cost *</label>
                <input
                  type="number"
                  min={1}
                  value={form.coinPrice}
                  onChange={(e) => setForm((f) => ({ ...f, coinPrice: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                {form.coinPrice > 0 && (
                  <p className="text-[11px] text-gray-400 mt-1">= Rs {(form.coinPrice / 10).toFixed(2)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sort order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Icon (emoji)</label>
              <input
                value={form.iconEmoji}
                onChange={(e) => setForm((f) => ({ ...f, iconEmoji: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. ..."
                maxLength={16}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image URL (optional)</label>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Animation URL (optional)</label>
              <input
                value={form.animationUrl}
                onChange={(e) => setForm((f) => ({ ...f, animationUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active (visible in app)
            </label>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={saving || !form.name.trim()}
                onClick={save}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
