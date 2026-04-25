'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, MessageCircle, Bookmark, Share2, Eye, Star, Lock, BookOpen, Feather, FileText, Flag } from 'lucide-react';
import { cn, formatDate, formatNumber, readingTime, getContentTypeEmoji } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useState } from 'react';
import { contentApi, bookmarkApi } from '@/lib/api';
import { ReportContentModal } from '@/components/moderation/ReportContentModal';
import { stripHtml } from '@/lib/html-utils';

interface ContentCardProps {
  content: any;
  variant?: 'feed' | 'compact' | 'grid';
  rank?: number;
}

export function ContentCard({ content, variant = 'feed', rank }: ContentCardProps) {
  const [liked, setLiked] = useState(content.isLiked || false);
  const [likeCount, setLikeCount] = useState(content.likesCount || content._count?.likes || 0);
  const [bookmarked, setBookmarked] = useState(content.isBookmarked || false);
  const [reportOpen, setReportOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [coverImgError, setCoverImgError] = useState(false);

  const ContentTypeIcon = content.contentType === 'POEM' ? Feather : content.contentType === 'ARTICLE' ? FileText : BookOpen;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await contentApi.toggleLike(content.id);
      setLiked(!liked);
      setLikeCount((p: number) => liked ? p - 1 : p + 1);
    } catch {}
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (bookmarked) await bookmarkApi.remove(content.id);
      else await bookmarkApi.add(content.id);
      setBookmarked(!bookmarked);
    } catch {}
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({ title: content.title, url: `/content/${content.id}` });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/content/${content.id}`);
    }
  };

  const author = content.author || {};
  const wordCount =
    content.body?.split(/\s+/).filter(Boolean).length ||
    (typeof content.readTime === 'number' ? content.readTime * 200 : (content.excerpt || '').split(/\s+/).filter(Boolean).length) ||
    0;

  if (variant === 'compact') {
    return (
      <Link href={`/content/${content.id}`} className="group block">
        <div className="flex gap-4 p-4 rounded-2xl hover:bg-white dark:hover:bg-warm-900 transition-all duration-200 border border-transparent hover:border-warm-100 dark:hover:border-warm-800 hover:shadow-sm">
          {rank && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0 mt-1">
              {rank}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Avatar src={author.profileImage} name={author.name || 'User'} size="xs" />
              <span className="text-xs font-medium text-warm-700 dark:text-warm-300">{author.name}</span>
              <span className="text-[10px] text-warm-400">{formatDate(content.createdAt)}</span>
              {content.rating && (
                <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                  <Star className="w-2.5 h-2.5 fill-green-600" /> {content.rating}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-warm-900 dark:text-warm-100 mb-1 group-hover:text-primary transition-colors line-clamp-2">{content.title}</h3>
            <p className="text-sm text-warm-500 line-clamp-2">{content.excerpt || (content.body ? stripHtml(content.body).slice(0, 120) : '')}</p>
            <div className="flex items-center gap-3 mt-2.5 text-warm-400">
              <span className="flex items-center gap-1 text-xs"><Heart className={cn('w-3.5 h-3.5', liked && 'fill-primary text-primary')} />{formatNumber(likeCount)}</span>
              <span className="flex items-center gap-1 text-xs"><MessageCircle className="w-3.5 h-3.5" />{formatNumber(content.commentsCount || content._count?.comments || 0)}</span>
              <span className="flex items-center gap-1 text-xs"><Eye className="w-3.5 h-3.5" />{formatNumber(content.viewsCount || 0)}</span>
              <Badge variant={content.contentType?.toLowerCase() as any} size="sm">{getContentTypeEmoji(content.contentType)} {content.contentType}</Badge>
              {content.membersOnly && (
                <span className="flex items-center gap-0.5 text-[10px] text-violet-600 dark:text-violet-400 font-medium bg-violet-50 dark:bg-violet-950/30 px-1.5 py-0.5 rounded-full">
                  <Lock className="w-2.5 h-2.5" /> Members
                </span>
              )}
            </div>
          </div>
          <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative bg-warm-100 dark:bg-warm-800">
            {content.coverImage && !imgError ? (
              <Image
                src={content.coverImage}
                alt={(content.title || '').slice(0, 100)}
                fill
                sizes="96px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <ContentTypeIcon className="w-6 h-6 text-warm-300 dark:text-warm-500" />
              </div>
            )}
            {content.membersOnly && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-violet-500/90 flex items-center justify-center">
                <Lock className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'grid') {
    return (
      <>
        <Link href={`/content/${content.id}`} className="group block">
          <div className="bg-white dark:bg-warm-900 rounded-2xl overflow-hidden border border-warm-100 dark:border-warm-800 hover-lift relative">
            <div className="aspect-[2/1] overflow-hidden bg-warm-100 dark:bg-warm-800 relative">
              {content.coverImage && !imgError ? (
                <Image
                  src={content.coverImage}
                  alt={(content.title || '').slice(0, 100)}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <ContentTypeIcon className="w-8 h-8 text-warm-300 dark:text-warm-500" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={content.contentType?.toLowerCase() as any} size="sm">
                  {getContentTypeEmoji(content.contentType)} {content.contentType}
                </Badge>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReportOpen(true); }}
                  aria-label="Report content"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-warm-300 dark:text-warm-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Flag className="w-3 h-3" />
                </button>
              </div>
              <h3 className="font-semibold text-warm-900 dark:text-warm-100 mb-1 line-clamp-2 group-hover:text-primary transition-colors">{content.title}</h3>
              <p className="text-xs text-warm-500 line-clamp-2 mb-3">{content.excerpt || (content.body ? stripHtml(content.body).slice(0, 100) : '')}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar src={author.profileImage} name={author.name || 'User'} size="xs" />
                  <span className="text-xs text-warm-600 dark:text-warm-400">{author.name}</span>
                </div>
                <span className="text-[10px] text-warm-400">{readingTime(wordCount)}</span>
              </div>
            </div>
          </div>
        </Link>
        <ReportContentModal contentId={content.id} open={reportOpen} onClose={() => setReportOpen(false)} />
      </>
    );
  }

  // Feed variant (default)
  return (
    <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 overflow-hidden hover:border-warm-200 dark:hover:border-warm-700 transition-all duration-200">
      {/* Author Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-2">
        <Link href={`/user/${author.username}`}>
          <Avatar src={author.profileImage} name={author.name || 'User'} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/user/${author.username}`} className="font-semibold text-sm text-warm-900 dark:text-warm-100 hover:text-primary transition-colors">
              {author.name}
            </Link>
            {author.isVerified && <span className="text-primary text-xs">✓</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-warm-400">
            <span>@{author.username}</span>
            <span>·</span>
            <span>{formatDate(content.createdAt)}</span>
            <span>·</span>
            <span>{readingTime(wordCount)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant={content.contentType?.toLowerCase() as any} size="sm">
            {getContentTypeEmoji(content.contentType)} {content.contentType}
          </Badge>
          {content.membersOnly && (
            <Badge variant="primary" size="sm" className="bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 hidden sm:flex">
              <Lock className="w-3 h-3 mr-0.5" /> Members
            </Badge>
          )}
          {content.membersOnly && (
            <div className="sm:hidden w-5 h-5 rounded-full bg-violet-500/90 flex items-center justify-center flex-shrink-0">
              <Lock className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <Link href={`/content/${content.id}`} className="block group">
        <div className="px-5 py-2">
          <h3 className="text-lg font-bold text-warm-900 dark:text-warm-50 group-hover:text-primary transition-colors mb-1">{content.title}</h3>
          <p className="text-sm text-warm-600 dark:text-warm-400 line-clamp-3 leading-relaxed">{content.excerpt || (content.body ? stripHtml(content.body).slice(0, 200) : '')}</p>
        </div>
        {content.coverImage && (
          <div className="mx-5 mt-2 rounded-xl overflow-hidden aspect-[2/1] bg-warm-100 dark:bg-warm-800 relative">
            {!coverImgError ? (
              <Image
                src={content.coverImage}
                alt={(content.title || '').slice(0, 100)}
                fill
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                onError={() => setCoverImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <ContentTypeIcon className="w-10 h-10 text-warm-300 dark:text-warm-500" />
              </div>
            )}
          </div>
        )}
      </Link>

      {/* Actions */}
      <div className="flex items-center justify-between px-5 py-2 mt-1">
        <div className="flex items-center gap-0.5">
          <button onClick={handleLike} aria-pressed={liked} aria-label={liked ? 'Unlike' : 'Like'} className={cn('flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg text-sm transition-all', liked ? 'text-primary bg-primary/5' : 'text-warm-500 hover:bg-warm-50 dark:hover:bg-warm-800')}>
            <Heart className={cn('w-4 h-4', liked && 'fill-primary')} />
            <span className="text-xs font-medium">{formatNumber(likeCount)}</span>
          </button>
          <Link href={`/content/${content.id}#comments`} className="flex items-center gap-1.5 px-3 min-h-[44px] rounded-lg text-sm text-warm-500 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs font-medium">{formatNumber(content.commentsCount || content._count?.comments || 0)}</span>
          </Link>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReportOpen(true); }}
            aria-label="Report content"
            className="flex items-center justify-center w-11 h-11 rounded-lg text-warm-300 dark:text-warm-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleBookmark} aria-pressed={bookmarked} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'} className={cn('flex items-center justify-center w-11 h-11 rounded-lg transition-all', bookmarked ? 'text-primary bg-primary/5' : 'text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800')}>
            <Bookmark className={cn('w-4 h-4', bookmarked && 'fill-primary')} />
          </button>
          <button onClick={handleShare} aria-label="Share this content" className="flex items-center justify-center w-11 h-11 rounded-lg text-warm-400 hover:bg-warm-50 dark:hover:bg-warm-800 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Report Modal */}
      <ReportContentModal
        contentId={content.id}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
