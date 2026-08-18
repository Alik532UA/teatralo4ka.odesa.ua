/**
 * Повний реєстр випускників зі збереженої сторінки «Галактика випускників».
 *
 * ## Чому окремий скрипт, а не частина краулера
 *
 * Краулер обходив ПОСИЛАННЯ, тому знайшов лише тих, у кого є власна сторінка —
 * 80 із понад чотирьохсот. Решта на сторінці-індексі присутня просто текстом:
 * вони ще не заповнили анкету, тож сторінки в них немає й посилання нікуди не
 * веде. Обхід за посиланнями їх не побачить у принципі, скільки б його не
 * запускати.
 *
 * Тому вхід тут — збережена копія сторінки `/GG`, а не жива адреса: у ній є
 * розмітка списку цілком.
 *
 * ## Як розрізняються два види записів (заміряно, не вгадано)
 *
 *   ⭐️ Ім'я Прізвище 🎭   — усередині `<a href="/view/ats-ua/GG/<рік>/<код>">`,
 *                            тобто сторінка є, і її вміст уже розібраний
 *                            `parse-graduates.ts`;
 *   ✨ Ім'я Прізвище 🎭🎤  — просто текст, без посилання: анкети немає.
 *
 * ## Звідки береться рік випуску — і чому не з тексту
 *
 * Рік НЕ читається як «рядок перед групою імен». Це виглядало очевидним і
 * виявилося хибним аж тричі:
 *
 *   1. заголовки записані як `🌟 1998 🌟`, а не голими цифрами;
 *   2. у розмітці всі 28 заголовків ідуть ОДНИМ блоком спочатку (це навігаційна
 *      сітка вгорі сторінки), а імена — всі після них. Тобто послідовне
 *      «останній побачений рік» дає нісенітницю;
 *   3. у самому списку текстових маркерів року лише 20 із 28: для 2005, 2010,
 *      2019–2023 і 2025 їх немає взагалі. Через це 2018-й отримував 153
 *      випускники замість своїх.
 *
 * Правильний зв'язок структурний: кожна плитка року в навігації — це посилання
 * на ЯКІР у списку (`…/GG#h.53xehg1i9uz7`). Отже рік визначається геометрично:
 * знаходимо y кожного якоря, і кожне ім'я дістає той рік, чий якір стоїть
 * найближче ВИЩЕ за нього. Так усі 28 років працюють однаково, зокрема ті вісім,
 * що не мають текстового заголовка.
 *
 * Емодзі після імені — відділення, той самий набір, що в `parse-graduates.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser } from '@playwright/test';

const SOURCE =
	process.argv.find((a) => a.startsWith('--source='))?.slice('--source='.length) ??
	'C:/Users/alik5/Downloads/ODESA THEATER SCHOOL – копія.html.txt';

const OUT = path.join('.temp', 'ats-ua', 'roster.json');

/** Ті самі маркери, що в `parse-graduates.ts`. Незнайомий іде у звіт. */
const DEPARTMENTS: Record<string, string> = {
	'🎭': 'theatre',
	'🎵': 'music',
	'🎤': 'vocal',
	'🎨': 'art',
	'🎹': 'piano'
};

interface RosterEntry {
	name: string;
	graduationYear: number | null;
	departments: string[];
	/** Код сторінки, якщо вона є. `null` — анкету не заповнено. */
	code: string | null;
	sourceUrl: string | null;
}

interface Extracted {
	boundaries: { year: number; y: number }[];
	names: { text: string; y: number; href: string | null }[];
}

/**
 * Дістає з розмітки межі років і рядки імен.
 *
 * Окремою функцією, що ПОВЕРТАЄ значення, а не пише у зовнішню змінну: інакше
 * початкове значення тієї змінної ніде не читається, і `no-useless-assignment`
 * справедливо про це каже. Заразом `finally` тут закриває браузер незалежно від
 * того, чим скінчився розбір.
 */
