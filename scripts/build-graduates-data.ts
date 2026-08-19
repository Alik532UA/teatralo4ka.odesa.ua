/**
 * Дані випускників для сайту з розібраного дампа старого сайту.
 *
 * Вхід:  `.temp/ats-ua/parsed/<slug>.json` (npm run parse:graduates)
 *        `src/lib/data/graduates.index.json` (наявний індекс на 482 людини)
 * Вихід: той самий індекс із полем `code` і свіжим `playCount`
 *        `static/graduates/profiles/<code>.json` — повний профіль на кожного,
 *        хто має сторінку (80 із 482)
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
	socials?: { network: string; url: string }[];
	playCount?: number;
	sourceUrl?: string;
}

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

const index: IndexEntry[] = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
const before = index.map((entry) => `${entry.slug}|${entry.name}|${entry.graduationYear}`);

let matched = 0;
const profiles: Record<string, unknown>[] = [];

for (const entry of index) {
	if (!entry.sourceUrl) continue;

	const code = codeFromUrl(entry.sourceUrl);
	const record = byCode.get(code);
	if (!record) throw new Error(`індекс посилається на ${code}, якого немає серед розібраних`);
	matched += 1;

	entry.code = code;
	entry.playCount = record.plays.length;

	profiles.push({
		code,
		slug: entry.slug,
		name: entry.name,
		graduationYear: entry.graduationYear,
		enrollmentYears: record.enrollmentYears,
		departments: entry.departments,
		hasPhoto: entry.hasPhoto ?? false,
		group: record.group?.name ?? record.group?.abbr ?? null,
		masters: record.masters.map((master) => master.name),
		socials: record.socials,
		// Вистава віддається дослівним рядком, а не розкладеною на назву й роль:
		// див. коментар до `Play.text` у `parse-graduates.ts` — на частині рядків
		// структурний розбір бере за назву п'єсу зі середини ролі.
		plays: record.plays.map((play) => ({ year: play.year, text: play.text })),
		bio: record.bio,
		festivals: record.festivals,
		duringStudies: record.duringStudies,
		afterGraduation: record.afterGraduation,
		sourceUrl: entry.sourceUrl
	});
}

if (matched !== parsed.length) {
	throw new Error(`розібрано ${parsed.length} сторінок, а в індексі знайдено ${matched}`);
}

// Перевірка того, що скрипт НЕ мав змінювати. Без неї найтихіша можлива поломка —
// зсув транслітерації — пройшла б непоміченою й відв'язала портрети від людей.
const after = index.map((entry) => `${entry.slug}|${entry.name}|${entry.graduationYear}`);
if (before.length !== after.length || before.some((row, i) => row !== after[i])) {
	throw new Error('slug / ім’я / рік змінилися — цього робити не можна');
}

fs.writeFileSync(INDEX_FILE, JSON.stringify(index), 'utf8');

fs.rmSync(PROFILES_DIR, { recursive: true, force: true });
fs.mkdirSync(PROFILES_DIR, { recursive: true });
for (const profile of profiles) {
	fs.writeFileSync(path.join(PROFILES_DIR, `${profile.code}.json`), JSON.stringify(profile), 'utf8');
}

const plays = profiles.reduce((sum, p) => sum + (p.plays as unknown[]).length, 0);
const bio = profiles.reduce((sum, p) => sum + (p.bio as unknown[]).length, 0);
const bytes = fs
	.readdirSync(PROFILES_DIR)
	.reduce((sum, file) => sum + fs.statSync(path.join(PROFILES_DIR, file)).size, 0);

console.log(`OK індекс: ${index.length} записів, з них ${matched} із кодом сторінки`);
console.log(`OK профілі: ${profiles.length} файлів у ${PROFILES_DIR}`);
console.log(`   вистав ${plays}, абзаців біографії ${bio}, разом ${Math.round(bytes / 1024)} КБ`);
console.log(`   найбільший профіль: ${Math.round(Math.max(...fs.readdirSync(PROFILES_DIR).map((f) => fs.statSync(path.join(PROFILES_DIR, f)).size)) / 1024)} КБ`);
