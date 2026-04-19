'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';

interface EconomySetting {
  key: string;
  label: string;
  description: string;
  suffix: string;
  min: number;
  max: number;
  step: number;
}

const allLanguages = [
  { code: 'kn', name: '\u0C95\u0CA8\u0CCD\u0CA8\u0CA1', label: 'Kannada' },
  { code: 'hi', name: '\u0939\u093F\u0902\u0926\u0940', label: 'Hindi' },
  { code: 'en', name: 'English', label: 'English' },
  { code: 'ta', name: '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD', label: 'Tamil' },
  { code: 'te', name: '\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41', label: 'Telugu' },
  { code: 'mr', name: '\u092E\u0930\u093E\u0920\u0940', label: 'Marathi' },
  { code: 'bn', name: '\u09AC\u09BE\u0982\u09B2\u09BE', label: 'Bengali' },
  { code: 'gu', name: '\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0', label: 'Gujarati' },
  { code: 'ml', name: '\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02', label: 'Malayalam' },
  { code: 'pa', name: '\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40', label: 'Punjabi' },
  { code: 'ur', name: '\u0627\u0631\u062F\u0648', label: 'Urdu' },
];

const economySettings: EconomySetting[] = [
  {
    key: 'reading_reward_coins',
    label: 'Reading Reward (Points)',
    description: 'Points awarded per valid reading session (3 min + 50% scroll)',
    suffix: 'Points',
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: 'daily_coin_cap',
    label: 'Daily Point Cap',
    description: 'Maximum Points a reader can earn per day from reading',
    suffix: 'Points/day',
    min: 0,
    max: 500,
    step: 1,
  },
  {
    key: 'completion_bonus',
    label: 'Completion Bonus',
    description: 'Extra Points for completing a full story/article',
    suffix: 'Points',
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: 'streak_bonus_7day',
    label: '7-Day Streak Bonus',
    description: 'Extra Points for maintaining a 7+ day reading streak',
    suffix: 'Points',
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: 'referral_reward',
    label: 'Referral Reward',
    description: 'Points awarded to the referrer when someone joins via referral code',
    suffix: 'Points',
    min: 0,
    max: 1000,
    step: 10,
  },
  {
    key: 'min_withdrawal_coins',
    label: 'Minimum Withdrawal',
    description: 'Minimum Points required to request a withdrawal',
    suffix: 'Points',
    min: 10,
    max: 10000,
    step: 10,
  },
  {
    key: 'coins_per_rupee',
    label: 'Points per Rupee',
    description: 'Exchange rate: how many Points equal 1 INR',
    suffix: 'Points = Rs 1',
    min: 1,
    max: 1000,
    step: 1,
  },
  {
    key: 'platform_commission_percent',
    label: 'Platform Commission',
    description: 'Percentage the platform keeps from gems, unlocks, and subscriptions. Rest goes to the author (default 30%).',
    suffix: '%',
    min: 0,
    max: 100,
    step: 0.5,
  },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Language state
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>([]);
  const [langLoading, setLangLoading] = useState(true);
  const [langSaving, setLangSaving] = useState(false);
  const [langMessage, setLangMessage] = useState('');

  useEffect(() => {
    admin.getEnabledLanguages().then((res) => {
      const data = (res as any).data?.data ?? (res as any).data ?? [];
      setEnabledLanguages(Array.isArray(data) ? data : []);
      setLangLoading(false);
    }).catch(() => setLangLoading(false));
  }, []);

  const toggleLanguage = (code: string) => {
    setEnabledLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSaveLanguages = async () => {
    if (enabledLanguages.length === 0) {
      setLangMessage('At least one language must be enabled');
      return;
    }
    setLangSaving(true);
    setLangMessage('');
    try {
      await admin.setEnabledLanguages(enabledLanguages);
      setLangMessage('Languages saved successfully');
    } catch (err: any) {
      setLangMessage(err.message || 'Failed to save languages');
    } finally {
      setLangSaving(false);
    }
  };

  useEffect(() => {
    admin.getSettings().then((res) => {
      const raw = res.data?.data ?? res.data ?? {};
      const data: Record<string, string> = {};
      if (typeof raw === 'object' && raw !== null) {
        for (const [k, v] of Object.entries(raw)) {
          data[k] = String(v ?? '');
        }
      }
      setValues(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await admin.updateSettings(values);
      setMessage('Settings saved successfully');
    } catch (err: any) {
      setMessage(err.response?.data?.message || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure the Points & Gems economy, commissions, and reward rates</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Language Settings */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Enabled Languages</h2>
          <p className="text-xs text-gray-500 mb-4">
            Select which languages are available for content creation and reading on the platform.
          </p>
          {langLoading ? (
            <div className="flex h-16 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allLanguages.map((lang) => {
                  const isEnabled = enabledLanguages.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => toggleLanguage(lang.code)}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                        isEnabled
                          ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
                        isEnabled
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isEnabled && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900">{lang.name}</div>
                        <div className="text-xs text-gray-500">{lang.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <button
                  onClick={handleSaveLanguages}
                  disabled={langSaving}
                  className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                >
                  {langSaving ? 'Saving...' : 'Save Languages'}
                </button>
                {langMessage && (
                  <span className={`text-sm ${
                    langMessage.includes('success') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {langMessage}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Economy overview card */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-sm font-semibold text-blue-900 mb-1">Points & Gems Economy</h2>
          <p className="text-xs text-blue-700">
            Currency: Points. Rs 1 = {values.coins_per_rupee || '10'} Points.
            Readers earn Points by reading. Points are spent on Gems (gifts to authors) and episode unlocks.
            Authors receive {100 - parseFloat(values.platform_commission_percent || '30')}% of Point value as INR in their wallet.
          </p>
        </div>

        {/* Settings grid */}
        <div className="space-y-4">
          {economySettings.map((setting) => (
            <div key={setting.key} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{setting.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    min={setting.min}
                    max={setting.max}
                    step={setting.step}
                    value={values[setting.key] ?? ''}
                    onChange={(e) => handleChange(setting.key, e.target.value)}
                    className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 text-right focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-xs text-gray-400 w-16">{setting.suffix}</span>
                </div>
              </div>
              {/* Live preview for some settings */}
              {setting.key === 'reading_reward_coins' && (
                <p className="text-[11px] text-gray-400 mt-2">
                  = Rs {(parseFloat(values.reading_reward_coins || '2') / parseFloat(values.coins_per_rupee || '10')).toFixed(2)} per session
                </p>
              )}
              {setting.key === 'daily_coin_cap' && (
                <p className="text-[11px] text-gray-400 mt-2">
                  = Rs {(parseFloat(values.daily_coin_cap || '20') / parseFloat(values.coins_per_rupee || '10')).toFixed(2)}/day max
                </p>
              )}
              {setting.key === 'min_withdrawal_coins' && (
                <p className="text-[11px] text-gray-400 mt-2">
                  = Rs {(parseFloat(values.min_withdrawal_coins || '400') / parseFloat(values.coins_per_rupee || '10')).toFixed(2)} minimum
                </p>
              )}
              {setting.key === 'referral_reward' && (
                <p className="text-[11px] text-gray-400 mt-2">
                  = Rs {(parseFloat(values.referral_reward || '100') / parseFloat(values.coins_per_rupee || '10')).toFixed(2)} per referral
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Save */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
          {message && (
            <span className={`text-sm ${
              message.includes('success') ? 'text-green-600' : 'text-red-600'
            }`}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
