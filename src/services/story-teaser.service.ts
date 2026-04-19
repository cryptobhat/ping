import prisma from '../config/database';
import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

// Simple in-memory cache for teasers (avoid repeated LLM calls)
const teaserCache = new Map<string, { teaser: string; cachedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const LANG_NAMES: Record<string, string> = {
  kn: 'Kannada',
  hi: 'Hindi',
  en: 'English',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
};

export class StoryTeaserService {
  /**
   * Generate a 2-sentence teaser about what might happen next in a story.
   * Only works for content that is part of a series.
   */
  static async getTeaser(contentId: string): Promise<string | null> {
    // Check cache first
    const cached = teaserCache.get(contentId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.teaser;
    }

    // Check if teaser is stored in ContentAnalysis
    const analysis = await prisma.contentAnalysis.findUnique({
      where: { contentId },
      select: { id: true, keywords: true },
    });

    // Load content
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: {
        id: true,
        body: true,
        title: true,
        language: true,
        seriesItems: {
          select: {
            seriesId: true,
            sortOrder: true,
            series: {
              select: {
                id: true,
                title: true,
                status: true,
                items: {
                  orderBy: { sortOrder: 'asc' },
                  select: { contentId: true, sortOrder: true },
                },
              },
            },
          },
        },
      },
    });

    if (!content) return null;

    // Must be part of a series
    if (!content.seriesItems || content.seriesItems.length === 0) return null;

    const seriesItem = content.seriesItems[0];
    const series = seriesItem.series;
    const currentOrder = seriesItem.sortOrder;

    // Find next episode in the series
    const nextItem = series.items.find((item) => item.sortOrder > currentOrder);

    if (!DEEPSEEK_API_KEY) {
      // No LLM available — return a generic teaser
      return nextItem
        ? 'The story continues... What will happen next? Read the next episode to find out!'
        : null;
    }

    const langName = LANG_NAMES[content.language] || 'Kannada';
    const bodyText = content.body.replace(/<[^>]*>/g, '').trim();
    const opening = bodyText.slice(0, 300);
    const ending = bodyText.slice(-400);

    try {
      const res = await axios.post(
        `${DEEPSEEK_BASE_URL}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a storytelling expert for "${series.title}" — a ${langName} series on Kalaloka. You create exciting "What happens next?" teasers that make readers desperate to read the next episode. Write ONLY in ${langName}. Keep it to exactly 2 sentences. Be specific about characters and plot points from the text — don't be generic.`,
            },
            {
              role: 'user',
              content: `This episode is titled "${content.title}".

Opening:
${opening}

How the episode ends:
${ending}

Write a 2-sentence teaser for what might happen in the NEXT episode. Reference specific characters, events, or emotions from this episode. Make the reader feel they MUST read the next one. Write in ${langName} only.`,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      const teaser = res.data?.choices?.[0]?.message?.content?.trim();
      if (!teaser) return null;

      // Cache it
      teaserCache.set(contentId, { teaser, cachedAt: Date.now() });

      return teaser;
    } catch (err: any) {
      console.error('[StoryTeaser] LLM error:', err.message);
      return null;
    }
  }

  /**
   * Get the next episode content ID in a series, if any.
   */
  static async getNextEpisode(contentId: string): Promise<string | null> {
    const seriesItem = await prisma.seriesItem.findFirst({
      where: { contentId },
      select: {
        sortOrder: true,
        series: {
          select: {
            items: {
              orderBy: { sortOrder: 'asc' },
              select: { contentId: true, sortOrder: true },
            },
          },
        },
      },
    });

    if (!seriesItem) return null;

    const nextItem = seriesItem.series.items.find(
      (item) => item.sortOrder > seriesItem.sortOrder,
    );

    return nextItem?.contentId || null;
  }
}
