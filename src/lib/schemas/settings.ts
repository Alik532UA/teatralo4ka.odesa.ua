import { z } from 'zod';
import { SCROLLBAR_MODE_IDS } from '$lib/config/scrollbarModes';
import { BACKGROUND_TYPE_IDS } from '$lib/config/backgroundOptions';
import { isSafeUrl } from '$lib/utils/safeUrl';

/**
 * Валідація налаштувань, що приходять із Firestore.
 *
 * Статті проходили через zod давно, а налаштування — ні: їх просто приводили
 * до потрібного типу. Різниця в наслідках велика. Стаття з поламаним полем
 * псує одну сторінку; поламаний `headerBar` — це шапка на кожній сторінці,
 * а поламаний `blocks` — порядок усієї головної.
 *
 * **Зіпсоване поле стає `undefined`, а не отримує значення тут.**
 *
 * Це головне рішення файлу. Спокуса написати `.catch(true)` велика, але тоді
 * типові значення жили б у двох місцях — тут і в константах `DEFAULT_*` у
 * `settings.ts` — і розходилися б непомітно. Натомість схеми лише ВІДКИДАЮТЬ
 * непридатне, а заповнює прогалини наявне злиття `{ ...DEFAULT_X, ...raw }`,
 * яке в коді вже було. Одне джерело правди лишається одним.
 *
 * Виняток — списки (блоки, пункти меню): там непридатний елемент саме
 * викидається, бо підставити «типовий блок» посеред списку нема з чого.
 */

/** Поле, яке за непридатного значення зникає, а не набуває чужого значення. */
function optional<T>(schema: z.ZodType<T>) {
	return schema.optional().catch(undefined);
}

/**
 * Адреса, яку сайт покладе в `href`.
 *
 * Тут, а не в компоненті: меню й кнопка-CTA рендеряться на КОЖНІЙ сторінці, а
 * `href` до цього був звичайним `z.string()`. Тобто `javascript:…`, записаний
 * у Firestore, виконався б у кожного відвідувача на кожній сторінці — правила
 * Firestore перевіряють, хто пише, і не перевіряють що (SECURITY-v8 § 1.3).
 *
 * Схема лишається в своєму жанрі: непридатна адреса зникає (`optional`), а
 * пункт меню бере типове значення зі злиття `{ ...DEFAULT, ...validated }`.
 * Підставити тут `'#'` означало б завести друге джерело правди про типові.
 */
const HrefSchema = z.string().refine(isSafeUrl, {
	message: 'Непридатна схема адреси — дозволені лише http(s), mailto, tel і внутрішні шляхи'
});

// ── Блоки головної ────────────────────────────────────────────────────────────

export const BlockIdSchema = z.enum(['hero', 'news', 'departments', 'projects', 'gallery']);

export const BlockConfigSchema = z.object({
	id: BlockIdSchema,
	visible: z.boolean(),
	order: z.number().int().min(0)
});

export type ValidatedBlock = z.infer<typeof BlockConfigSchema>;

/**
 * Невідомий `id` або поламане поле відкидають блок, решта списку лишається.
 *
 * Це не теоретичний випадок: набір блоків уже змінювався, і в збережених
 * налаштуваннях залишаються записи від видалених. Порядок після цього
 * перенумеровується в `settings.ts`, тож дірки в `order` нікому не заважають.
 */
export const BlocksSchema = z
	.array(BlockConfigSchema.nullable().catch(null))
	.transform((arr) => arr.filter((b): b is ValidatedBlock => b !== null));

// ── Віджети ───────────────────────────────────────────────────────────────────

const ViewModeSchema = z.enum(['carousel', 'grid', 'list']);
/** Секунди. Верхня межа не з голови: більше двох хвилин — це вже не автопрокрутка. */
const IntervalSchema = z.number().min(1).max(120);

export const NewsWidgetConfigSchema = z.object({
	defaultView: optional(ViewModeSchema),
	showViewSwitcher: optional(z.boolean()),
	autoplay: optional(z.boolean()),
	autoplayInterval: optional(IntervalSchema),
	pinnedArticleId: optional(z.string()),
	maxItemsGrid: optional(z.number().int().min(0)),
	maxItemsList: optional(z.number().int().min(0))
});

