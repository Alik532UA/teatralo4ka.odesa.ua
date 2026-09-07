import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * Новина з адмінки мусить відкриватися ПРЯМИМ посиланням, а не лише з переліку.
 *
 * ## Що ловиться
 *
 * Новини з адмінки живуть у Firestore, у `build/` їх немає, адресу віддає
 * `fallback: '404.html'`. Відколи маршрут новин дістав `prerender = true`
 * (4 вересня 2026, разом із новинами в коді), клієнтський роутер на адресу з
 * бази віддавав 404, навіть не виконавши завантажувач. Заміряно 7 вересня:
 *
 *   з переліку `/news/` ..... заголовок новини на місці
 *   прямим посиланням ....... 404, «Сторінку не знайдено»
 *
 * Тобто кожне посилання на новину, надіслане в месенджері, показувало
 * одержувачеві 404, а автор цього не бачив: він приходить із переліку, а це
 * перехід усередині застосунку. Розбір і рятунок — у `src/routes/+error.svelte`.
 *
 * Перевірка саме E2E, і інакше не буває: дефект живе рівно в тому проміжку, який
 * видно лише на зібраній статиці в справжньому браузері. Ані типи, ані юніти
 * туди не дістають — обидві сторони окремо валідні.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v9 § 1.1)
 *
 * Проведено на зібраному сайті ДО правки: перша перевірка падала — на прямій
 * адресі стояв заголовок «404». Друга (справжня 404 лишається 404) була зелена
 * й до, і після: вона стереже, щоб рятунок не проковтнув чесну помилку.
 */

/*
 * Покажчик читається з диска, а не імпортом: Playwright виконує специфікації в
 * Node без завантажувача JSON-модулів («needs an import attribute»).
 */
const картки = JSON.parse(readFileSync('src/lib/data/news-cards.data.json', 'utf8')) as Record<
	'uk',
	Record<string, unknown>
>;
const КОД = new Set(Object.keys(картки.uk));

test.describe('новина з бази за прямим посиланням', () => {
	test('новина з адмінки відкривається', async ({ page }) => {
		await page.goto('/news/');
		await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20_000 });

		/*
		 * Чекаємо саме на новину З БАЗИ, а не просто на посилання: перелік
		 * дотягує Firestore уже після першого кадру, а рахувати всі посилання
		 * `/news/` не можна — у меню й у шапці вони теж є, і на вузькому екрані
		 * їх більше, ніж новин у коді. Через це перевірка спершу зеленіла на
		 * лічильнику й падала на порожньому переліку.
		 */
		const новиниЗБази = async () => {
			const hrefs = await page
				.locator('a[href*="news/"]')
				.evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute('href') ?? ''));
			return [
				...new Set(
					hrefs
						.map((h) => h.replace(/\/$/, '').split('news/')[1])
						.filter((id) => id && !id.includes('/') && !КОД.has(id))
				)
			];
		};
		await expect
			.poll(async () => (await новиниЗБази()).length, {
				timeout: 30_000,
				message: 'у переліку не з’явилося жодної новини з бази — перевіряти нема чого'
			})
			.toBeGreaterThan(0);

		const адреса = `/news/${(await новиниЗБази())[0]}/`;
		await page.goto(адреса);
		await page.waitForLoadState('load');

		const заголовок = page.locator('h1').first();
		await expect(заголовок, `${адреса} мусить показати статтю, а не 404`).not.toHaveText('404', {
			timeout: 30_000
		});
		await expect(page.getByTestId('error-page-section')).toHaveCount(0);
		expect((await заголовок.textContent())?.trim().length ?? 0).toBeGreaterThan(3);
	});

	test('справжня 404 лишилася 404', async ({ page }) => {
		/*
		 * Рятунок працює лише для адрес новин і рівно двох сегментів — без цієї
		 * перевірки він міг би проковтнути чесну помилку. Адреси взяті такі, що НЕ
		 * належать жодному маршрутові: `/takoi-storinky-nemaie/` сюди не годиться,
		 * бо один сегмент у корені — це маршрут сторінок із бази, і він законно
		 * показує «Сторінку не знайдено» вже своїм шаблоном.
		 */
		await page.goto('/about/nemaie-takoi/');
		await expect(page.getByTestId('error-page-status')).toHaveText('404', { timeout: 30_000 });
		await page.goto('/projects/galaxy-graduates/plays/takoi-vystavy-nemaie/');
		await expect(page.getByTestId('error-page-status')).toHaveText('404', { timeout: 30_000 });
	});
});
