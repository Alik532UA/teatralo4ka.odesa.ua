import { expect, test } from '@playwright/test';
import { gotoReady } from './ready';

/**
 * Три режими показу вистав у профілі майстра: плитка, список, хронологія.
 *
 * ## Що саме стережеться
 *
 * Головна властивість не «є три кнопки», а інша: у всіх трьох режимах видно
 * ОДНЕ Й ТЕ САМЕ, просто по-різному викладене. Зламати це легко й непомітно —
 * досить, щоб один режим брав `productions`, а другий `filteredProductions`, і
 * людина, перемкнувши вигляд, побачила б інший набір вистав, не змінивши
 * жодного фільтра. На екрані це майже непомітно: вистав сімдесят дві, і
 * зникнення восьми «ранніх показів» виглядає як інша розкладка.
 *
 * Заміряно 2026-08-31 на сторінці Федора Ткача: 72 вистави в кожному з трьох
 * режимів, 21 рік у хронології.
 *
 * ## Навіщо три режими взагалі — і чому це теж міряється
 *
 * Компактні режими мають бути компактними, інакше вони не потрібні. Заміряно
 * там же: висота розділу 10445 → 5401 (список) і 5717 (хронологія) на десктопі,
 * 26350 → 10573 і 9293 на телефоні. Перевірка нижче вимагає, щоб список був
 * помітно нижчим за плитку, — без цього режим лишився б назвою без сенсу.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Передати в `MasterProductionsList` не `filteredProductions`, а `productions` —
 * впаде перевірка про однаковий набір і назве обидва числа. Прибрати
 * `{#if view === ...}` на користь показу всіх трьох одразу — впаде перевірка
 * про рівно один видимий перелік.
 */

const ФЕДІР = '/residents/adults/fedir-tkach';

/** Скільки вистав видно в поточному режимі — рахуємо в кожного своє. */
async function скільки(page: import('@playwright/test').Page): Promise<number> {
	return page.evaluate(() => {
		const плитки = document.querySelectorAll('article[data-testid^="master-production-card-"]').length;
		const рядки = document.querySelectorAll('li[data-testid^="master-productions-row-"]').length;
		const хронологія = document.querySelectorAll('li[data-testid^="master-productions-year-item-"]').length;
		return плитки + рядки + хронологія;
	});
}

test.describe('режими показу вистав', () => {
	test('перемикач має всі три режими', async ({ page }) => {
		await gotoReady(page, ФЕДІР);
		await expect(page.getByTestId('master-productions-view-toggle')).toBeVisible();
		for (const режим of ['tiles', 'list', 'timeline']) {
			await expect(
				page.getByTestId(`master-productions-view-btn-${режим}`),
				`немає кнопки режиму «${режим}»`
			).toBeVisible();
		}
	});

	test('у трьох режимах видно однаковий набір вистав', async ({ page }) => {
		await gotoReady(page, ФЕДІР);

		await page.getByTestId('master-productions-view-btn-tiles').click();
		const плиткою = await скільки(page);
		expect(плиткою, 'плиткою не видно жодної вистави — перевірка мертва').toBeGreaterThan(10);

		await page.getByTestId('master-productions-view-btn-list').click();
		await expect(page.getByTestId('master-productions-rows-list')).toBeVisible();
		const списком = await скільки(page);

		await page.getByTestId('master-productions-view-btn-timeline').click();
		await expect(page.getByTestId('master-productions-timeline-list')).toBeVisible();
		const хронологією = await скільки(page);

		expect(
			{ списком, хронологією },
			`режим змінив НАБІР вистав, а не лише його вигляд (плиткою ${плиткою}). ` +
				'Найімовірніше, один із переліків отримує не відфільтрований список'
		).toEqual({ списком: плиткою, хронологією: плиткою });
	});

	test('показується рівно один перелік, а не три поверх одного', async ({ page }) => {
		await gotoReady(page, ФЕДІР);
		await page.getByTestId('master-productions-view-btn-list').click();

		const переліки = await page.evaluate(() =>
			[
				['плитка', 'master-productions-list'],
				['список', 'master-productions-rows-list'],
				['хронологія', 'master-productions-timeline-list']
			]
				.filter(([, id]) => document.querySelector(`[data-testid="${id}"]`) !== null)
				.map(([назва]) => назва)
		);

		expect(
			переліки,
			'на сторінці більше одного переліку вистав: решта режимів або сховані стилями, ' +
				'або малюються дарма — при 72 виставах це втричі більше вузлів'
		).toEqual(['список']);
	});

	test('компактні режими справді компактніші', async ({ page }) => {
		await gotoReady(page, ФЕДІР);
		const висота = async () =>
			(await page.getByTestId('master-productions-section').boundingBox())?.height ?? 0;

		await page.getByTestId('master-productions-view-btn-tiles').click();
		await expect(page.getByTestId('master-productions-list')).toBeVisible();
		const плиткою = await висота();

		await page.getByTestId('master-productions-view-btn-list').click();
		await expect(page.getByTestId('master-productions-rows-list')).toBeVisible();
		const списком = await висота();

		expect(плиткою, 'висота плиткою нульова — заміряти нема чого').toBeGreaterThan(0);
		expect(
			списком,
			`список заввишки ${Math.round(списком)} проти ${Math.round(плиткою)} плиткою — ` +
				'режим перестав бути компактним, тобто втратив причину існувати'
		).toBeLessThan(плиткою * 0.8);
	});

	test('вибраний режим переживає перезавантаження', async ({ page }) => {
		await gotoReady(page, ФЕДІР);
		await page.getByTestId('master-productions-view-btn-timeline').click();
		await expect(page.getByTestId('master-productions-timeline-list')).toBeVisible();

		await page.reload();
		await expect(
			page.getByTestId('master-productions-timeline-list'),
			'після перезавантаження повернувся типовий режим — вибір не зберігся'
		).toBeVisible();
	});
});
