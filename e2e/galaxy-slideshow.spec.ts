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
 * 1. Кнопка показу стоїть ПЕРЕД повним екраном — ліворуч у рядку на широкому
 *    екрані, вище в стовпчику меню на телефоні. Це єдина вимога до розкладки,
 *    яку автор назвав прямо (сусідство).
 * 2. Показ відкриває сторінку випускника, а не просто картку: адреса мусить
 *    стати його адресою, інакше слайдшоу не поділишся посиланням. Разом із нею
 *    відкривається повний екран.
 * 3. Слайд міняється ДВІЧІ ПІДРЯД — на мінімальній витримці, щоб прогін не
 *    стояв. Саме двічі: розбір нижче, у самій перевірці.
 * 4. Історія не забивається: двадцять слайдів не мусять дати двадцять записів,
 *    інакше «назад» перестає працювати як вихід.
 * 5. Рядок налаштувань гасне до одного відсотка без руху курсора й повертається
 *    від руху.
 * 6. Речі, які автор попросив ПІСЛЯ першого показу й кожна з яких ламається
 *    окремо: елементи керування стоять в ОДНОМУ рядку; у картці немає ні
 *    олівця, ні хрестика (закривають показом, а не карткою); повний екран
 *    ВИДНО, а не лише «доступно» — він живе в рядку налаштувань і гасне разом
 *    із ним.
 * 7. «Спинити показ» вертає туди, звідки пішли: без картки, без панелі, на
 *    адресу галактики.
 */
const ГАЛАКТИКА = '/projects/galaxy-graduates';

/** Чи екран повний — справжній або підроблений атрибутом (iOS і відмови). */
const повнийЕкран = (page: import('@playwright/test').Page) =>
	page.evaluate(
		() =>
			document.fullscreenElement !== null ||
			document.documentElement.hasAttribute('data-fake-fullscreen')
	);

