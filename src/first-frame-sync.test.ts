import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
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
