/**
 * Розбирає дамп краулера на структуровані записи випускників.
 *
 * Вхід: `.temp/ats-ua/manifest.json` (див. `scripts/crawl-ats-ua.ts`).
 * Вихід: `.temp/ats-ua/parsed/<slug>.json` + `parse-report.md`.
 *
 * ## Головне про цей скрипт: він НЕ вгадує
 *
 * Кожен рядок вихідного тексту або розібраний відомим правилом, або потрапляє у
 * звіт як **нерозібраний**. Другого шляху немає навмисно: парсер, який тихо
 * пропускає незнайоме, дає повний на вигляд JSON із дірками, і знаходить їх
 * потім читач сайту. Тому `npm run parse:graduates` друкує число нерозібраних
 * рядків, і це число — головний показник якості розбору, а не кількість
 * створених файлів.
 *
 * Через це вивід іде в `.temp/`, а не в `src/`. Дані переїжджають у репозиторій
 * окремим кроком — після того, як звіт прочитали. `--out=src/lib/data/graduates`
 * задається явно.
 *
 * ## Чому правила саме такі (усе заміряно на 80 сторінках, не вгадано)
 *
 *   • мітка майстра має П'ЯТЬ написань: «Майстриня курсу» 47, «Майстри» 17,
 *     «Майстер» 11, «Майстрині» 3, «Майстери» 2. Строге правило з'їло б 63 з 80;
 *   • розділювач між роком і назвою вистави — ЧОТИРИ різні символи: `-` (234),
 *     `─` U+2500 (54), `—` U+2014 (40), `–` U+2013 (16). Плюс форми «2010 рік»
 *     і «2010 г»;
 *   • у 21 записі з 80 у вистав РОКУ НЕМА взагалі, а форма інша:
 *     `- «Назва»: роль;` замість `2003 ─ «Назва», роль`. Тому рік опціональний,
 *     і нічого не підставляється;
 *   • відділення позначені емодзі: 🎭 театр (усі 80), 🎵 музика, 🎤 вокал,
 *     🎨 мистецтво, 🎹 фортепіано. Незнайомий емодзі йде у звіт, а не в null;
 *   • назви вистав часто російською («Сказки Пушкина») — це історичні назви,
 *     вони зберігаються дослівно й не перекладаються.
 */
import fs from 'node:fs';
import path from 'node:path';

const IN_DIR = process.argv.includes('--in')
	? process.argv[process.argv.indexOf('--in') + 1]
	: path.join('.temp', 'ats-ua');

const outArg = process.argv.find((a) => a.startsWith('--out='));
const OUT_DIR = outArg ? outArg.slice('--out='.length) : path.join(IN_DIR, 'parsed');

/** Емодзі-маркери відділень. Незнайомий — у звіт, не в тишу. */
const DEPARTMENTS: Record<string, string> = {
	'🎭': 'theatre',
	'🎵': 'music',
	'🎤': 'vocal',
	'🎨': 'art',
	'🎹': 'piano'
};

/**
 * Усі п'ять написань мітки майстра, заміряні в дампі.
 *
 * Значення захоплюється разом із міткою: у 17 рядках воно стоїть НА ТОМУ САМОМУ
 * рядку (`Майстер курсу: Ісачкіна Т.В.`), а не наступним. Перша версія вимагала
 * кінця рядка після двокрапки й через це втратила і мітку, і майстра.
 *
 * Основа тут «Майст», а не «Майстр», і це не дрібниця: у формах «Майстер» і
 * «Майстери» літера «е» стоїть ПЕРЕД «р». Перша версія з основою «Майстр»
 * пропускала їх обидві — 23 рядки нерозібраного, з яких 13 самих міток і 10
 * майстрів під ними.
 */
const MASTER_LABEL = /^Майст(?:ер|ери|риня|рині|ри)\s+курсу\s*:?\s*(.*)$/u;

/**
 * Назва вистави: гілочки АБО прямі лапки.
 *
 * У дампі трапляється і `«Русалочка»`, і `"Королівство кривих дзеркал"` —
 * близько 25 рядків. Перша версія приймала лише гілочки, і ці вистави тихо
 * ставали «нерозібраним рядком».
 */
