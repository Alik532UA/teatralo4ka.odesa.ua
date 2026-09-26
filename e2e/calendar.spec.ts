import { expect, test, type Page } from './fixtures';
import { gotoReady } from './ready';
import { ACADEMIC_YEAR_IDS, LATEST_ACADEMIC_YEAR_ID } from '../src/lib/data/academicYears';

/**
 * Навчальний календар — `/calendar/`.
 *
 * ## Що саме тут стережеться
 *
 * Сторінка одна на всі роки, і ВЕСЬ її вигляд — у параметрах адреси: рік,
 * фон, розмиття, фільтр (`src/lib/data/calendarView.ts`). Тому перевіряється не
 * «сторінка відкривається», а що адреса й плакат кажуть те саме в обидва
 * боки: клік пише в адресу, адреса, відкрита заново, відтворює плакат.
 *
 * Друге — те, що ламалося в першій редакції й чого юніт-тести не бачать:
 * одна зупинка Tab на місяць замість 546 кнопок, повний екран через спільний
 * сервіс і друк плаката на ОДНОМУ аркуші A4.
 *
 * Дати в очікуваннях — із листа школи, тобто рівно те, що мусить побачити
 * людина. `data/academicCalendar.ts` тут недосяжний: він імпортує `$lib`, а
 * Playwright аліасів SvelteKit не знає; `academicYears.ts` — чистий модуль.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v9 § 1.1)
 *
 * Прибрати `replaceState` з `update()` сторінки — впадуть обидві перевірки
 * адреси. Повернути кнопки на хвости сусідніх місяців — впаде підрахунок
 * зупинок Tab. Прибрати `@page` зі стилів друку — впаде перевірка одного аркуша.
 */

const поплакату = (page: Page) => page.getByTestId('calendar-poster-container');

/**
 * Кнопки працюють лише після гідрації, а заголовок видно ще до неї — у
 * prerender-ному HTML. Тому клік повторюється, доки не дасть наслідку.
 */
async function відкритиПанель(page: Page) {
	await expect(async () => {
		await page.getByTestId('calendar-theme-open-btn').click({ timeout: 1000 });
		await expect(page.getByTestId('calendar-theme-panel')).toBeVisible({ timeout: 1000 });
	}).toPass();
}

