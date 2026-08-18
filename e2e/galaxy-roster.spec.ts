import { expect, test, type Page } from '@playwright/test';
import { gotoReady } from './ready';

/**
 * Перелік випускників у галактиці.
 *
 * Тут перевіряється те, чого не бачить ні `svelte-check`, ні юніт-тест:
 * розкладка залежить від ЗАМІРЯНОЇ ширини сітки, тобто від `ResizeObserver`, а
 * той віддає спостереження лише коли сторінка справді малює кадри. У панелі
 * браузера, яка кадрів не композитить, число колонок так і лишилося
 * позаминулим — і зовні це виглядало як помилка у формулі, хоч формула була
 * правильна. Playwright малює по-справжньому, тож замір тут чесний.
 *
 * `staggerCells` і `sortRoster` покриті юніт-тестами окремо; тут — що сторінка
 * справді ними користується.
 */

const OPEN = '[data-testid="galaxy-open-roster-btn"]';
const MODAL = '[data-testid="galaxy-roster-modal"]';
const ITEM = '[data-testid^="galaxy-roster-list-item-"]';
const HEAD = '[data-testid^="galaxy-roster-head-"]';

async function openRoster(page: Page) {
	await gotoReady(page, '/projects/galaxy-graduates');
	await page.locator(OPEN).click();
	await expect(page.locator(MODAL)).toBeVisible();
	// Перший кадр після відкриття: до нього ширина сітки ще нуль, і колонок один.
	await page.locator(`${ITEM} button`).first().waitFor();
	await page.evaluate(
		() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
	);
}

