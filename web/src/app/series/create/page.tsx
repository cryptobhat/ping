'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { seriesApi, contentApi, uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Image, X, BookOpen, Loader2, Feather, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

const languages = [
  { code: 'kn', name: 'Kannada' },
  { code: 'hi', name: 'Hindi' },
  { code: 'en', name: 'English' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'mr', name: 'Marathi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ml', name: 'Malayalam' },
];

export default function CreateSeriesPage() {
  const router = useRouter();

  // Step tracking
  const [step, setStep] = useState<1 | 2>(1);
  const [createdSeriesId, setCreatedSeriesId] = useState<string | null>(null);

  // Step 1: Series details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('kn');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2: First episode
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [episodeBody, setEpisodeBody] = useState('');
  const [publishingEpisode, setPublishingEpisode] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadApi.upload(file);
      setCoverImage(data.url || data.data?.url);
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return toast.error('Please add a title');
    setSaving(true);
    try {
      const res = await seriesApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        language,
        coverImage: coverImage || undefined,
      });
      const newId = res.data?.data?.id ?? res.data?.id;
      if (!newId) {
        toast.error('Failed to create series');
        return;
      }
      setCreatedSeriesId(newId);
      setStep(2);
      toast.success('Series created! Now write your first episode.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create series');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishEpisode = async () => {
    if (!episodeTitle.trim()) return toast.error('Please add an episode title');
    if (!episodeBody.trim()) return toast.error('Please write some content');
    if (!createdSeriesId) return;

    setPublishingEpisode(true);
    try {
      // Create the content
      const contentRes = await contentApi.create({
        title: episodeTitle.trim(),
        body: episodeBody.trim(),
        contentType: 'STORY',
        visibility: 'PUBLIC',
        language,
        isDraft: false,
      });
      const contentId = contentRes.data?.data?.id ?? contentRes.data?.id;

      if (!contentId) {
        toast.error('Failed to publish episode');
        return;
      }

      // Link content to series
      await seriesApi.addItem(createdSeriesId, contentId);

      toast.success('First episode published! Redirecting to your series...');
      router.push(`/series/${createdSeriesId}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to publish episode');
    } finally {
      setPublishingEpisode(false);
    }
  };


  return (
    <div className="px-4 lg:px-6 py-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/create"
          className="p-2.5 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-warm-600 dark:text-warm-400" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-warm-900 dark:text-warm-50">Create Series</h1>
            <p className="text-xs text-warm-500">
              {step === 1 ? 'Step 1: Series details' : 'Step 2: Write your first episode'}
            </p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
          step === 1
            ? 'bg-primary text-white'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        )}>
          {step === 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>1</span>}
          <span>Series Info</span>
        </div>
        <div className="flex-1 h-px bg-warm-200 dark:bg-warm-700" />
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
          step === 2
            ? 'bg-primary text-white'
            : 'bg-warm-100 dark:bg-warm-800 text-warm-400'
        )}>
          <span>2</span>
          <span>First Episode</span>
        </div>
      </div>

      {/* Step 1: Series Details */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
              Cover Image
            </label>
            {coverImage ? (
              <div className="relative rounded-2xl overflow-hidden aspect-[2/1]">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={() => setCoverImage(null)}
                  className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-warm-200 dark:border-warm-700 rounded-2xl py-10 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                {uploading ? (
                  <Loader2 className="w-7 h-7 text-warm-400 animate-spin" />
                ) : (
                  <Image className="w-7 h-7 text-warm-400" />
                )}
                <span className="text-sm text-warm-500">
                  {uploading ? 'Uploading...' : 'Add cover image'}
                </span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your series a name..."
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-warm-400 transition-shadow"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this series about?"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 text-sm outline-none resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-warm-400 transition-shadow"
            />
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
              Language
            </label>
            <div className="flex gap-2 flex-wrap">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    language === lang.code
                      ? 'bg-primary text-white'
                      : 'bg-warm-100 dark:bg-warm-800 text-warm-600 dark:text-warm-400 hover:bg-warm-200 dark:hover:bg-warm-700'
                  )}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCreate}
              loading={saving}
            >
              Next: Write First Episode
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: First Episode */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Series created confirmation */}
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Series "{title}" created successfully
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                Add at least one episode to publish your series
              </p>
            </div>
          </div>

          {/* Episode title */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
              <div className="flex items-center gap-2">
                <Feather className="w-4 h-4 text-primary" />
                Episode Title <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              type="text"
              value={episodeTitle}
              onChange={(e) => setEpisodeTitle(e.target.value)}
              placeholder="Episode 1: ..."
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-warm-400 transition-shadow"
            />
          </div>

          {/* Episode body */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={episodeBody}
              onChange={(e) => setEpisodeBody(e.target.value)}
              placeholder="Start writing your first episode..."
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 dark:border-warm-700 bg-white dark:bg-warm-900 text-warm-900 dark:text-warm-100 text-sm outline-none resize-y focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-warm-400 transition-shadow leading-relaxed"
            />
            {episodeBody.trim() && (
              <p className="text-xs text-warm-400 mt-1.5">
                {episodeBody.trim().split(/\s+/).length} words ~ {Math.max(1, Math.ceil(episodeBody.trim().split(/\s+/).length / 200))} min read
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4">
            <Button
              variant="primary"
              className="w-full"
              onClick={handlePublishEpisode}
              loading={publishingEpisode}
            >
              Publish Episode & View Series
            </Button>
          </div>

          <p className="text-xs text-warm-400 text-center">
            You can always add more episodes from the series page later.
          </p>
        </div>
      )}
    </div>
  );
}
