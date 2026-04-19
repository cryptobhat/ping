'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';

const LANGS = ['en', 'hi', 'kn', 'ta', 'te', 'mr', 'bn', 'gu', 'ml', 'pa', 'ur'];

export default function SiteCopyPage() {
  const [pageKeys, setPageKeys] = useState<string[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [pageKey, setPageKey] = useState('home');
  const [language, setLanguage] = useState('en');
  const [jsonText, setJsonText] = useState('{}');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await admin.siteCopy.get();
      const data = res.data;
      setPageKeys(data?.defaultPageKeys || ['home', 'welcome']);
      setBundles(data?.bundles || []);
      const row = data?.bundles?.find((b: any) => b.pageKey === pageKey && b.language === language);
      setJsonText(JSON.stringify(row?.strings || {}, null, 2));
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when switching page/lang
  }, []);

  useEffect(() => {
    const row = bundles.find((b: any) => b.pageKey === pageKey && b.language === language);
    setJsonText(JSON.stringify(row?.strings || {}, null, 2));
  }, [pageKey, language, bundles]);

  const save = async () => {
    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(jsonText);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Root must be a JSON object');
      }
    } catch (e: any) {
      setError(e.message || 'Invalid JSON');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await admin.siteCopy.upsert(pageKey, language, parsed as Record<string, string>);
      setMessage('Saved');
      await load();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Copy &amp; languages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Override UI strings per page and language. Empty JSON uses app defaults until you add keys.
        </p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>}
      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">{message}</div>
      )}

      <div className="card mb-4 !p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Page key</label>
            <select
              value={pageKey}
              onChange={(e) => setPageKey(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {pageKeys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card !p-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <>
            <label className="mb-2 block text-xs font-medium text-gray-600">Strings (JSON object: key → string)</label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={18}
              className="w-full rounded-lg border border-gray-300 p-3 font-mono text-xs"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save bundle'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
