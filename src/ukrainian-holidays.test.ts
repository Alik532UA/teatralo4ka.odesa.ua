// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	UKRAINIAN_HOLIDAYS,
	UKRAINIAN_HOLIDAY_DATES,
	isUkrainianHoliday,
	monthDay,
	ukrainianHolidayOn
} from './lib/config/ukrainianHolidays';

/**
 * Перелік державних свят живе у ДВОХ місцях, і це неминуче.
 *
 * Куліси заставки стають прапором на державні свята. Вирішує це інлайн-скрипт у
 * `src/app.html` — інакше не можна: заставка малюється до гідрації, а скрипт
 * першого кадру не може нічого імпортувати. Отже той самий перелік дат є і в
 * `lib/config/ukrainianHolidays.ts`, і в розмітці.
 *
 * ## Чому розходження було б найдорожчим із можливих
 *
 * Воно не ламає ані збірку, ані типи, ані жоден інший тест. І побачити його
 * можна РІВНО ОДИН ДЕНЬ НА РІК — той, у який дата випала з одного переліку, але
 * лишилася в другому. Причому саме в цей день на сайт дивиться найбільше людей,
 * а виправити вже пізно: наступна нагода через рік.
 *
 * Це той самий клас, що `first-frame-sync.test.ts` стереже для теми й смуги
 * прокрутки, лише з гіршим вікном спостереження.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Прибрати `'08-24'` з масиву в `app.html` — перевірка мусить назвати саме цю
 * дату й саме як «є в конфігу, немає в розмітці». Проведено.
 */

const APP_HTML = readFileSync('src/app.html', 'utf8');

/**
 * Дати з інлайн-скрипта.
 *
 * Беруться з ОДНОГО оголошення `var HOLIDAYS = [...]`, а не грепом по всьому
 * файлу: `MM-DD` — надто загальний шаблон, і будь-яке число в коментарі
 * потрапило б у вибірку. Перша редакція так і зробила, і перевірка «збігається»
 * проходила б, навіть якби масив зник зовсім.
 */
function datesInAppHtml(): string[] {
	const block = APP_HTML.match(/var HOLIDAYS = \[([\s\S]*?)\];/);
	expect(block, 'у app.html немає оголошення `var HOLIDAYS = [...]`').toBeTruthy();
	return [...block![1].matchAll(/'(\d{2}-\d{2})'/g)].map((m) => m[1]);
}

describe('перевірка жива', () => {
	it('обидва джерела знайдено і вони не порожні', () => {
		expect(UKRAINIAN_HOLIDAY_DATES.length).toBeGreaterThan(0);
		expect(datesInAppHtml().length).toBeGreaterThan(0);
	});
});

describe('державні свята: конфіг проти скрипта першого кадру', () => {
	it('переліки збігаються дослівно', () => {
		const inHtml = datesInAppHtml();
		const inConfig = [...UKRAINIAN_HOLIDAY_DATES];

		const missingInHtml = inConfig.filter((d) => !inHtml.includes(d));
		const missingInConfig = inHtml.filter((d) => !inConfig.includes(d));

		expect(
			missingInHtml,
			'є в ukrainianHolidays.ts, немає в app.html — прапор не з’явиться в цей день'
		).toEqual([]);
		expect(
			missingInConfig,
			'є в app.html, немає в ukrainianHolidays.ts — прапор з’явиться в день, якого перелік не знає'
		).toEqual([]);

		// Порядок теж звіряється: обидва переліки читають люди, і календарний
		// порядок — єдиний, у якому пропущену дату видно оком.
		expect(inHtml, 'порядок дат розійшовся').toEqual(inConfig);
	});

	it('дати не повторюються і мають вигляд MM-DD', () => {
		const dates = [...UKRAINIAN_HOLIDAY_DATES];
		expect(new Set(dates).size, `дублікати: ${dates.join(', ')}`).toBe(dates.length);
		for (const d of dates) {
			expect(d, `${d} не у вигляді MM-DD`).toMatch(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
		}
	});

	it('кожне свято має назву обома мовами', () => {
		const empty = UKRAINIAN_HOLIDAYS.filter((h) => !h.uk.trim() || !h.en.trim()).map((h) => h.md);
		expect(empty, `без назви: ${empty.join(', ')}`).toEqual([]);
	});
});

describe('розрахунок дати', () => {
	/**
	 * Місцева дата, а не UTC — і ця перевірка саме про це.
	 *
	 * `new Date(2026, 7, 24, 0, 30)` — це пів на першу ночі 24 серпня МІСЦЕВОГО
	 * часу. У поясі UTC+3 той самий момент в UTC — ще 23 серпня, тобто
	 * `toISOString().slice(5, 10)` віддав би `08-23`. Обидві дати у нас святкові,
	 * тому помилка не спливла б; ловить її саме перевірка формату нижче.
	 */
	it('MM-DD рахується з місцевих полів', () => {
		expect(monthDay(new Date(2026, 7, 24, 0, 30))).toBe('08-24');
		expect(monthDay(new Date(2026, 0, 1, 23, 59))).toBe('01-01');
		// Однозначні числа з нулем попереду — так само, як їх формує app.html.
		expect(monthDay(new Date(2026, 5, 8))).toBe('06-08');
	});

	it('свято визначається, а звичайний день — ні', () => {
		expect(isUkrainianHoliday(new Date(2026, 7, 23))).toBe(true);
		expect(isUkrainianHoliday(new Date(2026, 7, 24))).toBe(true);
		expect(isUkrainianHoliday(new Date(2026, 7, 25))).toBe(false);
		expect(isUkrainianHoliday(new Date(2026, 2, 15))).toBe(false);
	});

	it('рік не бере участі: усі дати в переліку нерухомі', () => {
		for (const year of [2024, 2026, 2031]) {
			expect(isUkrainianHoliday(new Date(year, 11, 25)), `${year}-12-25`).toBe(true);
		}
	});

	it('назва свята повертається разом із датою', () => {
		expect(ukrainianHolidayOn(new Date(2026, 7, 23))?.uk).toBe('День Державного Прапора України');
		expect(ukrainianHolidayOn(new Date(2026, 7, 25))).toBeUndefined();
	});
});
