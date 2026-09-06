import { z } from 'zod';

export const pageMetadataSchema = z.object({
  title: z.string().min(2).max(200),
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
  /**
   * Плашка новини на картці: «Благодійність», «Святкування», «Фестиваль»…
   *
   * `category` вище — це РІД сторінки, і для новини він завжди `news`: саме
   * так її відрізняють від розділів сайту, і саме це вимагає гейт
   * `config/codeNews.test.ts`. Але в базі стаття має ще й свою категорію
   * показу, і з чотирнадцяти перенесених новин дві були не «Новина», а
   * «Благодійність» і «Святкування». Без окремого поля вони мовчки ставали
   * новинами — тобто перенос у код губив те, що автор виставив руками.
   *
   * Значення — ключ із `config/categories.ARTICLE_CATEGORIES`; його ж читає
   * `getCategoryLabel`, тому підпис виходить двома мовами без жодного рядка
   * тут. Немає поля — плашка та сама, що доти («Новина»).
   */
  newsCategory: z.string().optional(),
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
