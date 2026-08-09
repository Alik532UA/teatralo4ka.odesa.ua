import { expect, test } from '@playwright/test';
import { OFFSITE_REDIRECTS } from './pages';

/**
 * Сторінки-перенаправлення на зовнішні ресурси.
 *
 * Решта тестів їх пропускає — інакше браузер іде за перенаправленням і вони
 * перевіряють чужу розмітку. Тут перевіряється рівно те, що нам належить:
 * сторінка справді існує і справді веде куди треба.
 *
 * `meta http-equiv="refresh"` — не найкращий спосіб перенаправлення (пошуковики
 * віддають перевагу 301), але на GitHub Pages віддати заголовок нема як. Це
 * записано в PROJECT-CONTEXT як свідоме відхилення, а не забуте.
 */
test.describe('перенаправлення на зовнішні сайти', () => {
	for (const [path, target] of Object.entries(OFFSITE_REDIRECTS)) {
		test(`${path} → ${target}`, async ({ request }) => {
			// Через request, а не page: сторінку не треба відкривати, щоб побачити
			// її власну розмітку. page.goto пішов би за refresh.
			const response = await request.get(path);
			expect(response.status(), `${path} має існувати`).toBe(200);

			const html = await response.text();
			const meta = html.match(/<meta[^>]+http-equiv="refresh"[^>]*>/i)?.[0];
			expect(meta, `${path}: немає meta refresh`).toBeTruthy();
			expect(meta).toContain(target);
		});
	}
});
