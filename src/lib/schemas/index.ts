import { z } from 'zod';
import { isSafeUrl } from '$lib/utils/safeUrl';

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
/**
 * Адреса, яку сайт покладе в `src` або віддасть плеєру.
 *
 * `coverUrl` раніше був простим `z.string()` — тобто в `<img src>` потрапляло
 * що завгодно, тоді як сусідній `externalUrl` уже мав `.url()`. Тепер обидва
 * медіа-поля проходять той самий allowlist схем, що й посилання меню
 * (SECURITY-v8 § 5.1): непридатне значення ЗНИКАЄ, а не підмінюється тут.
 */
const optionalSafeUrl = z
	.string()
	.refine((v) => v === '' || isSafeUrl(v), { message: 'Непридатна схема адреси' })
	.optional()
	.catch(undefined);

/**
 * Один елемент медіа статті.
 *
 * Доти в перекладі були ОДНА обкладинка й ОДНЕ відео, тобто «друге фото» з
 * адмінки додати було нікуди. Поле `media` це знімає; старі два лишаються й
 * далі читаються (`utils/articleMedia.legacyMedia`), тож жодну наявну новину
 * переписувати не треба.
 *
 * Адреса проходить той самий allowlist схем, що й обкладинка: значення йде і в
 * `<img src>`, і в плеєр.
 */
export const ArticleMediaItemSchema = z.object({
	kind: z.enum(['photo', 'video']).default('photo'),
	url: z
		.string()
		.refine((v) => isSafeUrl(v), { message: 'Непридатна схема адреси' })
		.catch(''),
	alt: z.string().optional(),
	position: z.string().optional(),
	width: z.number().int().positive().optional(),
	height: z.number().int().positive().optional()
});

export const ArticleTranslationSchema = z.object({
	title: z.string().default(''),
	content: z.string().default(''),
	excerpt: z.string().optional().default(''),
	isPublished: z.boolean().default(false),
	coverUrl: optionalSafeUrl,
	/**
	 * Перевіряється тим самим allowlist-ом схем, що й обкладинка: поле йде в
	 * `src` плеєра, і `javascript:`/`data:` там непотрібні так само.
	 * Чи це справді відео і чи його можна вбудувати — вирішує
	 * `utils/videoEmbed.ts` уже при показі.
	 */
	videoUrl: optionalSafeUrl,
	contentFormat: z.enum(['markdown', 'html']).optional().default('markdown'),
	externalUrl: z.string().url().optional().or(z.literal('')),
	/**
	 * Медіа статті в порядку показу: знімки й записи одним переліком.
	 *
	 * Порожньо або немає — читаються старі `coverUrl` і `videoUrl`.
	 *
	 * Порожні адреси відсіює ПОКАЗ (`DetailPage`), а не схема: `.transform()`
	 * тут зробив би поле обов'язковим у виведеному типі, і кожен `.default()`
	 * перекладу довелося б переписати заради значення, якого в чернетці немає.
	 */
	media: z.array(ArticleMediaItemSchema).optional().catch(undefined)
});

/**
 * Схема для статті / сторінки з Firebase
 */
export const ArticleSchema = z.object({
	id: z.string().optional(),
	slug: z.string().regex(/^[a-z0-9_]+$/).optional().or(z.literal('')),
	type: z.enum(['article', 'page', 'page_project']).optional(),
	category: z.string().default(''),
	author: z.string().default(''),
	dateMode: z.enum(['createdAt', 'updatedAt', 'custom', 'hidden']).default('createdAt'),
	createdAt: z.any().optional(),
	updatedAt: z.any().optional(),
	customDate: z.any().optional(),
	sortOrder: z.number().int().min(0).max(9999).optional(),
	/**
	 * Пропорція плиток медіа НА СТОРІНЦІ й спосіб їх показу.
	 *
	 * Поля статті, а не перекладу: пропорція й розкладка не залежать від мови, і
	 * два різні значення для uk та en означали б, що сторінка виглядає по-різному
	 * без жодної причини.
	 */
	mediaShape: z.enum(['square', 'portrait', 'landscape']).optional(),
	mediaLayout: z.enum(['column', 'sequence']).optional(),
	translations: z.object({
		uk: ArticleTranslationSchema.default({ title: '', content: '', excerpt: '', isPublished: false, contentFormat: 'markdown' }),
		en: ArticleTranslationSchema.default({ title: '', content: '', excerpt: '', isPublished: false, contentFormat: 'markdown' }),
	}).default({ uk: { title: '', content: '', excerpt: '', isPublished: false, contentFormat: 'markdown' }, en: { title: '', content: '', excerpt: '', isPublished: false, contentFormat: 'markdown' } }),
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
