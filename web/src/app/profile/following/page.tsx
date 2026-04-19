'use client';

import { useEffect, useState } from 'react';
import { followApi } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FollowingPage() {
  const router = useRouter();
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowing();
  }, []);

  const loadFollowing = async () => {
    try {
      const { data } = await followApi.getFollowing({ limit: 50 });
      setFollowing(data?.data || data || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 lg:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-warm-600" />
        </button>
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">Following</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 p-3">
              <Skeleton className="w-11 h-11 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
            </div>
          ))}
        </div>
      ) : following.length === 0 ? (
        <EmptyState icon={Users} title="Not following anyone" description="Follow writers to see their content in your feed" />
      ) : (
        <div className="space-y-1">
          {following.map((f: any) => {
            const u = f.following || f;
            return (
              <Link key={u.id} href={`/user/${u.username}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-warm-50 dark:hover:bg-warm-900 transition-colors">
                <Avatar src={u.profileImage} name={u.name} size="md" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-warm-900 dark:text-warm-100">{u.name}</p>
                  <p className="text-xs text-warm-500">@{u.username}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
