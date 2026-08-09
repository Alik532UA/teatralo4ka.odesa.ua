import { expect, test } from '@playwright/test';
import { PUBLIC_PAGES } from './pages';
import { gotoReady } from './ready';

/**
 * Дублікати `data-testid` у рантаймі (TESTID-AND-NAMING-v8 § 4).
 *
 * Статично цього не видно: один і той самий шаблон у компоненті дає унікальні
 * значення, поки компонент на сторінці один. Другий екземпляр — і два різні
 * елементи відповідають одному селектору. Тест і Playwright, і людина після
 * цього бачать перший-ліпший.
 */
test.describe('data-testid унікальні', () => {
	for (const path of PUBLIC_PAGES) {
		test(`${path}`, async ({ page }) => {
			await gotoReady(page, path);

			const ids = await page.$$eval('[data-testid]', (nodes) =>
				nodes.map((n) => n.getAttribute('data-testid') ?? '')
			);

			expect(ids.length, `${path}: жодного data-testid — перевірка мертва`).toBeGreaterThan(0);

			const seen = new Map<string, number>();
			for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1);
			const duplicates = [...seen.entries()].filter(([, n]) => n > 1);

			expect(
				duplicates,
				`дублікати на ${path}: ${duplicates.map(([id, n]) => `${id} ×${n}`).join(', ')}`
			).toEqual([]);
		});
	}
});

test('порожніх data-testid немає', async ({ page }) => {
	await page.goto('/');
	const empty = await page.$$eval('[data-testid]', (nodes) =>
		nodes.filter((n) => !(n.getAttribute('data-testid') ?? '').trim()).length
	);
	expect(empty).toBe(0);
});

test('у testid не протікають невирішені шаблони', async ({ page }) => {
	// `data-testid="{prefix}-btn"` у Svelte без фігурних дужок навколо всього
	// значення потрапляє в HTML буквально.
	await page.goto('/');
	const ids = await page.$$eval('[data-testid]', (nodes) =>
		nodes.map((n) => n.getAttribute('data-testid') ?? '')
	);
	const broken = ids.filter((id) => /[{}$]|undefined|NaN|null/.test(id));
	expect(broken, `зламані testid: ${broken.join(', ')}`).toEqual([]);
});
