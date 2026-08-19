import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { STORAGE_PREFIX } from './lib/config/storage';
import { SCROLLBAR_MODE_IDS } from './lib/config/scrollbarModes';

/**
 * Інлайн-скрипт першого кадру мусить вирішувати те саме, що й контролери.
 *
 * `app.html` містить скрипт, який виконується ДО гідрації: він ставить тему й
 * клас, що ховає нативну смугу прокрутки. Робити це в ефекті пізно — між
 * першим кадром і гідрацією встигне показатися світле тло або чужа смуга, і
 * саме через це скрипт там і стоїть.
 *
 * Ціна рішення — дублювання. Ті самі медіа-запити, ті самі ключі сховища й те
 * саме типове значення живуть у двох місцях: у розмітці та в
 * `controllers/scrollbar.svelte.ts` / `controllers/ui.svelte.ts`. У самому
 * `app.html` про це є коментар «умови мусять збігатися» — але коментар не
 * перевірка.
 *
 * ## Чому розходження буде тихим
 *
 * Воно не ламає ані збірку, ані типи, ані жоден наявний тест. Видно його як
 * ОДИН кадр: смуга блимне при завантаженні й стане на місце. Той, хто правив
 * контролер, цього не побачить — він дивиться на сторінку після гідрації, де
 * вже все правильно. Найдорожчий випадок — зміна `STORAGE_PREFIX`: інлайн-скрипт
 * читає ключ повним рядком, тож після перейменування він мовчки не знаходить
 * нічого і щоразу бере типове значення.
 */

const APP_HTML = readFileSync('src/app.html', 'utf8');
const SCROLLBAR = readFileSync('src/lib/controllers/scrollbar.svelte.ts', 'utf8');
const UI = readFileSync('src/lib/controllers/ui.svelte.ts', 'utf8');

/** Усі медіа-запити файлу, у порядку появи. */
function mediaQueries(source: string): string[] {
	return [...source.matchAll(/matchMedia\(\s*['"]([^'"]+)['"]|MediaQuery\(\s*['"]([^'"]+)['"]/g)].map(
		(m) => m[1] ?? m[2]
	);
}

describe('перший кадр: app.html проти контролерів', () => {
	it('медіа-запити смуги збігаються дослівно', () => {
		const inHtml = new Set(mediaQueries(APP_HTML));
		const inController = new Set(mediaQueries(SCROLLBAR));

		// Кожен запит контролера мусить бути в скрипті першого кадру. Зворотне не
		// вимагається: `app.html` має ще й запит теми, якого в цьому контролері
		// немає за визначенням.
		for (const query of inController) {
			expect(
				inHtml,
				`медіа-запит «${query}» є в scrollbar.svelte.ts і відсутній в app.html — перший кадр вирішить інакше`
			).toContain(query);
		}
	});

	it('перевірка справді знайшла запити, а не порожній набір', () => {
		// Без цього попередній тест лишався б зеленим, якби регулярка перестала
		// збігатися після рефакторингу — а це найімовірніший спосіб його зламати.
		expect(mediaQueries(SCROLLBAR).length).toBeGreaterThanOrEqual(2);
		expect(mediaQueries(APP_HTML).length).toBeGreaterThanOrEqual(2);
	});

	it('ключі сховища в app.html побудовані з поточного STORAGE_PREFIX', () => {
		// Інлайн-скрипт не може імпортувати константу — він виконується до
		// будь-якого модуля. Тому ключ у ньому вписаний рядком, і при
		// перейменуванні префікса він мовчки перестане щось знаходити.
		const keys = [...APP_HTML.matchAll(/localStorage\.getItem\(\s*['"]([^'"]+)['"]/g)].map(
			(m) => m[1]
		);
		expect(keys.length, 'у app.html не знайдено читання сховища — перевірка мертва').toBeGreaterThan(
			0
		);
		for (const key of keys) {
			expect(key, `ключ «${key}» не має префікса «${STORAGE_PREFIX}»`).toMatch(
				new RegExp(`^${STORAGE_PREFIX}`)
			);
		}
	});

	it('типовий режим смуги в app.html збігається з контролером', () => {
		// `|| 'custom'` наприкінці ланцюжка в app.html і початкове значення
		// `scrollbarMode` в ui. Розійшовшись, вони дають видимий стрибок: перший
		// кадр малює одну смугу, гідрація — іншу.
		const htmlDefault = APP_HTML.match(/getItem\([^)]*scrollbarModeDefault[^)]*\)\s*\|\|\s*'([^']+)'/)?.[1];
		const uiDefault = UI.match(/scrollbarMode\s*=\s*\$state<ScrollbarMode>\('([^']+)'\)/)?.[1];

		expect(htmlDefault, 'в app.html не знайдено типового режиму — перевірка мертва').toBeTruthy();
		expect(uiDefault, 'в ui.svelte.ts не знайдено початкового режиму — перевірка мертва').toBeTruthy();
		expect(htmlDefault).toBe(uiDefault);
		// І він мусить бути дійсним значенням, а не будь-яким рядком.
		expect(SCROLLBAR_MODE_IDS).toContain(htmlDefault as (typeof SCROLLBAR_MODE_IDS)[number]);
	});

	it('усі режими, які ховають нативну смугу, згадані в app.html', () => {
		// Контролер вважає «нашими» custom, minimap і minimap-full. Якщо режим
		// додадуть у перелік і забудуть у скрипті першого кадру, нативна смуга
		// покажеться й зникне вже після гідрації.
		const hiding = SCROLLBAR_MODE_IDS.filter((id) => id !== 'standard');
		for (const mode of hiding) {
			expect(APP_HTML, `режим «${mode}» не згаданий у скрипті першого кадру`).toContain(`'${mode}'`);
		}
	});
});

