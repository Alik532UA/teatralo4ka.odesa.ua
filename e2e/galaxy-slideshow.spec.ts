import { expect, test } from '@playwright/test';
import { gotoReady, openStageMenu } from './ready';

/**
 * Слайдшоу зі сторінок випускників на сцені галактики.
 *
 * ## Чому це перевіряється прогоном, а не гейтом
 *
 * Тут майже все — ЧАС. Слайд міняється через N секунд, зміна триває M
 * мілісекунд, рядок налаштувань гасне після паузи без руху курсора. Жоден
 * розбір джерел цього не бачить: у ньому є числа, але немає того, чи таймер
 * справді спрацював і чи прибрався за собою.
 *
 * І ще одна причина, дорожча. Перший замір я зробив у прихованій панелі
 * браузера й побачив, що слайд не міняється дванадцять секунд. Насправді
 * ПРИХОВАНА панель ріже таймери: та сама петля з десяти кроків по секунді там
 * не встигла за сорок п'ять. Тобто замір показав дефект, якого не було, і
 * єдиний спосіб мати з цим справу — міряти таймери в справжньому прогоні.
 *
 * ## Що саме стережеться
 *
 * 1. Кнопка стоїть ЛІВОРУЧ від повного екрана — так просив автор, і це єдина
 *    вимога до розкладки, яку він назвав числом (сусідство).
 * 2. Показ відкриває сторінку випускника, а не просто картку: адреса мусить
 *    стати його адресою, інакше слайдшоу не поділишся посиланням.
 * 3. Слайд СПРАВДІ міняється — на мінімальній витримці, щоб прогін не стояв.
 * 4. Історія не забивається: двадцять слайдів не мусять дати двадцять записів,
 *    інакше «назад» перестає працювати як вихід.
 * 5. Рядок налаштувань гасне до одного відсотка без руху курсора й повертається
 *    від руху.
 */
const ГАЛАКТИКА = '/projects/galaxy-graduates';

test.describe('слайдшоу випускників', () => {
	test('кнопка показу стоїть ліворуч від повного екрана', async ({ page }) => {
		await gotoReady(page, ГАЛАКТИКА);
		await openStageMenu(page);

		const показ = page.getByTestId('galaxy-slideshow-btn');
		const екран = page.getByTestId('galaxy-fullscreen-btn');
		await expect(показ).toBeVisible();

		const a = await показ.boundingBox();
		const b = await екран.boundingBox();
		expect(a && b, 'кнопки мусять бути на екрані').toBeTruthy();
		expect(
			a!.x + a!.width <= b!.x + 1,
			`показ на ${Math.round(a!.x)}, повний екран на ${Math.round(b!.x)} — показ мусить бути лівіше`
		).toBe(true);
	});

	test('показ відкриває сторінку випускника й рядок налаштувань', async ({ page }) => {
		await gotoReady(page, ГАЛАКТИКА);
		await openStageMenu(page);
		await page.getByTestId('galaxy-slideshow-btn').click();

		await expect(page.getByTestId('galaxy-card-modal')).toBeVisible();
		await expect(page, 'адреса мусить стати адресою випускника').toHaveURL(
			/\/projects\/galaxy-graduates\/[^/]+\/?$/
		);

		const панель = page.getByTestId('galaxy-slideshow-settings-panel');
		await expect(панель).toBeVisible();

		/* Типові значення з прохання: сім секунд на анкету, плавна зміна. */
		await expect(page.getByTestId('galaxy-slideshow-seconds-text')).toContainText('7');
		await expect(page.getByTestId('galaxy-slideshow-fade-text')).toContainText('1.2');

		/* Три способи вибрати, кого показувати. */
		await expect(page.locator('[data-testid="galaxy-slideshow-filter-select"] option')).toHaveCount(
			3
		);
	});

	test('слайд міняється сам, а історія не забивається', async ({ page }) => {
		await gotoReady(page, ГАЛАКТИКА);
		await openStageMenu(page);
		await page.getByTestId('galaxy-slideshow-btn').click();
		await expect(page.getByTestId('galaxy-card-modal')).toBeVisible();

		/*
		 * Витримка й зміна — на мінімум: сім секунд на слайд перетворили б цю
		 * перевірку на найдовшу в прогоні. Міряється те, що слайд МІНЯЄТЬСЯ сам,
		 * а не конкретне число секунд — числа стережуть межі в самому сервісі.
		 */
		await page.getByTestId('galaxy-slideshow-seconds-input').fill('2');
		await page.getByTestId('galaxy-slideshow-fade-input').fill('200');

		const перший = page.url();
		await expect(async () => {
			expect(page.url(), 'адреса не змінилася — слайд не перемкнувся').not.toBe(перший);
		}).toPass({ timeout: 12_000 });

		/*
		 * Історія: перший слайд кладе запис, решта його заміняє. Тож один
		 * `goBack()` мусить вивести з показу назад у галактику, а не на
		 * попереднього випускника.
		 */
		await page.goBack();
		await expect(page.getByTestId('galaxy-card-modal')).toBeHidden();
		await expect(page.getByTestId('galaxy-slideshow-settings-panel')).toBeHidden();
	});

	test('рядок налаштувань гасне без руху курсора й повертається від руху', async ({ page }) => {
		await gotoReady(page, ГАЛАКТИКА);
		await openStageMenu(page);
		await page.getByTestId('galaxy-slideshow-btn').click();

		const панель = page.getByTestId('galaxy-slideshow-settings-panel');
		await expect(панель).toBeVisible();

		/*
		 * Курсор відводиться В КУТ і більше не рухається. Без цього перевірка
		 * міряла б не таймер, а те, що курсор стоїть над самою панеллю — а
		 * наведення тримає її видимою навмисно.
		 */
		await page.mouse.move(2, 400);
		await expect(async () => {
			expect(Number(await панель.evaluate((el) => getComputedStyle(el).opacity))).toBeLessThan(0.1);
		}).toPass({ timeout: 8000 });

		await page.mouse.move(400, 400);
		await expect(async () => {
			expect(Number(await панель.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(
				0.9
			);
		}).toPass({ timeout: 5000 });
	});

	test('кнопка «спинити» закриває показ', async ({ page }) => {
		await gotoReady(page, ГАЛАКТИКА);
		await openStageMenu(page);
		await page.getByTestId('galaxy-slideshow-btn').click();
		await expect(page.getByTestId('galaxy-slideshow-settings-panel')).toBeVisible();

		await page.getByTestId('galaxy-slideshow-stop-btn').click();
		await expect(page.getByTestId('galaxy-slideshow-settings-panel')).toBeHidden();
	});
});
