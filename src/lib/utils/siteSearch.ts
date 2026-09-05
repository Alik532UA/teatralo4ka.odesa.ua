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
 *
 * ## Три шари зіставлення, і чому саме три
 *
 * Спершу шар був один — точний підрядок, і для сімнадцяти markdown-сторінок
 * його справді досить. Але 2026-09-05 у пошук додали реєстри галактики: 1397
 * записів, у яких живуть ЛЮДСЬКІ ІМЕНА. Того самого дня заміряно, що з семи
 * правдоподібних запитів чотири давали нуль:
 *
 * - «Дар'я Гуревич» — у даних апостроф типографський, у запиті прямий;
 * - «Тункевіч» — те саме прізвище двома написаннями, и проти і;
 * - «Маріна Суханова» — те саме, тільки в імені;
 * - «Тункевич Аліса» — слова в іншому порядку;
 * - «Запальнов» — справжня одруківка: а замість о.
 *
 * Звідси три шари, від найдешевшого до найдорожчого:
 *
 * 1. **Згортання схожих літер** (`fold`) — детерміноване, без жодного здогаду.
 *    Закриває перші три випадки й майже нічого не коштує: рядки й так зводилися
 *    до порівнюваного вигляду, просто таблиця замін тепер ширша.
 * 2. **Слова в будь-якому порядку** — кожне слово запиту мусить знайтися десь
 *    у записі. Закриває четвертий випадок.
 * 3. **Одна помилкова літера** (`oneLetterApart`) — і лише вона закриває
 *    «Запальнов». Найдорожчий шар, тому й останній: працює ТІЛЬКИ по назвах і
 *    тільки тоді, коли точних збігів мало (`ENOUGH_EXACT`). Поки набране щось
 *    знаходить, приблизні збіги лише відтісняли б потрібне вниз.
 *
 * Точний збіг завжди вище приблизного — за це відповідають ваги нижче, і саме
 * тому вони розведені на порядок, а не на десяті частки.
 *
 * ## Чого тут свідомо немає
 *
 * Ані покажчика n-грам, ані BM25, ані бібліотеки. Записів 1397, слів у назвах
 * близько 3380 — це мілісекунди простим перебором, а кожен із тих механізмів
 * додав би ваги в бандл шапки, яку платить КОЖНА сторінка сайту.
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
 * Скільки точних збігів робить пошук одруків непотрібним.
 *
 * Число невелике навмисно: коли на екрані вже п'ять влучань, шоста здогадка
 * нічого не додає, а от коли їх два — може виявитися саме тим, що шукали.
 */
const ENOUGH_EXACT = 5;

/**
 * Найкоротше слово, у якому шукаємо одруку.
 *
 * На одній заміні коротке слово перетворюється на надто багато інших: «Ткач»
 * ще осмислено, «сад» — уже ні, бо збігся б і з «сам», і з «рад», і з «сад»
 * будь-кого. Тому шар одруків починається з чотирьох літер.
 */
const MIN_TYPO_WORD = 4;

/**
 * Ваги шарів.
 *
 * Розведені на порядок навмисно: перекриття між ними НЕ має бути, бо інакше
 * запис, у якому слова просто розсипані по тексту, міг би обійти запис із
 * точним збігом у назві. Позиція збігу лишається другорядним чинником — вона
 * додає щонайбільше одиницю (`proximity`), тобто впорядковує рівних, а не
 * змагається з шаром.
 */
const SCORE_PHRASE_TITLE = 300;
const SCORE_PHRASE_TEXT = 100;
const SCORE_WORDS_TITLE = 30;
const SCORE_WORDS_TEXT = 10;
const SCORE_TYPO_TITLE = 3;

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
 * Літери, які в НАШИХ даних означають одне й те саме.
 *
 * Таблиця виведена з реальних розходжень, а не з фонетики: и/і/ы/й/ї — це те
 * саме прізвище, записане різними руками («Тункевич» і «Тункевіч», «Марина» і
 * «Маріна»), а три види апострофа трапляються всередині одного реєстру.
 *
 * Плата за це — трохи менша точність: «били» і «білі» стають одним словом. Для
 * пошуку по іменах це правильний бік вибору: не знайти людину, яка в базі є,
 * гірше, ніж побачити один зайвий рядок у переліку.
 */
