/**
 * Дані випускників із розібраного дампа старого сайту — ДОЗАПОВНЕННЯ, а не
 * перезбирання.
 *
 * Вхід:  `.temp/ats-ua/parsed/<slug>.json` (npm run parse:graduates)
 *        `src/lib/data/graduates.index.json` — наявний реєстр
 *        `static/graduates/profiles/<адреса>.json` — наявні анкети
 * Вихід: ті самі файли, доповнені тим, чого в них бракує
 *
 * ## Чому «дозаповнення» і що було до цього
 *
 * Дамп Google-сайту був ОДНОРАЗОВИМ джерелом: сайт відтоді закрито, а живими
 * даними стали реєстр і анкети в цьому репозиторії. Скрипт же поводився так,
 * ніби дамп головний: перезаписував поля з нього, перейменовував файли й
 * витирав усю теку анкет перед записом. Заміряно 2026-09-01, що дав би
 * наступний запуск:
 *
 *   64 адреси змінилися б на коди старого сайту (`maryna-sukhanova` → `13M`,
 *     `nadiia-rybakova` → `98N`, `kateryna-kudlach` → `15K`);
 *   13 анкет зникли б назовсім — ті, яким немає відповідника в дампі, зокрема
 *     три створені руками й одна, куди того ж дня вписали майстрів;
 *   `id` зник би з усіх 93 анкет, `teachers` — із 41, `unlinkedGroups` — із 16,
 *     `photoCount` — із 5: дамп цих полів не знає;
 *   134 зв'язки `masters` перетворилися б з `{ id }` на `{ name }` — тобто
 *     сторінки викладачів утратили б усіх учнів, бо шукають за `id`;
 *   16 біографій, перекладених з російської руками, вернулися б до джерела;
 *   усі 93 файли з відступами стали б однорядковими.
 *
 * Тому тепер правило одне: скрипт ДОДАЄ те, чого немає, і не чіпає того, що є.
 * Поля, які веде репозиторій (`id`, адреса, ім'я, рік, зв'язки, переклади),
 * недоторканні за списком нижче. Прапорець `--from-dump` дозволяє освіжити
 * поля, які справді походять з дампа, але й він не чіпає ані адрес, ані
 * зв'язків, ані файлів, яких у дампі немає.
 *
 * ЧОМУ ІНДЕКС ПЕРЕТВОРЮЄТЬСЯ, А НЕ ЗБИРАЄТЬСЯ З НУЛЯ. У ньому 482 записи, і 402
 * з них мають лише ім'я з року — їхні `slug` уже вшиті в адреси портретів
 * (`static/graduates/<slug>-96.webp`) і в `data-testid` тестів. Перезбирання з
 * нуля перегенерувало б транслітерацію, і будь-яка розбіжність в одну літеру
 * тихо відв'язала б портрет від людини. Тому скрипт лишає `slug`, `name`,
 * `graduationYear` і `departments` недоторканими й ПЕРЕВІРЯЄ це,
 * а додає рівно те, чого бракує.
 *
 * Профілі лежать у `static/`, а не в бандлі: разом вони 60+ КБ, і тягнути їх
 * усі на сторінку галактики заради однієї відкритої картки — марно. Сторінка
 * профілю читає свій файл під час prerender, картка в галактиці — на кліку.
 */
import fs from 'node:fs';
import path from 'node:path';

const PARSED_DIR = path.join('.temp', 'ats-ua', 'parsed');
const INDEX_FILE = path.join('src', 'lib', 'data', 'graduates.index.json');
const PROFILES_DIR = path.join('static', 'graduates', 'profiles');

interface ParsedPlay {
	year: number | null;
	text: string;
	dedication: boolean;
	uncertain: boolean;
}

interface Parsed {
	slug: string;
	source: { url: string; code: string; year: number };
	name: string;
	departments: string[];
	enrollmentYears: number[];
	graduationYear: number | null;
	masters: { name: string; department: string | null }[];
	group: { abbr: string | null; name: string | null } | null;
	socials: { network: string; url: string }[];
	plays: ParsedPlay[];
	duringStudies: string | null;
	afterGraduation: string | null;
	bio: string[];
	festivals: string[];
	photo: { src: string; width: number; height: number } | null;
}

