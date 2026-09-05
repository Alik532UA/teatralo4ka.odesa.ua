/**
 * Пошук по сайту: зіставлення й ранжування.
 *
 * Логіка винесена з компонента навмисно — усе, що тут є, це чисті перетворення
 * рядків, і саме в них живуть помилки, яких не видно оком: регістр, порядок
 * результатів, обрізаний фрагмент посеред слова. Накладка ж лише малює те, що
 * повернула ця функція.
 *
 * Індексу як окремого артефакту немає і не потрібно: markdown-сторінки вже
 * лежать у бандлі (`import.meta.glob` з `eager: true` у `i18n/loader.ts`), а
 * новини приходять із Firestore тим самим запитом, що й для сторінки новин.
 */

/**
 * `galaxy` — усе, що живе в реєстрах розділу випускників: люди, вистави, курси,
 * фестивалі, заклади освіти, театри. Окремий вид, а не `page`, бо ці записи
 * приходять із даних, а не з markdown-сторінок, і вантажаться лише тоді, коли
 * пошук справді відкрили (розбір — у `services/searchGalaxy`).
 */
export type SearchKind = 'page' | 'news' | 'galaxy';

export interface SearchEntry {
	/** Унікальний ключ для `{#each}`. */
	id: string;
	title: string;
	/** Готова адреса — компонент нічого не доклеює. */
	href: string;
	kind: SearchKind;
	/** Текст для зіставлення: без розмітки, одним рядком. */
	text: string;
}

export interface SearchHit extends SearchEntry {
	/** Фрагмент тексту навколо збігу; порожній, коли збіг лише в назві. */
	snippet: string;
	score: number;
}

/** Скільком символам навколо збігу показуватися у фрагменті. */
const SNIPPET_RADIUS = 60;
/** Коротший запит дає надто багато шуму, щоб бути корисним. */
export const MIN_QUERY_LENGTH = 2;

/**
 * Зведення до вигляду, у якому порівнюємо.
 *
 * `toLowerCase` для української працює як слід, тож окремої таблиці не треба.
 * А от пробіли згортати обов'язково: у markdown переноси рядків стоять посеред
 * речень, і без цього запит «театральна школа» не знайшов би тексту, де між
 * словами перенос.
 */
export function normalize(value: string): string {
	return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Markdown у звичайний текст.
 *
 * Тут не потрібен ані `marked`, ані санітизація: результат ніколи не потрапляє
 * в розмітку як HTML, він лише зіставляється і показується як текст. Це і
 * дешевше, і безпечніше — повний рендер сімнадцяти сторінок двома мовами
 * коштував би відчутно, а віддача нульова.
 */
export function plainTextFromMarkdown(markdown: string): string {
	return markdown
		// Блоки коду цілком: у пошуку вони лише шум.
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/`([^`]*)`/g, '$1')
		// Зображення геть, посилання лишають текст.
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		// Заголовки, цитати, маркери списків.
		.replace(/^\s{0,3}#{1,6}\s+/gm, '')
		.replace(/^\s{0,3}>\s?/gm, '')
		.replace(/^\s{0,3}[-*+]\s+/gm, '')
		.replace(/^\s{0,3}\d+\.\s+/gm, '')
		// Виділення й лінії.
		.replace(/(\*\*|__|\*|_|~~)/g, '')
		.replace(/^\s{0,3}([-*_])\s*(\1\s*){2,}$/gm, ' ')
		// Залишки HTML, які трапляються в markdown.
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Фрагмент навколо збігу, обрізаний по межах слів.
 *
 * Обрізати рівно по `radius` означало б різати слова навпіл — виглядає як
 * помилка, хоч і не є нею.
 */
function buildSnippet(text: string, at: number, queryLength: number): string {
	const from = Math.max(0, at - SNIPPET_RADIUS);
	const to = Math.min(text.length, at + queryLength + SNIPPET_RADIUS);

	let start = from;
	if (from > 0) {
		const space = text.indexOf(' ', from);
		// Зсув до пробілу лише якщо він не перескочив сам збіг.
		if (space >= 0 && space < at) start = space + 1;
	}

	let end = to;
	if (to < text.length) {
		const space = text.lastIndexOf(' ', to);
		if (space > at + queryLength) end = space;
	}

	return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

/**
 * Знайти й упорядкувати.
 *
 * Ранжування просте навмисно: збіг у назві важить більше за збіг у тексті, а
 * серед рівних вище той, де збіг ближче до початку. Складніші схеми на сімнадцяти
 * сторінках і кількох десятках новин не дають нічого, крім місць, де можна
 * помилитися.
 */
export function searchEntries(entries: SearchEntry[], query: string, limit = 20, currentLang?: string): SearchHit[] {
	const q = normalize(query);
	if (q.length < MIN_QUERY_LENGTH) return [];

	const hits: SearchHit[] = [];

	for (const entry of entries) {
		const title = normalize(entry.title);
		const text = normalize(entry.text);

		const inTitle = title.indexOf(q);
		const inText = text.indexOf(q);
		if (inTitle < 0 && inText < 0) continue;

		// Назва важить утричі: людина шукає сторінку, а не згадку слова в ній.
		// Дільник 1000 лишає позицію другорядним чинником, а не головним.
		let score =
			(inTitle >= 0 ? 3 - inTitle / 1000 : 0) + (inText >= 0 ? 1 - inText / 1000 : 0);

		// Невеликий пріоритет поточній мові інтерфейсу при однакових збігах
		if (currentLang && entry.id.includes(`:${currentLang}:`)) {
			score += 0.1;
		}

		hits.push({
			...entry,
			score,
			snippet: inText >= 0 ? buildSnippet(entry.text, inText, q.length) : ''
		});
	}

	return hits
		.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'uk'))
		.slice(0, limit);
}
