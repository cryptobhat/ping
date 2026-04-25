'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { liveApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Radio, Mic, Users, Clock, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LiveRoom {
  id: string;
  hostId: string;
  hostName: string;
  hostImage?: string;
  title: string;
  contentId?: string;
  contentTitle?: string;
  listenerCount: number;
  startedAt: string;
  isActive: boolean;
}

export default function LiveRoomsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchRooms = async () => {
    try {
      const res = await liveApi.listRooms();
      setRooms(res.data.data || []);
    } catch {
      // Silently handle — empty rooms is fine
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    // Poll every 10 seconds for room updates
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title for your live reading');
      return;
    }
    setCreating(true);
    try {
      const res = await liveApi.createRoom({ title: title.trim() });
      const room = res.data.data;
      router.push(`/live/${room.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const timeSince = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just started';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Radio className="w-5 h-5 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50">Live Readings</h1>
          </div>
          <p className="text-sm text-warm-500 ml-[52px]">
            Authors reading their stories live. Listen, react, and connect.
          </p>
        </div>
        {isAuthenticated && (
          <Button
            variant="primary"
            onClick={() => setShowCreate(!showCreate)}
            icon={<Mic className="w-4 h-4" />}
          >
            Go Live
          </Button>
        )}
      </div>

      {/* Create Room Panel */}
      {showCreate && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200/50 dark:border-red-800/30 animate-slide-up">
          <h3 className="font-semibold text-warm-900 dark:text-warm-100 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Start a Live Reading
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What will you be reading today?"
              className="flex-1 px-4 py-2.5 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 text-sm placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={100}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={creating || !title.trim()}
            >
              {creating ? 'Creating...' : 'Start'}
            </Button>
          </div>
          <p className="text-xs text-warm-400 mt-2">
            You can also start a live reading from any of your published stories.
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Room List */}
      {!loading && rooms.length > 0 && (
        <div className="space-y-3">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => router.push(`/live/${room.id}`)}
              className="w-full text-left p-5 rounded-2xl bg-white dark:bg-warm-900 border border-warm-100 dark:border-warm-800 hover:border-red-200 dark:hover:border-red-800/50 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <Avatar src={room.hostImage} name={room.hostName} size="md" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-warm-900 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-warm-900 dark:text-warm-100 group-hover:text-primary transition-colors truncate">
                        {room.title}
                      </h3>
                      <p className="text-sm text-warm-500 mt-0.5">{room.hostName}</p>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-300 text-xs font-medium flex-shrink-0">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      LIVE
                    </div>
                  </div>
                  {room.contentTitle && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-warm-400">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="truncate">Reading: {room.contentTitle}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2.5">
                    <span className="flex items-center gap-1 text-xs text-warm-400">
                      <Users className="w-3.5 h-3.5" />
                      {room.listenerCount} listening
                    </span>
                    <span className="flex items-center gap-1 text-xs text-warm-400">
                      <Clock className="w-3.5 h-3.5" />
                      {timeSince(room.startedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && rooms.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-warm-100 dark:bg-warm-800 flex items-center justify-center mx-auto mb-6">
            <Radio className="w-10 h-10 text-warm-300 dark:text-warm-600" />
          </div>
          <h2 className="text-xl font-bold text-warm-900 dark:text-warm-100 mb-2">
            No one is live right now
          </h2>
          <p className="text-warm-500 mb-6 max-w-sm mx-auto">
            Be the first to go live and read your stories to an audience. Your fans will love it!
          </p>
          {isAuthenticated ? (
            <Button
              variant="primary"
              onClick={() => setShowCreate(true)}
              icon={<Mic className="w-4 h-4" />}
            >
              Start a Live Reading
            </Button>
          ) : (
            <Button variant="outline" onClick={() => router.push('/login')}>
              Sign in to Go Live
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
