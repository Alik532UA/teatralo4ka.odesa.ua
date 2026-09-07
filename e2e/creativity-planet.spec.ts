import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gotoReady } from './ready';

/**
 * «Планета творчості» — сторінка поточних учнів.
 *
 * ## Що саме стережеться
 *
 * 1. На планеті стоять УСІ учні реєстру й ніхто більше. Число в лічильнику
 *    береться з тих самих даних, тож розходження між ним і кількістю облич
 *    означало б, що когось не намалювали.
 * 2. Учня НЕМАЄ в галактиці випускників. Це головна межа всієї роботи: галактика
 *    для тих, хто випустився чи перестав учитися, планета — для тих, хто вчиться
 *    зараз. Межу тримає видимість `linked` у реєстрі, і без цієї перевірки вона
 *    зникла б від одного забутого поля.
 * 3. Натискання відкриває картку з ВЛАСНОЮ адресою людини — тією самою, що буде
 *    в неї після випуску: сторінка учня від першого дня та сама, і посилання,
 *    роздане учнем, переїзд у галактику переживе.
 * 4. У картці учня немає року випуску — замість нього «навчається». Саме цього
 *    просив автор: «така сама концепція, як у випускника, але без поля рік
 *    випуску».
 *
 * Дані читаються ФАЙЛОМ, а не імпортом `$lib/data/graduates`: той модуль тягне
 * JSON, а завантажувач Node у прогоні Playwright вимагає для цього
 * `import ... with { type: 'json' }` — без нього спека не збирається взагалі
 * (те саме вже ловило `theme-contrast.spec.ts`).
 */
const ПЛАНЕТА = '/projects/creativity-planet/';

const РЕЄСТР = JSON.parse(
	readFileSync(new URL('../src/lib/data/graduates.index.json', import.meta.url), 'utf8')
) as { id: string; slug: string; name: string; kind?: string; visibility?: string }[];

const УЧНІ = РЕЄСТР.filter((г) => г.kind === 'student');