export const ProjectsWidgetConfigSchema = z.object({
	defaultView: optional(ViewModeSchema),
	showViewSwitcher: optional(z.boolean()),
	autoplay: optional(z.boolean()),
	autoplayInterval: optional(IntervalSchema),
	pinnedProjectId: optional(z.string()),
	maxItemsGrid: optional(z.number().int().min(0)),
	maxItemsList: optional(z.number().int().min(0))
});

export const GalleryWidgetConfigSchema = z.object({
	defaultView: optional(z.enum(['carousel', 'grid'])),
	showViewSwitcher: optional(z.boolean()),
	showCaptions: optional(z.boolean()),
	autoplay: optional(z.boolean()),
	autoplayInterval: optional(IntervalSchema),
	// -1 означає «нічого не закріплено», тому мінімум саме -1, а не 0.
	pinnedIndex: optional(z.number().int().min(-1)),
	maxItemsGrid: optional(z.number().int().min(0)),
	aspectRatio: optional(z.enum(['4:3', '16:9', '3:4', '9:16']))
});

// ── Меню ──────────────────────────────────────────────────────────────────────

const MenuLinkTypeSchema = z.enum(['page', 'article', 'url']);

/**
 * У Firestore лежить не повне меню, а НАКЛАДКА на типове: `MenuItemOverride`.
 *
 * Через це поля тут не просто необовʼязкові, а ще й можуть бути `null` —
 * `settings.ts` читає null як «узяти типове» (`override.labelUk ?? def.labelUk`).
 * Схема це зберігає: перетворити null на undefined тут означало б непомітно
 * змінити семантику злиття.
 *
 * `id` — єдине обовʼязкове поле: за ним накладка знаходить свій типовий пункт.
 * Накладка без id ні до чого не застосовна, тож відкидається. Він же служить
 * ключем для `{#each}` у шапці, а згенерований на льоту ідентифікатор
 * змінювався б при кожному читанні й перебудовував усе меню на кожній навігації.
 */
export const MenuItemOverrideSchema = z.object({
	id: z.string().min(1),
	labelUk: optional(z.string().nullable()),
	labelEn: optional(z.string().nullable()),
	linkType: optional(MenuLinkTypeSchema),
	href: optional(HrefSchema),
	visible: optional(z.boolean()),
	order: optional(z.number().int()),
	custom: optional(z.boolean()),
	itemType: optional(z.literal('cta').nullable())
});

export type ValidatedMenuItemOverride = z.infer<typeof MenuItemOverrideSchema>;

const MenuItemOverridesSchema = z
	.array(MenuItemOverrideSchema.nullable().catch(null))
	.transform((arr) => arr.filter((i): i is ValidatedMenuItemOverride => i !== null));

export const MenuSectionOverrideSchema = z.object({
	id: z.string().min(1),
	labelUk: optional(z.string().nullable()),
	labelEn: optional(z.string().nullable()),
	href: optional(HrefSchema.nullable()),
	linkType: optional(MenuLinkTypeSchema),
	visible: optional(z.boolean()),
	order: optional(z.number().int()),
	custom: optional(z.boolean()),
	items: optional(MenuItemOverridesSchema)
});

export type ValidatedMenuSectionOverride = z.infer<typeof MenuSectionOverrideSchema>;

export const MenuConfigOverrideSchema = z.object({
	items: optional(MenuItemOverridesSchema),
	sections: optional(
		z
			.array(MenuSectionOverrideSchema.nullable().catch(null))
			.transform((arr) => arr.filter((s): s is ValidatedMenuSectionOverride => s !== null))
	)
});

// ── Шапка ─────────────────────────────────────────────────────────────────────

export const CtaConfigSchema = z.object({
	visible: optional(z.boolean()),
	labelUk: optional(z.string()),
	labelEn: optional(z.string()),
	linkType: optional(MenuLinkTypeSchema),
	href: optional(HrefSchema),
	/** Стара форма, яку `settings.ts` мігрує в `href`. Та сама перевірка: інакше шлях
	    міграції став би обходом для `href`. */
	linkValue: optional(HrefSchema)
});

