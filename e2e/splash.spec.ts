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

interface SplashProbe {
	events: SplashEvent[];
}

/**
 * Записувач подій, встановлений ДО завантаження сторінки.
 *
 * Саме тут, а не після `goto`: на внутрішній сторінці вся послідовність триває
 * ~1.4 с від старту, і слухач, доданий після завантаження, стабільно приходить
 * із запізненням — журнал виходив порожній.
 */
async function installProbe(page: Page) {
	await page.addInitScript(() => {
		const w = window as unknown as { __splashProbe?: SplashProbe };
		const probe: SplashProbe = { events: [] };
		w.__splashProbe = probe;

		for (const name of ['splash-exit', 'splash-logo-start', 'splash-removed']) {
			window.addEventListener(name, () => {
				probe.events.push({ name, at: Math.round(performance.now()) });
			});
		}
	});
}

/**
 * Заставку показує лише ХОЛОДНИЙ старт: `static/splash.js` ставить
 * `display: none`, якщо в сховищі вже є налаштування головної. Тому кожен тест
 * починає з чистого сховища — інакше перевіряти було б нічого.
 */
async function coldStart(page: Page, path: string) {
	await installProbe(page);
	await page.goto(path);
	await page.evaluate(() => {
		try {
			localStorage.removeItem('teatralo4ka_homeSettings');
		} catch {
			// Приватний режим: сховище недоступне — це саме той стан, який нам треба.
		}
	});
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
});