interface IndexEntry {
	slug: string;
	name: string;
	graduationYear: number | null;
	departments: string[];
	hasPhoto?: true;
	code?: string;
	enrollmentYears?: number[];
	group?: string;
	masters?: string[];
	playCount?: number;
	profileSize?: number;
}

/**
 * Освіжати поля, що походять з дампа, навіть якщо вони вже заповнені.
 *
 * Без прапорця скрипт лише дозаповнює. З ним — перезаписує `plays`, `bio` й
 * решту дампових полів, і це свідомий крок: у `bio` шістнадцять абзаців
 * перекладено руками, і дамп поверне їх до російської.
 */
const FROM_DUMP = process.argv.includes('--from-dump');

/**
 * Поля анкети, які веде РЕПОЗИТОРІЙ. Скрипт їх не пише ніколи.
 *
 * `id` і `code` — ключ зв'язків і адреса: на них указують склади вистав, групи
 * й фестивалі. `masters` і `teachers` — зв'язки за `id`, яких дамп не має
 * взагалі. `unlinkedGroups`, `photoCount`, `kind`, `visibility`, `videoUrl`
 * з'явилися вже в репозиторії.
 */
const REPO_OWNED = new Set([
	'id',
	'code',
	'slug',
	'name',
	'graduationYear',
	'hasPhoto',
	'masters',
	'teachers',
	'unlinkedGroups',
	'photoCount',
	'kind',
	'visibility',
	'videoUrl'
]);

/**
 * Поля дампа, які в анкету НЕ пишемо, бо їх ніхто не читає.
 *
 * `group` — назва групи так, як вона стояла на старому сайті. У типі
 * `GraduateProfile` його немає, і сторінка малює групи зі `memberIds` самих
 * груп та з `unlinkedGroups`. Заміряно: дозаповнення додало б рядок у 58
 * анкет, тобто зайві байти в кожен запит сторінки заради поля, яке нічого не
 * показує. Якщо колись знадобиться — дамп на місці.
 */
const IGNORED_FROM_DUMP = new Set(['group']);

/** Код сторінки зі старої адреси: `…/GG/2015/15K` → `15K`. */
function codeFromUrl(url: string): string {
	const clean = url.split('?')[0].replace(/\/+$/u, '');
	return clean.slice(clean.lastIndexOf('/') + 1);
}

const parsed: Parsed[] = fs
	.readdirSync(PARSED_DIR)
	.filter((file) => file.endsWith('.json'))
	.map((file) => JSON.parse(fs.readFileSync(path.join(PARSED_DIR, file), 'utf8')) as Parsed);

const byCode = new Map(parsed.map((record) => [record.source.code, record]));
if (byCode.size !== parsed.length) throw new Error('коди сторінок не унікальні');

/**
 * Адреса-джерело живе у профілі, а не в індексі, тож ключ з'єднання беремо
 * звідти. Раніше він лежав в індексі й їхав у клієнтський бандл на кожну
 * сторінку сайту заради скрипта, який у браузері не виконується ніколи.
 *
 * Файл названий АДРЕСОЮ: код, якщо він є, інакше слаг. Довго тут стояв самий
 * `entry.code` із приміткою «перевірено на всіх 90» — і це була правда про 90 із
 * 93. Три профілі (`illia-tryfonov`, `mykhailo-priadko`, `olena-beluhina`)
 * створені руками й названі слагом, бо коду в тих людей немає; за старою умовою
 * скрипт їх не бачив і `sourceUrl` у них губився.
 */
function sourceUrlOf(entry: IndexEntry): string | null {
	const address = entry.code ?? entry.slug;
	if (!address) return null;
	const file = path.join(PROFILES_DIR, `${address}.json`);
	if (!fs.existsSync(file)) return null;
	const profile = JSON.parse(fs.readFileSync(file, 'utf8')) as { sourceUrl?: string };
	return profile.sourceUrl ?? null;
}

const index: IndexEntry[] = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
const before = index.map(
	(entry) => `${entry.slug}|${entry.name}|${entry.graduationYear}|${entry.code ?? ''}`
);

