import { expect, test, type Page } from '@playwright/test';
import type { ScrollbarMode } from '$lib/controllers/ui.svelte';

/**
 * Режими смуги прокрутки.
 *
 * Перевіряється не вигляд, а поведінка, яку легко зламати непомітно:
 * чи типовий режим нічого не малює, чи власна смуга не забирає ширину, і чи
 * перетягування дає прокрутку БЕЗ затримки.
 *
 * Остання перевірка з'явилася після реальної скарги: рухи миші запускали
 * `scrollTo` з `behavior: 'auto'`, що означає «взяти значення з CSS», а там
 * `scroll-behavior: smooth`. Кожен рух починав плавну анімацію, вони
 * наздоганяли одна одну — і перетягування смикалося.
 */

/** Вмикає режим так само, як це робить кнопка в налаштуваннях. */
async function setMode(page: Page, mode: ScrollbarMode) {
	await page.evaluate((m) => {
		localStorage.setItem('teatralo4ka_scrollbarMode', m);
	}, mode);
	await page.reload();
	await page.waitForLoadState('load');
	await expect(page.locator('h1, h2').first()).toBeVisible();
}

test.describe('режими смуги прокрутки', () => {
	/**
	 * Усе, крім типового режиму, вимкнене на сенсорних пристроях: там прокрутка
	 * пальцем, нативний індикатор і так накладка, а «наближення миші» не існує.
	 * Компоненти перевіряють це через `(hover: hover) and (pointer: fine)`, тож
	 * на мобільному проєкті перевіряти нема чого.
	 */
	test.skip(
		({ isMobile }) => !!isMobile,
		'власна смуга і мінімапа — лише для пристроїв із мишею'
	);

	test.beforeEach(async ({ page }) => {
		// Довга сторінка: на короткій прокрутки немає і перевіряти нічого.
		await page.goto('/history');
		await page.waitForLoadState('load');
	});

	test('типовий режим не малює нічого свого', async ({ page }) => {
		await setMode(page, 'standard');
		await expect(page.getByTestId('page-scrollbar-container')).toHaveCount(0);
		await expect(page.getByTestId('minimap-container')).toHaveCount(0);

		// Нативна смуга лишається: клас ставить лише той компонент, що її замінює.
		const hidden = await page.evaluate(() =>
			document.documentElement.classList.contains('has-custom-scrollbar')
		);
		expect(hidden, 'нативну смугу не можна ховати в типовому режимі').toBe(false);
	});

	test('власна смуга не забирає ширину сторінки', async ({ page }) => {
		await setMode(page, 'custom');
		await expect(page.getByTestId('page-scrollbar-container')).toBeVisible();

		// Саме заради цього все й робилося: нативна смуга є частиною розкладки,
		// через що сторінки з нею і без неї зсунуті одна відносно одної.
		const gap = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
		expect(gap, 'сторінка мусить лишатися на всю ширину вікна').toBe(0);
	});

	test('власна смуга лежить під заставкою', async ({ page }) => {
		await setMode(page, 'custom');
		const z = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="page-scrollbar-container"]');
			return el ? Number(getComputedStyle(el).zIndex) : -1;
		});
		// Заставка в app.html має z-index 10000.
		expect(z).toBeGreaterThan(0);
		expect(z, 'смуга не має перекривати заставку').toBeLessThan(10000);
	});

	test('схематична мінімапа вузька', async ({ page }) => {
		await setMode(page, 'minimap');
		const viewport = page.viewportSize()!;
		await page.mouse.move(viewport.width - 4, viewport.height / 2);
		await page.waitForTimeout(900);

		const box = (await page.getByTestId('minimap-container').boundingBox())!;
		// Смужкам не потрібна пропорційна ширина: раніше вона бралася з масштабу
		// сторінки і виходила в кілька разів більшою, ніж треба.
		expect(box.width, 'схематична мінімапа має лишатися вузькою').toBeLessThanOrEqual(40);
	});

	test('візуальна мінімапа збігається зі сторінкою', async ({ page }) => {
		await setMode(page, 'minimap-full');
		const viewport = page.viewportSize()!;
		await page.mouse.move(viewport.width - 4, viewport.height / 2);
		await page.waitForTimeout(900);
		await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
		await page.waitForTimeout(300);

		const geometry = await page.evaluate(() => {
			const box = document.querySelector('[data-testid="minimap-container"]')!;
			const clone = box.querySelector('.minimap__clone') as HTMLElement;
			const marker = box.querySelector('[data-testid="minimap-viewport-status"]')!;
			return {
				boxHeight: box.getBoundingClientRect().height,
				cloneHeight: clone.getBoundingClientRect().height,
				markerTop: marker.getBoundingClientRect().top - box.getBoundingClientRect().top,
				scrollY: window.scrollY,
				pageHeight: document.documentElement.scrollHeight
			};
		});

		// Клон масштабується по ВИСОТІ, тож уся сторінка займає рівно висоту
		// смужки. Саме розходження цих двох величин і давало зсув рамки.
		expect(Math.abs(geometry.cloneHeight - geometry.boxHeight), 'клон має заповнювати смужку по висоті')
			.toBeLessThan(4);

		// Рамка стоїть там, де в клоні перебуває поточна позиція прокрутки.
		const expected = (geometry.scrollY / geometry.pageHeight) * geometry.boxHeight;
		expect(Math.abs(geometry.markerTop - expected), 'рамка має збігатися з вмістом клону')
			.toBeLessThan(6);
	});

	for (const mode of ['custom', 'minimap', 'minimap-full'] as const) {
		test(`${mode}: перетягування прокручує без затримки`, async ({ page }) => {
			await setMode(page, mode);
			const testId = mode === 'custom' ? 'page-scrollbar-container' : 'minimap-container';
			const control = page.getByTestId(testId);
			await expect(control).toBeVisible();

			const viewport = page.viewportSize()!;
			// Мінімапа у спокої схована за правий край і лишає вузьку смужку, тож
			// спершу підносимо мишу — як це робить людина, — і чекаємо, поки
			// пружина її висуне. Без цього точка натиску опинялася б за вікном.
			await page.mouse.move(viewport.width - 4, viewport.height / 2);
			await page.waitForTimeout(900);

			const box = (await control.boundingBox())!;
			// Впритул до краю: там елемент видимий у будь-якому режимі.
			const x = Math.min(box.x + box.width / 2, viewport.width - 4);

			await page.mouse.move(x, box.y + 40);
			await page.mouse.down();
			await page.mouse.move(x, box.y + box.height * 0.7, { steps: 8 });

			// Один кадр на застосування — і все. Якби прокрутка йшла плавною
			// анімацією, за 100 мс вона була б ще в дорозі.
			await page.waitForTimeout(100);
			const during = await page.evaluate(() => window.scrollY);

			await page.mouse.up();
			await page.waitForTimeout(400);
			const after = await page.evaluate(() => window.scrollY);

			expect(during, 'перетягування має прокручувати').toBeGreaterThan(100);
			// Після відпускання сторінка не повинна «доїжджати».
			expect(Math.abs(after - during), 'прокрутка не мусить тривати після відпускання')
				.toBeLessThan(80);
		});
	}
});
