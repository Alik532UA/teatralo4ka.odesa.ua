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
 * Які блоки НЕ вдалося побачити, гортаючи колесом згори донизу.
 *
 * Курсор ставиться в центр екрана — туди, куди його поставила б людина. Саме це
 * й ловить випадок, коли прокручується не те, під чим стоїть курсор: програмна
 * прокрутка такого не помічає взагалі.
 */
async function unreachableByWheel(page: Page, size: { width: number; height: number }) {
	const seen = new Set<string>();
	await page.mouse.move(size.width / 2, size.height / 2);
	await page.mouse.wheel(0, -WHEEL_STEP * WHEEL_LIMIT);
	await page.waitForTimeout(200);

	for (let step = 0; step <= WHEEL_LIMIT; step += 1) {
		for (const probe of PROBES) {
			if (seen.has(probe.name)) continue;
			const target = page.locator(probe.selector).last();
			// Блока може не бути взагалі — тоді й ховати нічого.
			if ((await target.count()) === 0) {
				seen.add(probe.name);
				continue;
			}
			const box = await target.boundingBox();
			if (box && box.y >= -2 && box.y + box.height <= size.height + 2) {
				seen.add(probe.name);
			}
		}
		if (seen.size === PROBES.length) break;
		await page.mouse.wheel(0, WHEEL_STEP);
		await page.waitForTimeout(60);
	}

	return PROBES.filter((probe) => !seen.has(probe.name)).map((probe) => probe.name);
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

				return { колонок: lefts.size, ховають: hiding };
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

			const unreachable = await unreachableByWheel(page, size);
			expect(
				unreachable,
				`${size.name}: до цих блоків не можна дійти КОЛЕСОМ:\n  ` + unreachable.join('\n  ')
			).toEqual([]);
		});
	}
});
