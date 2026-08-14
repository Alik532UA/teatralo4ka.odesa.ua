import { expect, test } from '@playwright/test';
import { REDIRECT_PAGES } from './pages';

/**
 * Сторінки-перенаправлення — і на зовнішні ресурси, і всередині сайту.
 *
 * Решта тестів їх пропускає: браузер іде за перенаправленням, і всі перевірки
 * стосуються вже іншої сторінки. Для зовнішніх це давало 757 порушень axe у
 * розмітці Google Sites; для внутрішніх — тихіше й гірше: перевірки мовчки
 * зараховувалися сторінці `/projects/teatr-pro`, а самі `fest-*` не
 * перевірялися жодного разу.
 *
 * Тут перевіряється рівно те, що нам належить: сторінка справді існує і справді
 * веде куди треба.
 *
 * `meta http-equiv="refresh"` — не найкращий спосіб перенаправлення (пошуковики
 * віддають перевагу 301), але на GitHub Pages віддати заголовок нема як. Це
 * записано в PROJECT-CONTEXT як свідоме відхилення, а не забуте.
 */
test.describe('сторінки-перенаправлення', () => {
	for (const [path, target] of Object.entries(REDIRECT_PAGES)) {
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