export const TickerConfigSchema = z.object({
	visible: optional(z.boolean()),
	mode: optional(z.enum(['always', 'time'])),
	// Формат HH:MM. Рядок іншої форми зламав би порівняння часу показу, тому
	// краще втратити налаштування й показати типове, ніж рахувати сміття.
	startTime: optional(z.string().regex(/^\d{2}:\d{2}$/)),
	endTime: optional(z.string().regex(/^\d{2}:\d{2}$/)),
	preview: optional(z.boolean()),
	enableSound: optional(z.boolean()),
	enableGrayscale: optional(z.boolean()),
	grayscaleStrength: optional(z.number().min(0).max(100))
});

export const DebugPanelConfigSchema = z.object({
	visible: optional(z.boolean()),
	showBackground: optional(z.boolean()),
	showBlur: optional(z.boolean()),
	showScrollbar: optional(z.boolean()),
	// Типи фону — 0..4, де 0 це «немає». Перелік спільний із випадайкою вибору.
	defaultBackground: optional(z.literal(BACKGROUND_TYPE_IDS)),
	defaultBlur: optional(z.boolean()),
	// Перелік той самий, що в контролері й у двох місцях вибору.
	defaultScrollbar: optional(z.enum(SCROLLBAR_MODE_IDS))
});


// ── Гарячі новини ─────────────────────────────────────────────────────────────

/**
 * Сповіщення про новину поверх сторінки.
 *
 * Список тут — саме СПИСОК за правилами цього файлу: непридатний елемент
 * викидається, а не отримує типові значення. Підставити «типову гарячу новину»
 * посеред переліку нема з чого, а показувати сповіщення про статтю, id якої
 * прийшов зіпсованим, гірше, ніж не показати нічого.
 */
export const HotNewsItemSchema = z.object({
	id: z.string().min(1),
	enabled: z.boolean(),
	frequency: z.enum(['once', 'session', 'always']),
	scope: z.enum(['exceptOwn', 'all', 'home']),
	order: z.number().int().min(0).max(999),
	/** Мілісекунди `updatedAt` новини — входять у ключ «уже бачив». */
	version: optional(z.number().int().min(0))
});

export type ValidatedHotNewsItem = z.infer<typeof HotNewsItemSchema>;

export const HotNewsConfigSchema = z.object({
	enabled: optional(z.boolean()),
	displayMode: optional(z.enum(['queue', 'stack2', 'all'])),
	// Межі не з голови: менше 5 секунд картку з фото не встигнути прочитати,
	// більше 5 хвилин — це вже не сповіщення, а частина сторінки.
	durationMs: optional(z.number().int().min(5_000).max(300_000)),
	// Верхня межа менша за нижню тривалість навмисно: затримка більша за десять
	// секунд означає, що відвідувач уже почав читати сторінку.
	delayMs: optional(z.number().int().min(0).max(10_000)),
	items: optional(
		z
			.array(HotNewsItemSchema.nullable().catch(null))
			.transform((arr) => arr.filter((i): i is ValidatedHotNewsItem => i !== null))
	)
});

/**
 * Прибирає ключі зі значенням `undefined`.
 *
 * Потрібне саме для злиття: `{ ...DEFAULT, ...validated }` із явним
 * `undefined` затер би типове значення на `undefined`, і сенс схеми зник би.
 */
export function withoutUndefined<T extends object>(obj: T): Partial<T> {
	return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/**
 * Розбирає значення схемою; за повної невдачі повертає `undefined`.
 *
 * `.catch()` на полях покриває неправильні ТИПИ полів. Сюди доходить те, що
 * не є обʼєктом узагалі — наприклад, коли в документі замість меню лежить
 * рядок. Далі викликач підставляє свої типові значення.
 *
 * Відсутнє значення проходить мовчки: незбережене налаштування — норма, і
 * попередження про нього швидко навчило б не читати консоль узагалі.
 * Попереджаємо лише про те, що є, але непридатне.
 */
export function parseOrUndefined<T>(schema: z.ZodType<T>, raw: unknown): T | undefined {
	if (raw === undefined || raw === null) return undefined;
	const result = schema.safeParse(raw);
	if (result.success) return result.data;
	console.warn('Налаштування не пройшли валідацію, застосовано типові:', result.error.issues);
	return undefined;
}
