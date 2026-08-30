import { expect, test } from '@playwright/test';
import { gotoReady, waitForAnimations } from './ready';

/**
 * Картка випускника: зміст досяжний, місце використане, колонок стільки, скільки
 * дозволяє ширина.
 *
 * ## Дефект, який це ловить
 *
 * Заміряно 2026-08-30. Колонкам зняли стелю висоти — намір розумний: на
 * iPad Pro 1024×1366 стеля в 820 px лишала 273 px порожніми, а 543 px змісту
 * ховала. Але разом зі стелею пішов `overflow-y: auto`, а модалка має
 * `position: fixed` і `overflow: visible`: прокрутка сторінки її не рухає, тож
 * усе, що не вмістилося, ОБРІЗАЛОСЯ. На iPad Air останній рядок вистав опинився
 * на 350 px нижче екрана без жодного способу до нього дійти.
 *
 * ## Чому цього не побачив жоден наявний гейт
 *
 * `viewport-overflow` міряє ширину, а вилізла висота. `touch-targets` і `a11y`
 * дивляться на дерево — а обрізаний список у дереві присутній цілком.
 *
 * ## Чому питання саме такі
 *
 * Дві попередні спроби заміряти досяжність були ХИБНІ й давали зелене:
 * `scrollHeight > clientHeight` істинне й тоді, коли прокрутки немає, а зміст
 * просто витікає; `bottom - innerHeight` рахує «вище екрана» як недосяжне, хоч
 * туди можна прокрутити вгору. Правильне питання одне: попросити браузер
 * прокрутити до елемента й подивитися, чи він після цього у вікні.
 *
 * Друге правило — від замовника, і воно про здоровий глузд: прокрутка потрібна
 * тоді, коли місця НЕМАЄ. Колонка зі скролом поруч із колонкою, що закінчилася
 * на півекрана раніше, означає, що місце є, але не використане.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Прибрати `overflow-y: auto` у `.col` — впаде перевірка досяжності й назве
 * розширення та блок. Повернути стелю `820px` — впаде перевірка використаного
 * місця на високих екранах.
 */

/** Найдовші списки картки: саме вони першими вилазять за екран. */
const PROBES = [
	{ name: 'останній рядок вистав', selector: '.plays li' },
	{ name: 'останній викладач', selector: '[data-testid^="galaxy-card-teacher-link"]' },
	{ name: 'останній фестиваль', selector: '[data-testid^="galaxy-card-festival-link"]' },
	{ name: 'останній абзац «Про себе»', selector: '[data-testid^="galaxy-card-bio-item"]' }
];

/**
 * Скільки колонок доречно на кожній ширині — межі задав замовник.
 *
 * `min` і `max` різні там, де рішення межове: на 768 і 820 дві колонки очевидні,
 * а на 1024 третя вже вміщається, але не мусить бути обов'язковою, якщо змісту
 * мало.
 */
const SIZES = [
	{ width: 375, height: 667, name: 'iPhone SE', minCols: 1, maxCols: 1 },
	{ width: 768, height: 1024, name: 'iPad Mini', minCols: 1, maxCols: 2 },
	{ width: 820, height: 1180, name: 'iPad Air', minCols: 2, maxCols: 2 },
	{ width: 1024, height: 1366, name: 'iPad Pro', minCols: 2, maxCols: 3 },
	{ width: 1440, height: 900, name: 'ноутбук', minCols: 3, maxCols: 3 },
	{ width: 2560, height: 1440, name: '4K', minCols: 3, maxCols: 4 }
];

/**
 * Скільки вільної висоти в одній колонці ще не є марнуванням, коли інша вже
 * скролиться. Колонки мають різний зміст, тож ідеальна рівність неможлива;
 * 240 px — це приблизно три картки, тобто помітна діра, а не округлення.
 */
const WASTED_SPACE_LIMIT = 240;

/** Картка з найдовшим змістом: двадцять вистав, чотири фестивалі, дев'ять викладачів. */
const PAGE = '/projects/galaxy-graduates/Alik';

test.describe('картка випускника', () => {
	for (const size of SIZES) {
		test(`${size.name} ${size.width}×${size.height}`, async ({ page }) => {
			await page.setViewportSize({ width: size.width, height: size.height });
			await gotoReady(page, PAGE);
			await page.locator('.profile-layout').waitFor();
			await waitForAnimations(page);

			const report = await page.evaluate(
				async ({ probes, limit }) => {
					const cols = [...document.querySelectorAll('.col')] as HTMLElement[];

					// Скільки колонок СПРАВДІ поруч: рахуємо різні координати лівого краю.
					const lefts = new Set(
						cols
							.filter((c) => c.getBoundingClientRect().height > 0)
							.map((c) => Math.round(c.getBoundingClientRect().left))
					);

					const unreachable: string[] = [];
					for (const probe of probes) {
						const all = document.querySelectorAll(probe.selector);
						const last = all[all.length - 1] as HTMLElement | undefined;
						if (!last) continue;

						last.scrollIntoView({ block: 'center', behavior: 'instant' });
						await new Promise((resolve) => setTimeout(resolve, 250));

						const box = last.getBoundingClientRect();
						if (!(box.top >= -2 && box.bottom <= window.innerHeight + 2)) {
							unreachable.push(
								`${probe.name}: ${Math.round(box.top)}..${Math.round(box.bottom)} ` +
									`при висоті вікна ${window.innerHeight}`
							);
						}
					}

					const scrolling = cols.filter((c) => c.scrollHeight > c.clientHeight + 2);
					const wasted = cols
						.map((c) => ({
							вільно: Math.round(c.clientHeight - c.scrollHeight),
							клас: c.className.replace(/\s*s-\w+/, '')
						}))
						.filter((c) => c.вільно > limit);

					return {
						колонок: lefts.size,
						недосяжно: unreachable,
						скролиться: scrolling.length,
						марнується: wasted
					};
				},
				{ probes: PROBES, limit: WASTED_SPACE_LIMIT }
			);

			expect(
				report.недосяжно,
				`${size.name}: до цих блоків не можна дійти навіть прокруткою:\n  ` +
					report.недосяжно.join('\n  ')
			).toEqual([]);

			expect(
				report.колонок,
				`${size.name}: колонок ${report.колонок}, а доречно ${size.minCols}–${size.maxCols}`
			).toBeGreaterThanOrEqual(size.minCols);
			expect(report.колонок).toBeLessThanOrEqual(size.maxCols);

			if (report.скролиться > 0) {
				expect(
					report.марнується,
					`${size.name}: одна колонка скролиться, а в іншій лишається місце — ` +
						`прокрутка потрібна тоді, коли місця немає:\n  ` +
						report.марнується.map((w) => `${w.клас}: вільно ${w.вільно} px`).join('\n  ')
				).toEqual([]);
			}
		});
	}
});
