'use client';

import { useEffect, useState } from 'react';
import { bookmarkApi, seriesApi, contentApi, readingApi } from '@/lib/api';
import { ContentCard } from '@/components/content/ContentCard';
import { BookCard } from '@/components/content/BookCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ContentCardSkeleton, BookCardSkeleton } from '@/components/ui/Skeleton';
import { BookOpen, Bookmark, Layers, Clock, FileText, Feather, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'bookmarks', label: 'Saved', icon: Bookmark, description: 'Your bookmarked stories, poems & articles' },
  { id: 'series', label: 'Series', icon: Layers, description: 'Series you follow' },
  { id: 'drafts', label: 'Drafts', icon: FileText, description: 'Your unpublished work' },
  { id: 'history', label: 'History', icon: Clock, description: 'Recently read content' },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('bookmarks');
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'bookmarks': {
          const { data } = await bookmarkApi.getAll({ page: 1, limit: 30 });
          setBookmarks(data?.data || data || []);
          break;
        }
        case 'series': {
          const { data } = await seriesApi.list({ limit: 30 });
          setSeries(data?.data || data || []);
          break;
        }
        case 'drafts': {
          const { data } = await contentApi.getDrafts({ page: 1, limit: 30 });
          setDrafts(data?.data || data || []);
          break;
        }
        case 'history': {
          const { data } = await readingApi.getHistory({ page: 1, limit: 30 });
          const sessions = data?.data || data || [];
          const mapped = (Array.isArray(sessions) ? sessions : []).map((s: any) => {
            const c = s.content;
            if (!c?.id) return null;
            return {
              id: s.id,
              content: {
                id: c.id,
                title: c.title,
                contentType: c.contentType,
                createdAt: s.endTime || s.updatedAt || s.createdAt,
                author: {},
              },
            };
          }).filter(Boolean);
          setHistory(mapped as any[]);
          break;
        }
      }
    } catch {
      if (activeTab === 'bookmarks') setBookmarks([]);
      if (activeTab === 'series') setSeries([]);
      if (activeTab === 'drafts') setDrafts([]);
      if (activeTab === 'history') setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const activeTabMeta = tabs.find(t => t.id === activeTab);

  const getActiveData = () => {
    switch (activeTab) {
      case 'bookmarks': return bookmarks;
      case 'series': return series;
      case 'drafts': return drafts;
      case 'history': return history;
      default: return [];
    }
  };

  const data = getActiveData();

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-warm-900 dark:text-warm-50">
              My Library
            </h1>
            <p className="text-sm text-warm-500 mt-0.5">
              {activeTabMeta?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop: Sidebar Tabs + Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Tabs - horizontal on mobile, vertical sidebar on desktop */}
        <div className="lg:w-56 flex-shrink-0">
          {/* Mobile: horizontal pill tabs */}
          <div className="flex lg:hidden gap-1 p-1 bg-warm-100 dark:bg-warm-800 rounded-xl mb-1 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-w-fit px-3',
                  activeTab === id
                    ? 'bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 shadow-sm'
                    : 'text-warm-500 hover:text-warm-700 dark:hover:text-warm-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Desktop: vertical sidebar tabs */}
          <nav className="hidden lg:flex flex-col gap-1 sticky top-24">
            {tabs.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 w-full',
                  activeTab === id
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-warm-600 dark:text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800/50'
                )}
              >
                <Icon className={cn('w-5 h-5', activeTab === id ? 'text-primary' : 'text-warm-400')} />
                <div>
                  <span className="text-sm block">{label}</span>
                  <span className="text-[10px] text-warm-400 block mt-0.5">{description}</span>
                </div>
              </button>
            ))}

            {/* Stats in sidebar */}
            <div className="mt-4 p-4 bg-warm-50 dark:bg-warm-900 rounded-xl border border-warm-100 dark:border-warm-800">
              <p className="text-xs font-medium text-warm-500 mb-3 uppercase tracking-wide">Quick Stats</p>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-warm-500 flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5" /> Saved</span>
                  <span className="font-semibold text-warm-900 dark:text-warm-100">{bookmarks.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warm-500 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Series</span>
                  <span className="font-semibold text-warm-900 dark:text-warm-100">{series.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warm-500 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Drafts</span>
                  <span className="font-semibold text-warm-900 dark:text-warm-100">{drafts.length}</span>
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                activeTab === 'series'
                  ? <BookCardSkeleton key={i} />
                  : <ContentCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {/* Bookmarks Tab */}
              {activeTab === 'bookmarks' && (
                data.length === 0 ? (
                  <EmptyState
                    icon={Bookmark}
                    title="No saved content"
                    description="Bookmark stories, poems, and articles to read later"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.map((b: any) => (
                      <ContentCard key={b.id} content={b.content || b} variant="grid" />
                    ))}
                  </div>
                )
              )}

              {/* Series Tab */}
              {activeTab === 'series' && (
                data.length === 0 ? (
                  <EmptyState
                    icon={Layers}
                    title="No series yet"
                    description="Follow your favorite series to see them here"
                  />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {data.map((s: any) => (
                      <BookCard key={s.id} item={s} type="series" />
                    ))}
                  </div>
                )
              )}

              {/* Drafts Tab */}
              {activeTab === 'drafts' && (
                data.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No drafts"
                    description="Your unpublished work will appear here"
                    actionLabel="Write a story"
                    onAction={() => window.location.href = '/create'}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.map((d: any) => (
                      <ContentCard key={d.id} content={d} variant="grid" />
                    ))}
                  </div>
                )
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                data.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title="No reading history"
                    description="Content you read will appear here"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.map((h: any) => (
                      <ContentCard key={h.id} content={h.content || h} variant="grid" />
                    ))}
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