let matched = 0;
const profiles: { file: string; json: string; data: Record<string, unknown> }[] = [];
/** Що дописано вперше і що освіжено — для звіту, а не для логіки. */
const filled: string[] = [];
const refreshed: string[] = [];
/** Анкети, чиє джерело старіше за дамп — їх не чіпаємо. */
const skippedNoDump: string[] = [];

for (const entry of index) {
	const sourceUrl = sourceUrlOf(entry);
	if (!sourceUrl) continue;

	const code = codeFromUrl(sourceUrl);
	const record = byCode.get(code);
	if (!record) {
		/*
		 * Анкета вказує на сторінку, якої в дампі немає, і це НЕ помилка.
		 *
		 * Доти тут стояв `throw`, і через дві такі анкети (`albinaabuladze` за
		 * 2026 рік і `daria-kristiian` за 2025) скрипт узагалі не міг
		 * завершитися — заміряно 2026-09-01. Дамп збирали раніше за ті
		 * сторінки, тож розбіжність показує вік дампа, а не поломку даних.
		 *
		 * За логікою «дозаповнення» відповідь очевидна: заповнювати нічим, отже
		 * анкету лишаємо як є. Обов'язковою лишається зворотна умова — кожен
		 * запис ДАМПА мусить знайти свого власника (перевірка нижче).
		 */
		skippedNoDump.push(`${entry.slug} → ${code}`);
		continue;
	}
	matched += 1;

	/*
	 * `entry.code` НЕ перезаписується: адреса людини живе в реєстрі, і саме
	 * вона визначає URL сторінки (`graduateAddress` = `code ?? slug`). Доти тут
	 * стояло `entry.code = code`, і це перетворювало 64 людські адреси на коди
	 * старого сайту. Код із дампа потрібен лише для З'ЄДНАННЯ вище.
	 */
	/*
	 * `playCount` рахується з АНКЕТИ, а не з дампа, і рахується нижче — після
	 * злиття. Заміряно 2026-09-01: у дванадцяти людей анкета має більше вистав,
	 * ніж дамп (у Катерини Мунтян 9 проти 4), бо їх дописували руками. Число з
	 * дампа зменшило б лічильник на сторінці, хоч самі вистави лишилися б на
	 * місці.
	 */

	const profileData = {
		code,
		slug: entry.slug,
		name: entry.name,
		graduationYear: entry.graduationYear,
		enrollmentYears: record.enrollmentYears,
		departments:
			record.departments && record.departments.length > 0 ? record.departments : entry.departments,
		hasPhoto: entry.hasPhoto ?? false,
		group: record.group?.name ?? record.group?.abbr ?? null,
		masters: record.masters,
		socials: record.socials,
		// Вистава віддається дослівним рядком, а не розкладеною на назву й роль:
		// див. коментар до `Play.text` у `parse-graduates.ts` — на частині рядків
		// структурний розбір бере за назву п'єсу зі середини ролі.
		plays: record.plays.map((play) => ({ year: play.year, text: play.text })),
		bio: record.bio,
		festivals: record.festivals,
		duringStudies: record.duringStudies,
		afterGraduation: record.afterGraduation,
		sourceUrl
	};

	/*
	 * ЗЛИТТЯ, а не заміна. Основа — те, що вже лежить у файлі; з дампа беруться
	 * лише поля, яких немає (або всі дампові, якщо просили `--from-dump`), і
	 * ніколи ті, що в `REPO_OWNED`.
	 *
	 * Порядок ключів успадковується від наявного файлу, тож дописане поле
	 * з'являється в кінці, а решта не «перемішується» — дифи лишаються
	 * читабельними.
	 */
	const address = entry.code ?? entry.slug;
	const file = path.join(PROFILES_DIR, `${address}.json`);
	const existing = fs.existsSync(file)
		? (JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>)
		: {};

	const merged: Record<string, unknown> = { ...existing };
	for (const [key, value] of Object.entries(profileData)) {
		if (REPO_OWNED.has(key) || IGNORED_FROM_DUMP.has(key)) continue;
		/*
		 * Порожнім значенням поле не заводимо. Перший прогін дописав
		 * `"group": null` у всі вісімдесят анкет — рядок, який нічого не
		 * повідомляє, зате дає вісімдесят файлів у дифі. Відсутнє поле й поле
		 * зі `null` застосунок читає однаково (`profile?.group`).
		 */
		const порожнє =
			value === null ||
			value === undefined ||
			value === '' ||
			(Array.isArray(value) && value.length === 0);
		const missing = merged[key] === undefined || merged[key] === null;
		if (порожнє && missing) continue;
		if (missing || FROM_DUMP) {
			if (!missing) refreshed.push(`${address}.${key}`);
			else filled.push(`${address}.${key}`);
			merged[key] = value;
		}
	}
	// Адреса й ключ зв'язків — з РЕЄСТРУ, і лише якщо в анкеті їх ще немає.
	if (merged.id === undefined) merged.id = entry.slug;
	if (merged.code === undefined) merged.code = address;
	if (merged.slug === undefined) merged.slug = entry.slug;

	entry.playCount = ((merged.plays as unknown[]) ?? []).length;

	const profileJson = JSON.stringify(merged, null, '\t') + '\n';
	entry.profileSize = Buffer.byteLength(profileJson, 'utf8');

	profiles.push({ file, json: profileJson, data: merged });
}