const FOLD: Record<string, string> = {
	и: 'і',
	ы: 'і',
	й: 'і',
	ї: 'і',
	є: 'е',
	э: 'е',
	ё: 'е',
	ґ: 'г',
	'’': "'",
	'ʼ': "'",
	'`': "'",
	'´': "'"
};

/**
 * Згортання схожих літер — символ у символ.
 *
 * ДОВЖИНА ЗБЕРІГАЄТЬСЯ, і це не дрібниця: позиція збігу, знайдена у згорнутому
 * тексті, потім ріже фрагмент із тексту для показу. Згортання, яке викидає
 * символи (скажімо, м'який знак), зсунуло б фрагмент — і виглядало б це як
 * обрізане посеред слова, тобто як помилка, якої ніде не видно в коді.
 */
export function fold(value: string): string {
	let out = '';
	for (const ch of value) {
		const low = ch.toLowerCase();
		// Регістр буває довшим за оригінал (турецьке «İ») — тоді лишаємо як є.
		const one = low.length === ch.length ? low : ch;
		out += FOLD[one] ?? one;
	}
	return out;
}

/** Розділові знаки словом не є; апостроф — є, він живе всередині слів. */
const WORD_SPLIT = /[^\p{L}\p{N}']+/u;

function words(value: string): string[] {
	return value.split(WORD_SPLIT).filter(Boolean);
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

interface Prepared {
	/** Назва у порівнюваному вигляді. */
	title: string;
	/** Текст у порівнюваному вигляді; ЗАВЖДИ тієї ж довжини, що `display`. */
	text: string;
	/** Текст для показу: пробіли згорнуті, регістр збережений. */
	display: string;
	/** Слова назви, у яких є сенс шукати одруку. */
	titleWords: string[];
}

/**
 * Підготовлені записи, щоб не перетирати їх на кожну натиснуту клавішу.
 *
 * Записів 1397, і кожен набраний символ проганяє їх усі. Без кешу кожен символ
 * знову опускав би регістр, згортав пробіли й згортав літери — тобто робив
 * роботу, яка від запиту не залежить ЗОВСІМ.
 *
 * `WeakMap` саме тому, що ключ — сам об'єкт запису: перелік збирається один раз
 * (`pageEntries`, `galaxyEntries`), а коли його виб'є з пам'яті, підготовка
 * піде за ним, і жодного «забудь кеш» кликати не треба.
 */
const prepared = new WeakMap<SearchEntry, Prepared>();

function prepare(entry: SearchEntry): Prepared {
	const cached = prepared.get(entry);
	if (cached) return cached;

	const display = entry.text.replace(/\s+/gu, ' ').trim();
	const title = fold(normalize(entry.title));
	const value: Prepared = {
		title,
		text: fold(display),
		display,
		titleWords: words(title).filter((w) => w.length >= MIN_TYPO_WORD)
	};
	prepared.set(entry, value);
	return value;
}

/**
 * Наскільки збіг ближче до початку. Завжди в межах (0; 1] — тому шар важить
 * більше за позицію, а не навпаки.
 */
function proximity(at: number): number {
	return 1 - Math.min(at, 999) / 1000;
}

/** Невеликий пріоритет поточній мові інтерфейсу при однакових збігах. */
function langBonus(entry: SearchEntry, currentLang?: string): number {
	return currentLang && entry.id.includes(`:${currentLang}:`) ? 0.1 : 0;
}

/**
 * Чи розходяться слова щонайбільше на одну літеру: заміну, вставку, пропуск або
 * перестановку сусідніх (відстань Дамерау—Левенштейна ≤ 1).
 *
 * Написано перевіркою, а не матрицею відстаней, і це навмисно. Питання тут
 * лише одне — «чи не більше однієї», — і на нього відповідає один прохід із
 * ранньою відмовою по довжині. Матриця ж рахувала б точну відстань для тисяч
 * пар, з яких майже всі відпадають на першому ж порівнянні довжин.
 *
 * Однакові слова повертають `false`: це не одруківка, а точний збіг, і його
 * шар — інший.
 */
function oneLetterApart(a: string, b: string): boolean {
	const diff = a.length - b.length;
	if (diff > 1 || diff < -1) return false;
	if (a === b) return false;

	if (diff === 0) {
		let i = 0;
		while (i < a.length && a[i] === b[i]) i++;
		// Заміна: далі рядки мусять збігтися.
		if (a.slice(i + 1) === b.slice(i + 1)) return true;
		// Перестановка сусідніх: «Тукневич» замість «Тункевич».
		return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
	}

	const [short, long] = diff < 0 ? [a, b] : [b, a];
	let i = 0;
	while (i < short.length && short[i] === long[i]) i++;
	return short.slice(i) === long.slice(i + 1);
}

/**
 * Шари точного зіставлення: фраза цілком, а якщо її немає — слова в будь-якому
 * порядку.
 */
function exactHit(entry: SearchEntry, q: string, qWords: string[], currentLang?: string): SearchHit | null {
	const { title, text, display } = prepare(entry);

	const inTitle = title.indexOf(q);
	const inText = text.indexOf(q);

	let score = 0;
	// Позиція для фрагмента: -1 означає «збіг лише в назві».
	let at = -1;
	let length = q.length;

	// Назва важить більше: людина шукає сторінку, а не згадку слова в ній.
	if (inTitle >= 0) score += SCORE_PHRASE_TITLE + proximity(inTitle);
	if (inText >= 0) {
		score += SCORE_PHRASE_TEXT + proximity(inText);
		at = inText;
	}

	/*
	 * Слова в будь-якому порядку — коли фрази як цілого немає. «Тункевич Аліса»
	 * саме такий випадок: обидва слова в назві, просто порядок інший, і точний
	 * підрядок не знаходив нічого. Порядку слів людина не пам'ятає, і вимагати
	 * його — вимагати вгадати, як записано в базі.
	 */
	if (score === 0) {
		if (!qWords.length) return null;
		if (!qWords.every((w) => title.includes(w) || text.includes(w))) return null;
		score = qWords.every((w) => title.includes(w)) ? SCORE_WORDS_TITLE : SCORE_WORDS_TEXT;
		for (const w of qWords) {
			const found = text.indexOf(w);
			if (found >= 0) {
				at = found;
				length = w.length;
				break;
			}
		}
	}

	return {
		...entry,
		score: score + langBonus(entry, currentLang),
		snippet: at >= 0 ? buildSnippet(display, at, length) : ''
	};
}

/**
 * Шар одруків: слово запиту розійшлося зі словом назви на одну літеру.
 *
 * Тільки по назвах — і це не економія, а точність. У тексті запису лежать роки,
 * міста, назви курсів; там «1985» збіглося б із «1984», а «Одеса» з «Одеси».
 * Назва ж — це те, чим запис зветься, і саме її людина набирає з пам'яті.
 */
function typoHit(entry: SearchEntry, qWords: string[], currentLang?: string): SearchHit | null {
	if (!qWords.length) return null;
	const { title, titleWords } = prepare(entry);

	for (const w of qWords) {
		// Слово, яке в назві є, виправляти не треба — помилка в іншому.
		if (title.includes(w)) continue;
		if (w.length < MIN_TYPO_WORD) return null;
		if (!titleWords.some((t) => oneLetterApart(t, w))) return null;
	}

	return { ...entry, score: SCORE_TYPO_TITLE + langBonus(entry, currentLang), snippet: '' };
}

/**
 * Знайти й упорядкувати.
 *
 * Ранжування просте навмисно: збіг у назві важить більше за збіг у тексті, а
 * серед рівних вище той, де збіг ближче до початку. Складніші схеми дали б лише
 * місця, де можна помилитися; а от шарів тут три — розбір угорі файлу.
 */
export function searchEntries(entries: SearchEntry[], query: string, limit = 20, currentLang?: string): SearchHit[] {
	const q = fold(normalize(query));
	if (q.length < MIN_QUERY_LENGTH) return [];

	const qWords = words(q);
	const hits: SearchHit[] = [];
	const missed: SearchEntry[] = [];

	for (const entry of entries) {
		const hit = exactHit(entry, q, qWords, currentLang);
		if (hit) hits.push(hit);
		else missed.push(entry);
	}

	/*
	 * Одруки шукаються лише тоді, коли точного майже нічого. Поки набране щось
	 * знаходить, приблизні збіги були б чистим шумом — а платити за них
	 * довелося б на кожну натиснуту клавішу.
	 */
	if (hits.length < ENOUGH_EXACT) {
		for (const entry of missed) {
			const hit = typoHit(entry, qWords, currentLang);
			if (hit) hits.push(hit);
		}
	}

	return hits
		.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'uk'))
		.slice(0, limit);
}
