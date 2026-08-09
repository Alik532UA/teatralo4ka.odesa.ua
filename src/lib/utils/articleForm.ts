/**
 * Чиста логіка форми статті, винесена з `ArticleForm.svelte`.
 *
 * Усе це працювало всередині компонента й було непідвладне тестам, при тому
 * що кожна функція тут має неочевидну поведінку: позиція курсора після
 * прибирання заборонених символів, формат «дві мови в одному рядку» для
 * власної категорії, межі дати, які мусять збігатися з `firestore.rules`.
 *
 * Що НЕ переїхало: усе, що торкається стану компонента або показу
 * повідомлень. Перевірки повертають опис проблеми, а показує його той, хто
 * викликав — інакше модуль тягнув би за собою i18n і toast.
 */

/** Роздільник української та англійської назви у власній категорії. */
export const CATEGORY_SEPARATOR = '||';

/** Службові значення випадайки категорій. */
export const CATEGORY_NONE = '__none__';
export const CATEGORY_CUSTOM = '__custom__';

// ── Slug ──────────────────────────────────────────────────────────────────────

export interface SlugInput {
	/** Що ввів користувач. */
	raw: string;
	/** Позиція курсора до перетворення. */
	cursor: number;
}

export interface SlugResult {
	slug: string;
	/** Куди поставити курсор після перетворення. */
	cursor: number;
	/** Чи довелося щось викинути — привід показати підказку. */
	hasForbidden: boolean;
}

/**
 * Приводить введене до вигляду `[a-z0-9_]`, зберігаючи позицію курсора.
 *
 * Курсор — не дрібниця: без поправки на викинуті символи він стрибає в кінець
 * рядка, і редагувати slug посеред тексту стає неможливо. Зсув рахується лише
 * за символами ЛІВОРУЧ від курсора — те, що викинуто праворуч, на його
 * позицію не впливає.
 */
export function sanitizeSlug({ raw, cursor }: SlugInput): SlugResult {
	let slug = '';
	let removedBeforeCursor = 0;
	let hasForbidden = false;

	for (let i = 0; i < raw.length; i++) {
		const char = raw[i];
		if (char === ' ') {
			slug += '_';
		} else if (/[A-Z]/.test(char)) {
			slug += char.toLowerCase();
		} else if (/[a-z0-9_]/.test(char)) {
			slug += char;
		} else {
			if (i < cursor) removedBeforeCursor++;
			hasForbidden = true;
		}
	}

	return { slug, cursor: cursor - removedBeforeCursor, hasForbidden };
}

// ── Категорія ─────────────────────────────────────────────────────────────────

export interface CategorySelection {
	/** Значення випадайки: ключ категорії або службове. */
	selection: string;
	customUk: string;
	customEn: string;
}

/**
 * Розбирає збережене значення категорії на стан випадайки.
 *
 * `knownKeys` передається, а не імпортується, щоб модуль не залежав від
 * конфігу: перелік категорій може відрізнятися між викликами.
 */
export function parseCategory(stored: string, knownKeys: readonly string[]): CategorySelection {
	if (!stored) return { selection: CATEGORY_NONE, customUk: '', customEn: '' };
	if (knownKeys.includes(stored)) return { selection: stored, customUk: '', customEn: '' };

	if (stored.includes(CATEGORY_SEPARATOR)) {
		const [uk, en] = stored.split(CATEGORY_SEPARATOR);
		return { selection: CATEGORY_CUSTOM, customUk: uk || '', customEn: en || '' };
	}
	return { selection: CATEGORY_CUSTOM, customUk: stored, customEn: '' };
}

/**
 * Збирає значення для збереження зі стану випадайки.
 *
 * Без англійської назви роздільник не пишеться — інакше в базі осідали б
 * рядки на кшталт `Концерти||`, які потім розбиралися б у порожню англійську.
 */
export function formatCategory({ selection, customUk, customEn }: CategorySelection): string {
	if (selection === CATEGORY_NONE) return '';
	if (selection !== CATEGORY_CUSTOM) return selection;

	const uk = customUk.trim();
	const en = customEn.trim();
	return en ? `${uk}${CATEGORY_SEPARATOR}${en}` : uk;
}

// ── Дати ──────────────────────────────────────────────────────────────────────

/** ISO-дата без часу; `null` дає прочерк, який показує форма. */
export function formatDateInput(date: Date | null): string {
	if (!date) return '---';
	return date.toISOString().split('T')[0];
}

export type DatePreset = 'createdAt' | 'updatedAt' | 'today' | 'hidden';

/**
 * Дата для пресета кнопки.
 *
 * Повертає `null` для `hidden`: там дати немає взагалі, і це не те саме, що
 * «сьогодні». Відсутня дата створення/оновлення падає на сьогодні — так
 * поводилася форма й раніше.
 */
export function datePresetValue(
	preset: DatePreset,
	dates: { createdAt: Date | null; updatedAt: Date | null; today: Date }
): string | null {
	if (preset === 'hidden') return null;
	if (preset === 'createdAt') return formatDateInput(dates.createdAt ?? dates.today);
	if (preset === 'updatedAt') return formatDateInput(dates.updatedAt ?? dates.today);
	return formatDateInput(dates.today);
}

// ── Перевірка перед збереженням ───────────────────────────────────────────────

/** Межі, що мусять збігатися з `firestore.rules`. */
export interface FormLimits {
	dateMin: string;
	dateMax: string;
	maxCategoryLength: number;
	maxTitleLength: number;
	maxContentLength: number;
}

export interface FormValues {
	dateMode: string;
	customDateStr: string;
	category: string;
	translations: Record<'uk' | 'en', { title: string; content: string }>;
}

/**
 * Що саме не так із формою. `null` означає «можна зберігати».
 *
 * Повертається опис, а не готовий текст: підставити переклад і показати
 * повідомлення — справа компонента. Так модуль лишається без залежностей і
 * піддається тестам.
 */
export type FormProblem =
	| { kind: 'dateRange' }
	| { kind: 'categoryLength'; current: number }
	| { kind: 'titleLength'; lang: 'uk' | 'en' }
	| { kind: 'contentLength'; lang: 'uk' | 'en' };

export function validateForm(values: FormValues, limits: FormLimits): FormProblem | null {
	if (values.dateMode === 'custom') {
		const d = new Date(values.customDateStr);
		const min = new Date(limits.dateMin);
		const max = new Date(limits.dateMax);
		if (isNaN(d.getTime()) || d < min || d > max) return { kind: 'dateRange' };
	}

	if (values.category.length > limits.maxCategoryLength) {
		return { kind: 'categoryLength', current: values.category.length };
	}

	for (const lang of ['uk', 'en'] as const) {
		if (values.translations[lang].title.length > limits.maxTitleLength) {
			return { kind: 'titleLength', lang };
		}
		if (values.translations[lang].content.length > limits.maxContentLength) {
			return { kind: 'contentLength', lang };
		}
	}

	return null;
}

// ── Інше ──────────────────────────────────────────────────────────────────────

/**
 * Чи схоже посилання на зображення.
 *
 * Порожнє значення вважається придатним: обкладинка необовʼязкова, і
 * підсвічувати порожнє поле як помилку було б неправдою.
 */
export function isImageUrlValid(url: string): boolean {
	if (!url) return true;
	return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
}
