import { expect, test, type Page } from './fixtures';
import { gotoReady } from './ready';

/**
 * Зациклена головна: сторінка не закінчується, а починається спочатку.
 *
 * Перевіряється не вигляд, а п'ять властивостей, які легко зламати мовчки:
 *
 * 1. **Коло справді є з першого візиту.** Настройка типова, і саме тому
 *    перевірка стоїть першою: механізм, увімкнений для всіх, ламається
 *    непомітно для того, хто його писав, і помітно для кожного відвідувача.
 * 2. **Перестановка відбувається** — в обидва боки.
 * 3. **Кінця немає** після кількох кіл поспіль.
 * 4. **Шов збігається.** Копія в нижньому розгоні мусить показувати ПОЧАТОК
 *    смуги: інакше в мить перестановки вміст стрибне, і вся витівка втрачає сенс.
 * 5. **Копія не приносить дублікатів.** На головній 1496 `data-testid` і 7 `id`
 *    усередині `main`; копія без зняття атрибутів зламала б `getElementById`,
 *    `e2e/testid.spec.ts` і правило `duplicate-id` в axe.
 *
 * Окремо перевіряється, що тумблер ВИМИКАЄ: настройка, яку не можна вимкнути,
 * нічим не краща за настройку, яку не можна ввімкнути (`PS-REACHABILITY`).
 */

/** Геометрія кола очима сторінки. */
async function geometry(page: Page) {
	return page.evaluate(() => {
		const band = document.querySelector('[data-endless-band]');
		const rect = band?.getBoundingClientRect();
		const runway = (id: string) =>
			Math.round(
				document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().height ?? -1
			);
		return {
			bandTop: rect ? Math.round(rect.top + window.scrollY) : -1,
			bandHeight: rect ? Math.round(rect.height) : -1,
			head: runway('endless-head-container'),
			tail: runway('endless-tail-container'),
			scrollY: Math.round(window.scrollY),
			docHeight: document.documentElement.scrollHeight,
			viewport: window.innerHeight
		};
	});
}

/**
 * Геометрія, коли смуга перестала рости.
 *
 * Без цього перевірки пливли між прогонами, і звинувачували не того: розділ
 * «Відділення» приходить лінивим завантаженням, новини й проєкти — з Firestore,
 * тож одразу після готовності сторінки смуга ще коротша за кінцеву. Очікуване
 * місце перестановки, пораховане від тієї висоти, застаріває за півсекунди —
 * і тест повідомляв «перестановки не було» там, де вона сталася за іншими
 * числами. Сам механізм за висотою стежить (`ResizeObserver` у контролері);
 * стежити мусить і перевірка.
 */
async function settled(page: Page) {
	/*
	 * Спершу ПРОГРІВ, і без нього чекання на сталість не працює.
	 *
	 * Розділ «Відділення» вставляє 1872 px, і робить це `IntersectionObserver` —
	 * тобто лише тоді, коли до нього догортали. Сторінка, що стоїть угорі, до
	 * нього не доростає НІКОЛИ, і «висота не змінилася двічі поспіль» читалося
	 * як «доросла». Заміряно: перевірка бачила смугу 3108 px, а на момент кліку
	 * та була вже 3750 — і падала на числі, яке сама ж і зістарила.
	 *
	 * Тому проїжджаємо коло до останнього екрана й повертаємося. Обидві мети
	 * лежать усередині кола, тож перестановка на це не спрацьовує.
	 */
	for (const toEnd of [true, false]) {
		await page.evaluate((end) => {
			const rect = document.querySelector('[data-endless-band]')!.getBoundingClientRect();
			const top = Math.round(rect.top + window.scrollY);
			const last = Math.max(Math.round(rect.height) - window.innerHeight, 0);
			window.scrollTo({ top: end ? top + last : top, behavior: 'instant' });
		}, toEnd);
		await page.waitForTimeout(600);
	}

	/*
	 * Сталість вимагається ТРИЧІ поспіль, а не двічі.
	 *
	 * Смуга росте не рівномірно, а поштовхами з паузами між ними: розділ,
	 * знімок, відповідь Firestore. Двох однакових замірів підряд вистачало на
	 * вільній машині й не вистачало в повному прогоні на семи воркерах — там
	 * пауза між поштовхами довша за крок опитування, і перевірка вважала
	 * зупинкою звичайний проміжок.
	 */
	let previous = await geometry(page);
	let stable = 0;
	for (let attempt = 0; attempt < 30; attempt += 1) {
		await page.waitForTimeout(250);
		const next = await geometry(page);
		stable =
			next.bandHeight === previous.bandHeight && next.bandTop === previous.bandTop
				? stable + 1
				: 0;
		previous = next;
		if (stable >= 3) return next;
	}
	return previous;
}

