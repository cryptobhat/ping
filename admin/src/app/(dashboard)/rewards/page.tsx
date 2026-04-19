'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import StatCard from '@/components/stat-card';

interface RewardSetting {
  key: string;
  label: string;
  description: string;
  suffix: string;
  min: number;
  max: number;
  step: number;
}

const rewardSettings: RewardSetting[] = [
  {
    key: 'daily_coin_cap',
    label: 'Daily Coin Cap',
    description: 'Maximum coins a reader can earn per day from reading',
    suffix: 'Coins/day',
    min: 0,
    max: 500,
    step: 1,
  },
  {
    key: 'coins_per_rupee',
    label: 'Coins Per Rupee',
    description: 'Exchange rate: how many coins equal 1 INR',
    suffix: 'Coins = Rs 1',
    min: 1,
    max: 1000,
    step: 1,
  },
  {
    key: 'reading_reward_coins',
    label: 'Reading Reward',
    description: 'Coins awarded per valid reading session (3 min + 50% scroll)',
    suffix: 'Coins',
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: 'streak_bonus_7day',
    label: '7-Day Streak Bonus',
    description: 'Extra coins for maintaining a 7+ day reading streak',
    suffix: 'Coins',
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: 'completion_bonus',
    label: 'Completion Bonus',
    description: 'Extra coins for completing a full story or article',
    suffix: 'Coins',
    min: 0,
    max: 100,
    step: 1,
  },
  {
    key: 'min_withdrawal_coins',
    label: 'Minimum Withdrawal',
    description: 'Minimum coins required to request a withdrawal',
    suffix: 'Coins',
    min: 10,
    max: 10000,
    step: 10,
  },
];

export default function RewardsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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
      // Only send the reward-related keys
      const rewardKeys = rewardSettings.map((s) => s.key);
      const payload: Record<string, string> = {};
      for (const key of rewardKeys) {
        if (values[key] !== undefined) {
          payload[key] = values[key];
        }
      }
      await admin.updateSettings(payload);
      setMessage('Reward settings saved successfully');
    } catch (err: any) {
      setMessage(err.message || 'Failed to save settings');
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

  const coinsPerRupee = parseFloat(values.coins_per_rupee || '10');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Economy & Rewards</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure the coin economy, reading rewards, and withdrawal thresholds
        </p>
      </div>

      {/* Stat cards overview */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Daily Coin Cap"
          value={values.daily_coin_cap || '0'}
          subtitle={`Rs ${(parseFloat(values.daily_coin_cap || '0') / coinsPerRupee).toFixed(2)}/day`}
          color="brand"
        />
        <StatCard
          title="Coins Per Rupee"
          value={values.coins_per_rupee || '0'}
          subtitle="Exchange rate"
          color="blue"
        />
        <StatCard
          title="Reading Reward"
          value={values.reading_reward_coins || '0'}
          subtitle={`Rs ${(parseFloat(values.reading_reward_coins || '0') / coinsPerRupee).toFixed(2)}/session`}
          color="green"
        />
        <StatCard
          title="Streak Bonus"
          value={values.streak_bonus_7day || '0'}
          subtitle="7-day streak"
          color="yellow"
        />
        <StatCard
          title="Completion Bonus"
          value={values.completion_bonus || '0'}
          subtitle="Per completion"
          color="green"
        />
      </div>

      {/* Economy summary */}
      <div className="card mb-6 !border-blue-200 !bg-blue-50">
        <h2 className="text-sm font-semibold text-blue-900 mb-1">Economy Summary</h2>
        <p className="text-xs text-blue-700">
          Currency: Coins. Rs 1 = {values.coins_per_rupee || '10'} Coins.
          Readers earn coins by reading content. Minimum withdrawal threshold is{' '}
          {values.min_withdrawal_coins || '400'} coins (Rs{' '}
          {(parseFloat(values.min_withdrawal_coins || '400') / coinsPerRupee).toFixed(2)}).
        </p>
      </div>

      {/* Editable form */}
      <div className="max-w-2xl space-y-4">
        {rewardSettings.map((setting) => (
          <div key={setting.key} className="card">
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
                <span className="text-xs text-gray-400 w-20">{setting.suffix}</span>
              </div>
            </div>
            {/* INR conversion preview */}
            {setting.key !== 'coins_per_rupee' && setting.key !== 'min_withdrawal_coins' && (
              <p className="text-[11px] text-gray-400 mt-2">
                = Rs {(parseFloat(values[setting.key] || '0') / coinsPerRupee).toFixed(2)} equivalent
              </p>
            )}
            {setting.key === 'min_withdrawal_coins' && (
              <p className="text-[11px] text-gray-400 mt-2">
                = Rs {(parseFloat(values.min_withdrawal_coins || '0') / coinsPerRupee).toFixed(2)} minimum
              </p>
            )}
          </div>
        ))}

        {/* Save button */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Reward Settings'}
          </button>
          {message && (
            <span
              className={`text-sm ${
                message.includes('success') ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
