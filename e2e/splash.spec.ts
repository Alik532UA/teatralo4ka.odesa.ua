import { expect, test, type Page } from '@playwright/test';

/**
 * Заставка мусить ЗАВЕРШУВАТИСЯ, а не зникати посеред анімації.
 *
 * ## Дефект, через який цей файл існує
 *
 * Заставка живе в `src/app.html`, тобто в розмітці КОЖНОЇ сторінки, і починає
 * анімацію входу всюди. А завершували її двома різними способами: головна вела
 * повну послідовність виходу, а `+layout.svelte` для решти маршрутів робив
 * `document.getElementById('app-splash')?.remove()` — виривав елемент посеред
 * анімації. Симптом (скарга автора 2026-08-23): «заходиш прямо на /contacts/,
 * заставка починається — і в якийсь момент різко зникає».
 *
 * ## Чому саме E2E, а не юніт
 *
 * Дефект був у ВЗАЄМОДІЇ трьох речей: розмітки з `app.html`, ефекту в лейауті й
 * CSS-анімацій виходу. Юніт над джерелами бачить кожну окремо і не бачить
 * жодного зв'язку; побачити «зникло раптово» можна лише в браузері, який
 * справді відпрацював послідовність.
 *
 * ## Чому все міряється ЖУРНАЛОМ ПОДІЙ, а не локаторами
 *
 * На внутрішній сторінці вся послідовність триває ~1.4 с від старту, і `goto`
 * повертається вже після неї. Перша редакція цієї перевірки шукала
 * `#app-splash` локатором і падала на «заставки немає» — на ПРАВИЛЬНОМУ коді,
 * бо на момент перевірки її вже (законно) прибрали. Журнал, встановлений
 * `addInitScript` до завантаження, бачить усе.
 */

/** Одна подія послідовності виходу. */
interface SplashEvent {
	name: string;
	at: number;
}

/** Знімок кольорів велюру, зроблений у момент початку виходу. */
interface CurtainSnapshot {
	theme: string | null;
	variant: string | null;
	base: string | null;
	hi: string | null;
	hem: string | null;
}

interface SplashProbe {
	events: SplashEvent[];
	curtains: CurtainSnapshot | null;
}

/**
 * Записувач, встановлений ДО завантаження сторінки.
 *
 * Крім послідовності подій він знімає обчислені кольори велюру на `splash-exit`
 * — тобто в останній момент, коли куліси ще на екрані. Читати їх після
 * прибирання елемента неможливо, а робити для цього окремий тест зі штучною
 * затримкою означало б перевіряти не той стан.
 */
async function installProbe(page: Page) {
	await page.addInitScript(() => {
		const w = window as unknown as { __splashProbe?: SplashProbe };
		const probe: SplashProbe = { events: [], curtains: null };
		w.__splashProbe = probe;

		const readCurtains = (): CurtainSnapshot => {
			/*
			 * Властивість читається за ВИДОМ вузла, а не «перша непорожня».
			 *
			 * Перша редакція брала `stopColor || fill`, і на `<path>` фестона це
			 * давало `rgb(0, 0, 0)`: `stop-color` існує на кожному елементі й типово
			 * чорний, тобто вираз ніколи не доходив до `fill`. Перевірка падала на
			 * правильному коді, повідомляючи «синьої складової немає».
			 */
			const pick = (selector: string) => {
				const el = document.querySelector(`#app-splash-curtains ${selector}`);
				if (!el) return null;
				const style = getComputedStyle(el);
				return el.tagName.toLowerCase() === 'stop' ? style.stopColor : style.fill;
			};
			return {
				theme: document.documentElement.getAttribute('data-theme'),
				variant: document.documentElement.getAttribute('data-splash'),
				base: pick('.sp-v-base'),
				hi: pick('.sp-v-hi'),
				hem: pick('.sp-v-hem')
			};
		};

		for (const name of ['splash-exit', 'splash-logo-start', 'splash-removed']) {
			window.addEventListener(name, () => {
				probe.events.push({ name, at: Math.round(performance.now()) });
				if (name === 'splash-exit') probe.curtains = readCurtains();
			});
		}
	});
}

/**
 * Заставку показує лише ХОЛОДНИЙ старт: `static/splash.js` ставить
 * `display: none`, якщо в сховищі вже є налаштування головної. Тому кожен тест
 * починає з чистого сховища — інакше перевіряти було б нічого.
 */
async function coldStart(page: Page, path: string, theme?: 'dark' | 'light') {
	await installProbe(page);
	await page.goto(path);
	await page.evaluate((t) => {
		try {
			localStorage.removeItem('teatralo4ka_homeSettings');
			if (t) localStorage.setItem('teatralo4ka_theme', t);
		} catch {
			// Приватний режим: сховище недоступне — це саме той стан, який нам треба.
		}
	}, theme);
	await page.reload();
}