/** Дочекатися, поки прокрутка ВСТОЇТЬСЯ після стрибка. */
async function settleScroll(page: Page) {
	/*
	 * Чекаємо, поки значення ВСТОЇТЬСЯ, а не фіксовану паузу.
	 *
	 * Перестановку робить обробник події прокрутки, а події дискетчаться
	 * окремим тактом. Фіксовані 250 мс тут уже підводили: поодинці перевірка
	 * проходила, а в повному прогоні на семи воркерах такт не встигав, і тест
	 * читав значення ДО перестановки. Падало це як «перестановки не було»,
	 * тобто звинувачувало механізм у чужій повільності.
	 */
	let previous = -1;
	for (let attempt = 0; attempt < 20; attempt += 1) {
		const y = await page.evaluate(() => Math.round(window.scrollY));
		if (y === previous) return y;
		previous = y;
		await page.waitForTimeout(100);
	}
	return previous;
}

/** Поставити прокрутку МИТТЄВО і дочекатися відповіді сторінки. */
async function jumpTo(page: Page, top: number) {
	await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
	return settleScroll(page);
}

/**
 * Перемикає зациклення ТАК САМО, як це робить відвідувач — тумблером у меню
 * смуги.
 *
 * Не записом у `localStorage` повз контролер: тоді перевірка не доводила б, що
 * тумблер узагалі під'єднаний, і мовчала б про рівно той дефект, якого тут
 * бояться найбільше — настройка є, керувати нею нічим.
 */
async function toggleEndless(page: Page, expectChecked: boolean) {
	const bar = page.getByTestId('page-scrollbar-container');
	const box = (await bar.boundingBox())!;
	await bar.click({ button: 'right', position: { x: box.width / 2, y: 4 } });
	await page.getByTestId('scrollbar-endless-label').click();
	/*
	 * Стан читається ДО `Escape`, поки панель ще відкрита.
	 *
	 * Перша редакція перевіряла його після закриття й падала з «element(s) not
	 * found» — тобто звинувачувала тумблер у тому, що його немає в закритому
	 * меню. Панель навмисно не закривається сама на перемиканні (SCROLLBAR § 7.4):
	 * зворотний зв'язок про стан — це сам тумблер.
	 */
	const toggle = page.getByTestId('scrollbar-endless-toggle');
	if (expectChecked) await expect(toggle).toBeChecked();
	else await expect(toggle).not.toBeChecked();
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('scrollbar-context-menu')).toHaveCount(0);
}

/**
 * Вимір і стрибок ОДНИМ тактом сторінки.
 *
 * Роздільно це давало плавучий тест: між `settled()` і стрибком лежить кілька
 * раундтріпів, і смуга за них устигає дорости — знімками, що доїхали, чи
 * даними з Firestore. Стрибок тоді цілить у місце, яке вже не за кінцем смуги,
 * перестановки не стається, і падіння звучить як «механізм не працює».
 *
 * `offset` рахується від ПОЧАТКУ кола: додатний більший за висоту смуги
 * виводить за нижній край, від'ємний — за верхній.
 */
async function probe(page: Page, past: 'end' | 'start', delta: number) {
	const base = await page.evaluate(
		({ past, delta }) => {
			const rect = document.querySelector('[data-endless-band]')!.getBoundingClientRect();
			const top = Math.round(rect.top + window.scrollY);
			const height = Math.round(rect.height);
			window.scrollTo({
				top: past === 'end' ? top + height + delta : top - delta,
				behavior: 'instant'
			});
			return { top, height };
		},
		{ past, delta }
	);

	return { ...base, lap: (await settleScroll(page)) - base.top };
}

