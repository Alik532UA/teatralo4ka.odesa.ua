import { expect, test } from '@playwright/test';
import { PUBLIC_PAGES } from './pages';
import { gotoReady, waitForAnimations } from './ready';

/**
 * Жоден елемент не ширший за екран (FLUID-SIZING-v8 § 9).
 *
 * Клас дефекту заміряний на `/admission` 2026-08-20 при 375 px: колонка тексту
 * була **486 px**, тобто на 135 px за екран, і разом із нею туди їхали ВСІ
 * заголовки й абзаци — `h1` закінчувався на 510-й точці. Причина — таблиця з
 * `white-space: nowrap` на клітинках: її min-content ширина підтягувала `.prose`,
 * бо той є елементом flex-колонки.
 *
 * ## Чому цього не бачив жоден наявний гейт
 *
 * `document.documentElement.scrollWidth` дорівнював 375 — тобто перевірка «чи
 * сторінка прокручується боком» була б ЗЕЛЕНОЮ. Бічної прокрутки справді не
 * було: `.prose` має `overflow-x: hidden`, тож текст не виїжджав за екран, а
 * ОБРІЗАВСЯ. Дефект гірший за прокрутку — до тексту не можна дійти взагалі — і
 * саме тому міряти треба не прокрутку документа, а межі самих елементів.
 *
 * axe цього теж не бачить: обрізаний текст присутній у дереві доступності.
 *
 * ## Міряється ШИРИНА, а не позиція краю
 *
 * Перша редакція ловила «правий край за межами екрана» і дала шість хибних
 * знахідок: слайди каруселі, відсунуті трансформацією на -7638 px, і декоративна
 * хмарка в шапці, що навмисно виступає за край. Обидва випадки правильні — це
 * не вміст, до якого треба дійти.
 *
 * Дефект, який справді болить, інший: елемент ШИРШИЙ за екран. Тоді текст у
 * ньому або обрізається, або жене сторінку боком. `.prose` на `/admission` мав
 * 486 px при екрані 375; слайд каруселі має 350 px і за екран лише відсунутий.
 *
 * ## Чому вміст скрол-контейнерів виключено
 *
 * Широка таблиця, код або діаграма МАЮТЬ право бути ширшими за екран — усередині
 * власного контейнера з прокруткою. Це і є правильне розв'язання, а не дефект,
 * тож перевірка пропускає нащадків елементів, які прокручуються по горизонталі.
 * Без цього виключення гейт червонів би саме на виправленому місці.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): повернути
 * `max-width: 800px` замість `min(800px, 100%)` у `.prose` — перевірка мусить
 * назвати `/admission` і перелічити елементи, що вилізли.
 */

/** Скільки пікселів за краєм вважаємо шумом округлення. */
const TOLERANCE = 2;

test.describe('жоден елемент не ширший за екран', () => {
	for (const path of PUBLIC_PAGES) {
		test(`${path}`, async ({ page, isMobile }) => {
			// Перевірка має сенс на вузькому екрані; десктопний проєкт її не дублює.
			test.skip(!isMobile, 'вузький екран — саме там вміст і не вміщується');

			await gotoReady(page, path);
			await waitForAnimations(page);

			const report = await page.evaluate((tolerance) => {
				const viewport = window.innerWidth;

				/** Чи лежить елемент усередині контейнера з власною прокруткою. */
				const insideScroller = (el: Element): boolean => {
					for (let node = el.parentElement; node; node = node.parentElement) {
						const style = getComputedStyle(node);
						if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
							if (node.scrollWidth > node.clientWidth) return true;
						}
					}
					return false;
				};

				const over: string[] = [];
				let measured = 0;

				for (const el of document.querySelectorAll('body *')) {
					const rect = el.getBoundingClientRect();
					// Нульові й приховані бокси не займають місця на екрані.
					if (rect.width === 0 || rect.height === 0) continue;
					const style = getComputedStyle(el);
					if (style.visibility === 'hidden' || style.display === 'none') continue;
					measured += 1;

					if (rect.width <= viewport + tolerance) continue;
					if (insideScroller(el)) continue;

					const name =
						el.getAttribute('data-testid') ??
						`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`;
					over.push(`${name}: ширина ${Math.round(rect.width)} при екрані ${viewport}`);
				}

				return { viewport, measured, over };
			}, TOLERANCE);

			expect(report.measured, `${path}: жодного видимого елемента — перевірка мертва`).toBeGreaterThan(
				20
			);
			expect(
				report.over,
				`${path}: вміст ширший за екран і не в скрол-контейнері, тобто обрізаний ` +
					`або жене сторінку боком:\n${report.over.join('\n')}`
			).toEqual([]);
		});
	}
});