/** Чекає на повну послідовність і віддає журнал. */
async function waitForSequence(page: Page): Promise<SplashProbe> {
	await expect
		.poll(
			async () =>
				page.evaluate(
					() =>
						(window as unknown as { __splashProbe?: SplashProbe }).__splashProbe?.events.map((e) => e.name) ??
						[]
				),
			{ message: 'послідовність виходу заставки не дійшла до splash-removed', timeout: 12_000 }
		)
		.toContain('splash-removed');

	return page.evaluate(() => (window as unknown as { __splashProbe: SplashProbe }).__splashProbe);
}

test.describe('заставка', () => {
	test('на внутрішній сторінці вихід доходить до кінця, а не обривається', async ({ page }) => {
		await coldStart(page, '/contacts');
		const probe = await waitForSequence(page);

		const names = probe.events.map((e) => e.name);
		expect(names, `очікувалася повна послідовність, отримано: ${names.join(' → ')}`).toEqual([
			'splash-exit',
			'splash-logo-start',
			'splash-removed'
		]);

		/*
		 * Головне число цього файлу. Доти між початком і кінцем не було НІЧОГО:
		 * елемент виривався одним викликом, тобто ця різниця дорівнювала нулю (та
		 * й самої події `splash-exit` не було). Тепер між `splash-exit` і
		 * `splash-removed` мусить пройти час, якого досить, щоб куліси розійшлися:
		 * `app.html` дає їм 1 с анімації із затримкою 0.35 с.
		 *
		 * Поріг 1200 мс, а не рівно 1350: у сповільненому CI на кожен таймер
		 * накладається планувальник, і рівний поріг зробив би гейт плаваючим.
		 */
		const exit = probe.events.find((e) => e.name === 'splash-exit')!;
		const removed = probe.events.find((e) => e.name === 'splash-removed')!;
		expect(
			removed.at - exit.at,
			'вихід тривав менше, ніж анімація куліс — елемент прибрали посеред неї'
		).toBeGreaterThanOrEqual(1200);

		// І врешті елемента справді немає — послідовність не лишає його на екрані.
		await expect(page.locator('#app-splash')).toHaveCount(0);
	});

	test('на головній послідовність та сама', async ({ page }) => {
		await coldStart(page, '/');
		const names = (await waitForSequence(page)).events.map((e) => e.name);
		expect(names).toEqual(['splash-exit', 'splash-logo-start', 'splash-removed']);
	});

	/**
	 * Куліси — SVG-велюр, і в темній темі він мусить бути темно-синім, а не
	 * жовтим. Перевіряється обчислений `stop-color`, а не скріншот: колір
	 * приходить із токена, і саме токен тут можна зламати непомітно.
	 *
	 * Літерали `stop-color` лишаються в атрибутах SVG як запасний варіант (щоб
	 * велюр малювався навіть без цих правил), тому перевірка «синє, а не жовте»
	 * заодно відрізняє реальне застосування токена від фолбеку.
	 */
	test('у темній темі куліси темно-сині, а не жовті', async ({ page }) => {
		await coldStart(page, '/contacts', 'dark');
		const { curtains } = await waitForSequence(page);

		expect(curtains, 'знімок кольорів не зроблено — події splash-exit не було').not.toBeNull();
		expect(curtains!.variant, 'варіант заставки не `curtains` — перевіряти нема чого').toBe('curtains');
		expect(curtains!.theme).toBe('dark');

		// Жовтий велюр — це високі red і green при нульовому blue. Темно-синій —
		// навпаки. Перевіряємо саму цю ознаку, а не конкретний відтінок: значення
		// палітри можуть змінитися, а «синє, а не жовте» — ні.
		for (const key of ['base', 'hi', 'hem'] as const) {
			const rgb = (curtains![key] ?? '').match(/\d+/g)?.map(Number) ?? [];
			expect(rgb.length, `не вдалося прочитати колір для ${key}`).toBeGreaterThanOrEqual(3);
			const [r, , b] = rgb;
			expect(b, `${key}: синьої складової майже немає — це жовтий велюр`).toBeGreaterThan(r);
		}
	});

	test('у світлій темі куліси лишаються жовтими', async ({ page }) => {
		await coldStart(page, '/contacts', 'light');
		const { curtains } = await waitForSequence(page);

		expect(curtains!.theme).toBe('light');
		for (const key of ['base', 'hi'] as const) {
			const rgb = (curtains![key] ?? '').match(/\d+/g)?.map(Number) ?? [];
			expect(rgb.length, `не вдалося прочитати колір для ${key}`).toBeGreaterThanOrEqual(3);
			const [r, g, b] = rgb;
			expect(r, `${key}: очікувався жовтий велюр`).toBeGreaterThan(b);
			expect(g, `${key}: очікувався жовтий велюр`).toBeGreaterThan(b);
		}
	});
});
