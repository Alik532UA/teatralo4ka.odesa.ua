import { expect, test } from '@playwright/test';
import { gotoReady } from './ready';

/**
 * Вітальне вікно: пункт про порядок викладачів ПОКАЗУЄ цей порядок.
 *
 * Доти пункт розповідав про правило, якого ніде не було видно, — «порядок
 * викладачів залежить від ваших анкет» доводилося брати на віру. Тепер під ним
 * стоять самі викладачі в тому порядку, який це правило й задає.
 *
 * Перевіряються три речі, і кожна вже була причиною дефекту в цьому проєкті:
 *
 *   1. Рядок ОДИН. Перенос тут гірший за обрізання: порядок читається зліва
 *      направо, і другий рядок казав би, що показано всіх, хоча показано
 *      перших.
 *   2. Значків тим більше, чим більше місця. Це головна вимога замовника й
 *      єдина причина, чому кількість рахується від ширини, а не задана числом.
 *   3. Підказка називає людину Й число і дає куди написати. Без числа
 *      демонстрація не пояснює нічого: порядок видно, а чому саме такий — ні.
 *      Підказка ВЛАСНА, а не рідна `title`: у рідну не можна покласти кнопку.
 */

const ROW = '[data-testid="galaxy-update-teachers-row-list"]';
const PAGE = '/projects/galaxy-graduates/?update=open';

test.describe('вітальне вікно: порядок викладачів', () => {
	test.skip(({ isMobile }) => !!isMobile, 'ширини задає сам тест');

	test('значки стоять в один рядок, і їх тим більше, чим ширший екран', async ({ page }) => {
		const counts: { name: string; badges: number; rows: number }[] = [];

		for (const size of [
			{ width: 375, height: 667, name: 'телефон' },
			{ width: 820, height: 1180, name: 'планшет' },
			{ width: 1440, height: 900, name: "комп'ютер" }
		]) {
			await page.setViewportSize({ width: size.width, height: size.height });
			await gotoReady(page, PAGE);
			await page.locator(ROW).waitFor();
			// Кількість рахується після заміру ширини, тож перший кадр її ще не має.
			await expect
				.poll(async () => await page.locator(`${ROW} > *`).count(), { timeout: 5000 })
				.toBeGreaterThan(0);

			const report = await page.evaluate((selector) => {
				const row = document.querySelector(selector)!;
				const kids = [...row.children];
				const box = row.getBoundingClientRect();
				return {
					badges: kids.length,
					// Скільки різних верхніх координат — стільки й рядків.
					rows: new Set(kids.map((k) => Math.round(k.getBoundingClientRect().top))).size,
					overflow: Math.round(
						Math.max(...kids.map((k) => k.getBoundingClientRect().right)) - box.right
					),
					label: kids[0]?.querySelector('[role="img"]')?.getAttribute('aria-label') ?? ''
				};
			}, ROW);

			expect(report.rows, `${size.name}: значки перенеслися на ${report.rows} рядки`).toBe(1);
			expect(
				report.overflow,
				`${size.name}: останній значок вилазить за рядок на ${report.overflow} px`
			).toBeLessThanOrEqual(0);
			expect(
				report.label,
				`${size.name}: підпис «${report.label}» не називає число згадок`
			).toMatch(/\d+/);

			// Власна підказка: ім'я, число і чотири способи написати.
			await page.locator(`${ROW} > *`).first().hover();
			const tip = page.getByTestId('galaxy-update-teacher-tip-panel');
			await tip.waitFor();
			expect(
				await tip.getByTestId(/galaxy-update-teacher-tip-link-/).count(),
				`${size.name}: у підказці немає посилань, щоб написати`
			).toBe(4);
			await page.mouse.move(0, 0);

			counts.push({ name: size.name, badges: report.badges, rows: report.rows });
		}

		const [phone, tablet, desktop] = counts;
		expect(
			tablet.badges,
			`на планшеті значків ${tablet.badges}, на телефоні ${phone.badges} — ` +
				`кількість не залежить від місця`
		).toBeGreaterThan(phone.badges);
		expect(
			desktop.badges,
			`на комп'ютері значків ${desktop.badges}, на планшеті ${tablet.badges}`
		).toBeGreaterThan(tablet.badges);
	});
});
