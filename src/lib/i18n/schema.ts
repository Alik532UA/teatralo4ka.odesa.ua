import { z } from 'zod';

export const pageMetadataSchema = z.object({
  title: z.string().min(5).max(200),
  date: z.string(),
  lastModified: z.string().optional(),
  author: z.string().optional(),
  category: z.enum(['about', 'history', 'admission', 'news', 'competitions']),
  lang: z.enum(['uk', 'en']),
  seo: z.object({
    title: z.string().min(10).max(100),
    description: z.string().min(20).max(300),
    keywords: z.string().optional(),
    ogImage: z.string().optional(),
  }),
  status: z.enum(['published', 'draft', 'archived']),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  readingTime: z.number().optional(),
  toc: z.boolean().optional(),
});

export function validatePageMetadata(data: unknown) {
  return pageMetadataSchema.parse(data);
}