test.describe('планета творчості', () => {
	test('у реєстрі є учні — перевірка жива', () => {
		expect(УЧНІ.length, 'без жодного учня сторінка нічого не стереже').toBeGreaterThan(0);
	});

	test('на планеті стоять усі учні й лічильник із ними згоден', async ({ page }) => {
		await gotoReady(page, ПЛАНЕТА);

		await expect(page.getByTestId('creativity-planet-count')).toHaveText(String(УЧНІ.length));

		for (const учень of УЧНІ) {
			const кнопка = page.getByTestId(`creativity-planet-${учень.slug}-btn`);
			await expect(кнопка, `${учень.name} не потрапив на планету`).toBeVisible();
			await expect(кнопка).toContainText(учень.name);
		}

		/* Обличчя стоять НА планеті, а не поруч: перша редакція сторінки
		   виносила крайніх за коло, і одна учениця висіла над текстом. */
		const межі = await page.evaluate((слаг) => {
			const коло = document.querySelector('[data-testid="creativity-planet-list"]')!.getBoundingClientRect();
			const обличчя = document
				.querySelector(`[data-testid="creativity-planet-${слаг}-btn"] span`)!
				.getBoundingClientRect();
			const cx = коло.left + коло.width / 2;
			const cy = коло.top + коло.height / 2;
			const dx = обличчя.left + обличчя.width / 2 - cx;
			const dy = обличчя.top + обличчя.height / 2 - cy;
			return { відстань: Math.hypot(dx, dy) + обличчя.width / 2, радіус: коло.width / 2 };
		}, УЧНІ[УЧНІ.length - 1].slug);
		expect(
			межі.відстань,
			`крайнє обличчя відходить на ${Math.round(межі.відстань)} px від центру, а планета має радіус ${Math.round(межі.радіус)}`
		).toBeLessThanOrEqual(межі.радіус);
	});

	test('учня немає в галактиці випускників', async ({ page }) => {
		await gotoReady(page, '/projects/galaxy-graduates/');
		for (const учень of УЧНІ) {
			await expect(
				page.locator(`[data-testid="galaxy-list-item-${учень.slug}"]`),
				`${учень.name} летить у галактиці, хоч іще вчиться`
			).toHaveCount(0);
		}
	});

	test('на сторінці учня квітка замість зірки й жодних зірок галактики позаду', async ({
		page
	}) => {
		const учень = УЧНІ[0];
		await gotoReady(page, `/projects/galaxy-graduates/${учень.slug}/`);

		/*
		 * Зірка належить ГАЛАКТИЦІ: людина, яка випустилася, світить іздалеку.
		 * Учень стоїть на планеті, і замість зірки в нього квітка — «тут росте».
		 * Автор побачив розходження одразу: на планеті квітка, а на власній
		 * сторінці того самого учня була зірка.
		 */
		await expect(page.getByTestId('galaxy-card-bloom')).toBeVisible();
		await expect(page.locator('.star'), 'зірка лишилася на сторінці учня').toHaveCount(0);

		/* Позаду не летять ВИПУСКНИКИ: це чужий розділ за спиною учня. */
		await expect(page.getByTestId('galaxy-section')).toHaveCount(0);

		/*
		 * І сторінка живе в темі сайту, а не в палітрі космосу: саме клас на тілі
		 * підміняє токени теми, тож його тут бути не мусить.
		 */
		expect(
			await page.evaluate(() => document.body.classList.contains('page-galaxy')),
			'на сторінці учня стоїть клас галактики — тема сайту на неї не подіє'
		).toBe(false);
	});

	test('хрестик на сторінці учня вертає на планету, а не в галактику', async ({ page }) => {
		await gotoReady(page, `/projects/galaxy-graduates/${УЧНІ[0].slug}/`);

		/*
		 * У галактиці учня немає взагалі, тож кнопка «закрити» вела б у перелік,
		 * де його не знайти. Автор побачив це на сторінці Родоміри Долбишевої.
		 */
		await page.getByTestId('graduate-profile-close-btn').click();
		await expect(page).toHaveURL(/\/projects\/creativity-planet\/?$/);
	});

	test('учня ніде не підписують галактикою', async ({ page }) => {
		/*
		 * Скарги автора йшли одна за одною за єдиним зразком: усюди, де учень
		 * користується механікою випускника, підпис і посилання лишалися
		 * випускницькими. Тут зібрано те, що видно читачеві на його сторінці.
		 */
		await gotoReady(page, `/projects/galaxy-graduates/${УЧНІ[0].slug}/`);

		/* Вкладка браузера — свій розділ, а не чужий. */
		await expect(page).toHaveTitle(/Планета творчості/);

		/* Опис для пошуку не порожній і не сам лише рядок імені: у учня немає ні
		   року випуску, ні майстрів курсу, з яких він складається у випускника. */
		const опис = await page.getAttribute('meta[name="description"]', 'content');
		expect(опис ?? '', 'опис сторінки учня').toContain('навчається');
	});

	/**
	 * ТРИ РОЗКЛАДКИ — і головне про кожну з них.
	 *
	 * Перевірка з'явилася 2026-09-08 за знімком автора: обличчя стояли спіраллю
	 * й накладалися підписами, з одинадцяти імен читалися п'ять. Тому тут не
	 * «перемикач перемикає», а те, заради чого його зробили: НІЧОГО НЕ
	 * ПЕРЕКРИВАЄТЬСЯ, і ім'я кожного учня можна дістати в кожній розкладці.
	 */
	test('у кожній розкладці обличчя не перекриваються, а імена доступні', async ({ page }) => {
		await gotoReady(page, ПЛАНЕТА);

		for (const вигляд of ['orbits', 'grid', 'split'] as const) {
			await page.getByTestId(`creativity-planet-view-btn-${вигляд}`).click();

			/* Усі учні на місці — у будь-якій розкладці. */
			for (const учень of УЧНІ) {
				await expect(
					page.getByTestId(`creativity-planet-${учень.slug}-btn`),
					`${учень.name} зник у розкладці ${вигляд}`
				).toBeVisible();
			}

			/*
			 * Попарне порівняння КІЛ, а не прямокутників.
			 *
			 * Обличчя круглі, і в перших редакціях цієї перевірки стояло
			 * перетинання рамок — воно дало хибну тривогу одразу: два кола по
			 * діагоналі одне від одного не торкаються, а їхні рамки
			 * перетинаються кутами. Тому міряється відстань між центрами, і
			 * порівнюється вона з півсумою діаметрів — тобто рівно з тим, що
			 * видно очима. Допуск 1 px — округлення розкладки.
			 */
			const накладки = await page.evaluate((учні: { slug: string; name: string }[]) => {
				const кола = учні.map((у) => {
					/* Перший span усередині кнопки — саме обличчя, у всіх трьох розкладках. */
					const r = document
						.querySelector(`[data-testid="creativity-planet-${у.slug}-btn"] span`)!
						.getBoundingClientRect();
					return { ім: у.name, x: r.left + r.width / 2, y: r.top + r.height / 2, d: r.width };
				});
				const знайдені: string[] = [];
				for (let i = 0; i < кола.length; i++) {
					for (let j = i + 1; j < кола.length; j++) {
						const a = кола[i];
						const b = кола[j];
						const треба = (a.d + b.d) / 2 - 1;
						const є = Math.hypot(a.x - b.x, a.y - b.y);
						if (є < треба) знайдені.push(`${a.ім} ↔ ${b.ім}: ${Math.round(є)} < ${Math.round(треба)}`);
					}
				}
				return знайдені;
			}, УЧНІ.map((у) => ({ slug: у.slug, name: у.name })));
			expect(накладки, `у розкладці ${вигляд} обличчя налазять одне на одне`).toEqual([]);
		}
	});

	test('вибір розкладки переживає перезавантаження', async ({ page }) => {
		await gotoReady(page, ПЛАНЕТА);
		await page.getByTestId('creativity-planet-view-btn-grid').click();
		await gotoReady(page, ПЛАНЕТА);
		await expect(page.getByTestId('creativity-planet-view-btn-grid')).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

	test('у розкладці «планета й перелік» пошук звужує імена', async ({ page }) => {
		await gotoReady(page, ПЛАНЕТА);
		await page.getByTestId('creativity-planet-view-btn-split').click();

		const перелік = page.getByTestId('creativity-planet-names-list');
		await expect(перелік.locator('li')).toHaveCount(УЧНІ.length);

		/* Перше слово імені: у реєстрі це прізвище, і воно точно одне. */
		await page.getByTestId('creativity-planet-search-input').fill(УЧНІ[0].name.split(' ')[0]);
		await expect(перелік.locator('li')).toHaveCount(1);
		await expect(перелік).toContainText(УЧНІ[0].name);
	});

	test('натискання відкриває картку з власною адресою і без року випуску', async ({
		page
	}, testInfo) => {
		test.skip(
			testInfo.project.name === 'mobile',
			'на вузькому екрані картка не відкривається, а веде на саму сторінку — окрема поведінка'
		);
		await gotoReady(page, ПЛАНЕТА);

		const учень = УЧНІ[0];
		await page.getByTestId(`creativity-planet-${учень.slug}-btn`).click();

		const картка = page.getByTestId('galaxy-card-modal');
		await expect(картка).toBeVisible();
		await expect(картка).toContainText(учень.name);
		await expect(page).toHaveURL(new RegExp(`/${учень.slug}/?$`));

		/* «навчається» замість «випуск ####» — і жодного року поруч з іменем. */
		await expect(картка).not.toContainText(/випуск\s+\d{4}/i);
	});
});