async function extract(html: string): Promise<Extracted> {
	let browser: Browser | null = null;
	try {
		browser = await chromium.launch();
		// В'юпорт задається явно: рік визначається геометрично, тож розкладка мусить
		// бути такою, як на десктопі, а не типовою 800×600.
		const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
		// `setContent`, а не `goto(file://…)`: збережена копія має розширення
		// `.txt`, і браузер показав би її як текст, а не як розмітку.
		await page.setContent(html, { waitUntil: 'domcontentloaded' });
		await page.waitForTimeout(800);

		return await page.evaluate(() => {
			// Плитки років у навігації: текст без літер, усі цифри — один рік, і
			// всередині є посилання на якір у списку.
			const boundaries: { year: number; y: number }[] = [];
			for (const el of document.querySelectorAll('p')) {
				const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
				if (/\p{L}/u.test(text)) continue;
				if (!/^(?:19|20)\d{2}$/.test(text.replace(/\D/g, ''))) continue;

				const href =
					el.closest('a')?.getAttribute('href') ?? el.querySelector('a')?.getAttribute('href');
				if (!href || !href.includes('#')) continue;

				const anchor = document.getElementById(href.slice(href.indexOf('#') + 1));
				if (!anchor) continue;

				boundaries.push({
					year: Number(text.replace(/\D/g, '')),
					y: Math.round(anchor.getBoundingClientRect().y)
				});
			}

			// Імена — лише з блочних `p`/`li`: у розмітці рядок це
			// `<p><span>✨</span><span>Ім'я</span><span>🎭</span></p>`, тобто емодзі й
			// ім'я СУСІДИ. Обхід текстових вузлів давав то самотнє «✨», то обрізане
			// «Катерина» — 137 втрачених імен у першій версії.
			const names: { text: string; y: number; href: string | null }[] = [];
			for (const el of document.querySelectorAll('p, li')) {
				const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
				if (!/^[⭐✨]/u.test(text) || text.length < 7 || text.length > 120) continue;
				names.push({
					text,
					y: Math.round(el.getBoundingClientRect().y),
					href:
						el.closest('a')?.getAttribute('href') ??
						el.querySelector('a')?.getAttribute('href') ??
						null
				});
			}

			return { boundaries, names };
		});
	} finally {
		await browser?.close();
	}
}

async function main() {
	if (!fs.existsSync(SOURCE)) {
		console.error(`! немає ${SOURCE}`);
		process.exit(1);
	}

	const data = await extract(fs.readFileSync(SOURCE, 'utf8'));

	// Межі за зростанням y: рік випускника — той, чий якір найближче ВИЩЕ.
	const boundaries = [...data.boundaries].sort((a, b) => a.y - b.y);

	const entries: RosterEntry[] = [];
	const warnings: string[] = [];

	if (boundaries.length === 0) {
		console.error('! жодного якоря року не знайдено — розмітка змінилася, перевірка мертва');
		process.exit(1);
	}

	for (const { text, y, href } of data.names) {
		// Рік — той, чий якір стоїть найближче ВИЩЕ цього імені.
		let year: number | null = null;
		for (const boundary of boundaries) {
			if (boundary.y <= y) year = boundary.year;
			else break;
		}

		const departments: string[] = [];
		let name = '';
		for (const char of text) {
			if (DEPARTMENTS[char]) {
				if (!departments.includes(DEPARTMENTS[char])) departments.push(DEPARTMENTS[char]);
			} else if (/[\p{L}\p{Pd}'’ .]/u.test(char)) {
				name += char;
			}
		}
		name = name.replace(/\s+/g, ' ').trim();

		// «Заповнити анкету» — це заклик до дії поруч зі списком, а не випускник.
		// Ім'я мусить бути щонайменше з двох слів: так відсікаються й підписи
		// кнопок, і уламки розмітки.
		if (/анкет/i.test(name) || name.split(' ').length < 2) {
			if (!/анкет/i.test(name)) warnings.push(`не схоже на ім'я, пропущено: ${text}`);
			continue;
		}
		if (year === null) warnings.push(`${name}: рік не визначено — ім'я стоїть вище першого якоря`);
		if (departments.length === 0) warnings.push(`${name}: жодного маркера відділення`);

		const code = href ? decodeURIComponent(href.split('/').pop() ?? '') || null : null;

		entries.push({
			name,
			graduationYear: year,
			departments,
			code,
			sourceUrl: href ? `https://sites.google.com${href}` : null
		});
	}

	if (entries.length === 0) {
		console.error('! жодного випускника не знайдено — розмітка змінилася, перевірка мертва');
		process.exit(1);
	}

	// Дублікати імен реальні: тезки в різні роки. Падати не треба, але назвати —
	// так, бо далі з імені робиться slug, і там вони зіткнуться.
	const byName = new Map<string, number>();
	for (const entry of entries) byName.set(entry.name, (byName.get(entry.name) ?? 0) + 1);
	const twins = [...byName.entries()].filter(([, n]) => n > 1);

	fs.mkdirSync(path.dirname(OUT), { recursive: true });
	fs.writeFileSync(
		OUT,
		JSON.stringify({ source: SOURCE, total: entries.length, entries }, null, 2),
		'utf8'
	);

	const withPage = entries.filter((e) => e.code !== null).length;
	const years = entries.map((e) => e.graduationYear).filter((y): y is number => y !== null);

	console.log(`OK випускників ${entries.length}`);
	console.log(`   зі власною сторінкою: ${withPage}`);
	console.log(`   без анкети: ${entries.length - withPage}`);
	console.log(`   роки: ${Math.min(...years)}–${Math.max(...years)}`);
	console.log(`   тезок: ${twins.length}${twins.length ? ' — ' + twins.map(([n, c]) => `${n} ×${c}`).join(', ') : ''}`);
	console.log(`   ${path.resolve(OUT)}`);

	if (warnings.length > 0) {
		console.warn(`! питань ${warnings.length}:`);
		for (const warning of warnings.slice(0, 20)) console.warn(`   ${warning}`);
	}
}

main().catch((error) => {
	console.error('! розбір реєстру не завершився:', error);
	process.exit(1);
});
