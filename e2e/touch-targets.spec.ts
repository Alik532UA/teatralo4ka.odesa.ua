import { expect, test } from '@playwright/test';
import { gotoReady, waitForAnimations } from './ready';

/**
 * Розмір цілей дотику (ACCESSIBILITY-v8 § 8, перевірка — § 10.3).
 *
 * Канон називає це правило найточнішим у файлі й водночас єдиним, якого ніхто
 * не перевіряв. axe його не бачить: `target-size` — правило WCAG 2.2, а прогін
 * `a11y.spec.ts` іде за тегами до 2.1 включно; та й із ним axe міряє перекриття
 * сусідніх цілей, а не сам розмір.
 *
 * ДВА ПОРОГИ, і вони різні за природою:
 *
 *   24px — обов'язковий мінімум WCAG 2.2 AA (SC 2.5.8). Це гейт: нуль, і назад
 *          він не зростає. Перший прогін (2026-08-16) знайшов шість порушень —
 *          три крапки пагінації 20×6 і три посилання підвалу заввишки 19/19/14.
 *          Усі виправлені тим самим комітом.
 *
 *   44px — власний стандарт проєкту. Це НЕ гейт, а виміряний борг: стеля на
 *          сторінку, яка може лише спадати. Гейт із нулем тут довелося б
 *          вимкнути наступного дня — 36-піксельні іконки соцмереж і 40-піксельні
 *          кнопки шапки це рішення про вигляд, а не недогляд.
 *
 * Міряється лише на проєкті `mobile`: на десктопі поріг інший (32) і вказівник
 * точний, тож ті самі числа дали б шум замість сигналу.
 */
const WCAG_MINIMUM = 24;
const PROJECT_STANDARD = 44;

/**
 * Сторінки вибіркою, а не всі 38.
 *
 * Шапка, підвал і смуга прокрутки — де живе більшість кнопок — однакові скрізь,
 * тож повний набір міряв би ті самі елементи 19 разів. `/contacts` у переліку
 * заради пошти й соцмереж, `/news` — заради карток із Firestore.
 */
const PAGES = ['/', '/contacts', '/news'];

/**
 * Клон сторінки всередині мінімапи виключений навмисно.
 *
 * `Minimap` копіює весь `<main>` у зменшену прев'юшку й вішає на неї
 * `aria-hidden="true"`. Без цього виключення кожна кнопка сайту рахувалася б
 * двічі, а її «розмір» був би розміром у масштабі мінімапи — тобто перевірка
 * звітувала б десятки порушень, жодне з яких не існує для користувача.
 */
const SELECTOR = [
	'button',
	'a[href]',
	'input:not([type=hidden])',
	'select',
	'[role="button"]'
]
	.map((s) => `${s}:not([aria-hidden="true"] ${s})`)
	.join(', ');

/**
 * Записаний борг: ВИДИ елементів, менших за 44px. Виміряно 2026-08-16 на Pixel 7.
 *
 * Перелік, а не число, і це не стиль. Кількість тут нестабільна за побудовою:
 * картки новин і проєктів приходять із Firestore, тож у CI їх стільки, скільки
 * адміністратор устиг додати, а локально — скільки лежить у типових даних.
 * Гейт на числі червонів би від нової новини, і його вимкнули б.
 *
 * Вид натомість стабільний: та сама кнопка повторюється в кожній картці. І
 * перелік ловить те, чого число не ловить у принципі — ЩЕ ОДИН вид замалої
 * цілі, який з'явився замість виправленого.
 *
 * Підпис — тег і класи без svelte-хеша: `a.btn-more.card-link`.
 */
const BELOW_STANDARD: Record<string, string[]> = {
	'/': [
		'a.btn-more.card-link',
		'a.footer__btn-order',
		'a.footer__link',
		'a.footer__social-link',
		'a.skip-link',
		'button.active.autoplay-btn.view-btn',
		'button.active.f-dot',
		'button.active.gc-dot',
		'button.active.view-btn',
		'button.f-dot',
		'button.footer__btn-piano',
		'button.footer__link',
		'button.gc-dot',
		'button.gc-play-btn',
		'button.header__burger.header__burger--mobile',
		'button.header__burger.header__search-mobile',
		'button.video-control',
		'button.view-btn'
	],
	'/contacts': [
		'a.footer__btn-order',
		'a.footer__link',
		'a.footer__social-link',
		'a.skip-link',
		'button.footer__btn-piano',
		'button.footer__link',
		'button.header__burger.header__burger--mobile',
		'button.header__burger.header__search-mobile'
	],
	'/news': [
		'a.btn-more.card-link',
		'a.footer__btn-order',
		'a.footer__link',
		'a.footer__social-link',
		'a.skip-link',
		'button.active.view-btn',
		'button.footer__btn-piano',
		'button.footer__link',
		'button.header__burger.header__burger--mobile',
		'button.header__burger.header__search-mobile',
		'button.video-control',
		'button.view-btn'
	]
};

