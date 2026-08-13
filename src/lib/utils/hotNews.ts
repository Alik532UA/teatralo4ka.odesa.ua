/**
 * Правило «яку гарячу новину показати цьому відвідувачу на цій сторінці».
 *
 * Чиста функція без залежностей — тому її можна перевірити тестом, а не оком у
 * браузері. Показ (тости, таймер, пауза) живе в компоненті; РІШЕННЯ — тут.
 *
 * ## Чому частота — головне в цій задачі
 *
 * Гаряча новина це попап: вміст, якого відвідувач не просив, поверх сторінки.
 * Якщо він з'являється на кожен захід, його починають закривати рефлекторно, не
 * читаючи, — і тоді він перестає працювати навіть тоді, коли новина справді
 * важлива. Тому частота налаштовується для КОЖНОЇ новини окремо:
 *
 * - `once`    — один раз на відвідувача. Показали й запам'ятали в `localStorage`.
 *               Відредагована новина показується знову: ключ несе `updatedAt`.
 * - `session` — один раз на вкладку (`sessionStorage`). Для справді термінового.
 * - `always`  — щоразу. Лишається можливим, але це найгучніший режим.
 */

export type HotNewsFrequency = 'once' | 'session' | 'always';

/** Де саме показувати новину. */
export type HotNewsScope =
	/** Скрізь, окрім сторінки самої новини. Сповіщення про те, що вже читаєш, — збій. */
	| 'exceptOwn'
	/** Скрізь без винятків. */
	| 'all'
	/** Лише на головній. */
	| 'home';

/**
 * Кут екрана, у якому з'являється сповіщення.
 *
 * Налаштовується, бо правильної відповіді на всі сайти немає: правий нижній —
 * звичне місце сповіщень і туди ж дивиться відвідувач після кліку, лівий
 * нижній не перекриває кнопку «нагору» й чат, верхні помітніші, але й
 * настирливіші. Типове значення — правий нижній.
 */
export type HotNewsCorner = 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft';

/** Як показувати кілька новин одночасно. */
export type HotNewsDisplayMode =
	/** По одній: наступна з'являється, коли попередню закрито або її час вийшов. */
	| 'queue'
	/** Стопкою, не більше двох одночасно. */
	| 'stack2'
	/** Усі одразу. */
	| 'all';

export interface HotNewsItem {
	/** Слуг або id статті — те саме, чим адресується сторінка новини. */
	id: string;
	enabled: boolean;
	frequency: HotNewsFrequency;
	scope: HotNewsScope;
	/** Порядок показу. Менше — раніше. */
	order: number;
	/**
	 * Мітка версії новини (мілісекунди `updatedAt`).
	 *
	 * Входить у ключ «уже бачив»: відредагована новина має показатися знову,
	 * інакше виправлену дату набору побачать лише нові відвідувачі.
	 */
	version?: number;
}

export interface HotNewsConfig {
	enabled: boolean;
	displayMode: HotNewsDisplayMode;
	position: HotNewsCorner;
	/** Скільки живе одне сповіщення, мс. */
	durationMs: number;
	/** Пауза після завантаження, мс — щоб не змагатися із заставкою й LCP. */
	delayMs: number;
	items: HotNewsItem[];
}

export const DEFAULT_HOT_NEWS: HotNewsConfig = {
	enabled: false,
	displayMode: 'queue',
	// Правий нижній: там уже живуть тости сайту, і два стеки в одному кутку не
	// накривають один одного — гарячі новини стають у ту саму чергу.
	position: 'bottomRight',
	// 30 секунд: картка з фото й заголовком читається довше за рядок тексту, а
	// тост «адресу скопійовано» живе 6 секунд і для новини був би блимом.
	durationMs: 30_000,
	delayMs: 1500,
	items: []
};

/** Скільки сповіщень видно одночасно за обраного режиму. */
export function visibleLimit(mode: HotNewsDisplayMode): number {
	if (mode === 'queue') return 1;
	if (mode === 'stack2') return 2;
	return Number.POSITIVE_INFINITY;
}

/**
 * Ключ «цю новину вже показували».
 *
 * Версія в ключі навмисно: після редагування новини ключ інший, і показ
 * повториться. Без цього виправлена новина не дійшла б до тих, хто вже бачив
 * стару.
 */
export function seenKey(item: Pick<HotNewsItem, 'id' | 'version'>): string {
	return item.version ? `${item.id}@${item.version}` : item.id;
}

/** Чи підходить новина цій сторінці. */
export function matchesPath(item: HotNewsItem, pathname: string): boolean {
	// Кінцева коса риска на статичному хостингу є не завжди — прибираємо, щоб
	// `/news/x` і `/news/x/` не вважалися різними сторінками.
	const path = pathname.replace(/\/+$/, '') || '/';
	if (item.scope === 'home') return path === '/';
	if (item.scope === 'all') return true;
	// exceptOwn: не показувати на сторінці самої новини
	return path !== `/news/${item.id}`;
}

export interface SelectInput {
	config: HotNewsConfig;
	pathname: string;
	/** Ключі, показані назавжди (`localStorage`). */
	seenForever: readonly string[];
	/** Ключі, показані в цій вкладці (`sessionStorage`). */
	seenSession: readonly string[];
}

/**
 * Які новини показати зараз — у порядку показу.
 *
 * Ліміт одночасності тут НЕ застосовується: скільки з них видно водночас,
 * вирішує компонент за `displayMode`. Ця функція відповідає на інше питання —
 * які з них узагалі мають право з'явитися.
 */
export function selectHotNews({
	config,
	pathname,
	seenForever,
	seenSession
}: SelectInput): HotNewsItem[] {
	if (!config.enabled) return [];
	// Адмінка — робоче місце, а не сторінка сайту. Попап поверх форми
	// редагування новини заважає саме тому, хто цю новину й робить гарячою.
	if (pathname.startsWith('/admin')) return [];

	const forever = new Set(seenForever);
	const inSession = new Set(seenSession);

	return config.items
		.filter((item) => item.enabled)
		.filter((item) => matchesPath(item, pathname))
		.filter((item) => {
			const key = seenKey(item);
			if (item.frequency === 'once') return !forever.has(key);
			if (item.frequency === 'session') return !inSession.has(key);
			return true; // always
		})
		.slice()
		.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
