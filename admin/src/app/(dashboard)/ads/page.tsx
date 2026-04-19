'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';

export default function AdsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await admin.getAdConfigs();
      setConfigs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch ad configs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfigs(); }, []);

  const toggleAd = async (id: string, isEnabled: boolean) => {
    setUpdating(id);
    try {
      await admin.updateAdConfig(id, { isEnabled: !isEnabled });
      setConfigs(prev => prev.map(c => c.id === id ? { ...c, isEnabled: !isEnabled } : c));
      setAlert({ type: 'success', msg: `Ad ${!isEnabled ? 'enabled' : 'disabled'}` });
    } catch (err: any) {
      setAlert({ type: 'error', msg: err.message || 'Failed to update' });
    } finally {
      setUpdating(null);
    }
  };

  const updateFrequency = async (id: string, frequencyCap: number) => {
    setUpdating(id);
    try {
      await admin.updateAdConfig(id, { frequencyCap });
      setConfigs(prev => prev.map(c => c.id === id ? { ...c, frequencyCap } : c));
      setAlert({ type: 'success', msg: 'Frequency cap updated' });
    } catch (err: any) {
      setAlert({ type: 'error', msg: err.message || 'Failed to update' });
    } finally {
      setUpdating(null);
    }
  };

  const formatPlacement = (p: string) => p.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(t);
    }
  }, [alert]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ad Management</h1>
        <p className="mt-1 text-sm text-gray-500">Configure ad placements, frequency caps, and enable/disable ads</p>
      </div>

      {alert && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${alert.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {alert.msg}
        </div>
      )}

      {/* Ad Config Info */}
      <div className="card mb-6 bg-blue-50 border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">Setup Info</h3>
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Web (AdSense):</strong> Set <code>NEXT_PUBLIC_ADSENSE_CLIENT</code> and <code>NEXT_PUBLIC_ADSENSE_SLOT</code> env vars in the web app.<br />
          <strong>Mobile (AdMob):</strong> Update <code>androidAppId</code> / <code>iosAppId</code> in <code>mobile/app.json</code> under <code>react-native-google-mobile-ads</code> plugin. Replace test IDs with production IDs before release.
        </p>
      </div>

      <div className="card overflow-hidden !p-0">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : configs.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-gray-500">
            <p>No ad configurations found</p>
            <p className="text-xs text-gray-400">Ad configs are seeded during setup</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="table-header">Placement</th>
                <th className="table-header">Ad Type</th>
                <th className="table-header">Status</th>
                <th className="table-header">Frequency Cap</th>
                <th className="table-header">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {configs.map((config) => (
                <tr key={config.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-gray-900">
                    {formatPlacement(config.placement)}
                  </td>
                  <td className="table-cell">
                    <span className="badge-blue">{formatPlacement(config.adType)}</span>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => toggleAd(config.id, config.isEnabled)}
                      disabled={updating === config.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${config.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="table-cell">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="input w-20 text-center"
                      value={config.frequencyCap}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setConfigs(prev => prev.map(c => c.id === config.id ? { ...c, frequencyCap: val } : c));
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (val !== config.frequencyCap) {
                          updateFrequency(config.id, val);
                        }
                      }}
                    />
                  </td>
                  <td className="table-cell text-sm text-gray-500">
                    {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