test.describe('перелік випускників', () => {
	test('роки — кнопки, і вони справді фільтрують', async ({ page }) => {
		await openRoster(page);

		// Спадного списку більше немає: він приховував усі 28 років за кліком.
		await expect(page.locator('[data-testid="galaxy-roster-year-select"]')).toHaveCount(0);

		// Перелік показує ВСІХ, кого завантажила сторінка, а не частину. Число
		// беремо з кнопки, а не константою: інакше тест постаріє з новим випуском.
		const total = Number((await page.locator('[data-testid="galaxy-roster-total-count"]').innerText()).trim());
		const all = await page.locator(ITEM).count();
		expect(all).toBe(total);

		// По кнопці на кожен рік, який справді є в даних, плюс «усі роки».
		const yearsInData = new Set(await page.locator(HEAD).allInnerTexts());
		await expect(page.locator('[data-testid^="galaxy-roster-year-"]')).toHaveCount(
			yearsInData.size + 1
		);

		const year = page.locator('[data-testid="galaxy-roster-year-2014-btn"]');
		await expect(year).toHaveAttribute('aria-pressed', 'false');
		await year.click();
		await expect(year).toHaveAttribute('aria-pressed', 'true');

		const filtered = await page.locator(ITEM).count();
		expect(filtered).toBeGreaterThan(0);
		expect(filtered).toBeLessThan(all);
		// Лишився рівно один рік — і саме той.
		expect(await page.locator(HEAD).allInnerTexts()).toEqual(['2014']);
	});

	test('у межах року спершу заповнені анкети', async ({ page }) => {
		await openRoster(page);
		await page.locator('[data-testid="galaxy-roster-year-2014-btn"]').click();

		// 'фото' — анкета заповнена, є портрет; 'без' — лише ім'я.
		const kinds = await page.locator(ITEM).evaluateAll((items) =>
			items.map((item) => (item.querySelector('img') ? 'фото' : 'без'))
		);
		const lastPhoto = kinds.lastIndexOf('фото');
		const firstPlain = kinds.indexOf('без');
		if (lastPhoto !== -1 && firstPlain !== -1) {
			expect(lastPhoto, 'портрет після імені без портрета').toBeLessThan(firstPlain);
		}

		// І кожна група за абеткою всередині себе.
		const names = await page.locator(`${ITEM} .row__name`).allInnerTexts();
		expect(names.length).toBeGreaterThan(0);
		const photos = names.slice(0, kinds.filter((k) => k === 'фото').length);
		expect(photos).toEqual([...photos].sort((a, b) => a.localeCompare(b, 'uk')));
	});

	test('рядки рівномірні, центровані, і рядок анкет просторіший', async ({ page }, testInfo) => {
		test.skip(
			testInfo.project.name === 'mobile',
			'на телефоні в сітку не вміщається й двох колонок — там навмисно стовпчик'
		);
		await openRoster(page);

		const layout = await page.evaluate(
			({ item, head }) => {
				const heads = [...document.querySelectorAll(head)]
					.map((h) => ({ year: h.textContent!.trim(), top: h.getBoundingClientRect().y }))
					.sort((a, b) => a.top - b.top);

				// Рядки: скільки в кожному людей, чи вони з портретами і де межі рядка.
				const byTop = new Map<
					number,
					{ count: number; photos: number; left: number; right: number }
				>();
				for (const cell of document.querySelectorAll(item)) {
					const box = cell.getBoundingClientRect();
					const key = Math.round(box.y);
					const row = byTop.get(key) ?? {
						count: 0,
						photos: 0,
						left: Infinity,
						right: -Infinity
					};
					row.count += 1;
					if (cell.querySelector('img')) row.photos += 1;
					row.left = Math.min(row.left, box.x);
					row.right = Math.max(row.right, box.right);
					byTop.set(key, row);
				}

				const grid = document.querySelector('[data-testid="galaxy-roster-list"]')!;
				const gridBox = grid.getBoundingClientRect();
				// Центр саме вмісту: смуга прокрутки не входить у `clientWidth`.
				const center = gridBox.x + grid.clientLeft + grid.clientWidth / 2;

				// Кожен рядок належить смузі: рік (найближчий заголовок вище) + вид.
				const stripes = new Map<string, number[]>();
				const offCenter: number[] = [];
				for (const [top, row] of [...byTop.entries()].sort((a, b) => a[0] - b[0])) {
					const year = heads.filter((h) => h.top <= top).at(-1)?.year ?? '?';
					const kind = row.photos > 0 ? 'анкети' : 'решта';
					const key = `${year}:${kind}`;
					stripes.set(key, [...(stripes.get(key) ?? []), row.count]);
					offCenter.push(Math.abs((row.left + row.right) / 2 - center));
				}

				return {
					смуги: [...stripes.entries()].map(([key, counts]) => ({ key, counts })),
					найбільшийЗсувВідЦентру: Math.round(Math.max(...offCenter))
				};
			},
			{ item: ITEM, head: HEAD }
		);

		// Усі рядки центровані — включно з останнім, неповним.
		expect(layout.найбільшийЗсувВідЦентру, 'рядки мають бути по центру').toBeLessThanOrEqual(2);

		for (const { key, counts } of layout.смуги) {
			// Рівномірність: найбільший і найменший рядок смуги різняться щонайбільше
			// на одного. Саме це й прибирає останній рядок на одну-дві людини.
			expect(Math.max(...counts) - Math.min(...counts), `нерівномірна смуга ${key}`).toBeLessThanOrEqual(1);
			// Самотній рядок дозволений лише тоді, коли в смузі й справді одна людина.
			const total = counts.reduce((a, b) => a + b, 0);
			if (total > 1) expect(Math.min(...counts), `самотній рядок у ${key}`).toBeGreaterThan(1);
		}

		// Анкети розкладені просторіше за решту. Порівнюються НАЙШИРШІ рядки кожного
		// виду по всьому переліку, а не рік до року: у році, де решти лишилося двоє,
		// рядок на двох — це не «просторо», а просто нікого більше немає.
		const widest = (kind: string) =>
			Math.max(
				...layout.смуги.filter((s) => s.key.endsWith(kind)).flatMap((s) => s.counts)
			);
		expect(widest('анкети'), 'найширший рядок анкет має бути вужчим за рядок решти').toBeLessThan(
			widest('решта')
		);
	});

	test('на телефоні роки — смуга над переліком, а не стовпчик збоку', async ({
		page
	}, testInfo) => {
		test.skip(testInfo.project.name !== 'mobile', 'перевірка саме про вузький екран');
		await openRoster(page);

		const years = (await page.locator('[data-testid="galaxy-roster-years-toolbar"]').boundingBox())!;
		const list = (await page.locator('[data-testid="galaxy-roster-list"]').boundingBox())!;
		expect(years.y + years.height, 'роки мають бути НАД переліком').toBeLessThanOrEqual(list.y + 1);

		// І нічого не вилазить за екран убік.
		const viewport = page.viewportSize()!;
		const modal = (await page.locator(MODAL).boundingBox())!;
		expect(modal.x).toBeGreaterThanOrEqual(0);
		expect(modal.x + modal.width).toBeLessThanOrEqual(viewport.width + 1);
	});
});

