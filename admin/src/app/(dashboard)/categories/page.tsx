'use client';

import { useCallback, useEffect, useState } from 'react';
import { admin } from '@/lib/api';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  parent?: { id: string; name: string } | null;
  _count?: { content?: number; children?: number };
};

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  iconUrl: '',
  parentId: '',
  sortOrder: 0,
  isActive: true,
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await admin.getCategories();
      setCategories((res.data || []) as CategoryRow[]);
    } catch (e: any) {
      setError(e.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sortOrder: categories.length + 1 });
    setShowForm(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      iconUrl: cat.iconUrl || '',
      parentId: cat.parentId || '',
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setShowForm(true);
  };

  const handleNameChange = (name: string) => {
    const isNew = !editing;
    setForm((f) => ({
      ...f,
      name,
      // Only auto-generate slug for new categories
      ...(isNew ? { slug: slugify(name) } : {}),
    }));
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || null,
        iconUrl: form.iconUrl.trim() || null,
        parentId: form.parentId || null,
        sortOrder: Number(form.sortOrder),
        isActive: form.isActive,
      };
      if (editing) {
        await admin.updateCategory(editing.id, body);
      } else {
        await admin.createCategory(body);
      }
      setEditing(null);
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Content under it will be uncategorized.')) return;
    setDeleting(id);
    setError(null);
    try {
      await admin.deleteCategory(id);
      if (editing?.id === id) {
        setEditing(null);
        setForm(emptyForm);
        setShowForm(false);
      }
      await load();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  // Separate parent and child categories
  const parentCategories = categories.filter((c) => !c.parentId);
  const childCategories = categories.filter((c) => c.parentId);

  // Build display list: parent, then its children indented
  const displayList: (CategoryRow & { isChild?: boolean })[] = [];
  for (const parent of parentCategories.sort((a, b) => a.sortOrder - b.sortOrder)) {
    displayList.push(parent);
    const children = childCategories
      .filter((c) => c.parentId === parent.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const child of children) {
      displayList.push({ ...child, isChild: true });
    }
  }
  // Orphan children (parentId points to non-existent parent)
  const listedChildIds = new Set(displayList.filter((d) => (d as any).isChild).map((d) => d.id));
  for (const child of childCategories) {
    if (!listedChildIds.has(child.id)) {
      displayList.push({ ...child, isChild: true });
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage content genres and subcategories. {categories.length} total.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Add category
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Table */}
        <div className="card !p-0 overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading...</p>
          ) : displayList.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No categories yet. Create one to get started.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="table-header text-left">Name</th>
                  <th className="table-header text-left">Slug</th>
                  <th className="table-header text-right">Order</th>
                  <th className="table-header text-center">Active</th>
                  <th className="table-header" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayList.map((cat) => (
                  <tr
                    key={cat.id}
                    className={`hover:bg-gray-50 ${editing?.id === cat.id ? 'bg-brand-50' : ''}`}
                  >
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        {(cat as any).isChild && (
                          <span className="text-gray-300 ml-2">└</span>
                        )}
                        {cat.iconUrl ? (
                          <img
                            src={cat.iconUrl}
                            alt=""
                            className="h-6 w-6 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs text-gray-400 flex-shrink-0">
                            #
                          </span>
                        )}
                        <span className="font-medium text-gray-900">{cat.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">{cat.slug}</td>
                    <td className="table-cell text-right tabular-nums">{cat.sortOrder}</td>
                    <td className="table-cell text-center">
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                          cat.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {cat.isActive ? '\u2713' : '\u2717'}
                      </span>
                    </td>
                    <td className="table-cell text-right space-x-3">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="text-brand-600 hover:underline text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleting === cat.id}
                        className="text-red-500 hover:underline text-xs font-medium disabled:opacity-50"
                      >
                        {deleting === cat.id ? '...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="card !p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editing ? 'Edit category' : 'New category'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. ಪ್ರೀತಿ"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                  placeholder="auto-generated-from-name"
                />
                <p className="mt-0.5 text-[10px] text-gray-400">URL-safe identifier. Auto-generated from name.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Short description of this genre"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Icon / Image URL</label>
                <input
                  value={form.iconUrl}
                  onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="https://... (cover image for the category)"
                />
                {form.iconUrl && (
                  <img
                    src={form.iconUrl}
                    alt="Preview"
                    className="mt-2 h-16 w-24 rounded-lg object-cover border"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Parent Category</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">None (top-level)</option>
                  {parentCategories
                    .filter((c) => c.id !== editing?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.slug})
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, isActive: e.target.checked }))
                      }
                    />
                    Active (visible on site)
                  </label>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={saving || !form.name.trim()}
                  onClick={save}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(emptyForm);
                    setShowForm(false);
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
