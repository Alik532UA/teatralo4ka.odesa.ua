import { expect, test, type Page } from '@playwright/test';
import { gotoReady } from './ready';

/**
 * Зациклена головна: сторінка не закінчується, а починається спочатку.
 *
 * Перевіряється не вигляд, а чотири властивості, які легко зламати мовчки:
 *
 * 1. **Типово нічого немає.** Настройка вимкнена, і сторінка мусить лишатися
 *    рівно такою, якою була: розгін нульовий, висота документа не змінилася.
 *    Це найважливіша з чотирьох — механізм, який щось коштує ВСІМ заради
 *    меншості, що його ввімкнула, не має права існувати.
 * 2. **Перестановка справді відбувається** — в обидва боки.
 * 3. **Шов збігається.** Копія в нижньому розгоні мусить показувати ПОЧАТОК
 *    смуги: інакше в мить перестановки вміст стрибне, і вся витівка втрачає сенс.
 * 4. **Копія не приносить дублікатів.** На головній 1496 `data-testid` і 7 `id`
 *    усередині `main`; копія без зняття атрибутів зламала б `getElementById`,
 *    `e2e/testid.spec.ts` і правило `duplicate-id` в axe. Тут це перевіряється
 *    саме у ВВІМКНЕНОМУ стані — звичайний прогін `testid.spec.ts` ходить по
 *    сторінці з вимкненою настройкою й цього не побачив би ніколи.
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
	let previous = await geometry(page);
	for (let attempt = 0; attempt < 20; attempt += 1) {
		await page.waitForTimeout(150);
		const next = await geometry(page);
		if (next.bandHeight === previous.bandHeight && next.bandTop === previous.bandTop) return next;
		previous = next;
	}
	return previous;
}

/** Поставити прокрутку МИТТЄВО і дочекатися, поки сторінка на це відповість. */
async function jumpTo(page: Page, top: number) {
	await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);

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

/**
 * Вмикає зациклення ТАК САМО, як це робить відвідувач — тумблером у меню смуги.
 *
 * Не записом у `localStorage` повз контролер: тоді перевірка не доводила б, що
 * тумблер узагалі під'єднаний, і мовчала б про рівно той дефект, якого тут
 * бояться найбільше — настройка є, вмикати її нічим.
 */
async function enableEndless(page: Page) {
	const bar = page.getByTestId('page-scrollbar-container');
	const box = (await bar.boundingBox())!;
	await bar.click({ button: 'right', position: { x: box.width / 2, y: 4 } });
	await page.getByTestId('scrollbar-endless-label').click();
	await expect(page.getByTestId('scrollbar-endless-toggle')).toBeChecked();
	await page.keyboard.press('Escape');
	await expect(page.getByTestId('scrollbar-context-menu')).toHaveCount(0);
	// Розгін з'являється разом із першим виміром; чекаємо саме на нього, а не
	// на фіксовану паузу.
	await expect
		.poll(async () => (await geometry(page)).tail, { timeout: 10_000 })
		.toBeGreaterThan(0);
}

test.describe('зациклена головна', () => {
	test('типово вимкнена — розгону немає', async ({ page }) => {
		await gotoReady(page, '/');
		const g = await geometry(page);

		expect(g.bandHeight, 'смуга вмісту не знайдена — перевірка мертва').toBeGreaterThan(0);
		expect(g.head, 'верхній розгін займає місце при вимкненій настройці').toBe(0);
		expect(g.tail, 'нижній розгін займає місце при вимкненій настройці').toBe(0);
	});

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

	test.describe('увімкнена', () => {
		test.skip(({ isMobile }) => !!isMobile, 'зациклення лише на десктопі');

		test('перестановка працює в обидва боки', async ({ page }) => {
			await gotoReady(page, '/');
			await enableEndless(page);
			const g = await settled(page);

			expect(g.head, 'розгін мусить бути вищим за вікно').toBeGreaterThan(g.viewport);
			expect(g.tail).toBeGreaterThan(g.viewport);

			// Униз: за кінцем смуги читач опиняється на тому ж місці кола.
			expect(await jumpTo(page, g.bandTop + g.bandHeight + 40)).toBe(g.bandTop + 40);
			// Угору: вище початку смуги — в її кінець.
			expect(await jumpTo(page, g.bandTop - 40)).toBe(g.bandTop + g.bandHeight - 40);
		});

		test('кінця немає: після трьох кіл усе ще є куди гортати', async ({ page }) => {
			await gotoReady(page, '/');
			await enableEndless(page);
			const g = await settled(page);

			for (let lap = 1; lap <= 3; lap += 1) {
				const y = await jumpTo(page, g.bandTop + g.bandHeight - 10);
				expect(y, `коло ${lap}: читач випав за межі кола`).toBeLessThan(
					g.bandTop + g.bandHeight
				);
				expect(await jumpTo(page, y + 200)).toBeLessThan(g.bandTop + g.bandHeight);
			}
		});

		test('шов збігається: копія показує початок смуги', async ({ page }) => {
			await gotoReady(page, '/');
			await enableEndless(page);

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
					return { text: (h.textContent ?? '').trim(), depth: Math.round(h.getBoundingClientRect().top - base) };
				};
				const tail = document.querySelector('[data-testid="endless-tail-container"]');
				return { band: first(document.querySelector('[data-endless-band]')), copy: first(tail?.firstElementChild ?? null) };
			});

			expect(seam.band, 'у смузі немає заголовка — перевірка мертва').not.toBeNull();
			expect(seam.copy, 'нижній розгін порожній').not.toBeNull();
			expect(seam.copy!.text).toBe(seam.band!.text);
			expect(Math.abs(seam.copy!.depth - seam.band!.depth)).toBeLessThanOrEqual(2);
		});

		test('копія не приносить дублікатів testid та id', async ({ page }) => {
			await gotoReady(page, '/');
			await enableEndless(page);

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
			await enableEndless(page);
			const g = await settled(page);

			await jumpTo(page, g.bandTop + 1500);
			const button = page.getByTestId('back-to-top-btn');
			await expect(button).toBeVisible();
			await button.click();

			await expect
				.poll(async () => (await geometry(page)).scrollY, { timeout: 10_000 })
				.toBe(g.bandTop);
		});
	});
});
