'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { userApi, contentApi, followApi, seriesApi, creatorApi, chatApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { ContentCard } from '@/components/content/ContentCard';
import { BookCard } from '@/components/content/BookCard';
import { Avatar } from '@/components/ui/Avatar';
import { FallbackImage } from '@/components/ui/FallbackImage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ContentCardSkeleton } from '@/components/ui/Skeleton';
import {
  BookOpen,
  Feather,
  FileText,
  CheckCircle,
  MessageCircle,
  UserPlus,
  UserMinus,
  UserX,
  Layers,
  Crown,
  Lock,
  Users,
} from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

const contentTabs = [
  { id: 'STORY', label: 'Stories', icon: BookOpen },
  { id: 'POEM', label: 'Poems', icon: Feather },
  { id: 'ARTICLE', label: 'Articles', icon: FileText },
  { id: 'SERIES', label: 'Series', icon: Layers },
];

export default function UserProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [content, setContent] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('STORY');
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState<any>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [messagingLoading, setMessagingLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    const un = typeof username === 'string' ? username : Array.isArray(username) ? username[0] : '';
    if (!un) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await userApi.getByUsername(un);
      const p = data?.data ?? data;
      setProfile(p && p.id ? p : null);
      setFollowing(!!p?.isFollowing);
      // Load creator subscription info if this user is a creator
      if (p?.id && p?.isCreator) {
        try {
          const { data: cData } = await creatorApi.getCreatorProfile(p.id);
          setCreatorInfo(cData?.data ?? cData);
        } catch {
          setCreatorInfo(null);
        }
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  const loadContent = useCallback(async () => {
    if (!profile?.id) return;
    setContentLoading(true);
    try {
      if (activeTab === 'SERIES') {
        const { data } = await seriesApi.list({ authorId: profile.id, limit: 24, page: 1 });
        const rows = data?.data ?? data ?? [];
        setContent(Array.isArray(rows) ? rows : []);
      } else {
        const { data } = await contentApi.getFeed({
          authorId: profile.id,
          contentType: activeTab,
          limit: 20,
        });
        const rows = data?.data ?? data ?? [];
        setContent(Array.isArray(rows) ? rows : []);
      }
    } catch {
      setContent([]);
    } finally {
      setContentLoading(false);
    }
  }, [activeTab, profile?.id]);

  useEffect(() => {
    setLoading(true);
    setProfile(null);
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (profile?.id) loadContent();
    else setContent([]);
  }, [loadContent, profile?.id]);

  const handleFollow = async () => {
    if (!profile?.id) return;
    try {
      if (following) await followApi.unfollow(profile.id);
      else await followApi.follow(profile.id);
      setFollowing(!following);
      setProfile((p: any) => ({
        ...p,
        followersCount: Math.max(0, (p.followersCount || 0) + (following ? -1 : 1)),
      }));
      toast.success(following ? 'Unfollowed' : 'Following!');
    } catch {
      toast.error('Could not update follow');
    }
  };

  const handleCreatorSubscribe = async () => {
    if (!profile?.id || !currentUser) return;
    setSubscribing(true);
    try {
      if (creatorInfo?.isSubscribed) {
        await creatorApi.unsubscribe(profile.id);
        setCreatorInfo((c: any) => ({ ...c, isSubscribed: false, subscriberCount: Math.max(0, (c?.subscriberCount || 1) - 1) }));
        toast.success('Unsubscribed');
      } else {
        await creatorApi.subscribe(profile.id);
        setCreatorInfo((c: any) => ({ ...c, isSubscribed: true, subscriberCount: (c?.subscriberCount || 0) + 1 }));
        toast.success('Subscribed! You now have access to members-only content.');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not update subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const handleMessage = async () => {
    if (!currentUser) {
      const un = typeof username === 'string' ? username : Array.isArray(username) ? username[0] : '';
      router.push(`/login?next=/user/${un}`);
      return;
    }
    if (!profile?.id) return;
    setMessagingLoading(true);
    try {
      const { data } = await chatApi.create({ userIds: [profile.id] });
      const conversation = data?.data ?? data;
      const conversationId = conversation?.id || conversation?.conversationId;
      if (conversationId) {
        router.push(`/chat/${conversationId}`);
      } else {
        router.push('/chat');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not start conversation');
    } finally {
      setMessagingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-8 space-y-4">
        <div className="skeleton h-32 rounded-2xl" />
        <div className="flex gap-4 items-end -mt-8 px-4">
          <div className="skeleton w-20 h-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-5 w-32" />
            <div className="skeleton h-3 w-20" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-4 py-16 max-w-md mx-auto">
        <EmptyState
          icon={UserX}
          title="Profile not found"
          description="This username does not exist or the profile is private."
        />
        <div className="text-center mt-6">
          <Link href="/discover" className="text-sm font-semibold text-primary hover:underline">
            Discover writers
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === profile.id;
  const tabMeta = contentTabs.find((t) => t.id === activeTab);

  return (
    <div className="pb-8">
      <div className="h-32 lg:h-40 bg-gradient-to-r from-primary/15 via-accent/10 to-primary/10 relative overflow-hidden">
        {profile.coverImage && (
          <FallbackImage
            src={profile.coverImage}
            alt=""
            className="w-full h-full object-cover"
            fallbackClassName="w-full h-full"
            fallbackIconClassName="w-0 h-0"
          />
        )}
      </div>
      <div className="px-4 lg:px-6 -mt-10 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          <Avatar src={profile.profileImage} name={profile.name} size="xl" border className="ring-4 ring-white dark:ring-warm-950" />
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">{profile.name}</h1>
              {profile.isVerified && <CheckCircle className="w-5 h-5 text-primary fill-primary/20" />}
              {profile.isPremium && (
                <Badge variant="warning" size="sm">
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-sm text-warm-500">@{profile.username}</p>
          </div>
        </div>
        {profile.bio && <p className="text-sm text-warm-600 dark:text-warm-400 mb-4">{profile.bio}</p>}
        <div className="flex items-center gap-6 mb-5">
          <div className="text-center">
            <p className="text-lg font-bold text-warm-900 dark:text-warm-50">{formatNumber(profile.contentCount ?? 0)}</p>
            <p className="text-xs text-warm-500">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-warm-900 dark:text-warm-50">{formatNumber(profile.followersCount ?? 0)}</p>
            <p className="text-xs text-warm-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-warm-900 dark:text-warm-50">{formatNumber(profile.followingCount ?? 0)}</p>
            <p className="text-xs text-warm-500">Following</p>
          </div>
        </div>
        {!isOwnProfile && (
          <div className="flex gap-2 mb-6">
            <Button
              variant={following ? 'outline' : 'primary'}
              size="sm"
              onClick={handleFollow}
              icon={following ? <UserMinus className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              className="flex-1"
            >
              {following ? 'Unfollow' : 'Follow'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMessage}
              loading={messagingLoading}
              icon={<MessageCircle className="w-3.5 h-3.5" />}
            >
              Message
            </Button>
          </div>
        )}
        {/* Creator Subscription Card */}
        {creatorInfo && creatorInfo.creatorPriceINR && !isOwnProfile && (
          <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 p-5 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-warm-900 dark:text-warm-50 text-sm">Creator Subscription</h3>
                <p className="text-xs text-warm-500">
                  {creatorInfo.subscriberCount || 0} subscriber{(creatorInfo.subscriberCount || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
                {'\u20B9'}{creatorInfo.creatorPriceINR}/mo
              </span>
            </div>
            <p className="text-xs text-warm-500 mb-3">Subscribe to access members-only stories, poems and articles.</p>
            <Button
              variant={creatorInfo.isSubscribed ? 'outline' : 'primary'}
              size="sm"
              className="w-full"
              onClick={handleCreatorSubscribe}
              disabled={subscribing}
              icon={creatorInfo.isSubscribed ? <Users className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            >
              {subscribing ? 'Processing...' : creatorInfo.isSubscribed ? 'Subscribed (Cancel)' : `Subscribe \u20B9${creatorInfo.creatorPriceINR}/month`}
            </Button>
          </div>
        )}
        <div className="flex gap-1 border-b border-warm-100 dark:border-warm-800 mb-4 overflow-x-auto scrollbar-hide">
          {contentTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                activeTab === id ? 'border-primary text-primary' : 'border-transparent text-warm-500 hover:text-warm-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
        {contentLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : content.length === 0 ? (
          <EmptyState
            icon={tabMeta?.icon || BookOpen}
            title={`No ${(tabMeta?.label || 'content').toLowerCase()} yet`}
            description="This writer has not published anything in this category yet."
          />
        ) : activeTab === 'SERIES' ? (
          <div className="flex flex-wrap gap-4">
            {content.map((s: any) => (
              <BookCard key={s.id} item={s} type="series" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {content.map((item: any) => (
              <ContentCard key={item.id} content={item} variant="compact" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