/**
 * Кожен `window.__x` із джерел ІСНУЄ: оголошений у `app.d.ts` і присвоєний у
 * `static/*.js` (AI-AGENT-PITFALLS-v8 § 3 — існування не дорівнює досяжності).
 *
 * Клас дефекту заміряний тут 2026-08-20. `+page.svelte` мав рядки:
 *
 *     // Clean up splash timers (slow-internet message, facts rotation)
 *     if (typeof (window as any).__splashCleanup === 'function') {
 *         (window as any).__splashCleanup();
 *     }
 *
 * `__splashCleanup` не присвоював ніхто — ані `static/splash.js`, ані `app.html`,
 * ані бандл. Тобто умова завжди була false, коментар про прибирання таймерів був
 * неправдою, а `setInterval` ротатора фактів смикав видалені з документа вузли
 * кожні чотири секунди до кінця сеансу.
 *
 * Чому це прожило довго: `as any` глушив єдиний гейт, який міг би про це
 * сказати. `svelte-check` побачив би невідоме поле `window`, якби поле не було
 * приведене до `any`.
 *
 * Перевірка навмисно дивиться в ДВА боки. Оголошення без реалізації — саме той
 * випадок, що був; реалізація без оголошення повертає `as any` назад.
 *
 * Зворотний експеримент (§ 1.1): прибрати присвоєння `window.__splashCleanup` зі
 * `static/splash.js` — перевірка мусить назвати саме це імʼя.
 */
describe('глобальні хуки window.__*', () => {
	const APP_D_TS = readFileSync('src/app.d.ts', 'utf8');
	const STATIC_JS = readdirSync('static')
		.filter((f) => f.endsWith('.js'))
		.map((f) => readFileSync(join('static', f), 'utf8'))
		.join('\n');

	const walk = (dir: string, out: string[] = []): string[] => {
		for (const entry of readdirSync(dir)) {
			const full = join(dir, entry).replace(/\\/g, '/');
			if (statSync(full).isDirectory()) walk(full, out);
			else if (/\.(ts|svelte)$/.test(entry) && !/\.(test|spec)\.ts$/.test(entry)) out.push(full);
		}
		return out;
	};

	/** Імена, які джерела читають із `window`. `app.d.ts` не рахується — це оголошення. */
	const used = new Set(
		walk('src')
			.filter((f) => f !== 'src/app.d.ts')
			.flatMap((f) => [
				...readFileSync(f, 'utf8').matchAll(/window\s*(?:as\s+\w+\s*)?\)?\s*[.?]*\.?(__\w+)/g)
			])
			.map((m) => m[1])
	);

	it('перевірка жива: хуки в джерелах знайдено', () => {
		expect([...used], 'жодного window.__x — сканер шукає не там').toContain('__perf');
	});

	it('кожен хук оголошений у app.d.ts', () => {
		const undeclared = [...used].filter((name) => !APP_D_TS.includes(`${name}?`));
		expect(
			undeclared,
			`window.__x без оголошення — писати доведеться через as any:\n${undeclared.join('\n')}`
		).toEqual([]);
	});

	it('кожен хук хтось присвоює у static/*.js', () => {
		const orphans = [...used].filter(
			(name) => !new RegExp(`window\\.${name}\\s*=`).test(STATIC_JS)
		);
		expect(
			orphans,
			'хук кличуть, а присвоює його ніхто — виклик мовчки не робить нічого:\n' +
				orphans.join('\n')
		).toEqual([]);
	});
});
