import { expect, test, type Page } from '@playwright/test';
import { gotoReady, waitForAnimations } from './ready';

/**
 * Картка випускника: зміст досяжний КОЛЕСОМ, місце використане, колонок стільки,
 * скільки просив замовник на цій ширині.
 *
 * ## Дефекти, які це ловить
 *
 * Заміряно 2026-08-30, і за один день тут набралося три різні поломки одного
 * роду — «зміст є, дійти неможливо»:
 *
 *   1. Колонкам зняли стелю висоти, а разом з нею пішов `overflow-y: auto`.
 *      Модалка має `position: fixed`, тож прокрутка сторінки її не рухає, і все,
 *      що не вмістилося, обрізалося. На iPad Air останній рядок вистав опинився
 *      на 350 px нижче екрана.
 *   2. Магічна стеля `min(88dvh, 820px)` у плашці вистав: на iPad Pro список
 *      показував 734 px із 1399, ховаючи 665 px, — і робив це тоді, коли під
 *      карткою лишалося порожнє місце.
 *   3. Та сама магічна `840px` у ДРУГІЙ копії — на власній сторінці випускника.
 *      Прибрана в модалці, вона лишилася тут, і сцена з `overflow: hidden` не
 *      давала докрутити взагалі.
 *
 * ## Чому цього не побачив жоден наявний гейт
 *
 * `viewport-overflow` міряє ширину, а вилізла висота. `touch-targets` і `a11y`
 * дивляться на дерево — а обрізаний список у дереві присутній цілком.
 *
 * ## Чому питання саме такі
 *
 * ТРИ попередні спроби заміряти досяжність були хибні й давали зелене:
 *
 *   1. `scrollHeight > clientHeight` істинне й тоді, коли прокрутки немає, а
 *      зміст просто витікає;
 *   2. `bottom - innerHeight` рахує «вище екрана» як недосяжне, хоч туди можна
 *      прокрутити вгору;
 *   3. `scrollIntoView()` крутить ПРОГРАМНО — і доходить туди, куди колесо не
 *      доходить. Саме так перевірка була зелена на власній сторінці випускника:
 *      заміряно на 1440×900, останній рядок вистав закінчувався на 988 px при
 *      вікні 900, а `scrollTop` після колеса лишався 0 при 151 px доступної
 *      прокрутки.
 *
 * Тому питання ставиться так, як його ставить людина: покрутити КОЛЕСОМ і
 * подивитися, чи видно тепер потрібний рядок.
 *
 * Друге правило — теж від замовника, і воно про здоровий глузд: прокрутка
 * потрібна тоді, коли місця НЕМАЄ. Тому жодна плашка всередині картки не сміє
 * ховати зміст за власною межею — не вмістилося все разом, крутить сторінка.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Повернути `max-height: min(88dvh, 820px)` плашці вистав — упаде перевірка
 * «ховають» і назве розширення, плашку й кількість схованих пікселів. Прибрати
 * `overflow-y: auto` в `.card__inner` — упаде перевірка досяжності. Дозволити
 * `SEEDS` віддавати три колонки на 820 px — упаде перевірка кількості.
 */

/** Найдовші списки картки: саме вони першими вилазять за екран. */
const PROBES = [
	{ name: 'останній рядок вистав', selector: '.plays li' },
	{ name: 'останній викладач', selector: '[data-testid^="galaxy-card-teacher-link"]' },
	{ name: 'останній фестиваль', selector: '[data-testid^="galaxy-card-festival-link"]' },
	{ name: 'останній абзац «Про себе»', selector: '[data-testid^="galaxy-card-bio-item"]' }
];

/**
 * Скільки колонок на кожній ширині. Числа — ТОЧНІ, а не «від і до».
 *
 * Перша версія цієї таблиці дозволяла на iPad Mini «одну або дві», і саме через
 * це перевірка була зелена, поки сторінка показувала одну колонку там, де
 * замовник просив дві. Вимогу не можна записувати як діапазон, у який вона
 * входить разом зі своїм порушенням: тоді гейт закріплює не вимогу, а
 * поблажливість того, хто його писав.
 */
const SIZES = [
	{ width: 375, height: 667, name: 'iPhone SE', cols: 1 },
	{ width: 768, height: 1024, name: 'iPad Mini', cols: 2 },
	{ width: 820, height: 1180, name: 'iPad Air', cols: 2 },
	{ width: 1024, height: 1366, name: 'iPad Pro', cols: 3 },
	{ width: 1440, height: 900, name: 'ноутбук', cols: 3 },
	{ width: 2560, height: 1440, name: '4K', cols: 4 }
];

/**
 * Скільки зміст може виходити за свій контейнер, лишаючись похибкою округлення.
 * Понад це — контейнер справді ховає зміст за власною межею.
 */
const HIDDEN_TOLERANCE = 2;

/** Картка з найдовшим змістом: двадцять вистав, чотири фестивалі, дев'ять викладачів. */
const PAGE = '/projects/galaxy-graduates/Alik';

/** Один крок колеса — приблизно те саме, що дає одне клацання коліщатка. */
const WHEEL_STEP = 300;
/** Скільки кроків дозволено, перш ніж вважати, що дійти не можна. */
const WHEEL_LIMIT = 60;

