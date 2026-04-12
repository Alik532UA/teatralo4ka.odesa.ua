import { z } from 'zod';

export const pageMetadataSchema = z.object({
  title: z.string().min(5).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" }),
  lastModified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  author: z.string().optional(),
  category: z.enum(['about', 'history', 'admission', 'news', 'contacts', 'departments', 'residents', 'projects', 'general']),
  lang: z.enum(['uk', 'en']),
  seo: z.object({
    title: z.string().min(10).max(100),
    description: z.string().min(50).max(300),
    keywords: z.string().optional(),
    ogImage: z.string().optional(),
  }),
  status: z.enum(['published', 'draft', 'archived']),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  excerpt: z.string().max(300).optional(),
  coverUrl: z.string().optional(),
  readingTime: z.number().optional(),
  toc: z.boolean().optional(),
});

export function validatePageMetadata(data: unknown) {
  return pageMetadataSchema.parse(data);
}
