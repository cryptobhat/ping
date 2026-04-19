'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ratingApi, userApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Star, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function RatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <RateForm />
    </Suspense>
  );
}

function RateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authorId = searchParams.get('authorId');

  const [author, setAuthor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadAuthor = useCallback(async () => {
    if (!authorId) return;
    setLoading(true);
    try {
      const { data } = await userApi.getByUsername(authorId);
      const user = data?.data ?? data;
      setAuthor(user);
    } catch {
      toast.error('Could not load author');
    } finally {
      setLoading(false);
    }
  }, [authorId]);

  useEffect(() => {
    if (!authorId) {
      router.replace('/');
      return;
    }
    loadAuthor();
  }, [authorId, loadAuthor, router]);

  const handleSubmit = async () => {
    if (!rating || !authorId) return;
    setSubmitting(true);
    try {
      await ratingApi.rate(authorId, { rating });
      setSubmitted(true);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authorId) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="px-4 py-16 max-w-sm mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50 mb-2">Thank you!</h1>
        <p className="text-sm text-warm-500 mb-6">
          Your rating has been submitted{author?.name ? ` for ${author.name}` : ''}.
        </p>
        <Button variant="primary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 max-w-sm mx-auto">
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-sm text-warm-500 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="bg-white dark:bg-warm-900 rounded-2xl border border-warm-100 dark:border-warm-800 p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Star className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50 mb-1">Rate</h1>

        {author && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <Avatar
              src={author.profileImage}
              name={author.name || author.username || 'Author'}
              size="sm"
            />
            <span className="text-sm font-medium text-warm-700 dark:text-warm-300">
              {author.name || author.username}
            </span>
          </div>
        )}

        {/* Star Rating */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={cn(
                  'w-10 h-10 transition-colors',
                  (hoveredStar || rating) >= star
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-warm-300 dark:text-warm-600'
                )}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p className="text-sm text-warm-500 mb-4">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        )}

        <Button
          variant="primary"
          className="w-full"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!rating}
        >
          Submit Rating
        </Button>
      </div>
    </div>
  );
}