test.describe('зациклена головна', () => {
	test('на дотиковому екрані не вмикається', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'mobile', 'перевірка саме про мобільний профіль');
		await gotoReady(page, '/');
		/*
		 * Тумблера немає там, де його нічим не підкріпити: підвал тут у потоці й
		 * заввишки 380 px, тож коло зробило б контакти або недосяжними, або
		 * повторюваними щокола.
		 *
		 * Меню тут НЕ відкривається навмисно: на дотиковому екрані власної смуги
		 * не існує взагалі, тож правий клік по ній — це клік по тому, чого немає.
		 * Перша редакція його все ж робила «про всяк випадок» і падала не на
		 * тумблері, а на самому кліку. Перевіряється саме те, що заявлено:
		 * перемикача немає в розмітці, а разом із ним і розгону.
		 */
		await expect(page.getByTestId('scrollbar-endless-toggle')).toHaveCount(0);
		expect((await geometry(page)).tail).toBe(0);
	});

	test.describe('на десктопі', () => {
		test.skip(({ isMobile }) => !!isMobile, 'зациклення лише на десктопі');

		test('типова: розгін стоїть з першого візиту', async ({ page }) => {
			await gotoReady(page, '/');
			const g = await settled(page);

			expect(g.bandHeight, 'смуга вмісту не знайдена — перевірка мертва').toBeGreaterThan(0);
			expect(g.head, 'розгін мусить бути вищим за вікно').toBeGreaterThan(g.viewport);
			expect(g.tail).toBeGreaterThan(g.viewport);
		});

		test('перестановка працює в обидва боки', async ({ page }) => {
			await gotoReady(page, '/');
			await settled(page);

			// Униз: на 40 px за кінцем смуги читач опиняється на 40 px від її початку.
			const down = await probe(page, 'end', 40);
			expect(down.lap, 'перестановки вниз не сталося').toBe(40);

			// Угору: на 40 px вище початку — на 40 px від кінця.
			const up = await probe(page, 'start', 40);
			expect(up.lap, 'перестановки вгору не сталося').toBe(up.height - 40);
		});

		test('кінця немає: три кола поспіль', async ({ page }) => {
			await gotoReady(page, '/');
			await settled(page);

			for (let lap = 1; lap <= 3; lap += 1) {
				const wrapped = await probe(page, 'end', 10);
				expect(wrapped.lap, `коло ${lap}: перестановки не сталося`).toBe(10);
			}
		});

		/**
		 * Кінець сторінки мусить бути КІНЦЕМ, а не точкою перестановки.
		 *
		 * Обидва способи туди дійти — клавіша й повзунок — читали шкалу так, що
		 * 100 % припадали рівно на шов: сторінка миттєво переставлялася, і замість
		 * кінця поточного кола читач отримував початок наступного. `Home` був
		 * зламаний інакше: нуль документа лежить усередині верхнього розгону,
		 * тобто в мертвій копії.
		 */
		test('End дає останній екран кола, Home — його верх', async ({ page }) => {
			await gotoReady(page, '/');
			const g = await settled(page);
			const lastScreen = g.bandTop + g.bandHeight - g.viewport;

			await page.keyboard.press('End');
			expect(await settleScroll(page), 'End не дав кінця кола').toBe(lastScreen);

			await page.keyboard.press('Home');
			expect(await settleScroll(page), 'Home не дав верху кола').toBe(g.bandTop);
		});

		/**
		 * Повзунок мусить уміти дві речі, які довго не вдавалися разом.
		 *
		 * Перша — доїжджати до САМОГО низу, і щоб низ означав кінець поточного
		 * кола. Проміжна редакція обрізала мету перетягування окремо й відбирала
		 * в повзунка крайнє положення: дотягнути його донизу ставало неможливо.
		 *
		 * Друга — не брехати на шві. Обрізаний по низу він там ЗАМИРАВ на цілу
		 * висоту вікна; необрізаний перестрибував угору ЦІЛКОМ, ніби читач уже
		 * на початку. Насправді вікно на шві стоїть у двох місцях одразу, і
		 * смужка мусить бути розрізана: частина внизу, частина згори.
		 */
		test('повзунок кільцевий: доїжджає донизу й розрізається на шві', async ({ page }) => {
			await gotoReady(page, '/');
			await settled(page);

			const pieces = () =>
				page.evaluate(() => {
					const box = (id: string) => {
						const el = document.querySelector(`[data-testid="${id}"]`);
						if (!el) return null;
						const r = el.getBoundingClientRect();
						return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
					};
					return {
						main: box('page-scrollbar-thumb-status'),
						wrap: box('page-scrollbar-wrap-status'),
						track: window.innerHeight
					};
				});

			/**
			 * Ставимо прокрутку й чекаємо, поки смужка ВСТОЇТЬСЯ.
			 *
			 * Її висота пружинна (`springHeight` у `PageScrollbar`), а пружина
			 * рухається кадрами. Фіксована пауза в 400 мс проходила наодинці й
			 * падала в повному прогоні: під навантаженням кадрів менше, пружина
			 * доїжджає довше — і перевірка міряла смужку на півдорозі.
			 */
			const at = async (where: 'last' | 'seam') => {
				await page.evaluate((w) => {
					const rect = document.querySelector('[data-endless-band]')!.getBoundingClientRect();
					const top = Math.round(rect.top + window.scrollY);
					const last = Math.max(Math.round(rect.height) - window.innerHeight, 0);
					window.scrollTo({
						top: top + (w === 'last' ? last : last + Math.round(window.innerHeight / 2)),
						behavior: 'instant'
					});
				}, where);

				let previous = JSON.stringify(await pieces());
				for (let attempt = 0; attempt < 25; attempt += 1) {
					await page.waitForTimeout(200);
					const next = await pieces();
					if (JSON.stringify(next) === previous) return next;
					previous = JSON.stringify(next);
				}
				return pieces();
			};

			const last = await at('last');
			expect(last.main, 'повзунка немає').not.toBeNull();
			expect(last.main!.bottom, 'повзунок не доїхав до низу доріжки').toBeGreaterThanOrEqual(
				last.track - 2
			);
			expect(last.wrap, 'на останньому екрані смужка розрізалася зарано').toBeNull();

			const seam = await at('seam');
			expect(seam.wrap, 'на шві смужка не розрізалася').not.toBeNull();
			expect(seam.main!.bottom).toBeGreaterThanOrEqual(seam.track - 2);
			expect(seam.wrap!.top, 'верхня частина мусить починатися від краю доріжки').toBeLessThanOrEqual(2);
			// Разом частини дають ту саму смужку: розмір вікна не «дихає».
			const total =
				seam.main!.bottom - seam.main!.top + (seam.wrap!.bottom - seam.wrap!.top);
			expect(Math.abs(total - (last.main!.bottom - last.main!.top))).toBeLessThanOrEqual(4);
		});

		/**
		 * На шві кнопки «нагору» немає.
		 *
		 * За глибиною читач там найдальший від початку, тож проста умова «глибше
		 * за 400 px» дає «показати». Але на екрані в нього вже герой наступного
		 * кола — кнопка пропонує повернутися туди, де він стоїть, і натиск нічого
		 * видимого не змінює.
		 */
		test('«нагору» зникає на шві', async ({ page }) => {
			await gotoReady(page, '/');
			await settled(page);

			const goto = (seam: boolean) =>
				page.evaluate((s) => {
					const rect = document.querySelector('[data-endless-band]')!.getBoundingClientRect();
					const top = Math.round(rect.top + window.scrollY);
					const last = Math.max(Math.round(rect.height) - window.innerHeight, 0);
					window.scrollTo({
						top: top + (s ? last + Math.round(window.innerHeight / 2) : last),
						behavior: 'instant'
					});
				}, seam);

			await goto(false);
			await expect(page.getByTestId('back-to-top-btn')).toBeVisible();

			await goto(true);
			await expect(page.getByTestId('back-to-top-btn')).toBeHidden();
		});

		test('повзунок, дотягнутий донизу, дає кінець кола', async ({ page }) => {
			await gotoReady(page, '/');
			await settled(page);

			const bar = page.getByTestId('page-scrollbar-container');

			/*
			 * Спроба повторюється, і причина та сама, що всюди тут: смуга росте.
			 * Натиск цілиться в кінець ТІЄЇ висоти, яку бачив, а поки прокрутка
			 * доїжджає, розділ унизу встигає підрости — і кінець виявляється вже
			 * не там. Друга спроба йде по вже дорослій смузі.
			 */
			let off = Number.POSITIVE_INFINITY;
			for (let attempt = 0; attempt < 3 && off > 6; attempt += 1) {
				const box = (await bar.boundingBox())!;
				await bar.click({ position: { x: box.width / 2, y: box.height - 2 } });
				await settleScroll(page);
				off = await page.evaluate(() => {
					const rect = document.querySelector('[data-endless-band]')!.getBoundingClientRect();
					const top = Math.round(rect.top + window.scrollY);
					const last = Math.max(Math.round(rect.height) - window.innerHeight, 0);
					return Math.abs(Math.round(window.scrollY) - top - last);
				});
			}

			expect(off, 'повзунок унизу віддав не кінець кола').toBeLessThanOrEqual(6);
		});

		test('шов збігається: копія показує початок смуги', async ({ page }) => {
			await gotoReady(page, '/');
			await settled(page);

			/*
			 * Порівнюється не картинка, а те, що робить її однаковою: перший
			 * помітний заголовок копії мусить бути тим самим заголовком і стояти
			 * на тій самій глибині від початку своєї смуги. Розбіжність тут — це
			 * рівно той стрибок вмісту, заради приховування якого все й зроблено.
			 */
			const seam = await page.evaluate(() => {
				const first = (root: Element | null) => {
					const h = root?.querySelector('h1, h2');
					if (!h || !root) return null;
					const base = root.getBoundingClientRect().top;
					return {
						text: (h.textContent ?? '').trim(),
						depth: Math.round(h.getBoundingClientRect().top - base)
					};
				};
				const tail = document.querySelector('[data-testid="endless-tail-container"]');
				return {
					band: first(document.querySelector('[data-endless-band]')),
					copy: first(tail?.firstElementChild ?? null)
				};
			});

			expect(seam.band, 'у смузі немає заголовка — перевірка мертва').not.toBeNull();
			expect(seam.copy, 'нижній розгін порожній').not.toBeNull();
			expect(seam.copy!.text).toBe(seam.band!.text);
			expect(Math.abs(seam.copy!.depth - seam.band!.depth)).toBeLessThanOrEqual(2);
		});

		test('копія не приносить дублікатів testid та id', async ({ page }) => {
			await gotoReady(page, '/');
			await settled(page);

			const dupes = await page.evaluate(() => {
				const count = (values: string[]) => {
					const seen = new Map<string, number>();
					for (const v of values) seen.set(v, (seen.get(v) ?? 0) + 1);
					return [...seen.entries()].filter(([, n]) => n > 1).map(([v, n]) => `${v} ×${n}`);
				};
				return {
					testids: count(
						[...document.querySelectorAll('[data-testid]')].map(
							(n) => n.getAttribute('data-testid') ?? ''
						)
					),
					ids: count([...document.querySelectorAll('[id]')].map((n) => n.id))
				};
			});

			expect(dupes.testids, `дублікати testid: ${dupes.testids.join(', ')}`).toEqual([]);
			expect(dupes.ids, `дублікати id: ${dupes.ids.join(', ')}`).toEqual([]);
		});

		test('«нагору» веде на верх кола, а не в копію', async ({ page }) => {
			await gotoReady(page, '/');
			const g = await settled(page);

			await jumpTo(page, g.bandTop + 1500);
			const button = page.getByTestId('back-to-top-btn');
			await expect(button).toBeVisible();
			await button.click();

			await expect
				.poll(async () => (await geometry(page)).scrollY, { timeout: 10_000 })
				.toBe(g.bandTop);
		});

		test('тумблер вимикає — розгін зникає, сторінка знову кінчається', async ({ page }) => {
			await gotoReady(page, '/');
			const before = await settled(page);

			await toggleEndless(page, false);

			await expect.poll(async () => (await geometry(page)).tail, { timeout: 10_000 }).toBe(0);
			const after = await geometry(page);
			expect(after.head, 'верхній розгін лишився займати місце').toBe(0);
			expect(after.docHeight, 'висота документа не повернулася').toBeLessThan(before.docHeight);
		});
	});
});
