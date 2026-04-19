import { z } from 'zod';

export const createContentSchema = z.object({
  body: z.object({
    title: z.string().max(255).optional(),
    body: z.string().min(1),
    contentType: z.enum(['QUOTE', 'STORY', 'POEM', 'ARTICLE']),
    categoryId: z.string().uuid().optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE', 'FOLLOWERS']).default('PUBLIC'),
    isPremium: z.boolean().default(false),
    membersOnly: z.boolean().default(false),
    coverImage: z.string().max(500).optional(),
    description: z.string().max(300).optional(),
    images: z.array(z.string().max(500)).max(10).default([]),
    isDraft: z.boolean().default(false),
    language: z.string().max(5).default('kn'),
    unlockPrice: z.number().int().min(0).max(10000).optional(),
  }),
});

export const updateContentSchema = z.object({
  body: z.object({
    title: z.string().max(255).optional(),
    body: z.string().min(1).optional(),
    categoryId: z.string().uuid().optional(),
    visibility: z.enum(['PUBLIC', 'PRIVATE', 'FOLLOWERS']).optional(),
    // isPremium intentionally omitted — only admins can set premium status
    membersOnly: z.boolean().optional(),
    coverImage: z.string().max(500).optional().nullable(),
    description: z.string().max(300).optional(),
    images: z.array(z.string().max(500)).max(10).optional(),
    isDraft: z.boolean().optional(),
    language: z.string().max(5).optional(),
    unlockPrice: z.number().int().min(0).max(10000).optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const contentIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const contentFeedSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1'),
    limit: z.string().regex(/^\d+$/).optional().default('20'),
    contentType: z.enum(['QUOTE', 'STORY', 'POEM', 'ARTICLE']).optional(),
    categoryId: z.string().uuid().optional(),
    authorId: z.string().uuid().optional(),
  }),
});