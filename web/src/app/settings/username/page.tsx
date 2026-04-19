'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { userApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, AtSign, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChangeUsernamePage() {
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!username.trim() || username.length < 3) return toast.error('Username must be at least 3 characters');
    setSaving(true);
    try {
      await userApi.updateUsername(username.trim());
      await fetchUser();
      toast.success('Username updated!');
      router.back();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Username already taken');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 lg:px-6 py-6">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-warm-600" />
        </button>
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">Change Username</h1>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div>
          <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-1.5">Username</label>
          <div className="flex items-center gap-2 border border-warm-200 dark:border-warm-700 rounded-xl px-4 py-3 bg-white dark:bg-warm-900 focus-within:border-primary">
            <AtSign className="w-4 h-4 text-warm-400" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className="flex-1 bg-transparent text-warm-900 dark:text-warm-100 text-sm outline-none"
              maxLength={30}
            />
          </div>
          <p className="text-xs text-warm-400 mt-1">Only lowercase letters, numbers, and underscores</p>
        </div>

        <Button onClick={handleSave} loading={saving} className="w-full" size="lg" icon={<Save className="w-4 h-4" />}>
          Update Username
        </Button>
      </div>
    </div>
  );
}
