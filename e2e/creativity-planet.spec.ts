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
