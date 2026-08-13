import { expect, test, type Page } from '@playwright/test';
import { gotoReady, waitForAnimations } from './ready';

/**
 * Патерн email (NOTIFICATIONS-v8 § 4 і § 7).
 *
 * Перевіряється саме те, що не видно ні в коді, ні в юніт-тестах: що клік
 * СПРАВДІ не йде в `mailto:`, що тост з'являється БІЛЯ посилання, а не в кутку,
 * і що він закривається при прокрутці. Останнє довелося винести сюди, бо в
 * панелі браузера подій `scroll` не існує взагалі — вона не композитить кадри.
 *
 * Окремо береться посилання з ТІЛА сторінки: воно приходить із markdown, тобто
 * власного обробника мати не може, і саме на ньому патерн раніше не працював.
 */

const FOOTER_EMAIL = '[data-testid="footer-email-link"]';
const ANCHORED = '[data-testid="toast-anchored-container"]';
const TOAST_SUCCESS = '[data-testid="toast-message-success"]';

/** Буфер обміну в headless за замовчуванням відмовляє — дозволяємо явно. */
async function allowClipboard(page: Page) {
	await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);
}

test.describe('email — копіювання з тостом замість mailto', () => {
	test('клік у підвалі не відкриває пошту, а показує тост із дією', async ({ page }) => {
		await allowClipboard(page);
		await gotoReady(page, '/');
		await waitForAnimations(page);

		const link = page.locator(FOOTER_EMAIL);
		await link.scrollIntoViewIfNeeded();
		await link.click();

		const toast = page.locator(TOAST_SUCCESS).first();
		await expect(toast).toBeVisible();
		await expect(page.locator('[data-testid="toast-action-btn"]').first()).toBeVisible();

		// Адреса справді в буфері, а не просто «щось показали».
		const clipboard = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboard).toContain('@');

		// І головне: сторінка лишилася на місці, mailto не відкрився.
		expect(new URL(page.url()).pathname).toBe('/');
	});

	test('email із ТІЛА сторінки поводиться так само, як у підвалі', async ({ page }) => {
		await allowClipboard(page);
		await gotoReady(page, '/projects/teatr-pro');
		await waitForAnimations(page);

		// Саме текстове посилання зі змісту сторінки, не з підвала.
		const link = page.locator('a[href^="mailto:" i]').filter({ hasNotText: '' }).first();
		await link.scrollIntoViewIfNeeded();
		await link.click();

		await expect(page.locator(TOAST_SUCCESS).first()).toBeVisible();
		const clipboard = await page.evaluate(() => navigator.clipboard.readText());
		expect(clipboard).toContain('@');
	});

	test('тост анкорний — біля посилання, а не в кутку', async ({ page }, testInfo) => {
		test.skip(
			testInfo.project.name === 'mobile',
			'на вузьких екранах анкор навмисно ігнорується — див. §5'
		);
		await allowClipboard(page);
		await gotoReady(page, '/');
		await waitForAnimations(page);

		const link = page.locator(FOOTER_EMAIL);
		await link.scrollIntoViewIfNeeded();
		await link.click();

		const anchored = page.locator(ANCHORED);
		await expect(anchored).toBeVisible();

		const linkBox = (await link.boundingBox())!;
		const toastBox = (await anchored.boundingBox())!;
		const viewport = page.viewportSize()!;

		// Переворот за половиною вьюпорта: тригер унизу — тост зверху, і навпаки.
		const linkInLowerHalf = linkBox.y + linkBox.height / 2 > viewport.height / 2;
		if (linkInLowerHalf) {
			expect(toastBox.y + toastBox.height, 'тост має бути НАД посиланням').toBeLessThanOrEqual(
				linkBox.y + 1
			);
		} else {
			expect(toastBox.y, 'тост має бути ПІД посиланням').toBeGreaterThanOrEqual(
				linkBox.y + linkBox.height - 1
			);
		}

		// Цілком на екрані — інакше сенс анкорності зникає.
		expect(toastBox.x).toBeGreaterThanOrEqual(0);
		expect(toastBox.x + toastBox.width).toBeLessThanOrEqual(viewport.width);
		expect(toastBox.y).toBeGreaterThanOrEqual(0);
		expect(toastBox.y + toastBox.height).toBeLessThanOrEqual(viewport.height);
	});

	test('прокрутка закриває анкорний тост — він не їздить за посиланням', async ({
		page
	}, testInfo) => {
		test.skip(testInfo.project.name === 'mobile', 'на вузьких екранах тост не анкорний');
		await allowClipboard(page);
		await gotoReady(page, '/projects/teatr-pro');
		await waitForAnimations(page);

		const link = page.locator('a[href^="mailto:" i]').first();
		await link.scrollIntoViewIfNeeded();
		await link.click();
		await expect(page.locator(ANCHORED)).toBeVisible();

		// 'instant': у global.css стоїть `scroll-behavior: smooth`, і плавна
		// прокрутка тут перетворила б перевірку на гонитву за анімацією.
		await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'instant' }));

		await expect(page.locator(ANCHORED)).toHaveCount(0);
	});

	test('звичайне посилання лишається звичайним', async ({ page }) => {
		await gotoReady(page, '/');
		await waitForAnimations(page);

		await page.locator('[data-testid="footer-address-link"]').first().waitFor();
		// Перевіряємо намір, а не перехід: відкриття чужого сайту в тесті зайве.
		const href = await page
			.locator('[data-testid="footer-address-link"]')
			.first()
			.getAttribute('href');
		expect(href).toMatch(/^https:/);
		await expect(page.locator(TOAST_SUCCESS)).toHaveCount(0);
	});
});