test.describe('слайдшоу випускників', () => {
	test('кнопка показу стоїть перед повним екраном', async ({ page }) => {
		await gotoReady(page, ГАЛАКТИКА);
		await openStageMenu(page);

		const показ = page.getByTestId('galaxy-slideshow-btn');
		const екран = page.getByTestId('galaxy-fullscreen-btn');
		await expect(показ).toBeVisible();

		const a = await показ.boundingBox();
		const b = await екран.boundingBox();
		expect(a && b, 'кнопки мусять бути на екрані').toBeTruthy();

		/*
		 * «Ліворуч» — це прохання автора про ШИРОКИЙ екран, де кнопки стоять
		 * рядком у кутку. На телефоні той самий рядок згорнутий у меню, і обидві
		 * кнопки там — плашки на всю ширину: заміряно, обидві починаються на 177,
		 * тобто «лівіше» не має сенсу взагалі, а порядок має.
		 *
		 * Тому міряється СУСІДСТВО В ПОРЯДКУ: у рядку показ лівіше, у стовпчику —
		 * вище. Перша редакція перевіряла лише перше й на телефоні падала,
		 * стережучи розкладку, якої там немає.
		 */
		const рядком = Math.abs(a!.y - b!.y) < 4;
		if (рядком) {
			expect(
				a!.x + a!.width <= b!.x + 1,
				`показ на ${Math.round(a!.x)}, повний екран на ${Math.round(b!.x)} — у рядку показ мусить бути лівіше`
			).toBe(true);
		} else {
			expect(
				a!.y + a!.height <= b!.y + 1,
				`показ на ${Math.round(a!.y)}, повний екран на ${Math.round(b!.y)} — у стовпчику показ мусить бути вище`
			).toBe(true);
		}
	});

	test('показ відкриває сторінку випускника, рядок налаштувань і повний екран', async ({
		page
	}) => {
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

		/*
		 * «Режим galaxy-slideshow відкривати в режимі повноекраного вікна» —
		 * окреме прохання автора. Обидва шляхи сервісу вважаються: справжній
		 * повний екран браузер може й не дати, і тоді лишається підробка
		 * атрибутом. Через `toPass`, бо справжній стан приходить подією
		 * `fullscreenchange`, а не одразу.
		 */
		await expect(async () => {
			expect(await повнийЕкран(page), 'показ мусить відкритися на весь екран').toBe(true);
		}).toPass({ timeout: 5000 });
	});

	test('слайд міняється двічі підряд, а історія не забивається', async ({ page }) => {
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

		/*
		 * ДВІ зміни підряд, а не одна, — і це не запас про всяк випадок.
		 *
		 * Перша редакція цієї перевірки чекала однієї зміни адреси й була зелена
		 * на дефекті, який автор побачив одразу: «тільки один раз перемикається а
		 * далі не переключається». Показ справді мінявся РІВНО РАЗ — ефект зі
		 * таймером не читав номера кроку, тож після першого спрацювання новий
		 * таймер ніхто не заводив. Одна зміна цього не відрізняє від справжнього
		 * показу; дві — відрізняють.
		 */
		const адреси = [page.url()];
		await expect(async () => {
			const тепер = page.url();
			if (тепер !== адреси[адреси.length - 1]) адреси.push(тепер);
			expect(
				адреси.length,
				`адреса змінилася ${адреси.length - 1} раз(и) — показ мусить іти далі, а не спинятися на першому слайді`
			).toBeGreaterThanOrEqual(3);
		}).toPass({ timeout: 25_000 });

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

	test('елементи керування стоять в одному рядку', async ({ page }, testInfo) => {
		/* Нижче 640 px рядок НАВМИСНО стає стовпчиком: повзунки в нього не влазять,
		   і це записано в стилях самого рядка. Стерегти тут одну лінію означало б
		   вимагати розкладки, від якої відмовилися свідомо. */
		test.skip(testInfo.project.name === 'mobile', 'на телефоні рядок навмисно стає стовпчиком');
		await gotoReady(page, ГАЛАКТИКА);
		await openStageMenu(page);
		await page.getByTestId('galaxy-slideshow-btn').click();

		const панель = page.getByTestId('galaxy-slideshow-settings-panel');
		await expect(панель).toBeVisible();

		/*
		 * «Один рядок» міряється СЕРЕДИНАМИ полів, а не їхніми верхніми краями.
		 *
		 * Перша редакція брала верхні краї й падала на 14, 14, 11, 10 — а це
		 * якраз ПРАВИЛЬНА розкладка: `align-items: center` вирівнює по центру, і
		 * поля різної висоти закономірно починаються на різних рівнях. Тобто
		 * перевірка ловила не перенос, а власну мірку.
		 *
		 * Середини одного рядка збігаються з точністю до пікселів; поле,
		 * перенесене вниз, відстає на всю висоту рядка — тут це десятки.
		 */
		const середини = await панель.evaluate((el) =>
			[...el.querySelectorAll('label, button')].map((e) => {
				const b = e.getBoundingClientRect();
				return Math.round(b.top + b.height / 2);
			})
		);
		const розкид = Math.max(...середини) - Math.min(...середини);
		expect(
			розкид,
			`середини полів розкидані на ${розкид} px (${середини.join(', ')}) — щось перенеслося на другий рядок`
		).toBeLessThan(10);
	});

	test('у показі картка без олівця й хрестика, а повний екран видно в рядку', async ({ page }) => {
		await gotoReady(page, ГАЛАКТИКА);
		await openStageMenu(page);
		await page.getByTestId('galaxy-slideshow-btn').click();
		await expect(page.getByTestId('galaxy-card-modal')).toBeVisible();

		await expect(
			page.getByTestId('galaxy-card-close-btn'),
			'хрестик у показі зайвий: закривають кнопкою «Спинити показ»'
		).toBeHidden();
		await expect(
			page.getByTestId('graduate-profile-edit-btn'),
			'олівець у показі зайвий: тут перегляд, а не редагування'
		).toBeHidden();

		/*
		 * Кнопка повного екрана під час показу живе В РЯДКУ НАЛАШТУВАНЬ, а не в
		 * кутку сцени, і саме тому «видна», а не лише «доступна».
		 *
		 * Автор двічі писав про цю кнопку. Спершу — що її взагалі не натиснути
		 * (картка накривала). Тоді підложці зняли перехоплення натискань, і
		 * кнопка стала доступною, але лишилася ПІД розмиттям: «доступна, але
		 * прихована за блюром; очікуваний результат: доступна, і видна, але як і
		 * меню тільки коли є рух миші».
		 *
		 * Підняти її на місці не вийшло б жодним числом: кутовий рядок керування
		 * має власний `z-index`, тобто окремий контекст накладання, і назовні йде
		 * одним шаром нижче за підложку. Тому перевіряється саме те, що просив
		 * автор: кнопка ВСЕРЕДИНІ панелі (тобто гасне й з'являється разом із нею)
		 * і натискається.
		 */
		const кнопка = page.getByTestId('galaxy-fullscreen-btn');
		await expect(кнопка).toHaveCount(1);
		await expect(кнопка).toBeVisible();
		expect(
			await кнопка.evaluate((el) => !!el.closest('[data-testid="galaxy-slideshow-settings-panel"]')),
			'у показі кнопка повного екрана мусить бути в рядку налаштувань — інакше вона знову під розмиттям'
		).toBe(true);
		await кнопка.click({ timeout: 4000 });

		/* Кутових кнопок під час показу немає: пауза й повний екран — у рядку. */
		expect(
			await page.evaluate(() =>
				document.querySelectorAll('.stage__fullscreen-btn, [data-testid="galaxy-slideshow-btn"]')
					.length
			),
			'кутові кнопки лишилися під карткою — їх у показі не має бути'
		).toBe(0);
	});

	test('«спинити показ» закриває анкету й вертає в галактику', async ({ page }) => {
		await gotoReady(page, ГАЛАКТИКА);
		await openStageMenu(page);
		await page.getByTestId('galaxy-slideshow-btn').click();
		await expect(page.getByTestId('galaxy-slideshow-settings-panel')).toBeVisible();
		await expect(page.getByTestId('galaxy-card-modal')).toBeVisible();

		await page.getByTestId('galaxy-slideshow-stop-btn').click();

		/*
		 * Три речі, і кожна — окрема скарга автора: «після натискання залишається
		 * анкета останнього кого показували відкритою; очікуваний результат:
		 * анкета закривається і сторінка /projects/galaxy-graduates/». Доти
		 * кнопка гасила лише сам показ.
		 */
		await expect(page.getByTestId('galaxy-slideshow-settings-panel')).toBeHidden();
		await expect(page.getByTestId('galaxy-card-modal')).toBeHidden();
		await expect(page).toHaveURL(/\/projects\/galaxy-graduates\/?$/);

		/* І повний екран, який відкрив показ, теж закривається разом із ним. */
		await expect(async () => {
			expect(await повнийЕкран(page), 'повний екран мусить вимкнутися разом із показом').toBe(false);
		}).toPass({ timeout: 5000 });
	});
});
