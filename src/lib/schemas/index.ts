import { z } from 'zod';

export { NewsItemSchema, type NewsItem, validateNews } from './news';

/**
 * Схема для відділення
 */
export const DepartmentSchema = z.object({
	id: z.string().min(1, "Department ID required"),
	name: z.string().min(1, "Department name required"),
	iconPath: z.string().optional(),
	description: z.string().optional(),
});

export type Department = z.infer<typeof DepartmentSchema>;

/**
 * Схема для зображення в галереї
 */
export const GalleryImageSchema = z.object({
	src: z.string().min(1, "Image src required"),
	alt: z.string().min(1, "Alt text required"),
	title: z.string().optional(),
});

export type GalleryImage = z.infer<typeof GalleryImageSchema>;

/**
 * Схема для загальних налаштувань сайту
 */
export const SiteConfigSchema = z.object({
	schoolName: z.string(),
	schoolPhone: z.string(),
	schoolEmail: z.string().email(),
	socialLinks: z.object({
		facebook: z.string().url().optional(),
		youtube: z.string().url().optional(),
		instagram: z.string().url().optional(),
	}).optional(),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

/**
 * Helper функції для безпечного парсингу
 */
export function validateDepartment(data: unknown): Department {
	return DepartmentSchema.parse(data);
}

export function validateDepartmentArray(data: unknown[]): Department[] {
	return data.map(item => DepartmentSchema.parse(item));
}

export function validateGalleryImageArray(data: unknown[]): GalleryImage[] {
	return data.map(item => GalleryImageSchema.parse(item));
}

/**
 * Схема для перекладу статті
 */
export const ArticleTranslationSchema = z.object({
	title: z.string().default(''),
	content: z.string().default(''),
	isPublished: z.boolean().default(false),
	coverUrl: z.string().optional(),
	contentFormat: z.enum(['markdown', 'html']).optional().default('markdown'),
});

/**
 * Схема для статті / сторінки з Firebase
 */
export const ArticleSchema = z.object({
	id: z.string().optional(),
	slug: z.string().optional(),
	type: z.enum(['article', 'page', 'page_project']).optional(),
	category: z.string().default(''),
	author: z.string().default(''),
	dateMode: z.enum(['createdAt', 'updatedAt', 'custom', 'hidden']).default('createdAt'),
	createdAt: z.any().optional(),
	updatedAt: z.any().optional(),
	customDate: z.any().optional(),
	translations: z.object({
		uk: ArticleTranslationSchema.default({ title: '', content: '', isPublished: false, contentFormat: 'markdown' }),
		en: ArticleTranslationSchema.default({ title: '', content: '', isPublished: false, contentFormat: 'markdown' }),
	}).default({ uk: { title: '', content: '', isPublished: false, contentFormat: 'markdown' }, en: { title: '', content: '', isPublished: false, contentFormat: 'markdown' } }),
});

export type ValidatedArticle = z.infer<typeof ArticleSchema>;

/**
 * Безпечний парсинг статті з Firebase (замість as Article)
 */
export function parseArticle(data: unknown): ValidatedArticle {
	return ArticleSchema.parse(data);
}

export function safeParseArticle(data: unknown): ValidatedArticle | null {
	const result = ArticleSchema.safeParse(data);
	return result.success ? result.data : null;
}