/**
 * Які блоки НЕ вдалося побачити, гортаючи КОЛЕСОМ.
 *
 * Курсор ставиться над тією колонкою, у якій лежить блок, — інакше перевірка
 * питала б не те: кожна колонка прокручується сама, і колесо в центрі екрана
 * рухає лише ту, під якою стоїть курсор.
 */
async function unreachableByWheel(page: Page, size: { width: number; height: number }) {
	const missed: string[] = [];

	for (const probe of PROBES) {
		const target = page.locator(probe.selector).last();
		// Блока може не бути взагалі — тоді й ховати нічого.
		if ((await target.count()) === 0) continue;

		const column = await target.evaluate((el) => {
			const col = el.closest('.col');
			if (!col) return null;
			const box = col.getBoundingClientRect();
			return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
		});
		if (!column) continue;

		await page.mouse.move(column.x, column.y);
		await page.mouse.wheel(0, -WHEEL_STEP * WHEEL_LIMIT);
		await page.waitForTimeout(150);

		let seen = false;
		for (let step = 0; step <= WHEEL_LIMIT; step += 1) {
			const box = await target.boundingBox();
			if (box && box.y >= -2 && box.y + box.height <= size.height + 2) {
				seen = true;
				break;
			}
			await page.mouse.wheel(0, WHEEL_STEP);
			await page.waitForTimeout(50);
		}
		if (!seen) missed.push(probe.name);
	}

	return missed;
}

test.describe('картка випускника', () => {
	/*
	 * Тільки один проєкт: розширення тут задає САМ тест, а проєкт `mobile`
	 * накладає поверх емуляцію Pixel 7 — дотик, потрійну щільність пікселів і
	 * мобільний User-Agent. Прогін «4K на телефоні» не перевіряє нічого, що
	 * трапляється з живою людиною, зате падає.
	 */
	test.skip(({ isMobile }) => !!isMobile, 'розширення задає сам тест');

	for (const size of SIZES) {
		test(`${size.name} ${size.width}×${size.height}`, async ({ page }) => {
			await page.setViewportSize({ width: size.width, height: size.height });
			await gotoReady(page, PAGE);
			/*
			 * Чекаємо не появу розкладки, а ЗАМІР ширини. У пререндереній розмітці
			 * стоїть здогад у три колонки — знати справжню ширину сторінка може
			 * лише в браузері. Гейт, що міряв би до цього моменту, звітував би про
			 * три колонки на планшеті, тобто про кадр, якого людина не бачить.
			 */
			await page.locator('.profile-layout[data-measured="yes"]').waitFor();
			await waitForAnimations(page);

			const report = await page.evaluate((limit) => {
				const cols = [...document.querySelectorAll('.col')] as HTMLElement[];

				// Скільки колонок СПРАВДІ поруч: рахуємо різні координати лівого краю.
				const lefts = new Set(
					cols
						.filter((c) => c.getBoundingClientRect().height > 0)
						.map((c) => Math.round(c.getBoundingClientRect().left))
				);

				/*
				 * Хто ховає зміст за власною межею. Питання ставиться до ВСІХ
				 * нащадків розкладки, а не до самих лише колонок: попередня версія
				 * дивилася тільки на `.col` і була зелена, поки список вистав ховав
				 * 665 px усередині своєї плашки. Сама картка й сторінка сюди не
				 * потрапляють — вони поза розкладкою, і саме вони мають брати
				 * прокрутку на себе.
				 */
				const layout = document.querySelector('.profile-layout');
				const hiding = [...(layout?.querySelectorAll('*') ?? [])]
					.filter((el): el is HTMLElement => el instanceof HTMLElement)
					/*
					 * Сама колонка ховати ЗМІСТ має право — прокрутка в колонках і
					 * є те, що просив замовник. Заборона стосується всього, що
					 * всередині: плашка з власною стелею ховає зміст тоді, коли
					 * колонка навколо неї ще має місце.
					 */
					.filter((el) => !el.classList.contains('col'))
					/*
					 * Картинки й значки — повз. У них `scrollHeight` означає ВЛАСНИЙ
					 * розмір файлу, а не схований зміст: значок соцмережі 42 px,
					 * показаний як 34 px, дає «сховано 8 px», хоча нічого не сховано.
					 * Заміряно — саме на цьому перевірка спіймала невинного.
					 */
					.filter((el) => !['IMG', 'SVG', 'PICTURE', 'VIDEO', 'CANVAS'].includes(el.tagName))
					.filter((el) => getComputedStyle(el).overflowY !== 'visible')
					.filter((el) => el.scrollHeight - el.clientHeight > limit)
					.map(
						(el) =>
							`${el.className.toString().replace(/\s*s-\w+/g, '').trim() || el.tagName}: ` +
							`видно ${el.clientHeight} із ${el.scrollHeight}, сховано ` +
							`${el.scrollHeight - el.clientHeight} px`
					);

				/*
				 * Чи ВПИСУЮТЬСЯ колонки у вікно. Це друга половина правила
				 * «прокрутка потрібна, коли місця немає»: колонка сміє
				 * прокручуватися лише тоді, коли вона вже займає всю доступну
				 * висоту. Заміряно на iPad Air: колонки були 1132 px при вікні
				 * 1180 — тобто прокручувалися, використавши місце повністю.
				 *
				 * Коли колонка одна, прокручується сторінка, і питання не стоїть.
				 */
				const bottoms = cols.map((c) => c.getBoundingClientRect().bottom);
				const heights = cols.map((c) => Math.round(c.getBoundingClientRect().height));
				const крайЗаЕкраном =
					lefts.size > 1 ? Math.round(Math.max(...bottoms) - window.innerHeight) : 0;
				const розбіжністьВисот = Math.max(...heights) - Math.min(...heights);

				return { колонок: lefts.size, ховають: hiding, крайЗаЕкраном, розбіжністьВисот };
			}, HIDDEN_TOLERANCE);

			expect(
				report.ховають,
				`${size.name}: усередині картки зміст обрізано, хоча прокрутку мала б ` +
					`брати на себе сторінка. Прокрутка потрібна тоді, коли місця немає:\n  ` +
					report.ховають.join('\n  ')
			).toEqual([]);

			expect(
				report.колонок,
				`${size.name}: колонок ${report.колонок}, а має бути ${size.cols}`
			).toBe(size.cols);

			expect(
				report.крайЗаЕкраном,
				`${size.name}: колонки виходять за нижній край на ${report.крайЗаЕкраном} px — ` +
					`прокручуватися має їхній вміст, а не вилазити сама колонка`
			).toBeLessThanOrEqual(56);

			expect(
				report.розбіжністьВисот,
				`${size.name}: колонки різної висоти (${report.розбіжністьВисот} px) — ` +
					`тоді «скролиться та, у якої не вмістилося» перетворюється на ` +
					`«та, у якої найдовший список»`
			).toBeLessThanOrEqual(2);

			const unreachable = await unreachableByWheel(page, size);
			expect(
				unreachable,
				`${size.name}: до цих блоків не можна дійти КОЛЕСОМ:\n  ` + unreachable.join('\n  ')
			).toEqual([]);
		});
	}
});

