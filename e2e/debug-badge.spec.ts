import { expect, test } from '@playwright/test';
import { gotoReady } from './ready';

/**
 * Службовий елемент рівно ОДИН (DEBUGGING-v8 § 2.1, § 2.2).
 *
 * Канон просить одну плаваючу кнопку й називає причину прямо: якщо той самий
 * елемент несе ще й номер версії, форма з одним елементом правильна, бо «дві
 * плашки в двох кутах призначені для однієї й тієї самої людини». § 2.2 закріплює
 * і місце: `bottom: 16px; left: 16px; z-index: 9999`.
 *
 * До 2026-08-20 їх було дві, і друга не просто дублювала призначення — вона
 * НАКРИВАЛА першу: `.perf-debug-btn` (🐛) стояла в тому самому куті на
 * `bottom: 12px; left: 12px` із `z-index: 99998`, тобто вище службового табла.
 *
 * Перевірка рантаймова, бо саме тут статика безсила: обидві кнопки жили в різних
 * файлах (`+layout.svelte` і `ui/ServiceBadge.svelte`), мали різні класи й різні
 * `data-testid`. Ані гейт унікальності testid, ані `svelte-check` не мали з чого
 * побачити, що на екрані вони опиняються одна на одній.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): додати в `+layout.svelte`
 * другу кнопку з `position: fixed` під тією самою умовою видимості — перевірка
 * мусить назвати обидві.
 */

test('у debug-режимі службова кнопка одна', async ({ page }) => {
	// `?debug=1` діє поверх збереженого стану — це і є документований вхід.
	await gotoReady(page, '/?debug=1');

	const badge = page.getByTestId('app-version-value');
	await expect(badge, 'службове табло не з’явилося за `?debug=1`').toBeVisible({ timeout: 15_000 });

	const fixed = await page.evaluate(() => {
		const visible = (el: Element) => {
			const box = el.getBoundingClientRect();
			const style = getComputedStyle(el);
			return (
				box.width > 0 && box.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
			);
		};

		return [...document.querySelectorAll('button, a[href]')]
			.filter((el) => visible(el) && getComputedStyle(el).position === 'fixed')
			.map((el) => ({
				testid: el.getAttribute('data-testid'),
				cls: (el.className || '').toString().split(' ')[0],
				label: el.getAttribute('aria-label')?.slice(0, 40) ?? el.textContent?.trim().slice(0, 20)
			}));
	});

	expect(fixed.length, 'жодного плаваючого контрола — перевірка мертва').toBeGreaterThan(0);
	expect(
		fixed,
		'у лівому нижньому куті мусить бути ОДИН службовий елемент; знайдено кілька ' +
			`плаваючих контролів:\n${fixed.map((f) => `${f.testid ?? f.cls}: ${f.label}`).join('\n')}`
	).toHaveLength(1);
	expect(fixed[0].testid, 'єдиний плаваючий контрол — не службове табло').toBe('app-version-value');
});