type Target = { size: string; html: string; small: number; kind: string };

test.describe('цілі дотику', () => {
	for (const path of PAGES) {
		test(`${path}`, async ({ page }, testInfo) => {
			test.skip(
				testInfo.project.name !== 'mobile',
				'пороги 24/44 — для тач-пристроїв; на десктопі діє інший (§ 8)'
			);

			await gotoReady(page, path);

			// Прокрутка донизу ОБОВ'ЯЗКОВА, і це не про повноту покриття.
			// Підвал з'являється на прокрутці, а до неї має `opacity: 0` — стан,
			// який `isVisible()` невидимістю не вважає. Тому без прокрутки набір
			// знайдених елементів залежить від того, чи встиг браузер щось
			// доскролити: перший прогін цієї перевірки дав шість видів на
			// `/contacts`, другий — три. База, що змінюється між прогонами, гірша
			// за відсутню (та сама пастка записана в PROJECT-CONTEXT для заміру
			// контрасту).
			// `scrollIntoViewIfNeeded`, а не `window.scrollTo`: голий скрол не
			// чекає, поки підвал ДОГРАЄ свою появу, і два прогони поспіль давали
			// вісім видів і три.
			await page.getByTestId('footer-social-menu').first().scrollIntoViewIfNeeded();
			await waitForAnimations(page);

			// Поки триває поява сторінки, елементи ще їдуть і масштабуються —
			// виміряний бокс належав би кадру анімації, а не кінцевому стану.
			await waitForAnimations(page);

			const targets = page.locator(SELECTOR);
			const count = await targets.count();
			expect(count, `${path}: не знайдено жодного елемента — перевірка мертва`).toBeGreaterThan(0);

			const found: Target[] = [];
			for (let i = 0; i < count; i++) {
				const el = targets.nth(i);
				if (!(await el.isVisible())) continue;

				// Виняток «Inline» із самого SC 2.5.8: ціль, розмір якої задає
				// висота рядка навколишнього тексту, під правило не підпадає.
				// Це не послаблення — це формулювання критерію. Без нього гейт
				// звітував би про кожне посилання в статті, і його вимкнули б
				// першого ж тижня.
				if ((await el.evaluate((n) => getComputedStyle(n).display)) === 'inline') continue;

				const box = await el.boundingBox();
				if (!box) continue;

				// Округлення обов'язкове, і не заради вигляду звіту. `boundingBox`
				// віддає підпіксельні значення: кнопка з `height: 24px` при
				// масштабуванні сторінки міряється як 23.99, і без округлення гейт
				// звітував би «менша за 24» поруч із написаним «84×24». Такий
				// самосуперечливий вивід — найкоротший шлях до того, щоб перевірку
				// перестали читати.
				const width = Math.round(box.width);
				const height = Math.round(box.height);

				const small = Math.min(width, height);
				if (small >= PROJECT_STANDARD) continue;

				found.push({
					size: `${width}×${height}`,
					html: await el.evaluate((n) => n.outerHTML.replace(/\s+/g, ' ').slice(0, 90)),
					kind: await el.evaluate((n) => {
						const classes = [...n.classList]
							.filter((c) => !c.startsWith('svelte-'))
							.sort()
							.join('.');
						return classes ? `${n.tagName.toLowerCase()}.${classes}` : n.tagName.toLowerCase();
					}),
					small
				});
			}

			const show = (list: Target[]) => list.map((t) => `  ${t.size}  ${t.html}`).join('\n');

			// Гейт: обов'язковий мінімум WCAG. Нуль, і без бази.
			const violations = found.filter((t) => t.small < WCAG_MINIMUM);
			expect(
				violations.length,
				`${path}: ціль дотику менша за ${WCAG_MINIMUM}px — порушення WCAG 2.2 AA (SC 2.5.8)\n${show(violations)}`
			).toBe(0);

			// Борг: власний стандарт проєкту. Перевіряється поява НОВОГО виду, а не
			// точний збіг переліку.
			//
			// Чому не `toEqual`: частина видів з'являється не щоразу. Карусель
			// перемикає, яка крапка `active`, галерея є не на кожній добірці, а
			// картки приходять із Firestore. Точний збіг червонів би від того, що
			// елемент цього разу не трапився, — тобто від нічого. Односторонній
			// перелік ловить саме те, заради чого існує: ЩЕ ОДИН вид замалої цілі.
			const kinds = [...new Set(found.map((t) => t.kind))].sort();
			const known = BELOW_STANDARD[path] ?? [];
			const fresh = kinds.filter((k) => !known.includes(k));
			expect(
				fresh,
				`${path}: вид цілі, меншої за ${PROJECT_STANDARD}px, якого немає в базі.\n` +
					`Заміряно зараз (готове до вставки в BELOW_STANDARD):\n` +
					kinds.map((k) => `\t\t\t'${k}',`).join('\n') +
					`\nСамі елементи:\n${show(found)}`
			).toEqual([]);
		});
	}
});