if (matched !== parsed.length) {
	throw new Error(`розібрано ${parsed.length} сторінок, а в індексі знайдено ${matched}`);
}

// Перевірка того, що скрипт НЕ мав змінювати. Без неї найтихіша можлива поломка —
// зсув транслітерації — пройшла б непоміченою й відв'язала портрети від людей.
const after = index.map(
	(entry) => `${entry.slug}|${entry.name}|${entry.graduationYear}|${entry.code ?? ''}`
);
if (before.length !== after.length || before.some((row, i) => row !== after[i])) {
	throw new Error('slug / ім’я / рік / адреса змінилися — цього робити не можна');
}

fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, '\t') + '\n', 'utf8');

/*
 * Теку НЕ витираємо. Доти тут стояло `fs.rmSync(PROFILES_DIR)`, і кожен запуск
 * лишав рівно ті 80 файлів, що є в дампі, — а тринадцять інших, зокрема
 * створені руками, зникали без слова.
 *
 * Файл переписується лише тоді, коли вміст справді інший: інакше запуск
 * оновлював би час зміни в дев'яноста трьох файлах і показував у git
 * порожній діф.
 */
fs.mkdirSync(PROFILES_DIR, { recursive: true });
let written = 0;
for (const profile of profiles) {
	const same = fs.existsSync(profile.file) && fs.readFileSync(profile.file, 'utf8') === profile.json;
	if (same) continue;
	fs.writeFileSync(profile.file, profile.json, 'utf8');
	written += 1;
}

const plays = profiles.reduce((sum, p) => sum + ((p.data.plays as unknown[]) ?? []).length, 0);
const bio = profiles.reduce((sum, p) => sum + ((p.data.bio as unknown[]) ?? []).length, 0);
const bytes = fs
	.readdirSync(PROFILES_DIR)
	.reduce((sum, file) => sum + fs.statSync(path.join(PROFILES_DIR, file)).size, 0);

console.log(`OK індекс: ${index.length} записів, з них ${matched} із кодом сторінки`);
console.log(`OK профілі: ${profiles.length} зіставлено, ${written} переписано`);
console.log(`   дозаповнено полів: ${filled.length}${filled.length ? ` (${filled.slice(0, 8).join(', ')}${filled.length > 8 ? ', …' : ''})` : ''}`);
if (FROM_DUMP) console.log(`   освіжено з дампа: ${refreshed.length} полів`);
const untouched = fs.readdirSync(PROFILES_DIR).length - profiles.length;
console.log(`   не зіставлено з дампом і лишено як є: ${untouched} файлів`);
if (skippedNoDump.length) {
	console.log(`   джерело новіше за дамп, анкету не чіпали: ${skippedNoDump.join(', ')}`);
}
console.log(`   вистав ${plays}, абзаців біографії ${bio}, разом ${Math.round(bytes / 1024)} КБ`);
console.log(`   найбільший профіль: ${Math.round(Math.max(...fs.readdirSync(PROFILES_DIR).map((f) => fs.statSync(path.join(PROFILES_DIR, f)).size)) / 1024)} КБ`);
