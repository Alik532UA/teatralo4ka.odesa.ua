// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Гола довжина першим аргументом `minmax()` (FLUID-SIZING-v8 § 1.1, CRITICAL).
 *
 * `repeat(auto-fill, minmax(320px, 1fr))` читається як «колонка не вужча за
 * 320px, далі росте», і слово «мінімум» тут БУКВАЛЬНЕ: коли контейнер вужчий за
 * 320px, колонка однаково лишається 320px, а картка вилазить за сітку й жене
 * сторінку боком. `auto-fill` цього не рятує — він прибирає ПОРОЖНІ колонки, а
 * не звужує наявну.
 *
 * ## Чому це не ловив жоден наявний гейт
 *
 * `e2e/viewport-overflow.spec.ts` міряє саме цей клас дефектів, але лише на
 * сторінках із `prerender.entries` і лише в тому вигляді, у якому вони
 * відкриваються. Список викладачів на `/residents/adults` за замовчуванням
 * СХОВАНИЙ (`adultsVisibility`, серія `H` або `?adults=1`), тож у прогоні
 * сітки просто немає в DOM — перевірка зелена, бо міряти нічого.
 *
 * ## Ціна вже заплачена, і саме тому потрібен гейт, а не правка
 *
 * `f98168e` (15.08) прибрав підлогу в пікселях із `ContentWidget` і
 * `ArticleForm` — руками, у двох файлах, без перевірки. Через тиждень,
 * `66d407a` і `63e5cbd` (22.08), гола довжина приїхала знову: три сітки в
 * `residents/adults/+page.svelte` і одна в `GraduateProfileView.svelte`.
 * Тобто правило дожило рівно до наступної фічі.
 *
 * Заміряно перед цим комітом: `.masters-container` має `padding: 0 1rem`, тобто
 * на екрані 320px сітці лишається 288px, а `.masters-grid--cards` вимагала
 * 320px — картки виходили за екран на 32px. Решта трьох (220px, 180px, 130px)
 * на реальних ширинах не переповнювали нічого; вони приведені до тієї самої
 * форми, бо гейт тримає ОДНЕ правило, а не перелік «ця довжина ще нічого».
 * `min(N, 100%)` при контейнері ширшому за N дорівнює N — поріг переносу
 * лишається той самий.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): повернути
 * `minmax(320px, 1fr)` у `.masters-grid--cards` — перевірка мусить назвати файл,
 * рядок і саме цей запис. Зроблено, падає.
 */

/** Де шукаємо стилі: розмітка компонентів, сторінок і глобальні файли. */
const ROOT = 'src';

function walk(dir: string, keep: (name: string) => boolean, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, keep, out);
		else if (keep(entry.name)) out.push(full);
	}
	return out;
}

/**
 * Текст без коментарів — але з тими самими номерами рядків.
 *
 * Обовʼязково обидва кроки. Без вирізання коментарів перший же прогін падає на
 * ВЛАСНІЙ документації: анти-патерн доводиться процитувати, щоб пояснити (так і
 * сталося — цей файл цитує `minmax(320px, 1fr)` тричі). А замінювати треба
 * пробілами, зберігаючи переводи рядків: інакше номер рядка у звіті вказує не
 * туди, і знахідку шукають руками (FLUID-SIZING-v8 § 9).
 */
function stripComments(text: string): string {
	const blank = (m: string) => m.replace(/[^\n]/g, ' ');
	return text.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/<!--[\s\S]*?-->/g, blank);
}

/** Аргументи одного `minmax(...)`, з урахуванням вкладених дужок. */
function splitArgs(text: string, from: number): { args: string[]; end: number } | null {
	let depth = 0;
	let level = 0;
	let current = '';
	const args: string[] = [];

	for (let i = from; i < text.length; i++) {
		const ch = text[i];
		if (ch === '(') {
			depth++;
			if (depth === 1) continue;
		} else if (ch === ')') {
			depth--;
			if (depth === 0) {
				args.push(current.trim());
				return { args, end: i };
			}
		}
		if (depth === 0) continue;
		if (ch === '(') level++;
		else if (ch === ')') level--;
		if (ch === ',' && level === 0) {
			args.push(current.trim());
			current = '';
			continue;
		}
		current += ch;
	}
	return null;
}

