import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PUBLIC_PAGES } from './pages';
import { gotoReady, waitForAnimations } from './ready';

/**
 * Автоматичний аудит доступності (ACCESSIBILITY-v8 § 10).
 *
 * axe ловить приблизно третину проблем WCAG — контраст, відсутні мітки,
 * порушену ієрархію заголовків, дублікати id. Решта (порядок фокуса, сенс
 * альтернативного тексту, робота з клавіатури) лишається за людиною, і це
 * записано в PROJECT-CONTEXT як борг, а не вдається за покриття.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * На мобільному прогоні перевіряються лише дві сторінки. Правила axe від
 * ширини не залежать, крім контрасту й перекриття цілей дотику — а вони
 * ловляться на будь-якій сторінці з тим самим макетом. Повний набір на обох
 * проєктах додав би 25 прогонів axe заради тих самих порушень.
 */
const MOBILE_SAMPLE = ['/', '/about'];

test.describe('axe без порушень', () => {
	for (const path of PUBLIC_PAGES) {
		test(`${path}`, async ({ page }, testInfo) => {
			test.skip(
				testInfo.project.name === 'mobile' && !MOBILE_SAMPLE.includes(path),
				'на мобільному — вибірка, див. MOBILE_SAMPLE'
			);

			await gotoReady(page, path);
			// Без цього axe міряє контраст ПОСЕРЕД появи сторінки, коли текст ще
			// напівпрозорий, і тест стає нестабільним. Подробиці — у `ready.ts`.
			await waitForAnimations(page);

			const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();

			const report = violations
				.map((v) => `[${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`)
				.join('\n');

			expect(violations, `${path}\n${report}`).toEqual([]);
		});
	}
});

test('клавіатура доходить до основного контенту', async ({ page }) => {
	await page.goto('/');
	await page.keyboard.press('Tab');

	// Посилання «Перейти до основного контенту» має бути першим у порядку
	// фокуса — інакше користувач клавіатури щоразу проходить усе меню.
	const focused = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
	expect(focused).toMatch(/основного контенту|main content/i);
});
