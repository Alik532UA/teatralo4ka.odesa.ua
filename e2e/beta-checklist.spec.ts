import { expect, test } from './fixtures';
import { HIDDEN_ROUTES } from './pages';
import { gotoReady } from './ready';

/**
 * Службова сторінка чеклиста в РАНТАЙМІ (BETA-CHECKLIST-v9).
 *
 * Окремий файл, а не рядок у `smoke.spec.ts`, бо ця сторінка перевіряється
 * ПРОТИЛЕЖНИМ до публічних: у неї немає canonical і hreflang, зате є `noindex`.
 * Спроба перевірити її нарівні з рештою давала б червоне щоразу — тобто
 * перевірку довелося б вимкнути.
 *
 * Що саме тут ловиться і чого не бачать інваріанти над даними: чи сторінка
 * взагалі відкривається, чи позначка ЗБЕРІГАЄТЬСЯ через перезавантаження (а це
 * єдина річ, від якої залежить сенс усієї сторінки), і чи локатори унікальні —
 * двадцять три пункти на одній сторінці роблять дублікати найімовірнішою
 * помилкою розмітки саме тут.
 */

const ROUTE = `${HIDDEN_ROUTES[0]}/`;

test.describe('чеклист бета-тестування', () => {
	test('сторінка відкривається і показує пункти', async ({ page }) => {
		const response = await gotoReady(page, ROUTE);
		expect(response?.status()).toBe(200);

		await expect(page.getByTestId('beta-page-title')).toBeVisible();
		// Порядок рівнів — manual першим: людина витрачається спершу там, де
		// машини немає.
		await expect(page.getByTestId('beta-level-manual-section')).toBeVisible();
		await expect(page.getByTestId('beta-progress-value')).toContainText('/');
	});

	test('поза індексом: noindex є, canonical і hreflang немає', async ({ page }) => {
		await gotoReady(page, ROUTE);
		await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
			'content',
			/noindex/
		);
		expect(await page.locator('link[rel="canonical"]').count()).toBe(0);
		expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(0);
	});

	test('локатори на сторінці унікальні', async ({ page }) => {
		await gotoReady(page, ROUTE);
		const ids = await page.$$eval('[data-testid]', (nodes) =>
			nodes.map((n) => n.getAttribute('data-testid') ?? '')
		);
		expect(ids.length, 'жодного локатора — перевірка мертва').toBeGreaterThan(20);

		const seen = new Map<string, number>();
		for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1);
		const duplicates = [...seen.entries()].filter(([, n]) => n > 1);
		expect(duplicates.map(([id, n]) => `${id} ×${n}`)).toEqual([]);
	});

	test('позначка переживає перезавантаження, а «стерти» її знімає', async ({ page }) => {
		await gotoReady(page, ROUTE);

		// Перший пункт першої вкладки — рівень manual, тобто він завжди у
		// найпершому розділі.
		const firstVote = page
			.getByTestId('beta-level-manual-section')
			.locator('[data-testid$="-ok-btn"]')
			.first();
		await firstVote.click();
		await expect(firstVote).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('beta-progress-value')).not.toContainText('0 /');

		await page.reload();
		await expect(page.getByTestId('beta-progress-value')).not.toContainText('0 /');

		// «Стерти» — у два кроки: перше натискання лише озброює кнопку. Без цього
		// один випадковий клік стирав би всю роботу тестувальника.
		const clear = page.getByTestId('beta-clear-btn');
		await clear.click();
		await clear.click();
		await expect(page.getByTestId('beta-progress-value')).toContainText('0 /');
	});

	test('звіт складається і не порожній', async ({ page, context }) => {
		await context.grantPermissions(['clipboard-read', 'clipboard-write']);
		await gotoReady(page, ROUTE);

		await page
			.getByTestId('beta-level-manual-section')
			.locator('[data-testid$="-fail-btn"]')
			.first()
			.click();
		await page.getByTestId('beta-report-btn').click();

		// Підказка УСПІХУ має власний локатор (§ 6.2.1,
		// `BETA-REPORT-HINT-SPLIT`). Доти локатор був один на обидва випадки, і
		// цей рядок зеленів однаково — що буфер спрацював, що ні; сценарій
		// нижче через це не міг сказати, який саме шлях він щойно перевірив.
		await expect(page.getByTestId('beta-report-hint')).toBeVisible();

		const text = await page.evaluate(() => navigator.clipboard.readText());
		expect(text).toContain('НЕ ПРАЦЮЄ');
	});

	/**
	 * ЗАПАСНИЙ ШЛЯХ — окремим сценарієм із НАВМИСНО зламаним буфером (§ 6.2).
	 *
	 * Просто «не давати дозволу» не досить: у headless Chromium `writeText`
	 * після цього однаково спрацьовує, і сторінка йде гілкою успіху. Тобто
	 * перевірка запасного шляху перевіряла б не його, а те, що кнопка є.
	 */
	test('звіт доходить до людини навіть без буфера обміну', async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(navigator, 'clipboard', {
				configurable: true,
				value: { writeText: () => Promise.reject(new Error('clipboard blocked in test')) }
			});
		});
		await gotoReady(page, ROUTE);

		await page
			.getByTestId('beta-level-manual-section')
			.locator('[data-testid$="-fail-btn"]')
			.first()
			.click();
		await page.getByTestId('beta-report-btn').click();

		await expect(page.getByTestId('beta-report-failed-hint')).toBeVisible();

		// `toHaveValue`, а не `toContainText`: текст приходить у `value`, а не
		// вмістом вузла, і `toContainText` бачить порожній рядок. Стара редакція
		// цього сценарію мала саме `toContainText` — і не падала лише тому, що
		// гілка запасного шляху не виконувалася жодного разу.
		await expect(page.getByTestId('beta-report-input')).toHaveValue(/НЕ ПРАЦЮЄ/);
	});

	/**
	 * § 8.5.1 `BETA-VERSION-VISIBLE` і § 8.4 `BETA-SCREEN-LINKS`: версія
	 * відповідає на «чи рахується моя позначка» (підказка про чужу позначку
	 * несе число, і без поточного їй нема з чим порівнятися), а перелік екранів
	 * знімає найдовший крок у роботі — прочитав пункт, шукає, де це на сайті.
	 */
	test('на сторінці видно версію, екрани вкладки й вихід', async ({ page }) => {
		await gotoReady(page, ROUTE);

		await expect(page.getByTestId('beta-version-text')).toHaveText(/\d/);
		await expect(
			page.getByTestId('beta-home-link'),
			'зі службової сторінки нема куди піти'
		).toHaveAttribute('href', /.+/);

		const links = page.locator('[data-testid^="beta-screen-"]');
		expect(await links.count(), 'вкладка не показала жодного екрана').toBeGreaterThan(0);
		await expect(links.first()).toHaveAttribute('href', /.+/);
	});
});