const TITLE = /[«"“]([^»"”]+)[»"”]/u;

/**
 * Google Sites не віддає зовнішнє посилання прямо: воно обгорнуте у власний
 * редирект `https://www.google.com/url?q=<адреса>`. Через це 127 підписів
 * «Facebook»/«Instagram» лишилися без адрес — хост у них `www.google.com`, а не
 * `facebook.com`. Розгортається тут, один раз для всіх правил.
 */
function unwrapGoogleRedirect(href: string): string {
	try {
		const url = new URL(href);
		if (url.hostname === 'www.google.com' && url.pathname === '/url') {
			const target = url.searchParams.get('q');
			if (target) return target;
		}
	} catch {
		return href;
	}
	return href;
}

/** Чотири різні тире плюс словесні форми року. */
const YEAR_PREFIX = /^\s*[-–—]?\s*(\d{4})\s*(?:р(?:ік|\.)?|г\.?)?\s*[-–—─:]?\s*/u;

const SOCIAL_HOSTS: Record<string, string> = {
	'facebook.com': 'facebook',
	'www.facebook.com': 'facebook',
	'instagram.com': 'instagram',
	'www.instagram.com': 'instagram',
	'youtube.com': 'youtube',
	'www.youtube.com': 'youtube',
	'tiktok.com': 'tiktok',
	'www.tiktok.com': 'tiktok',
	'uk.wikipedia.org': 'wikipedia'
};

interface ImageRef {
	src: string;
	alt: string;
	width: number;
	height: number;
}

interface SectionRecord {
	id: string;
	heading: string;
	text: string;
	images: ImageRef[];
	links: string[];
}

interface PageRecord {
	url: string;
	slug: string;
	file: string;
	title: string;
	sections: SectionRecord[];
	images: ImageRef[];
}

interface Play {
	year: number | null;
	title: string;
	roles: string[];
	/** «Посвята в Мистетство» — окремий цикл, не звичайна вистава. */
	dedication: boolean;
	/**
	 * Ні року, ні ролі — тобто це може бути й не вистава, а назва групи або
	 * гуртка в лапках. Не викидається (втрата даних гірша), але позначається:
	 * звіт рахує такі окремо, і вони входять у перелік «перевірити руками».
	 */
	uncertain: boolean;
}

interface Graduate {
	slug: string;
	source: { url: string; code: string; year: number };
	name: string;
	departments: string[];
	enrollmentYears: number[];
	graduationYear: number | null;
	masters: { name: string; department: string | null }[];
	group: { abbr: string | null; name: string | null } | null;
	socials: { network: string; url: string }[];
	plays: Play[];
	duringStudies: string | null;
	afterGraduation: string | null;
	/** Абзаци без мітки — власні слова випускника. Див. `looksLikeProse`. */
	bio: string[];
	festivals: string[];
	photo: ImageRef | null;
	/** Те, чого парсер не зрозумів. Порожній масив — мета, а не даність. */
	unparsed: string[];
}

/**
 * Українська латиниця для slug.
 *
 * На початку слова `є ї й ю я` дають `ye yi y yu ya`, у середині — `ie i i iu ia`
 * (офіційний стандарт). Без цієї різниці «Єлизавета» стала б `ielyzaveta`.
 */
const TRANSLIT_INITIAL: Record<string, string> = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' };
const TRANSLIT: Record<string, string> = {
	а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh',
	з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n',
	о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
	ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia',
	// російські літери трапляються в іменах і назвах
	ы: 'y', э: 'e', ё: 'e', ъ: '', 'ʼ': '', "'": '', '’': ''
};

function transliterate(input: string): string {
	const words = input.toLowerCase().split(/\s+/);
	return words
		.map((word) =>
			[...word]
				.map((char, index) =>
					index === 0 && TRANSLIT_INITIAL[char] ? TRANSLIT_INITIAL[char] : (TRANSLIT[char] ?? char)
				)
				.join('')
		)
		.join('-')
		.replace(/[^a-z0-9-]/g, '-')
		.replace(/-{2,}/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * Кириличні двійники латинських літер → латиниця.
 *
 * У дампі є підпис `Іnstagram`, що починається з УКРАЇНСЬКОЇ «І» (U+0406).
 * Оком не відрізнити, і саме тому один запис лишався без адреси Instagram.
 * Застосовується лише до коротких підписів кнопок, не до тексту.
 */
const HOMOGLYPHS: Record<string, string> = {
	А: 'A', В: 'B', Е: 'E', І: 'I', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P',
	С: 'C', Т: 'T', Х: 'X', а: 'a', е: 'e', і: 'i', о: 'o', р: 'p', с: 'c',
	у: 'y', х: 'x'
};

const deHomoglyph = (text: string) => [...text].map((c) => HOMOGLYPHS[c] ?? c).join('');

const isEmojiOnly = (line: string) => line.length > 0 && !/[\p{L}\p{N}]/u.test(line);

/**
 * Рядок біографії без жодної мітки.
 *
 * Таких у дампі 51: люди просто дописували про себе абзацами, без «Після
 * випуску:». Складати їх у `unparsed` означало б викинути найцінніше — власні
 * слова випускників. Тому вони йдуть у `bio`, а звіт окремо називає їхню
 * кількість: рішення видиме, а не тихе.
 */
const looksLikeProse = (line: string) =>
	line.length > 40 && /\s/u.test(line) && /[\p{L}]{3,}/u.test(line);
const isSeparator = (line: string) => /^[_—–\-=.\s]{4,}$/u.test(line);

/** Розбирає рядок вистави. `null` — рядок не про виставу. */
function parsePlay(line: string): Play | null {
	const raw = line.trim();
	if (!TITLE.test(raw)) return null;

	let rest = raw;
	let year: number | null = null;

	const yearMatch = YEAR_PREFIX.exec(rest);
	if (yearMatch) {
		year = Number(yearMatch[1]);
		rest = rest.slice(yearMatch[0].length);
	} else {
		rest = rest.replace(/^\s*[-–—]\s*/u, '');
	}

	// «Посвята в Мистетство» стоїть МІЖ роком і назвою — це окремий цикл, і в
	// дампі він написаний саме так, з друкарською помилкою в слові.
	let dedication = false;
	const dedicationMatch = /^Посвят[аи]\s+в\s+Мисте(тс|цт)тво\s*[,:]?\s*/iu.exec(rest);
	if (dedicationMatch) {
		dedication = true;
		rest = rest.slice(dedicationMatch[0].length);
	}

	const titleMatch = TITLE.exec(rest);
	if (!titleMatch) return null;

	const title = titleMatch[1].trim();
	// Роль(і) — усе після назви, відділене комою або двокрапкою; `;` — кінець.
	const tail = rest
		.slice(titleMatch.index + titleMatch[0].length)
		.replace(/^\s*[,:—–-]\s*/u, '')
		.replace(/[;.]\s*$/u, '')
		.trim();

	const roles = tail
		? tail
				.split(/\s*,\s*/u)
				.map((r) => r.trim())
				.filter(Boolean)
		: [];

	return { year, title, roles, dedication, uncertain: year === null && roles.length === 0 };
}

/**
 * Портрет випускника серед зображень секцій.
 *
 * Логотипи, іконки й прикраси повторюються на кожній сторінці, тому вони
 * відкидаються за частотою: адреса, що трапилася більш ніж на десятьох
 * сторінках, — це оформлення сайту, а не портрет. Так правило не залежить від
 * конкретних імен файлів Google.
 */
function pickPhoto(record: PageRecord, srcFrequency: Map<string, number>): ImageRef | null {
	const candidates = record.sections
		.flatMap((s) => s.images)
		.filter((img) => (srcFrequency.get(img.src) ?? 0) <= 10)
		.filter((img) => img.width >= 100 && img.height >= 100);

	if (candidates.length === 0) return null;
	return candidates.sort((a, b) => b.width * b.height - a.width * a.height)[0];
}

function parseGraduate(record: PageRecord, srcFrequency: Map<string, number>): Graduate {
	const url = new URL(record.url);
	const segments = url.pathname.split('/').filter(Boolean);
	const code = decodeURIComponent(segments[segments.length - 1]);
	const year = Number(segments[segments.length - 2]);

	const departments: string[] = [];
	const unparsed: string[] = [];

	for (const char of [...record.title]) {
		if (!/[\p{L}\p{N}\s]/u.test(char)) {
			const known = DEPARTMENTS[char];
			if (known) {
				if (!departments.includes(known)) departments.push(known);
			} else {
				unparsed.push(`невідомий емодзі-маркер у заголовку: ${char}`);
			}
		}
	}

	const lines = record.sections
		.flatMap((s) => s.text.split('\n'))
		.map((l) => l.trim())
		.filter((l) => l.length > 0);

	const consumed = new Set<number>();
	const take = (index: number) => consumed.add(index);

	let name = '';
	let graduationYear: number | null = null;
	const enrollmentYears: number[] = [];
	const masters: { name: string; department: string | null }[] = [];
	let group: { abbr: string | null; name: string | null } | null = null;
	const socials: { network: string; url: string }[] = [];
	const plays: Play[] = [];
	const festivals: string[] = [];
	const during: string[] = [];
	const after: string[] = [];
	const bio: string[] = [];

	let mode: 'none' | 'masters' | 'during' | 'after' = 'none';

	for (let i = 0; i < lines.length; i++) {
		// Рядок, уже спожитий правилом наперед (розшифровка групи стоїть
		// НАСТУПНИМ рядком після мітки), не обробляється вдруге.
		//
		// Цього рядка спершу не було: `consumed` заповнювався й НЕ читався
		// ніколи. Наслідок був тихий і показовий — назва групи Аліка
		// «Захисники театральних куліс» потрапляла і в `group.name`, і в
		// `plays` як вистава без року й ролі. Тобто механізм існував, виглядав
		// робочим і не працював.
		if (consumed.has(i)) continue;

		const line = lines[i];

		if (isSeparator(line)) {
			take(i);
			mode = 'none';
			continue;
		}

		// Заголовок секції повторює сам себе — це не дані.
		if (isEmojiOnly(line) || line === 'Вистави та ролі' || /^Вистави\b/u.test(line)) {
			take(i);
			continue;
		}

		if (/рік\s+вступу/u.test(line)) {
			take(i);
			mode = 'none';
			for (const match of line.matchAll(/\d{4}/gu)) enrollmentYears.push(Number(match[0]));
			continue;
		}

		if (/рік\s+випуску/u.test(line)) {
			take(i);
			mode = 'none';
			const match = /\d{4}/u.exec(line);
			if (match) graduationYear = Number(match[0]);
			continue;
		}

		const masterLabel = MASTER_LABEL.exec(line);
		if (masterLabel) {
			take(i);
			mode = 'masters';
			// Значення на тому самому рядку — теж майстер, а не сміття.
			const inline = masterLabel[1].trim();
			if (inline) {
				const emoji = [...inline].find((c) => DEPARTMENTS[c]);
				masters.push({
					name: inline.replace(/^\P{L}+/u, '').trim(),
					department: emoji ? DEPARTMENTS[emoji] : null
				});
			}
			continue;
		}

		if (/^Назва\s+групи\s*:/u.test(line)) {
			take(i);
			mode = 'none';
			const value = line.replace(/^Назва\s+групи\s*:\s*/u, '').trim();
			const quoted = /^["«”“](.+)["»”“]$/u.exec(value);
			if (quoted) {
				group = { abbr: null, name: quoted[1].trim() };
			} else {
				group = { abbr: value || null, name: null };
				// Розшифровка стоїть НАСТУПНИМ рядком у лапках: `ЗТК` / `"Захисники…"`.
				const next = lines[i + 1];
				if (next && /^["«”“].+["»”“]$/u.test(next)) {
					group.name = next.replace(/^["«”“]|["»”“]$/gu, '').trim();
					take(i + 1);
				}
			}
			continue;
		}

		if (/^Під\s+час\s+навчання/iu.test(line)) {
			take(i);
			mode = 'during';
			during.push(line);
			continue;
		}

		if (/^Після\s+випуску\s*:?/iu.test(line)) {
			take(i);
			mode = 'after';
			const inline = line.replace(/^Після\s+випуску\s*:?\s*/iu, '').trim();
			if (inline) after.push(inline);
			continue;
		}

		// Прапорці країн — рядок про фестиваль.
		if (/^\p{Regional_Indicator}/u.test(line)) {
			take(i);
			festivals.push(line);
			continue;
		}

		const social = /^(Facebook|Instagram|YouTube|TikTok|Wikipedia|Вікіпедія)\s*$/iu.exec(
			deHomoglyph(line)
		);
		if (social) {
			take(i);
			const network = social[1].toLowerCase().replace('вікіпедія', 'wikipedia');
			const link = record.sections
				.flatMap((s) => s.links)
				.map(unwrapGoogleRedirect)
				.find((href) => {
					try {
						return SOCIAL_HOSTS[new URL(href).hostname] === network;
					} catch {
						return false;
					}
				});
			if (link) socials.push({ network, url: link });
			else unparsed.push(`підпис «${social[1]}» без адреси в посиланнях секції`);
			continue;
		}

		// Розшифровка групи окремим рядком у лапках — ПЕРЕД розбором вистав.
		// Порядок не косметичний: `"Мультяшки"` і `"Дєвішнік"` — це назви груп,
		// і при зворотному порядку вони ставали «виставами без року й ролі».
		if (group && !group.name && /^["«”“].+["»”“]$/u.test(line)) {
			take(i);
			group.name = line.replace(/^["«”“]|["»”“]$/gu, '').trim();
			continue;
		}

		const play = parsePlay(line);
		if (play) {
			take(i);
			mode = 'none';
			plays.push(play);
			continue;
		}

		if (mode === 'masters') {
			take(i);
			const emoji = [...line].find((c) => DEPARTMENTS[c]);
			masters.push({
				name: line.replace(/^\P{L}+/u, '').trim(),
				department: emoji ? DEPARTMENTS[emoji] : null
			});
			continue;
		}

		if (mode === 'during') {
			take(i);
			during.push(line);
			continue;
		}

		if (mode === 'after') {
			take(i);
			after.push(line);
			continue;
		}

		// Ім'я — перший змістовний рядок до будь-якої мітки.
		if (!name && /^[\p{Lu}]/u.test(line) && !line.includes(':') && line.split(/\s+/).length <= 4) {
			take(i);
			name = line;
			continue;
		}

		if (looksLikeProse(line)) {
			take(i);
			bio.push(line);
			continue;
		}

		unparsed.push(line);
	}

	if (!name) unparsed.push('ІМ’Я НЕ РОЗПІЗНАНО');
	if (graduationYear === null) unparsed.push('РІК ВИПУСКУ НЕ РОЗПІЗНАНО');

	const photo = pickPhoto(record, srcFrequency);
	if (!photo) unparsed.push('ПОРТРЕТ НЕ ЗНАЙДЕНО');

	const slug = name ? transliterate(name) : `code-${transliterate(code)}`;

	return {
		slug,
		source: { url: record.url, code, year },
		name,
		departments,
		enrollmentYears,
		graduationYear,
		masters,
		group,
		socials,
		plays,
		duringStudies: during.length > 0 ? during.join('\n') : null,
		afterGraduation: after.length > 0 ? after.join('\n') : null,
		bio,
		festivals,
		photo,
		unparsed
	};
}

function main() {
	const manifestPath = path.join(IN_DIR, 'manifest.json');
	if (!fs.existsSync(manifestPath)) {
		console.error(`! немає ${manifestPath} — спершу запустіть npm run crawl:ats`);
		process.exit(1);
	}

	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { records: PageRecord[] };
	const graduatePages = manifest.records.filter((r) =>
		/\/GG\/\d{4}\/./.test(new URL(r.url).pathname)
	);

	if (graduatePages.length === 0) {
		console.error('! у манифесті немає сторінок випускників — перевірка мертва');
		process.exit(1);
	}

	// Частота адрес зображень по всьому сайту: так відсіюється оформлення.
	const srcFrequency = new Map<string, number>();
	for (const record of manifest.records) {
		for (const img of record.images) {
			srcFrequency.set(img.src, (srcFrequency.get(img.src) ?? 0) + 1);
		}
	}

	fs.mkdirSync(OUT_DIR, { recursive: true });

	const graduates = graduatePages.map((r) => parseGraduate(r, srcFrequency));

	// Колізія slug — це втрата запису при переїзді в маршрути, тож падаємо.
	const bySlug = new Map<string, string[]>();
	for (const g of graduates) {
		bySlug.set(g.slug, [...(bySlug.get(g.slug) ?? []), g.source.url]);
	}
	const collisions = [...bySlug.entries()].filter(([, urls]) => urls.length > 1);

	for (const graduate of graduates) {
		fs.writeFileSync(
			path.join(OUT_DIR, `${graduate.slug}.json`),
			JSON.stringify(graduate, null, 2),
			'utf8'
		);
	}

	const withProblems = graduates.filter((g) => g.unparsed.length > 0);
	const unparsedTotal = graduates.reduce((n, g) => n + g.unparsed.length, 0);

	const report = [
		'# Звіт розбору сторінок випускників',
		'',
		`Розібрано: **${graduates.length}** сторінок.`,
		`Записів без жодного питання: **${graduates.length - withProblems.length}**.`,
		`Нерозібраних рядків усього: **${unparsedTotal}**.`,
		'',
		'## Заповненість полів',
		''
	];

	const filled = (predicate: (g: Graduate) => boolean) => graduates.filter(predicate).length;
	const rows: [string, number][] = [
		['ім’я', filled((g) => g.name.length > 0)],
		['рік випуску', filled((g) => g.graduationYear !== null)],
		['рік вступу', filled((g) => g.enrollmentYears.length > 0)],
		['портрет', filled((g) => g.photo !== null)],
		['вистави', filled((g) => g.plays.length > 0)],
		['майстри', filled((g) => g.masters.length > 0)],
		['назва групи', filled((g) => g.group !== null)],
		['соцмережі', filled((g) => g.socials.length > 0)],
		['«після випуску»', filled((g) => g.afterGraduation !== null)],
		['«під час навчання»', filled((g) => g.duringStudies !== null)],
		['фестивалі', filled((g) => g.festivals.length > 0)],
		['біографія без мітки', filled((g) => g.bio.length > 0)]
	];
	report.push('| Поле | Записів | %  |', '|---|---:|---:|');
	for (const [label, count] of rows) {
		report.push(`| ${label} | ${count} | ${Math.round((count / graduates.length) * 100)}% |`);
	}

	report.push('', `Вистав усього: ${graduates.reduce((n, g) => n + g.plays.length, 0)}`);
	report.push(
		`З них без року: ${graduates.reduce((n, g) => n + g.plays.filter((p) => p.year === null).length, 0)}`
	);
	report.push(
		`«Посвята в Мистетство»: ${graduates.reduce((n, g) => n + g.plays.filter((p) => p.dedication).length, 0)}`
	);
	report.push(
		`Сумнівних (ні року, ні ролі — можливо, назва групи): ${graduates.reduce((n, g) => n + g.plays.filter((p) => p.uncertain).length, 0)}`
	);

	if (collisions.length > 0) {
		report.push('', '## Колізії slug — ЛАГОДИТИ ДО ПЕРЕЇЗДУ', '');
		for (const [slug, urls] of collisions) report.push(`- \`${slug}\`: ${urls.join(', ')}`);
	}

	// Сумнівні вистави — теж перелік для перевірки, і саме тут його місце:
	// «Дуэнья» і «Голый король» справді вистави, а «Дєвішнік» і «Шевчушки» —
	// назви груп. Відрізнити їх правилом неможливо, тому вирішує людина.
	const uncertainPlays = graduates.flatMap((g) =>
		g.plays.filter((p) => p.uncertain).map((p) => `- \`${g.slug}\` → «${p.title}»`)
	);
	if (uncertainPlays.length > 0) {
		report.push(
			'',
			'## Вистава чи назва групи? — вирішити руками',
			'',
			'Ні року, ні ролі. Записи лишилися у `plays` із позначкою `uncertain`.',
			'',
			...uncertainPlays
		);
	}

	if (withProblems.length > 0) {
		report.push('', '## Перевірити руками', '');
		for (const graduate of withProblems) {
			report.push(`### ${graduate.name || graduate.source.code} — ${graduate.source.url}`, '');
			for (const item of graduate.unparsed) report.push(`- ${item}`);
			report.push('');
		}
	}

	fs.writeFileSync(path.join(IN_DIR, 'parse-report.md'), report.join('\n'), 'utf8');

	console.log(`OK розібрано ${graduates.length} сторінок → ${path.resolve(OUT_DIR)}`);
	console.log(`   без питань: ${graduates.length - withProblems.length}`);
	console.log(`   нерозібраних рядків: ${unparsedTotal}`);
	console.log(`   колізій slug: ${collisions.length}`);
	console.log(`   звіт: ${path.resolve(path.join(IN_DIR, 'parse-report.md'))}`);
}

main();