test.describe('навчальний календар', () => {
	test('без параметрів — останній рік реєстру', async ({ page }) => {
		await gotoReady(page, '/calendar/');
		await expect(page.getByTestId('calendar-year-title')).toHaveText(
			`Навчальний рік ${LATEST_ACADEMIC_YEAR_ID}`
		);
		await expect(page.getByTestId(`calendar-year-${LATEST_ACADEMIC_YEAR_ID}-link`)).toHaveAttribute(
			'aria-current',
			'page'
		);
	});

	test('рік перемикається на місці й записується в адресу', async ({ page }) => {
		await gotoReady(page, '/calendar/');
		const [перший] = ACADEMIC_YEAR_IDS;

		await page.getByTestId(`calendar-year-${перший}-link`).click();
		await expect(page.getByTestId('calendar-year-title')).toHaveText(`Навчальний рік ${перший}`);
		await expect(page.getByTestId('calendar-semesters-panel')).toContainText(
			'з 2 вересня по 23 грудня 2024 р.'
		);
		await expect(page).toHaveURL(new RegExp(`/calendar/\\?year=${перший}$`));

		// Типовий рік адреси не має: повернення до нього прибирає параметр.
		await page.getByTestId(`calendar-year-${LATEST_ACADEMIC_YEAR_ID}-link`).click();
		await expect(page).toHaveURL(/\/calendar\/$/);
	});

	test('адреса з параметрами відтворює плакат', async ({ page }) => {
		await gotoReady(page, '/calendar/?year=2025-2026&bg=nature-winter&blur=8&filter=dark&density=40');

		await expect(page.getByTestId('calendar-year-title')).toHaveText('Навчальний рік 2025-2026');
		await expect(page.getByTestId('calendar-vacation-winter-item')).toContainText('з 27 грудня');
		await expect(поплакату(page)).toHaveAttribute('style', /--poster-blur:\s*8px/);
		await expect(поплакату(page)).toHaveAttribute('style', /calendar-bg-winter\.webp/);

		await відкритиПанель(page);
		await expect(page.getByTestId('calendar-theme-nature-winter-btn')).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(page.getByTestId('calendar-filter-dark-btn')).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	test('вибір фону пишеться в адресу, типовий — стирається', async ({ page }) => {
		await gotoReady(page, '/calendar/?year=2024-2025');
		await expect(page.getByTestId('calendar-year-title')).toHaveText('Навчальний рік 2024-2025');
		await відкритиПанель(page);

		await page.getByTestId('calendar-theme-blue-hall-btn').click();
		await expect(page).toHaveURL(/[?&]bg=blue-hall(&|$)/);
		// Рік при цьому не губиться.
		await expect(page).toHaveURL(/[?&]year=2024-2025(&|$)/);

		await page.getByTestId('calendar-theme-geometry-btn').click();
		await expect(page).not.toHaveURL(/bg=/);

		// Escape закриває панель і повертає фокус на кнопку палітри.
		await page.keyboard.press('Escape');
		await expect(page.getByTestId('calendar-theme-panel')).toBeHidden();
		await expect(page.getByTestId('calendar-theme-open-btn')).toBeFocused();
	});

	test('англійською — і назва року, і дати', async ({ page }) => {
		await gotoReady(page, '/en/calendar/?year=2024-2025');
		await expect(page.getByTestId('calendar-year-title')).toHaveText('Academic Year 2024–2025');
		await expect(page.getByTestId('calendar-semesters-panel')).toContainText(
			'from Sep 2 to Dec 23, 2024'
		);
	});

	test('зміна мови не губить вибраний рік', async ({ page }) => {
		await gotoReady(page, '/calendar/?year=2024-2025');
		await expect(page.getByTestId('calendar-year-title')).toHaveText('Навчальний рік 2024-2025');
		await expect(async () => {
			await page.keyboard.press('KeyL');
			await expect(page).toHaveURL(/\/en\/calendar\/\?year=2024-2025$/, { timeout: 2000 });
		}).toPass();
		await expect(page.getByTestId('calendar-year-title')).toHaveText('Academic Year 2024–2025');
	});

	test('одна зупинка Tab на місяць, стрілки ходять днями', async ({ page }) => {
		await gotoReady(page, '/calendar/');
		const tabbable = поплакату(page).locator('button[data-date][tabindex="0"]');
		await expect(tabbable).toHaveCount(13);

		// Хвости сусідніх місяців — не кнопки: кожна дата на плакаті одна.
		const dates = await поплакату(page)
			.locator('button[data-date]')
			.evaluateAll((els) => els.map((el) => el.getAttribute('data-date')));
		expect(new Set(dates).size).toBe(dates.length);

		const першеЖовтня = page.getByTestId('calendar-day-2026-10-01-btn');
		await першеЖовтня.focus();
		await expect(async () => {
			await першеЖовтня.focus();
			await page.keyboard.press('ArrowRight');
			await expect(page.getByTestId('calendar-day-2026-10-02-btn')).toBeFocused({ timeout: 500 });
		}).toPass();
		await page.keyboard.press('ArrowDown');
		await expect(page.getByTestId('calendar-day-2026-10-09-btn')).toBeFocused();
	});

	test('картка дня називає канікули', async ({ page }) => {
		await gotoReady(page, '/calendar/');
		await expect(async () => {
			await page.getByTestId('calendar-day-2026-10-26-btn').click();
			await expect(page.getByTestId('calendar-day-card')).toBeVisible({ timeout: 1000 });
		}).toPass();
		await expect(page.getByTestId('calendar-day-card')).toContainText('Осінні канікули');
		await expect(page.getByTestId('calendar-day-card-title')).toHaveText('26 жовтня 2026');
	});

	test('літні канікули — не жирним і сірим, навчальний день — жирним', async ({ page }) => {
		await gotoReady(page, '/calendar/');
		const вага = (testid: string) =>
			page
				.getByTestId(testid)
				.locator('.day-number')
				.evaluate((el) => [getComputedStyle(el).fontWeight, getComputedStyle(el).color]);
		const [літоВага, літоКолір] = await вага('calendar-day-2027-07-14-btn');
		const [школаВага, школаКолір] = await вага('calendar-day-2026-09-16-btn');
		expect(літоВага).toBe('400');
		expect(школаВага).toBe('700');
		expect(літоКолір).not.toBe(школаКолір);
	});

	/*
	 * Розташування — прохання автора 2026-09-26, дослівно: керування ПРАВОРУЧ від
	 * плаката, палітра ЛІВОРУЧ від кнопки повного екрана, обидві НАД роками.
	 * На телефоні праворуч місця немає, тож там блок стоїть над плакатом.
	 */
	test('керування праворуч від плаката: палітра, повний екран, під ними роки', async ({
		page
	}, testInfo) => {
		test.skip(testInfo.project.name !== 'chromium', 'праворуч — лише на широкому екрані');
		await gotoReady(page, '/calendar/');
		const box = async (testid: string) => (await page.getByTestId(testid).boundingBox())!;
		const poster = await box('calendar-poster-container');
		const palette = await box('calendar-theme-open-btn');
		const full = await box('calendar-fullscreen-btn');
		const years = await box('calendar-years-nav');
		expect(palette.x, 'керування праворуч від плаката').toBeGreaterThanOrEqual(
			poster.x + poster.width
		);
		expect(palette.x + palette.width, 'палітра ліворуч від повного екрана').toBeLessThanOrEqual(
			full.x
		);
		expect(full.y + full.height, 'кнопки над роками').toBeLessThanOrEqual(years.y);

		// Панель фону випадає ПІД кнопкою палітри.
		await відкритиПанель(page);
		const panel = await box('calendar-theme-panel');
		expect(panel.y, 'панель під кнопкою').toBeGreaterThanOrEqual(palette.y + palette.height);
	});

	test('усі контейнери плаката йдуть за темою сайту', async ({ page }) => {
		await gotoReady(page, '/calendar/');
		const фони = () =>
			page.evaluate(() =>
				[
					'.calendar-month-card',
					'.poster-vacations-panel',
					'.header-pill',
					'.year-card'
				].map((sel) => getComputedStyle(document.querySelector(sel)!).backgroundColor)
			);
		// Тема ставиться і класом, і атрибутом — так само, як це робить контролер теми.
		const тема = (name: string) =>
			page.evaluate((n) => {
				const html = document.documentElement;
				for (const c of [...html.classList]) if (c.endsWith('-theme')) html.classList.remove(c);
				html.classList.add(`${n}-theme`);
				html.setAttribute('data-theme', n);
			}, name);
		// Контролер теми після гідрації ставить свою тему ще раз — тому ставимо в
		// опитуванні, доки наша не втримається.
		await тема('light');
		const світлі = await фони();
		await expect
			.poll(async () => {
				await тема('dark');
				return (await фони())[0];
			})
			.not.toBe(світлі[0]);
		const темні = await фони();
		// Скарга автора: темнішав лише місяць. Тепер усі чотири однакові в кожній темі.
		expect(new Set(світлі).size, `світла тема: ${світлі}`).toBe(1);
		expect(new Set(темні).size, `темна тема: ${темні}`).toBe(1);
		expect(темні[0]).not.toBe(світлі[0]);
	});

	test('повний екран вмикається й вимикається кнопками сторінки', async ({ page }) => {
		await gotoReady(page, '/calendar/');
		await expect(async () => {
			await page.getByTestId('calendar-fullscreen-btn').click({ timeout: 1000 });
			await expect(page.getByTestId('calendar-fullscreen-exit-btn')).toBeVisible({ timeout: 1000 });
		}).toPass();
		await expect(page.locator('body')).toHaveClass(/calendar-fullscreen/);
		await expect(page.locator('#main-header')).toBeHidden();
		// У повному екрані палітра — ПІД кнопкою «згорнути».
		const згорнути = (await page.getByTestId('calendar-fullscreen-exit-btn').boundingBox())!;
		const палітра = (await page.getByTestId('calendar-theme-open-btn').boundingBox())!;
		expect(палітра.y).toBeGreaterThanOrEqual(згорнути.y + згорнути.height);
		// Панель фону в повному екрані лишається — її відкривають саме під час показу,
		// і фони там стоять ОДНІЄЮ колонкою: панель вузька, щоб влізти збоку від аркуша.
		await expect(page.getByTestId('calendar-theme-open-btn')).toBeVisible();
		await відкритиПанель(page);
		const колонки = await page
			.locator('.themes-grid')
			.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
		expect(колонки).toBe(1);
		// Хрестиком, а не Escape: у справжньому повному екрані Escape забирає браузер.
		await page.getByTestId('calendar-theme-close-btn').click();
		await expect(page.getByTestId('calendar-theme-panel')).toBeHidden();

		await page.getByTestId('calendar-fullscreen-exit-btn').click();
		await expect(page.getByTestId('calendar-fullscreen-exit-btn')).toBeHidden();
		await expect(page.locator('body')).not.toHaveClass(/calendar-fullscreen/);
	});

	test('друк — плакат на одному аркуші A4', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'chromium', 'PDF уміє лише настільний Chromium');
		await gotoReady(page, '/calendar/');
		const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
		const pages = pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g) ?? [];
		expect(pages.length).toBe(1);
	});
});
