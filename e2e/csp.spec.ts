import { expect, test } from '@playwright/test';
import { PUBLIC_PAGES } from './pages';
import { gotoReady } from './ready';

/**
 * Порушення CSP у рантаймі (SECURITY-v8 § 3).
 *
 * Політику можна перевірити статично — і цього замало. `mode: 'auto'` хешує
 * лише інлайн-скрипти, які SvelteKit генерує сам; вписані руками в `app.html`
 * він не бачить. Заблокований скрипт не ламає збірку і не пише нічого в HTML:
 * він просто мовчки не виконується, і в проєкті це вже сталося.
 *
 * Домени теж не виводяться з бандла: reCAPTCHA підтягує Firebase Auth у
 * рантаймі, і знайшлася вона лише в консолі браузера — спершу як заблокований
 * скрипт, потім, уже після виправлення, ще й як заблокований запит.
 */
const CSP_MESSAGE = /Content Security Policy|violates the following|Refused to (load|connect|execute)/i;

/**
 * Порушення в режимі report-only нічого не блокують — браузер сам пише, що
 * «further action has been taken» не було. Такі повідомлення приходять із
 * чужої політики: фрейм reCAPTCHA несе власний `frame-ancestors`, і на нашу
 * сторінку це не впливає ніяк. Ловити їх означало б робити тест червоним
 * через чужі налаштування.
 */
const REPORT_ONLY = /report-only|no further action has been taken/i;

test.describe('CSP нічого не блокує', () => {
	for (const path of PUBLIC_PAGES) {
		test(`${path}`, async ({ page }) => {
			const violations: string[] = [];
			page.on('console', (msg) => {
				const text = msg.text();
				if (msg.type() === 'error' && CSP_MESSAGE.test(text) && !REPORT_ONLY.test(text)) {
					violations.push(text);
				}
			});

			await gotoReady(page, path);
			// Запас на відкладені скрипти: reCAPTCHA й аналітика підтягуються вже
			// після готовності сторінки, і саме вони впиралися в CSP.
			await page.waitForTimeout(1500);

			expect(violations, `${path}:\n${violations.join('\n')}`).toEqual([]);
		});
	}
});

test('усі потрібні директиви на місці', async ({ page }) => {
	await page.goto('/');
	const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
	expect(csp, 'CSP відсутня у зібраному HTML').toBeTruthy();

	// Самі хеші й unsafe-* перевіряє csp-static.spec.ts над зібраним HTML:
	// там це детерміновано, тут залежало б від того, що встиг зробити браузер.
	for (const directive of ['object-src', 'base-uri', 'form-action', 'connect-src', 'script-src']) {
		expect(csp, `директива ${directive} відсутня`).toContain(directive);
	}
});

test('інлайн-скрипт теми виконався, а не був заблокований', async ({ page }) => {
	await page.goto('/');
	// `data-splash`, а не `data-theme`: тему після гідрації виставляє ще й
	// контролер ui, тож її наявність нічого не доводить — перша версія цього
	// тесту проходила навіть тоді, коли скрипт був заблокований. `data-splash`
	// ставить лише інлайн-скрипт; решта коду його тільки читає.
	await expect(page.locator('html')).toHaveAttribute('data-splash', /.+/);
});

test('винесені скрипти справді віддаються', async ({ request }) => {
	for (const file of ['/perf.js', '/splash.js']) {
		const response = await request.get(file);
		expect(response.status(), `${file} не віддається`).toBe(200);
		expect((await response.text()).trim().length, `${file} порожній`).toBeGreaterThan(0);
	}
});
