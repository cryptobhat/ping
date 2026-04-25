'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { contentApi, seriesApi, uploadApi, categoryApi, aiApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  PenTool, BookOpen, Feather, FileText, Image, X, Eye, Send,
  ChevronDown, Globe, Lock, Users, Sparkles, ArrowLeft, Library, Tag, Coins, Wand2,
  Undo2, Redo2, Bold, Italic, Heading2, List, Quote, LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getReadingLang } from '@/lib/reading-lang';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { RichEditor } from '@/components/editor/RichEditor';

// --- Draft auto-save helpers ---
const DRAFT_KEY_PREFIX = 'kalaloka_draft_';

interface DraftData {
  title: string;
  body: string;
  coverImage: string | null;
  categoryId: string;
  description: string;
  visibility: string;
  contentType: string;
  savedAt: number;
}

function saveDraft(contentType: string, data: Omit<DraftData, 'savedAt'>) {
  try {
    const key = DRAFT_KEY_PREFIX + (contentType || 'UNKNOWN');
    const draft: DraftData = { ...data, savedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch { return false; }
}

function loadDraft(contentType: string): DraftData | null {
  try {
    const key = DRAFT_KEY_PREFIX + (contentType || 'UNKNOWN');
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as DraftData;
  } catch { return null; }
}

function clearDraft(contentType: string) {
  try {
    const key = DRAFT_KEY_PREFIX + (contentType || 'UNKNOWN');
    localStorage.removeItem(key);
  } catch {}
}

// --- Undo/Redo history manager ---
interface HistoryState {
  past: string[];
  future: string[];
}

// --- Markdown formatting helpers ---
function applyMarkdownFormat(
  textarea: HTMLTextAreaElement,
  format: 'bold' | 'italic' | 'heading' | 'bullet' | 'quote' | 'link',
  body: string,
  setBody: (v: string) => void,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = body.substring(start, end);
  let before = body.substring(0, start);
  let after = body.substring(end);
  let replacement = selected;
  let cursorOffset = 0;

  switch (format) {
    case 'bold':
      replacement = `**${selected || 'bold text'}**`;
      cursorOffset = selected ? replacement.length : 2; // place cursor inside
      break;
    case 'italic':
      replacement = `*${selected || 'italic text'}*`;
      cursorOffset = selected ? replacement.length : 1;
      break;
    case 'heading': {
      // Find start of current line
      const lineStart = before.lastIndexOf('\n') + 1;
      const linePrefix = before.substring(lineStart);
      before = before.substring(0, lineStart);
      replacement = `## ${linePrefix}${selected}`;
      cursorOffset = replacement.length;
      break;
    }
    case 'bullet': {
      const lineStart = before.lastIndexOf('\n') + 1;
      const linePrefix = before.substring(lineStart);
      before = before.substring(0, lineStart);
      replacement = `- ${linePrefix}${selected}`;
      cursorOffset = replacement.length;
      break;
    }
    case 'quote': {
      const lineStart = before.lastIndexOf('\n') + 1;
      const linePrefix = before.substring(lineStart);
      before = before.substring(0, lineStart);
      replacement = `> ${linePrefix}${selected}`;
      cursorOffset = replacement.length;
      break;
    }
    case 'link':
      if (selected) {
        replacement = `[${selected}](url)`;
        cursorOffset = replacement.length - 1; // place before closing paren
      } else {
        replacement = '[link text](url)';
        cursorOffset = 1; // after [
      }
      break;
  }

  const newBody = before + replacement + after;
  setBody(newBody);

  // Restore focus and cursor position after React re-render
  requestAnimationFrame(() => {
    textarea.focus();
    const pos = before.length + cursorOffset;
    textarea.setSelectionRange(pos, pos);
  });
}

const contentTypes = [
  { value: 'STORY', label: 'Story', emoji: '📖', icon: BookOpen, color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800', textColor: 'text-orange-600', desc: 'Share a narrative with readers' },
  { value: 'POEM', label: 'Poem', emoji: '🪶', icon: Feather, color: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800', textColor: 'text-rose-600', desc: 'Express feelings through verse' },
  { value: 'ARTICLE', label: 'Article', emoji: '📰', icon: FileText, color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', textColor: 'text-emerald-600', desc: 'Write informative long-form content' },
];

const visibilityOptions = [
  { value: 'PUBLIC', label: 'Public', icon: Globe, desc: 'Everyone can read' },
  { value: 'FOLLOWERS', label: 'Followers Only', icon: Users, desc: 'Only your followers' },
  { value: 'PRIVATE', label: 'Private', icon: Lock, desc: 'Only you can see' },
];


function CreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const seriesId = searchParams.get('seriesId');
  const editId = searchParams.get('editId');
  const topicParam = searchParams.get('topic');
  const [seriesInfo, setSeriesInfo] = useState<any>(null);
  const [step, setStep] = useState<'type' | 'editor'>(editId ? 'editor' : 'type');
  const [contentType, setContentType] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [visibility, setVisibility] = useState('PUBLIC');
  const [language, setLanguage] = useState(() => getReadingLang() || 'kn');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [membersOnly, setMembersOnly] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [aiAssistEnabled, setAiAssistEnabled] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false);
  const [descriptionGenerating, setDescriptionGenerating] = useState(false);
  const [editLoading, setEditLoading] = useState(!!editId);
  const [editTitle, setEditTitle] = useState('');
  const isEditing = !!editId;
  const fileRef = useRef<HTMLInputElement>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // --- Auto-save draft state ---
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);

  // --- Undo/Redo state ---
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHistoryBody = useRef<string>('');

  // Push body state to history (debounced, called from handleBodyChange)
  const pushHistory = useCallback((currentBody: string) => {
    if (currentBody === lastHistoryBody.current) return;
    setHistory(prev => ({
      past: [...prev.past.slice(-50), lastHistoryBody.current], // keep max 50
      future: [],
    }));
    lastHistoryBody.current = currentBody;
  }, []);

  const handleUndo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const newPast = [...prev.past];
      const restored = newPast.pop()!;
      const newFuture = [lastHistoryBody.current, ...prev.future];
      lastHistoryBody.current = restored;
      setBody(restored);
      return { past: newPast, future: newFuture };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const newFuture = [...prev.future];
      const restored = newFuture.shift()!;
      const newPast = [...prev.past, lastHistoryBody.current];
      lastHistoryBody.current = restored;
      setBody(restored);
      return { past: newPast, future: newFuture };
    });
  }, []);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    if (step === 'editor') {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [step, handleUndo, handleRedo]);

  // --- Restore draft on entering editor step ---
  useEffect(() => {
    if (step !== 'editor' || isEditing || draftRestored || !contentType) return;
    const draft = loadDraft(contentType);
    if (draft && draft.savedAt && (Date.now() - draft.savedAt < 24 * 60 * 60 * 1000)) {
      // Only restore if there is actual content and user hasn't typed yet
      if ((draft.title || draft.body) && !title.trim() && !body.trim()) {
        setTitle(draft.title || '');
        setBody(draft.body || '');
        setCoverImage(draft.coverImage || null);
        setCategoryId(draft.categoryId || '');
        setDescription(draft.description || '');
        setVisibility(draft.visibility || 'PUBLIC');
        lastHistoryBody.current = draft.body || '';
        const ago = Math.round((Date.now() - draft.savedAt) / 60000);
        toast.success(`Draft restored (saved ${ago < 1 ? 'just now' : ago + 'm ago'})`);
      }
    }
    setDraftRestored(true);
  }, [step, contentType, isEditing, draftRestored, title, body]);

  // --- Pre-fill title from daily topic URL param ---
  useEffect(() => {
    if (topicParam && step === 'editor' && !title.trim() && !isEditing) {
      setTitle(decodeURIComponent(topicParam));
    }
  }, [topicParam, step, isEditing]);

  // --- Debounced auto-save on content change (every 5 seconds) ---
  useEffect(() => {
    if (step !== 'editor' || isEditing) return;
    if (!title.trim() && !body.trim()) return;

    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const saved = saveDraft(contentType, { title, body, coverImage, categoryId, description, visibility, contentType });
      if (saved) setDraftSavedAt(Date.now());
    }, 5000);

    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [title, body, coverImage, categoryId, description, visibility, contentType, step, isEditing]);

  // --- Periodic auto-save every 30 seconds ---
  useEffect(() => {
    if (step !== 'editor' || isEditing) return;

    autoSaveIntervalRef.current = setInterval(() => {
      if (!title.trim() && !body.trim()) return;
      const saved = saveDraft(contentType, { title, body, coverImage, categoryId, description, visibility, contentType });
      if (saved) setDraftSavedAt(Date.now());
    }, 30000);

    return () => { if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current); };
  }, [title, body, coverImage, categoryId, description, visibility, contentType, step, isEditing]);

  // Auto-save on any navigation attempt (desktop only — mobile relies on auto-save)
  useEffect(() => {
    if (step !== 'editor' || isEditing) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (title.trim() || body.trim()) {
        saveDraft(contentType, { title, body, coverImage, categoryId, description, visibility, contentType });
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [step, isEditing, title, body]);

  // AI Writing Assistant: fetch suggestion after 2s of inactivity
  const fetchAiSuggestion = useCallback(async (currentBody: string) => {
    if (!aiAssistEnabled || !contentType || currentBody.trim().length < 20) {
      setAiSuggestion('');
      return;
    }
    setAiSuggestionLoading(true);
    try {
      const { data } = await aiApi.suggest({
        text: currentBody.trim(),
        contentType,
        language,
      });
      const suggestion = data?.data?.suggestion || data?.suggestion || '';
      setAiSuggestion(suggestion);
    } catch {
      setAiSuggestion('');
    } finally {
      setAiSuggestionLoading(false);
    }
  }, [aiAssistEnabled, contentType, language]);

  const handleBodyChange = (newBody: string) => {
    setBody(newBody);
    setAiSuggestion(''); // Clear old suggestion on new input

    // Debounce history push: save undo state after 1s pause
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(() => pushHistory(newBody), 1000);

    // Debounce AI suggestion: wait 2s after user stops typing
    // Strip HTML tags for AI suggestion length check
    const plainText = newBody.replace(/<[^>]*>/g, '');
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (aiAssistEnabled && plainText.trim().length >= 20) {
      aiTimerRef.current = setTimeout(() => fetchAiSuggestion(newBody), 2000);
    }
  };

  // Generate description via AI
  const handleGenerateDescription = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Add a title and some content first');
      return;
    }
    setDescriptionGenerating(true);
    try {
      const { data } = await aiApi.generateDescription({
        title: title.trim(),
        body: body.trim(),
        contentType: contentType || 'STORY',
      });
      const desc = data?.data?.description || data?.description || '';
      if (desc) {
        setDescription(desc);
        toast.success('Description generated!');
      } else {
        toast.error('Could not generate description');
      }
    } catch {
      toast.error('Failed to generate description');
    } finally {
      setDescriptionGenerating(false);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    };
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    categoryApi.getAll().then(({ data }) => {
      const list = data?.data ?? data ?? [];
      setCategories(Array.isArray(list) ? list.filter((c: any) => c.isActive !== false) : []);
    }).catch(() => {});
  }, []);

  // Fetch series info when creating a chapter
  useEffect(() => {
    if (seriesId) {
      seriesApi.getById(seriesId).then(({ data }) => {
        const s = data?.data ?? data;
        setSeriesInfo(s);
        if (s?.language) setLanguage(s.language);
        // Inherit category from series so episodes don't need to pick one
        if (s?.categoryId) setCategoryId(s.categoryId);
      }).catch(() => {});
      // Auto-select STORY for series episodes and skip type selection
      if (!editId) {
        setContentType('STORY');
        setStep('editor');
      }
    }
  }, [seriesId, editId]);

  // Load existing content when editing
  useEffect(() => {
    if (!editId) return;
    setEditLoading(true);
    contentApi.getById(editId).then(({ data }) => {
      const c = data?.data ?? data;
      if (c) {
        setTitle(c.title || '');
        setEditTitle(c.title || '');
        setBody(c.body || '');
        setContentType(c.contentType || 'STORY');
        setCoverImage(c.coverImage || null);
        setVisibility(c.visibility || 'PUBLIC');
        setLanguage(c.language || 'kn');
        setCategoryId(c.categoryId || '');
        setUnlockPrice(c.unlockPrice ? String(c.unlockPrice) : '');
        setMembersOnly(!!c.membersOnly);
        setDescription(c.description || '');
        setStep('editor');
      }
    }).catch(() => {
      toast.error('Failed to load content for editing');
    }).finally(() => {
      setEditLoading(false);
    });
  }, [editId]);

  const handleTypeSelect = (type: string) => {
    setContentType(type);
    setStep('editor');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadApi.upload(file);
      console.log('[ImageUpload] Full response:', JSON.stringify(res.data, null, 2));
      const uploadData = res.data?.data ?? res.data;
      let imageUrl = uploadData?.url || uploadData?.urls?.[0] || uploadData?.imageUrl || uploadData?.path || '';
      // Fix localhost URLs — replace with API domain
      if (imageUrl && imageUrl.includes('localhost')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://kavi-api.digiyogi.com';
        imageUrl = imageUrl.replace(/https?:\/\/localhost:\d+/, apiUrl);
      }
      // Fix relative URLs — prepend API domain
      if (imageUrl && imageUrl.startsWith('/uploads')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://kavi-api.digiyogi.com';
        imageUrl = `${apiUrl}${imageUrl}`;
      }
      if (imageUrl) {
        setCoverImage(imageUrl);
        toast.success('Cover image uploaded!');
      } else {
        toast.error('Upload failed — please try again');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || '';
      if (msg.includes('file')) {
        toast.error('File too large (max 5MB) or invalid format. Use JPG, PNG, or WebP.');
      } else {
        toast.error(msg || 'Upload failed — check your internet connection');
      }
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const publish = async (isDraft = false) => {
    if (!title.trim()) return toast.error('Please add a title');
    if (!body.trim()) return toast.error('Please add content');
    if (!isDraft && !categoryId && !seriesId) return toast.error('Please select a category before publishing');

    isDraft ? setSaving(true) : setPublishing(true);
    try {
      const parsedUnlockPrice = parseInt(unlockPrice);
      const payload = {
        title: title.trim(),
        body: body.trim(),
        contentType,
        coverImage,
        categoryId: categoryId || undefined,
        visibility: isDraft ? 'PRIVATE' : visibility,
        language,
        isDraft,
        membersOnly: isDraft ? false : membersOnly,
        unlockPrice: (!isDraft && visibility === 'PUBLIC' && parsedUnlockPrice > 0) ? parsedUnlockPrice : undefined,
        description: description.trim() || undefined,
      };

      if (isEditing) {
        // Update existing content
        await contentApi.update(editId!, payload);
        clearDraft(contentType);
        toast.success('Content updated!');
        router.push(`/content/${editId}`);
        return;
      }

      // Create new content
      const res = await contentApi.create(payload);
      const contentId = res.data?.data?.id ?? res.data?.id;

      // If creating a chapter within a series, link it
      if (seriesId && contentId && !isDraft) {
        try {
          await seriesApi.addItem(seriesId, contentId);
          // Count episodes for the toast
          const episodeNum = (seriesInfo?.items?.length || 0) + 1;
          clearDraft(contentType);
          toast.success(`Episode ${episodeNum} published!`);
          router.push(`/series/${seriesId}`);
          return;
        } catch (linkErr: any) {
          console.error('Failed to link to series:', linkErr);
          toast.error('Published but could not link to series');
        }
      }

      // Clear localStorage draft after successful publish/save
      if (!isDraft) {
        clearDraft(contentType);
      }
      toast.success(isDraft ? 'Saved as draft!' : 'Published successfully!');
      router.push(seriesId ? `/series/${seriesId}` : isDraft ? '/library' : '/');
    } catch (e: any) {
      toast.error(e.response?.data?.message || (isEditing ? 'Failed to update' : 'Failed to publish'));
    } finally {
      setPublishing(false);
      setSaving(false);
    }
  };

  // Loading state when fetching content for editing
  if (editLoading) {
    return (
      <div className="px-4 py-16 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-warm-500">Loading content...</p>
      </div>
    );
  }

  // Type Selection Step
  if (step === 'type') {
    return (
      <div className="px-4 lg:px-6 py-8">
        {seriesId && seriesInfo && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                <Library className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-violet-500 dark:text-violet-400">Adding chapter to series</p>
                <p className="text-sm font-bold text-violet-900 dark:text-violet-100 truncate">{seriesInfo.title}</p>
              </div>
            </div>
          </div>
        )}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <PenTool className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-warm-900 dark:text-warm-50 mb-2">
            {seriesId ? 'What type of chapter?' : 'What would you like to write?'}
          </h1>
          <p className="text-sm text-warm-500">Choose a format that best fits your creative expression</p>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          {contentTypes.map(({ value, label, emoji, icon: Icon, color, textColor, desc }) => (
            <button
              key={value}
              onClick={() => handleTypeSelect(value)}
              className={cn('w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] text-left', color)}
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-2xl')}>
                {emoji}
              </div>
              <div className="flex-1">
                <h3 className={cn('font-bold text-lg', textColor)}>{label}</h3>
                <p className="text-sm text-warm-500">{desc}</p>
              </div>
              <ChevronDown className="w-5 h-5 text-warm-300 -rotate-90" />
            </button>
          ))}

          {/* Series — prominent card like the content types */}
          <Link
            href="/series/create"
            className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] text-left"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl">📚</div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-violet-600">Series</h3>
              <p className="text-sm text-warm-500">Multi-chapter story with episodes</p>
            </div>
            <ChevronDown className="w-5 h-5 text-warm-300 -rotate-90" />
          </Link>
        </div>

        <div className="flex justify-center mt-6">
          <Link href="/content/drafts" className="text-sm text-warm-500 hover:text-primary transition-colors">
            My Drafts →
          </Link>
        </div>
      </div>
    );
  }

  // Editor Step
  const typeInfo = contentTypes.find((t) => t.value === contentType)!;
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen pb-28 lg:pb-8">
      {/* Editor Header */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-warm-950/95 backdrop-blur-xl border-b border-warm-100 dark:border-warm-800">
        <div className="flex items-center justify-between px-3 lg:px-6 h-12 lg:h-14">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isEditing) {
                  router.back();
                } else {
                  // Auto-save draft before leaving — user never loses content
                  if (title.trim() || body.trim()) {
                    saveDraft(contentType, { title, body, coverImage, categoryId, description, visibility, contentType });
                    toast.success('Draft saved automatically');
                  }
                  setStep('type');
                }
              }}
              className="p-2 hover:bg-warm-100 dark:hover:bg-warm-800 rounded-lg transition-colors -ml-1"
            >
              <ArrowLeft className="w-5 h-5 text-warm-600" />
            </button>
            {isEditing ? (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                Editing
              </span>
            ) : (
              <span className="text-xs text-warm-400">{typeInfo?.emoji} {wordCount}w</span>
            )}
            {/* Undo / Redo buttons */}
            <div className="flex items-center gap-0.5 ml-1 border-l border-warm-200 dark:border-warm-700 pl-2">
              <button
                onClick={handleUndo}
                disabled={history.past.length === 0}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  history.past.length > 0
                    ? 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'
                    : 'text-warm-300 dark:text-warm-700 cursor-not-allowed'
                )}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={history.future.length === 0}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  history.future.length > 0
                    ? 'text-warm-600 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-warm-800'
                    : 'text-warm-300 dark:text-warm-700 cursor-not-allowed'
                )}
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
            {/* Draft saved indicator */}
            {draftSavedAt && !isEditing && (
              <span className="text-[10px] text-emerald-500 dark:text-emerald-400 ml-1 animate-in fade-in duration-300">
                Draft saved
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setAiAssistEnabled(!aiAssistEnabled);
                if (aiAssistEnabled) setAiSuggestion('');
              }}
              className={cn(
                'p-2 rounded-lg transition-all',
                aiAssistEnabled
                  ? 'bg-violet-50 text-violet-600'
                  : 'text-warm-400 hover:text-warm-600'
              )}
              title={aiAssistEnabled ? 'AI Assist ON' : 'AI Assist OFF'}
            >
              <Wand2 className="w-4 h-4" />
            </button>
            {!isEditing && (
              <Button variant="ghost" size="sm" onClick={() => publish(true)} loading={saving} className="text-xs px-2">
                Save draft
              </Button>
            )}
            <Button size="sm" onClick={() => publish(false)} loading={publishing} icon={<Send className="w-3.5 h-3.5" />}>
              {isEditing ? 'Save changes' : 'Publish story'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8">
        {/* Series context banner */}
        {seriesInfo && !isEditing && (
          <div className="mb-6 p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                <Library className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-violet-500 dark:text-violet-400">Writing new episode for</p>
                <p className="text-sm font-bold text-violet-900 dark:text-violet-100 truncate">{seriesInfo.title}</p>
                {seriesInfo.items && (
                  <p className="text-xs text-violet-400 mt-0.5">This will be Episode {(seriesInfo.items.length || 0) + 1}</p>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Cover Image */}
        <div className="mb-6">
          {coverImage ? (
            <div className="relative rounded-2xl overflow-hidden aspect-[2/1]">
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              <button onClick={() => setCoverImage(null)} className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-warm-200 dark:border-warm-700 rounded-2xl py-10 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <Image className="w-7 h-7 text-warm-400" />
              <span className="text-sm text-warm-500">Add cover image</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        {/* Daily Topic Badge */}
        {topicParam && (
          <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl">
            <PenTool className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400">Writing on today&apos;s topic: {decodeURIComponent(topicParam)}</span>
          </div>
        )}

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your story a title..."
          className="w-full text-3xl font-bold text-warm-900 dark:text-warm-50 placeholder:text-warm-300 dark:placeholder:text-warm-600 outline-none mb-4 bg-transparent"
        />

        {/* Clean divider */}
        <div className="h-px bg-warm-100 dark:bg-warm-800 mb-4" />

        {/* Body with AI suggestion overlay */}
        <div className="relative">
          <RichEditor
            value={body}
            onChange={handleBodyChange}
            placeholder={contentType === 'POEM' ? 'Let the verses flow...' : 'Start writing your story...'}
            minHeight="400px"
          />
          {/* AI suggestion indicator */}
          {aiSuggestion && (
            <div className="mt-2 flex items-start gap-2.5 p-3.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-300/60 dark:border-violet-700/50 shadow-sm">
              <span className="shrink-0 text-xs font-bold text-white bg-violet-500 dark:bg-violet-600 px-2 py-0.5 rounded">
                AI
              </span>
              <p className="text-sm text-violet-700 dark:text-violet-300 italic leading-relaxed flex-1">
                {aiSuggestion}
              </p>
              <kbd className="shrink-0 text-[10px] font-medium text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 border border-violet-300 dark:border-violet-700 rounded px-2 py-0.5">
                Press Tab to accept
              </kbd>
            </div>
          )}
          {aiSuggestionLoading && aiAssistEnabled && (
            <div className="mt-2 flex items-center gap-2 text-xs text-violet-500 dark:text-violet-400">
              <div className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
              <Sparkles className="w-3 h-3" /> Thinking...
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <div className="border-t border-warm-100 dark:border-warm-800 pt-6 mt-8 space-y-5">
          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">Visibility</label>
            <div className="flex gap-2 flex-wrap">
              {visibilityOptions.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setVisibility(value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all border',
                    visibility === value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 hover:border-warm-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Category (required) — hidden for series episodes since they inherit the series category */}
          {categories.length > 0 && !seriesId && (
            <div>
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
                <Tag className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                Category <span className="text-red-400">*</span>
              </label>
              {!categoryId && (
                <p className="text-xs text-warm-400 mb-2">Select a genre for your content</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.filter((c: any) => !c.parentId).map((cat: any) => {
                  const isSelected = categoryId === cat.id;
                  const children = categories.filter((c: any) => c.parentId === cat.id);
                  const childSelected = children.some((c: any) => c.id === categoryId);
                  return (
                    <div key={cat.id}>
                      <button
                        onClick={() => setCategoryId(cat.id)}
                        className={cn(
                          'w-full px-4 py-2.5 rounded-xl text-sm transition-all border text-center',
                          isSelected || childSelected
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-warm-200 dark:border-warm-700 text-warm-600 dark:text-warm-400 hover:border-warm-300 hover:bg-warm-50 dark:hover:bg-warm-800/50'
                        )}
                      >
                        {cat.name}
                      </button>
                      {/* Subcategories */}
                      {(isSelected || childSelected) && children.length > 0 && (
                        <div className="mt-1.5 ml-2 flex flex-col gap-1">
                          {children.map((sub: any) => (
                            <button
                              key={sub.id}
                              onClick={() => setCategoryId(sub.id)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs transition-all border text-left',
                                categoryId === sub.id
                                  ? 'border-primary bg-primary/10 text-primary font-medium'
                                  : 'border-warm-200 dark:border-warm-700 text-warm-500 hover:border-warm-300'
                              )}
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Members Only Toggle — only for creator-eligible users */}
          {visibility === 'PUBLIC' && (user?.isCreatorEligible || user?.creatorPriceINR) && (
            <div className="flex items-center justify-between p-4 rounded-xl border border-violet-200/50 dark:border-violet-800/30 bg-violet-50/50 dark:bg-violet-950/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-warm-800 dark:text-warm-200">Members Only</p>
                  <p className="text-[11px] text-warm-500">Only your subscribers can read the full content</p>
                </div>
              </div>
              <button
                onClick={() => setMembersOnly(!membersOnly)}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors flex items-center px-0.5',
                  membersOnly ? 'bg-violet-500' : 'bg-warm-300 dark:bg-warm-700'
                )}
              >
                <div className={cn('w-5 h-5 bg-white rounded-full shadow-sm transition-transform', membersOnly && 'translate-x-5')} />
              </button>
            </div>
          )}

          {/* Unlock Price (Points) */}
          {visibility === 'PUBLIC' && (
            <div className="p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-warm-800 dark:text-warm-200">Unlock Price</p>
                  <p className="text-[11px] text-warm-500">Set a Point price to read this content (0 = free)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  value={unlockPrice}
                  onChange={(e) => setUnlockPrice(e.target.value)}
                  placeholder="0"
                  className="w-28 px-3 py-2 rounded-xl border border-warm-200 dark:border-warm-700 bg-transparent text-sm outline-none focus:border-primary text-warm-900 dark:text-warm-100"
                />
                <span className="text-sm text-warm-500">Points</span>
                {unlockPrice && parseInt(unlockPrice) > 0 && (
                  <span className="text-xs text-warm-400">
                    = Rs {(parseInt(unlockPrice) / 10).toFixed(2)}
                  </span>
                )}
              </div>
              {unlockPrice && parseInt(unlockPrice) > 0 && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Readers will pay {unlockPrice} Points (Rs {(parseInt(unlockPrice) / 10).toFixed(2)}) to read this. A 20% preview is shown for free.
                </p>
              )}
            </div>
          )}

          {/* Description / Excerpt */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-warm-700 dark:text-warm-300">
                Description / Excerpt
              </label>
              <button
                onClick={handleGenerateDescription}
                disabled={descriptionGenerating || !title.trim() || !body.trim()}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  descriptionGenerating
                    ? 'text-violet-400 cursor-wait'
                    : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30'
                )}
              >
                {descriptionGenerating ? (
                  <div className="w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                {descriptionGenerating ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => { if (e.target.value.length <= 200) setDescription(e.target.value); }}
              placeholder="A short summary of your content (auto-generated if left empty)"
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2.5 rounded-xl border border-warm-200 dark:border-warm-700 bg-transparent text-sm outline-none focus:border-primary resize-none text-warm-700 dark:text-warm-300 placeholder:text-warm-400"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-warm-400">
                Leave empty for auto-generation, or use AI.
              </p>
              <p className={cn('text-[11px] tabular-nums', description.length >= 180 ? 'text-red-500' : 'text-warm-400')}>
                {description.length}/200
              </p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">Tags (max 5)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="primary" size="md" className="cursor-pointer" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                  #{tag} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 rounded-xl border border-warm-200 dark:border-warm-700 bg-transparent text-sm outline-none focus:border-primary"
              />
              <Button variant="secondary" size="sm" onClick={addTag}>Add</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="px-4 py-8"><div className="skeleton h-8 w-1/3 rounded-lg mx-auto" /></div>}>
      <CreatePageInner />
    </Suspense>
  );
}
