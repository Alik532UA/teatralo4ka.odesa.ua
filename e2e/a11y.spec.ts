import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PUBLIC_PAGES } from './pages';
import { gotoReady, waitForAnimations } from './ready';
import { baselineFor, knownFor } from './a11y-baseline';

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

/**
 * Англійські дзеркала — теж вибіркою, і з тієї самої причини.
 *
 * `/en/about` це той САМИЙ компонент із тим самим макетом і тими самими
 * токенами кольору; відрізняється лише текст. Правила axe від мови не залежать
 * ніде, крім двох місць: довжина рядка може дати інший перенос (а отже інший
 * розмір цілі дотику) і `lang` на документі. Перше покривається вибіркою,
 * друге — окремим інваріантом у `smoke.spec.ts`.
 *
 * Ціна повного набору не теоретична: після появи мовних адрес сторінок стало
 * 38 замість 19, прогін axe подвоївся, і під навантаженням почали падати
 * `waitForAnimations` та кліки по підвалу — тобто подвоєння дало не сигнал, а
 * шум. Решта перевірок (`smoke`, `testid`) ходить по ВСІХ сторінках: там мова
 * справді змінює результат.
 */
const EN_SAMPLE = ['/en/', '/en/about'];

function isEnglish(path: string): boolean {
	return path === '/en/' || path.startsWith('/en/');
}

test.describe('axe без порушень', () => {
	for (const path of PUBLIC_PAGES) {
		test(`${path}`, async ({ page }, testInfo) => {
			test.skip(
				testInfo.project.name === 'mobile' && !MOBILE_SAMPLE.includes(path),
				'на мобільному — вибірка, див. MOBILE_SAMPLE'
			);
			test.skip(
				isEnglish(path) && !EN_SAMPLE.includes(path),
				'англійські дзеркала — вибірка, див. EN_SAMPLE'
			);

			await gotoReady(page, path);
			// Без цього axe міряє контраст ПОСЕРЕД появи сторінки, коли текст ще
			// напівпрозорий, і тест стає нестабільним. Подробиці — у `ready.ts`.
			await waitForAnimations(page);

			const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();

			const report = violations
				.map((v) => `[${v.impact}] ${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`)
				.join('\n');

			// Дві асерції, і порядок має значення. Спершу типи: порушення, якого ми
			// ніколи не бачили, валить прогін навіть у межах ліміту. Потім кількість —
			// як стеля, що лише спадає. Чому не `toEqual([])` — у `a11y-baseline.ts`.
			const ids = [...new Set(violations.map((v) => v.id))].sort();
			expect(ids, `${path}: тип порушення, якого немає в базі\n${report}`).toEqual(knownFor(path));

			expect(
				violations.length,
				`${path}: порушень більше, ніж дозволяє база\n${report}`
			).toBeLessThanOrEqual(baselineFor(path));
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
