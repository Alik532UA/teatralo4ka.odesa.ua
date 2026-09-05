import { expect, test } from '@playwright/test';
import { gotoReady } from './ready';

/**
 * Пошук по сайту: що він БАЧИТЬ і чого не бачить.
 *
 * ## Чому прогоном, а не гейтом
 *
 * Записи галактики довантажуються `import()`-ом у мить, коли накладку відкрили
 * (розбір — у `services/searchGalaxy`). Розбір джерел цього не перевіряє: там
 * видно імпорт, але не видно, чи модуль справді приїхав, чи потрапив у той
 * самий перелік, по якому шукають, і чи знайдеться людина за прізвищем.
 *
 * ## Що саме стережеться
 *
 * 1. Людина знаходиться за прізвищем. Саме з цього почалася робота: автор
 *    шукав «Тункевич» і не знаходив нічого — пошук знав лише markdown-сторінки
 *    та новини, а вся галактика лишалася поза ним.
 * 2. Знаходяться й інші реєстри: вистава, заклад освіти, курс.
 * 3. НЕ знаходиться той, кого приховали навмисно. Володимир Захарченко має
 *    рівень видимості `direct`: сторінка в нього є, але в переліках і в пошуку
 *    його немає — і це не випадковість, а вимога автора.
 */
const ЗАПИТИ: { запит: string; очікуємо: RegExp }[] = [
	{ запит: 'Тункевич', очікуємо: /Тункевич/ },
	{ запит: 'ОТХФК', очікуємо: /ОТХФК/ },
	{ запит: 'Резонанс', очікуємо: /Резонанс/ }
];

async function відкритиПошук(page: import('@playwright/test').Page) {
	await page.getByTestId('header-search-btn').first().click();
	await expect(page.locator('.search__input')).toBeVisible();
}

test.describe('пошук по сайту', () => {
	test.skip(({ isMobile }) => !!isMobile, 'кнопка пошуку в шапці — на широкому екрані');

	for (const { запит, очікуємо } of ЗАПИТИ) {
		test(`знаходить «${запит}» у галактиці`, async ({ page }) => {
			await gotoReady(page, '/');
			await відкритиПошук(page);
			await page.locator('.search__input').fill(запит);

			/* Реєстри приїжджають окремим шматком, тож перший кадр може бути
			   порожній — чекаємо на появу, а не міряємо одразу. */
			await expect(page.locator('.search__hit').first()).toBeVisible({ timeout: 10_000 });
			await expect(page.locator('.search__hit').first()).toHaveText(очікуємо);
		});
	}

	test('не знаходить того, кого приховали навмисно', async ({ page }) => {
		await gotoReady(page, '/');
		await відкритиПошук(page);
		await page.locator('.search__input').fill('Захарченко');

		/* Реєстрам дається час приїхати — інакше «нічого не знайдено» означало б
		   лише те, що вони ще в дорозі. */
		await page.waitForTimeout(3000);
		await expect(page.locator('.search__hit')).toHaveCount(0);
	});

	test('поле пошуку без прямокутного кільця, а фокус видно межею рядка', async ({ page }) => {
		await gotoReady(page, '/');
		await відкритиПошук(page);

		/*
		 * 28 серпня я прибрав звідси `outline: none` заради видимого фокуса, і
		 * глобальне кільце намалювало прямокутник усередині круглої плашки —
		 * автор назвав це «старомодною обводою». Тепер межу підсвічує рядок, у
		 * якому лежить поле, а кільця на самому полі немає.
		 */
		const стан = await page.evaluate(() => {
			const поле = document.querySelector('.search__input') as HTMLElement;
			поле.focus();
			const рядок = document.querySelector('.search__field') as HTMLElement;
			return {
				кільце: getComputedStyle(поле).outlineStyle,
				межа: getComputedStyle(рядок).borderBottomColor,
				акцент: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim()
			};
		});
		expect(стан.кільце, 'на полі знову з’явилося кільце фокуса').toBe('none');
		expect(стан.межа, 'межа рядка не підсвічена акцентом теми').not.toBe('rgba(0, 0, 0, 0)');
	});
});