/** Гола довжина: `320px`, `20rem`, `.5em` — але не `min(320px, 100%)` і не `0`. */
function isBareLength(arg: string): boolean {
	return /^[0-9.]+(px|rem|em|ch|ex|pt|cm|mm|in|pc)$/i.test(arg);
}

/**
 * Кожен `repeat(auto-fit|auto-fill, minmax(…))` у тексті.
 *
 * Саме ця форма, а не будь-який `minmax()`: явні колонки
 * (`grid-template-columns: minmax(340px, max-content) …`) у цьому проєкті стоять
 * усередині `@media (min-width: …)`, тобто до вузького екрана не доживають, і
 * підлога там — не дефект, а вибір розкладки для широкого.
 */
function autoRepeats(source: string): { line: number; raw: string; first: string }[] {
	const text = stripComments(source);
	const found: { line: number; raw: string; first: string }[] = [];
	const needle = /repeat\(\s*auto-(?:fit|fill)\s*,/g;

	for (let m = needle.exec(text); m; m = needle.exec(text)) {
		const inner = text.indexOf('minmax(', m.index);
		if (inner === -1) continue;
		// `minmax` мусить бути аргументом САМЕ цього repeat, а не наступного правила.
		if (inner > m.index + m[0].length + 4) continue;

		const parsed = splitArgs(text, inner + 'minmax'.length);
		if (!parsed || parsed.args.length === 0) continue;

		// `parsed.end` закриває `minmax`; для звіту потрібна ще дужка `repeat`,
		// інакше цитата обривається на пів запису й її не можна знайти пошуком.
		const close = text.indexOf(')', parsed.end + 1);

		found.push({
			line: text.slice(0, m.index).split('\n').length,
			raw: text.slice(m.index, (close === -1 ? parsed.end : close) + 1).replace(/\s+/g, ' '),
			first: parsed.args[0]
		});
	}
	return found;
}

describe('сітки: підлога колонки не буває голою довжиною (FLUID-SIZING-v8 § 1.1)', () => {
	const files = walk(
		ROOT,
		(n) => n.endsWith('.svelte') || n.endsWith('.css') || n.endsWith('.html')
	);
	const grids = files.flatMap((file) =>
		autoRepeats(readFileSync(file, 'utf8')).map((g) => ({
			file: file.replace(/\\/g, '/'),
			...g
		}))
	);

	it('перевірка жива: сітки з auto-fit/auto-fill знайдено', () => {
		expect(files.length, 'сканер не знайшов джерел — шукає не там').toBeGreaterThan(50);
		// 9 на момент коміту. Межа нижча за факт, щоб не падати на кожній новій
		// сітці, але не нульова: нуль означав би мертвий сканер.
		expect(
			grids.length,
			'жодного repeat(auto-fit|auto-fill, minmax(…)) — або розбір зламався, ' +
				'або сітки переписали, і тоді гейт треба не лагодити, а прибирати'
		).toBeGreaterThan(5);
	});

	it('розбір живий: гола довжина відрізняється від min() і від нуля', () => {
		// Без цього перевірка нижче була б зелена й на завжди-false `isBareLength`.
		expect(isBareLength('320px')).toBe(true);
		expect(isBareLength('20rem')).toBe(true);
		expect(isBareLength('min(320px, 100%)'), 'min() — не гола довжина').toBe(false);
		expect(isBareLength('0'), 'нуль підлоги не створює').toBe(false);
		expect(isBareLength('1fr')).toBe(false);

		const sample = autoRepeats('a { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }');
		expect(sample).toHaveLength(1);
		expect(sample[0].first).toBe('320px');

		const ok = autoRepeats('a { grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); }');
		expect(ok[0].first).toBe('min(300px, 100%)');
	});

	it('коментар не читається як код', () => {
		// Інакше гейт червонів би на власній документації, а не на дефекті.
		expect(autoRepeats('/* repeat(auto-fill, minmax(320px, 1fr)) */')).toEqual([]);
		expect(autoRepeats('<!-- repeat(auto-fill, minmax(320px, 1fr)) -->')).toEqual([]);
	});

	it('коментар не зсуває номери рядків у звіті', () => {
		const source = ['/* перший', '   другий */', 'a { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }'].join(
			'\n'
		);
		expect(autoRepeats(source)[0].line).toBe(3);
	});

	it('жодна колонка не має підлоги в пікселях', () => {
		const broken = grids
			.filter((g) => isBareLength(g.first))
			.map((g) => `${g.file}:${g.line} — ${g.raw}`)
			.sort();

		expect(
			broken,
			'гола довжина в minmax — це ПІДЛОГА, а не поріг переносу: у вужчому ' +
				'контейнері колонка лишається тієї самої ширини й жене сторінку боком. ' +
				`Треба min(N, 100%):\n  ${broken.join('\n  ')}`
		).toEqual([]);
	});
});

/**
 * `vh` там, де блок мусить вміститися у ВИДИМУ висоту (FLUID-SIZING-v8 § 2, § 4).
 *
 * `100vh` — це найбільший viewport, тобто екран із ЗГОРНУТОЮ панеллю браузера.
 * На телефоні з розгорнутою панеллю блок такої висоти на 10-15 % вищий за те,
 * що видно: нижній край лежить під панеллю, і кнопка закриття чи підпис під
 * зображенням опиняються там, куди не дотягнутися. `dvh` міряє те, що видно
 * зараз, і саме його віддає `window.innerHeight`.
 *
 * ## Чому саме висота й саме від 50
 *
 * Перевіряються лише `height` / `min-height` / `max-height`: `vh` у ширині
 * (`width: 90vh` у поверненому набік піаніно) і в зсувах анімації
 * (`translate: 0 105vh`) описує зовсім інше, і `dvh` там був би помилкою.
 *
 * Поріг 50 — не круглість, а межа помітності: різниця між `vh` і `dvh` дорівнює
 * висоті панелі браузера (заміряно в Chrome на Android — близько 13 % висоти
 * екрана). На `2.2vh` у відступі це чверть пікселя, на `80vh` — понад сотня.
 *
 * ## Знайдено цим гейтом
 *
 * `PageScrollbar` малював доріжку `height: 100vh`, а всю арифметику повзунка
 * рахував від `window.innerHeight` — тобто від `dvh`. Два різні визначення
 * «висоти екрана» в одному компоненті: повзунок доходив до `viewportHeight −
 * thumbHeight`, що на телефоні ВИЩЕ за низ доріжки, і нижня смуга доріжки
 * лишалася мертвою — по ній не можна було перейти в кінець сторінки.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): повернути `100vh` у
 * `.page-scrollbar` — перевірка мусить назвати файл, рядок і властивість.
 * Зроблено, падає.
 */

/** Нижче цієї межі різниця між `vh` і `dvh` менша за помітну. Див. шапку. */
const VH_SIGNIFICANT = 50;

/**
 * Місця, де `vh` — саме те, що треба, і `dvh` був би дефектом.
 *
 * Перелічені поіменно, а не дозволені класом: клас («тло», «анімація») наступний
 * автор прочитає ширше, ніж було задумано, і виняток тихо накриє справжній
 * промах. Ключ — `файл:властивість`.
 */
const VH_ON_PURPOSE: Record<string, string> = {
	'src/lib/components/ui/Select.svelte:height':
		'тло, що ловить натиск поза панеллю: воно мусить накрити НАЙБІЛЬШИЙ ' +
		'viewport, інакше під згорнутою панеллю браузера лишається смуга, ' +
		'натиск у яку не закриває список',
	'src/lib/components/ui/FilterDropdown.svelte:height':
		'те саме тло-ловець, тепер у спільному каркасі випадайних списків: ' +
		'підкладка мусить накрити екран цілком, і саме НАЙБІЛЬШИЙ — інакше при ' +
		'згорнутій панелі браузера під нею лишалася б смуга, у якій натискання ' +
		'не закривало б список',
	'src/lib/components/ui/PianoModal.svelte:max-height':
		'вміст ПОВЕРНУТИЙ на 90° (`transform: rotate(90deg)` у портреті), тож ' +
		'ця «висота» лягає на ширину екрана — вісь не та, до якої стосується правило'
};

/** Оголошення висоти з `vh` у значенні. `dvh`/`svh`/`lvh` — інші одиниці. */
function heightsInVh(source: string): { line: number; prop: string; value: number }[] {
	const text = stripComments(source);
	const found: { line: number; prop: string; value: number }[] = [];
	const decl = /\b(min-height|max-height|height)\s*:\s*([^;}"']+)/g;

	for (let m = decl.exec(text); m; m = decl.exec(text)) {
		for (const unit of m[2].matchAll(/(?<![a-z])([0-9.]+)vh\b/gi)) {
			found.push({
				line: text.slice(0, m.index).split('\n').length,
				prop: m[1],
				value: Number(unit[1])
			});
		}
	}
	return found;
}

describe('висота від екрана — dvh, а не vh (FLUID-SIZING-v8 § 2)', () => {
	const files = walk(
		ROOT,
		(n) => n.endsWith('.svelte') || n.endsWith('.css') || n.endsWith('.html')
	);
	const declarations = files.flatMap((file) =>
		heightsInVh(readFileSync(file, 'utf8')).map((d) => ({
			file: file.replace(/\\/g, '/'),
			...d
		}))
	);

	it('розбір живий: одиниця й вісь визначаються правильно', () => {
		expect(heightsInVh('a { max-height: 85vh; }')).toEqual([
			{ line: 1, prop: 'max-height', value: 85 }
		]);
		expect(heightsInVh('a { max-height: 85dvh; }'), 'dvh — не vh').toEqual([]);
		expect(heightsInVh('a { max-height: 85svh; }'), 'svh — не vh').toEqual([]);
		expect(heightsInVh('a { width: 90vh; }'), 'ширина — інша вісь').toEqual([]);
		expect(heightsInVh('a { translate: 0 105vh; }'), 'зсув — не розмір').toEqual([]);
		expect(heightsInVh('/* max-height: 85vh */'), 'коментар — не код').toEqual([]);
		expect(heightsInVh('a { max-height: clamp(1rem, 60vh, 40rem); }')).toHaveLength(1);
	});

	it('кожен виняток зі списку справді існує в коді', () => {
		const stale = Object.keys(VH_ON_PURPOSE).filter(
			(key) => !declarations.some((d) => `${d.file}:${d.prop}` === key)
		);
		expect(
			stale,
			`виняток пережив код, який пояснював:\n  ${stale.join('\n  ')}`
		).toEqual([]);
	});

	it('жодна помітна висота не міряється найбільшим viewport', () => {
		const broken = declarations
			.filter((d) => d.value >= VH_SIGNIFICANT)
			.filter((d) => !(`${d.file}:${d.prop}` in VH_ON_PURPOSE))
			.map((d) => `${d.file}:${d.line} — ${d.prop}: ${d.value}vh`)
			.sort();

		expect(
			broken,
			'`vh` — це екран зі ЗГОРНУТОЮ панеллю браузера: на телефоні нижній край ' +
				'блока лягає під панель, і до нього не дотягнутися. Треба `dvh` — або ' +
				`рядок у VH_ON_PURPOSE із причиною:\n  ${broken.join('\n  ')}`
		).toEqual([]);
	});
});