test.describe('шкала років і відступи', () => {
	test('роки стоять шкалою: два стовпці, точки по центральній лінії', async ({
		page
	}, testInfo) => {
		test.skip(testInfo.project.name === 'mobile', 'на вузькому екрані роки — смуга, не шкала');
		await openRoster(page);

		const boxes = await page.evaluate(() =>
			[...document.querySelectorAll('[data-testid="galaxy-roster-timeline-container"] button')].map((b) => {
				const box = b.getBoundingClientRect();
				return {
					left: Math.round(box.x),
					right: Math.round(box.right),
					top: Math.round(box.y),
					height: Math.round(box.height)
				};
			})
		);
		expect(boxes.length).toBeGreaterThan(10);

		// Два стовпці: парні роки ліворуч, непарні праворуч.
		const lefts = boxes.filter((_, i) => i % 2 === 0);
		const rights = boxes.filter((_, i) => i % 2 === 1);
		expect(new Set(lefts.map((b) => b.left)).size, 'лівий стовпець рівний').toBe(1);
		expect(new Set(rights.map((b) => b.left)).size, 'правий стовпець рівний').toBe(1);
		expect(rights[0].left).toBeGreaterThan(lefts[0].left);

		// Точки лягають на лінію: права межа лівого стовпця = ліва межа правого.
		expect(Math.abs(lefts[0].right - rights[0].left)).toBeLessThanOrEqual(1);

		// Крок шкали — півкнопки, і саме це подвоює кількість років на екрані.
		const step = boxes[1].top - boxes[0].top;
		expect(step).toBeGreaterThan(0);
		expect(Math.abs(step - boxes[0].height / 2)).toBeLessThanOrEqual(2);

		const scaleHeight = boxes.at(-1)!.top + boxes.at(-1)!.height - boxes[0].top;
		const asColumn = boxes.length * boxes[0].height;
		expect(scaleHeight, 'шкала має бути помітно нижчою за простий стовпчик').toBeLessThan(
			asColumn * 0.6
		);
	});

	test('рік стоїть заголовком групи, а не в кожній картці', async ({ page }) => {
		await openRoster(page);

		// У картці лишається лише ім'я: чотирицифрового року там більше немає.
		const texts = await page.locator(`${ITEM} button`).evaluateAll((items) =>
			items.slice(0, 40).map((item) => item.textContent?.trim() ?? '')
		);
		expect(texts.filter((text) => /[0-9]/.test(text))).toEqual([]);

		// Заголовків рівно стільки, скільки років у переліку, і роки спадають.
		const heads = await page.locator(HEAD).allInnerTexts();
		expect(heads.length).toBeGreaterThan(1);
		const numbers = heads.map((text) => Number(text.trim()));
		expect(numbers).toEqual([...numbers].sort((a, b) => b - a));
	});

	test('заголовок року стоїть НАД своєю групою і відділяє її', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name === 'mobile', 'на телефоні перелік в один стовпчик');
		await openRoster(page);

		const spacing = await page.evaluate(
			({ item, head }) => {
				const heads = [...document.querySelectorAll(head)]
					.map((h) => ({ year: h.textContent!.trim(), top: h.getBoundingClientRect().y }))
					.sort((a, b) => a.top - b.top);

				// Рядок = унікальний `top`; рік беремо з найближчого заголовка вище.
				const rows = new Map<number, { bottom: number; year: string }>();
				for (const cell of document.querySelectorAll(item)) {
					const box = cell.getBoundingClientRect();
					const top = Math.round(box.y);
					const year = heads.filter((h) => h.top <= box.y).at(-1)?.year ?? '?';
					const known = rows.get(top);
					rows.set(top, { bottom: Math.max(known?.bottom ?? 0, box.bottom), year });
				}

				const ordered = [...rows.entries()].sort((a, b) => a[0] - b[0]);
				const inside: number[] = [];
				const between: number[] = [];
				for (let i = 1; i < ordered.length; i++) {
					const gap = ordered[i][0] - ordered[i - 1][1].bottom;
					(ordered[i][1].year === ordered[i - 1][1].year ? inside : between).push(gap);
				}

				return {
					першийЗаголовокНадУсіма: heads[0].top <= ordered[0][0],
					всередині: Math.round(Math.max(...inside)),
					міжРоками: Math.round(Math.min(...between))
				};
			},
			{ item: ITEM, head: HEAD }
		);

		expect(spacing.першийЗаголовокНадУсіма).toBe(true);
		expect(spacing.міжРоками, 'між роками має бути більший відступ, ніж між рядками').toBeGreaterThan(
			spacing.всередині
		);
	});

	test('кути карток сильно скруглені, а не трохи', async ({ page }) => {
		await openRoster(page);
		const shape = await page
			.locator(`${ITEM} button`)
			.first()
			.evaluate((el) => ({
				radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
				height: el.getBoundingClientRect().height
			}));
		// Пігулка: радіус не менший за півкартки.
		expect(shape.radius).toBeGreaterThanOrEqual(shape.height / 2 - 1);
	});

	test('смуги прокрутки авторські, а не системні', async ({ page }) => {
		await openRoster(page);
		const bars = await page.evaluate(() => {
			const body = getComputedStyle(document.body);
			const grid = document.querySelector('[data-testid="galaxy-roster-list"]')!;
			return {
				колір: body.scrollbarColor,
				товщина: body.scrollbarWidth,
				сіткаПрокручується: grid.scrollHeight > grid.clientHeight
			};
		});
		// `auto` — це системна смуга; сторінка мусить задавати свої кольори.
		expect(bars.колір).not.toBe('auto');
		expect(bars.товщина).toBe('thin');
		expect(bars.сіткаПрокручується).toBe(true);
	});

	test('у випускника є своє тло, а не прозорий рядок', async ({ page }) => {
		await openRoster(page);
		const background = await page
			.locator(`${ITEM} button`)
			.first()
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(background).not.toBe('rgba(0, 0, 0, 0)');
		expect(background).not.toBe('transparent');
	});
});