/**
 * Меню контактів відкривається В ЕКРАН.
 *
 * Заміряно на iPhone SE: меню було 389 px завширшки й починалося на 259 — тобто
 * 273 px за правим краєм, разом із трьома з чотирьох посилань. Причина в двох
 * речах одразу: `white-space: nowrap` не давав меню звузитися, а точкою відліку
 * була `.contact-wrap` — обгортка кнопки, вужча за саме меню, притиснута до
 * правого краю картки.
 *
 * `viewport-overflow` цього не бачив і не міг: меню з'являється лише після
 * натискання, а той гейт міряє сторінку як вона є.
 *
 * Зворотний експеримент: повернути `left: 0` замість `right: 0` — перевірка
 * назве, на скільки пікселів і в який бік меню вийшло.
 */
test.describe('меню контактів', () => {
	for (const size of [
		{ width: 375, height: 667, name: 'iPhone SE' },
		{ width: 768, height: 1024, name: 'iPad Mini' }
	]) {
		test(`${size.name} ${size.width}×${size.height}`, async ({ page }) => {
			await page.setViewportSize({ width: size.width, height: size.height });
			await gotoReady(page, PAGE);
			await page.locator('.profile-layout[data-measured="yes"]').waitFor();
			await waitForAnimations(page);

			/*
			 * Спершу наведення, потім клік: меню відкривається по-різному на
			 * різних ширинах — на широкому екрані його показує `onmouseenter`,
			 * на вузькому лишається натискання. Перевірка має відкрити його тим
			 * способом, який працює саме тут, а не наполягати на своєму.
			 */
			const toggle = page.locator('.contact-wrap').locator('button, a, [role="button"]').first();
			const menu = page.getByTestId('graduate-profile-contact-menu');
			await page.locator('.contact-wrap').hover();
			if (!(await menu.isVisible())) await toggle.click({ force: true });
			await menu.waitFor();

			const report = await page.evaluate((viewport) => {
				const menu = document.querySelector('[data-testid="graduate-profile-contact-menu"]')!;
				const box = menu.getBoundingClientRect();
				// Кожне посилання окремо: меню може вміститися, а значки — витекти.
				const hidden = [...menu.querySelectorAll('a')]
					.map((a) => a.getBoundingClientRect())
					.filter((r) => r.right > viewport + 1 || r.left < -1).length;
				return {
					заПравим: Math.round(box.right - viewport),
					заЛівим: Math.round(-box.left),
					посиланьЗаЕкраном: hidden
				};
			}, size.width);

			expect(report.заПравим, `${size.name}: меню виходить за правий край`).toBeLessThanOrEqual(0);
			expect(report.заЛівим, `${size.name}: меню виходить за лівий край`).toBeLessThanOrEqual(0);
			expect(
				report.посиланьЗаЕкраном,
				`${size.name}: ${report.посиланьЗаЕкраном} посилань поза екраном`
			).toBe(0);
		});
	}
});
