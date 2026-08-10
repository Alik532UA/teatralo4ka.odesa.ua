import { expect, test, type Page } from '@playwright/test';
import type { ScrollbarMode } from '$lib/controllers/ui.svelte';

/**
 * Режими смуги прокрутки.
 *
 * Перевіряється не вигляд, а поведінка, яку легко зламати непомітно:
 * чи типовий режим нічого не малює, чи власна смуга не забирає ширину, і чи
 * перетягування дає прокрутку БЕЗ затримки.
 *
 * Остання перевірка з'явилася після реальної скарги: рухи миші запускали
 * `scrollTo` з `behavior: 'auto'`, що означає «взяти значення з CSS», а там
 * `scroll-behavior: smooth`. Кожен рух починав плавну анімацію, вони
 * наздоганяли одна одну — і перетягування смикалося.
 */

/** Вмикає режим так само, як це робить кнопка в налаштуваннях. */
async function setMode(page: Page, mode: ScrollbarMode) {
	await page.evaluate((m) => {
		localStorage.setItem('teatralo4ka_scrollbarMode', m);
	}, mode);
	await page.reload();
	await page.waitForLoadState('load');
	await expect(page.locator('h1, h2').first()).toBeVisible();
}

test.describe('режими смуги прокрутки', () => {
	/**
	 * Усе, крім типового режиму, вимкнене на сенсорних пристроях: там прокрутка
	 * пальцем, нативний індикатор і так накладка, а «наближення миші» не існує.
	 * Компоненти перевіряють це через `(hover: hover) and (pointer: fine)`, тож
	 * на мобільному проєкті перевіряти нема чого.
	 */
	test.skip(
		({ isMobile }) => !!isMobile,
		'власна смуга і мінімапа — лише для пристроїв із мишею'
	);

	test.beforeEach(async ({ page }) => {
		// Довга сторінка: на короткій прокрутки немає і перевіряти нічого.
		await page.goto('/history');
		await page.waitForLoadState('load');
	});

	test('режим standard не малює нічого свого', async ({ page }) => {
		await setMode(page, 'standard');
		await expect(page.getByTestId('page-scrollbar-container')).toHaveCount(0);
		await expect(page.getByTestId('minimap-container')).toHaveCount(0);

		const hidden = await page.evaluate(() =>
			document.documentElement.classList.contains('has-custom-scrollbar')
		);
		expect(hidden, 'нативну смугу не можна ховати в режимі standard').toBe(false);
	});

	test('типово увімкнена власна смуга, і клас стоїть ще до гідрації', async ({ page }) => {
		// Без збереженого вибору режим має бути `custom`.
		await page.evaluate(() => localStorage.clear());
		await page.reload();

		// Клас ставить інлайн-скрипт у <head>, а не ефект після гідрації: інакше
		// на заставці встигала показатися нативна смуга і зникала вже після неї.
		const html = await page.content();
		expect(html, 'клас мусить бути в розмітці до гідрації').toContain('has-custom-scrollbar');

		await expect(page.getByTestId('page-scrollbar-container')).toBeVisible();
	});

	test('власна смуга не забирає ширину сторінки', async ({ page }) => {
		await setMode(page, 'custom');
		await expect(page.getByTestId('page-scrollbar-container')).toBeVisible();

		// Саме заради цього все й робилося: нативна смуга є частиною розкладки,
		// через що сторінки з нею і без неї зсунуті одна відносно одної.
		const gap = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
		expect(gap, 'сторінка мусить лишатися на всю ширину вікна').toBe(0);
	});

	test('власна смуга лежить під заставкою', async ({ page }) => {
		await setMode(page, 'custom');
		const z = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="page-scrollbar-container"]');
			return el ? Number(getComputedStyle(el).zIndex) : -1;
		});
		// Заставка в app.html має z-index 10000.
		expect(z).toBeGreaterThan(0);
		expect(z, 'смуга не має перекривати заставку').toBeLessThan(10000);
	});

	test('схематична мінімапа вузька', async ({ page }) => {
		await setMode(page, 'minimap');
		const viewport = page.viewportSize()!;
		await page.mouse.move(viewport.width - 4, viewport.height / 2);
		await page.waitForTimeout(900);

		const box = (await page.getByTestId('minimap-container').boundingBox())!;
		// Смужкам не потрібна пропорційна ширина: раніше вона бралася з масштабу
		// сторінки і виходила в кілька разів більшою, ніж треба.
		expect(box.width, 'схематична мінімапа має лишатися вузькою').toBeLessThanOrEqual(40);
	});

	test('перемикання режимів не лишає двох смуг', async ({ page }) => {
		// Клас, що ховає нативну смугу, колись ставили самі компоненти, і при
		// перемиканні виходила гонка: новий додавав, прибиральник старого одразу
		// знімав. На екрані було дві смуги — власна й системна.
		for (const mode of ['minimap', 'custom', 'minimap-full', 'custom', 'standard'] as const) {
			await setMode(page, mode);
			const hidden = await page.evaluate(() =>
				document.documentElement.classList.contains('has-custom-scrollbar')
			);
			expect(hidden, `режим ${mode}: нативна смуга має ${mode === 'standard' ? 'лишатися' : 'ховатися'}`)
				.toBe(mode !== 'standard');
		}
	});

	test('панель налаштувань прокручується, а не вилазить за екран', async ({ page }) => {
		// Панель містить ДВА окремі блоки — мову з темою і налаштування нижче, —
		// і за екран вилазить їхня спільна висота. Тому обмеження стоїть на
		// зовнішньому контейнері, а не на кожному блоці: інакше вийшли б дві
		// незалежні смуги, а нижній блок усе одно лишався б за краєм.
		await page.getByTestId('header-settings-btn').click();
		const popover = page.getByTestId('settings-popover-menu');
		await expect(popover).toBeVisible();

		const g = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="settings-popover-menu"]') as HTMLElement;
			const style = getComputedStyle(el);
			return {
				overflowY: style.overflowY,
				bottom: el.getBoundingClientRect().bottom,
				viewportHeight: window.innerHeight,
				// Скільки смуг прокрутки всередині — має бути рівно одна, зовнішня.
				innerScrollable: [...el.querySelectorAll('.dropdown-menu-unified')].filter(
					(n) => getComputedStyle(n).overflowY === 'auto'
				).length
			};
		});

		expect(g.overflowY, 'зайве має прокручуватися').toBe('auto');
		expect(g.bottom, 'панель не має вилазити за низ екрана')
			.toBeLessThanOrEqual(g.viewportHeight + 1);
		expect(g.innerScrollable, 'вкладених смуг прокрутки бути не має').toBe(0);

		// І найнижчий пункт мусить бути ДОСЯЖНИМ після прокрутки панелі.
		// Прокрутка сама по собі цього не гарантувала: попов доходив рівно до низу
		// екрана, а на широких екранах його накривав приклеєний підвал.
		const last = page.getByTestId('debug-scrollbar-minimap-full-btn');
		await last.scrollIntoViewIfNeeded();
		const visible = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="debug-scrollbar-minimap-full-btn"]')!;
			const r = el.getBoundingClientRect();
			const footer = document.querySelector('footer, .footer');
			const footerTop = footer ? footer.getBoundingClientRect().top : window.innerHeight;
			return {
				bottom: r.bottom,
				height: r.height,
				limit: Math.min(window.innerHeight, footerTop)
			};
		});
		expect(visible.height, 'нижній пункт мусить існувати').toBeGreaterThan(0);
		expect(visible.bottom, 'нижній пункт не має ховатися під підвалом чи за краєм')
			.toBeLessThanOrEqual(visible.limit + 1);
	});

	test('накладки відокремлені тінню від сторінки', async ({ page }) => {
		for (const [mode, testId] of [
			['custom', 'page-scrollbar-container'],
			['minimap-full', 'minimap-container']
		] as const) {
			await setMode(page, mode);
			const shadow = await page.evaluate((id) => {
				const el = document.querySelector(`[data-testid="${id}"]`);
				return el ? getComputedStyle(el).boxShadow : 'none';
			}, testId);
			// Тло накладок майже збігається з тлом сторінки, тож без тіні вони
			// зливаються — саме це й було видно.
			expect(shadow, `${mode}: накладка має мати тінь`).not.toBe('none');
		}
	});

	test('область натискання мінімапи не більша за видиму', async ({ page }) => {
		await setMode(page, 'minimap-full');
		const viewport = page.viewportSize()!;
		await page.mouse.move(viewport.width - 4, viewport.height / 2);
		await page.waitForTimeout(900);

		const g = await page.evaluate(() => {
			const box = document.querySelector('[data-testid="minimap-container"]')!;
			const clone = box.querySelector('.minimap__clone') as HTMLElement;
			return {
				boxHeight: box.getBoundingClientRect().height,
				cloneHeight: clone.getBoundingClientRect().height,
				viewportHeight: window.innerHeight
			};
		});

		// Коли клон коротший за екран, смужка мусить закінчуватися разом із ним.
		// Інакше натиск під клоном виглядає як «кінець сторінки», а веде в середину.
		const expected = Math.min(g.cloneHeight, g.viewportHeight);
		expect(Math.abs(g.boxHeight - expected), 'висота смужки має дорівнювати видимій частині')
			.toBeLessThan(6);
	});

	test('візуальна мінімапа збігається зі сторінкою', async ({ page }) => {
		await setMode(page, 'minimap-full');
		const viewport = page.viewportSize()!;
		await page.mouse.move(viewport.width - 4, viewport.height / 2);
		await page.waitForTimeout(900);
		await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
		await page.waitForTimeout(300);

		const geometry = await page.evaluate(() => {
			const box = document.querySelector('[data-testid="minimap-container"]')!;
			const clone = box.querySelector('.minimap__clone') as HTMLElement;
			const marker = box.querySelector('[data-testid="minimap-viewport-status"]')!;
			const boxRect = box.getBoundingClientRect();
			return {
				boxHeight: boxRect.height,
				boxWidth: boxRect.width,
				cloneHeight: clone.getBoundingClientRect().height,
				cloneTop: clone.getBoundingClientRect().top - boxRect.top,
				markerTop: marker.getBoundingClientRect().top - boxRect.top,
				scrollY: window.scrollY,
				pageHeight: document.documentElement.scrollHeight,
				windowWidth: window.innerWidth
			};
		});

		// Масштаб береться по ШИРИНІ: сторінка вміщається цілком, нічого не
		// зрізається. Через це клон буває вищим за смужку — тоді він їде
		// всередині неї разом із прокруткою, як мінімапа в редакторі коду.
		const scale = geometry.boxWidth / geometry.windowWidth;
		expect(Math.abs(geometry.cloneHeight - geometry.pageHeight * scale), 'клон має бути сторінкою в масштабі')
			.toBeLessThan(8);

		// Рамка стоїть там, де в клоні перебуває поточна позиція прокрутки —
		// з урахуванням того, наскільки клон уже поїхав угору.
		const expected = geometry.scrollY * scale + geometry.cloneTop;
		expect(Math.abs(geometry.markerTop - expected), 'рамка має збігатися з вмістом клону')
			.toBeLessThan(6);
	});

	test('наведення й утримання прокручує без натискання', async ({ page }) => {
		await setMode(page, 'custom');
		const bar = page.getByTestId('page-scrollbar-container');
		await expect(bar).toBeVisible();

		const box = (await bar.boundingBox())!;
		const x = box.x + box.width / 2;
		// Нижче за повзунок: сторінка на початку, тож повзунок угорі.
		const below = box.y + box.height * 0.8;

		// Позицію задаємо самі й даємо їй усістися. Браузер відновлює прокрутку
		// після перезавантаження АСИНХРОННО, і без цього вона доїжджала вже
		// посеред перевірки — виглядало як завчасний старт доводчика.
		await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
		await page.waitForTimeout(300);
		const atStart = await page.evaluate(() => window.scrollY);

		await page.mouse.move(x, below);
		// Затримка навмисна: випадкове проходження курсора повз смугу не має
		// нічого зрушити.
		await page.waitForTimeout(600);
		expect(await page.evaluate(() => window.scrollY), 'до затримки рух не починається')
			.toBe(atStart);

		await page.waitForTimeout(900);
		const early = (await page.evaluate(() => window.scrollY)) - atStart;
		expect(early, 'після затримки сторінка має поїхати').toBeGreaterThan(0);

		// Розгін: за такий самий відрізок часу проходить помітно більше.
		await page.waitForTimeout(900);
		const late = (await page.evaluate(() => window.scrollY)) - atStart - early;
		expect(late, 'рух має прискорюватися').toBeGreaterThan(early);

		// Курсор геть — рух припиняється.
		await page.mouse.move(box.x - 300, below);
		await page.waitForTimeout(300);
		const stopped = await page.evaluate(() => window.scrollY);
		await page.waitForTimeout(500);
		expect(await page.evaluate(() => window.scrollY), 'без курсора рух зупиняється')
			.toBe(stopped);
	});

	test('права кнопка відкриває меню вибору режиму', async ({ page }) => {
		await setMode(page, 'custom');
		const bar = page.getByTestId('page-scrollbar-container');
		const box = (await bar.boundingBox())!;

		await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
		const menu = page.getByTestId('scrollbar-context-menu');
		await expect(menu).toBeVisible();

		// Меню має жити в корені, а не всередині смуги: мінімапа з
		// `overflow: hidden` обрізала б його, а після перемикання режиму
		// компонент, що його відкрив, зникає разом із меню.
		const insideOverlay = await page.evaluate(() => {
			const m = document.querySelector('[data-testid="scrollbar-context-menu"]')!;
			return !!m.closest('.page-scrollbar, .minimap');
		});
		expect(insideOverlay, 'меню не має лежати всередині накладки').toBe(false);

		// Вибір застосовується й запам’ятовується.
		await menu.getByTestId('scrollbar-menu-minimap-btn').click();
		await expect(menu).toHaveCount(0);
		await expect(page.getByTestId('minimap-container')).toBeVisible();
		expect(
			await page.evaluate(() => localStorage.getItem('teatralo4ka_scrollbarMode'))
		).toBe('minimap');
	});

	test('у стандартному режимі меню ловиться зоною біля краю', async ({ page }) => {
		await setMode(page, 'standard');

		// Нативну смугу малює браузер, і подій із неї сторінка не отримує —
		// перехопити клік просто над нею неможливо. Тому робоча зона це двадцять
		// пікселів ЛІВОРУЧ від смуги: прозорий елемент поверх неї перекрив би саму
		// смугу, і її стало б не можна тягнути.
		const contentEdge = await page.evaluate(() => document.documentElement.clientWidth);

		await page.mouse.click(contentEdge - 6, 300, { button: 'right' });
		await expect(page.getByTestId('scrollbar-context-menu')).toBeVisible();

		// Далі від краю — звичайне поведінка сторінки, наше меню не з’являється.
		await page.getByTestId('scrollbar-menu-backdrop').click();
		await expect(page.getByTestId('scrollbar-context-menu')).toHaveCount(0);
		await page.mouse.click(contentEdge - 200, 300, { button: 'right' });
		await expect(page.getByTestId('scrollbar-context-menu')).toHaveCount(0);
	});

	test('на сторінці без прокрутки жоден режим нічого не малює', async ({ page }) => {
		// `/residents/adults` вміщається у вікно тестового розміру цілком.
		// Перевірка була у власної смуги, а в мінімапи її забули — і вона висіла
		// збоку з рамкою на всю висоту, тобто не показувала нічого корисного.
		await page.goto('/residents/adults');
		await page.waitForLoadState('load');

		const fits = await page.evaluate(
			() => document.documentElement.scrollHeight <= window.innerHeight + 1
		);
		expect(fits, 'сторінка мусить уміщатися — інакше перевірка нічого не варта').toBe(true);

		for (const mode of ['standard', 'custom', 'minimap', 'minimap-full'] as const) {
			await page.evaluate((m) => {
				localStorage.setItem('teatralo4ka_scrollbarMode', m);
			}, mode);
			await page.reload();
			await page.waitForLoadState('load');
			await page.waitForTimeout(300);

			const shown = await page.evaluate(() => ({
				bar: !!document.querySelector('[data-testid="page-scrollbar-container"]:not(.page-scrollbar--hidden)'),
				map: !!document.querySelector('[data-testid="minimap-container"]')
			}));
			expect(shown.map, `${mode}: мінімапи бути не має`).toBe(false);
			expect(shown.bar, `${mode}: смуги бути не має`).toBe(false);
		}
	});

	test('доводчик працює в усіх трьох режимах', async ({ page }) => {
		for (const [mode, testId] of [
			['custom', 'page-scrollbar-container'],
			['minimap', 'minimap-container'],
			['minimap-full', 'minimap-container']
		] as const) {
			await setMode(page, mode);
			const control = page.getByTestId(testId);
			await expect(control).toBeVisible();

			const viewport = page.viewportSize()!;
			// Мінімапа у спокої схована за краєм — спершу підносимо мишу.
			await page.mouse.move(viewport.width - 4, viewport.height / 2);
			await page.waitForTimeout(900);

			const box = (await control.boundingBox())!;
			const x = Math.min(box.x + box.width / 2, viewport.width - 4);
			const atStart = await page.evaluate(() => window.scrollY);

			// Нижче за рамку: сторінка на початку, тож рамка вгорі.
			await page.mouse.move(x, box.y + box.height * 0.8);
			await page.waitForTimeout(1600);

			const moved = (await page.evaluate(() => window.scrollY)) - atStart;
			expect(moved, `${mode}: доводчик має прокручувати`).toBeGreaterThan(0);

			await page.mouse.move(box.x - 300, viewport.height / 2);
			await page.waitForTimeout(300);
		}
	});

	for (const mode of ['custom', 'minimap', 'minimap-full'] as const) {
		test(`${mode}: перетягування прокручує без затримки`, async ({ page }) => {
			await setMode(page, mode);
			const testId = mode === 'custom' ? 'page-scrollbar-container' : 'minimap-container';
			const control = page.getByTestId(testId);
			await expect(control).toBeVisible();

			const viewport = page.viewportSize()!;
			// Мінімапа у спокої схована за правий край і лишає вузьку смужку, тож
			// спершу підносимо мишу — як це робить людина, — і чекаємо, поки
			// пружина її висуне. Без цього точка натиску опинялася б за вікном.
			await page.mouse.move(viewport.width - 4, viewport.height / 2);
			await page.waitForTimeout(900);

			const box = (await control.boundingBox())!;
			// Впритул до краю: там елемент видимий у будь-якому режимі.
			const x = Math.min(box.x + box.width / 2, viewport.width - 4);

			await page.mouse.move(x, box.y + 40);
			await page.mouse.down();
			await page.mouse.move(x, box.y + box.height * 0.7, { steps: 8 });

			// Один кадр на застосування — і все. Якби прокрутка йшла плавною
			// анімацією, за 100 мс вона була б ще в дорозі.
			await page.waitForTimeout(100);
			const during = await page.evaluate(() => window.scrollY);

			await page.mouse.up();
			await page.waitForTimeout(400);
			const after = await page.evaluate(() => window.scrollY);

			expect(during, 'перетягування має прокручувати').toBeGreaterThan(100);
			// Після відпускання сторінка не повинна «доїжджати».
			expect(Math.abs(after - during), 'прокрутка не мусить тривати після відпускання')
				.toBeLessThan(80);
		});
	}
});
