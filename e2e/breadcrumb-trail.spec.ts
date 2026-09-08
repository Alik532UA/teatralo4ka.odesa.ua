import { expect, test, type Locator, type Page } from '@playwright/test';
import { gotoReady } from './ready';

/**
 * КРИХТА «ЗВІДКИ ПРИЙШОВ» на сторінках галактики.
 *
 * ## Чому це перевіряється в браузері, а не юнітом
 *
 * Правила відсіву вже під юнітом (`services/trail.svelte.test.ts`). Тут — те,
 * чого юніт не бачить у принципі: чи доходить слід від справжнього кліку до
 * розмітки. Сайт весь prerender, тобто в HTML крихти немає й бути не може —
 * вона з'являється лише після гідрації, і поламати цей ланцюг можна, не
 * зачепивши жодного правила.
 *
 * ## Чому переходи саме кліком
 *
 * `page.goto` — це повне завантаження, а слід пишеться в `beforeNavigate`,
 * тобто на клієнтських переходах. Тест, який ходить лише `goto`, показував би
 * зелене на непрацюючій функції.
 */

const ПРОФІЛЬ = '/projects/galaxy-graduates/Alik/';
const ГРУПИ = '/projects/galaxy-graduates/groups/';

/**
 * Крихти зліва направо — ЛОКАТОРОМ, а не готовим переліком рядків.
 *
 * `allInnerTexts()` знімає DOM один раз, і в цьому вже спіймалася гонка:
 * `toHaveURL` після `goBack()` минає, коли адреса змінилася, а вміст під час
 * переходу між сторінками ще старий. Знімок ловив крихти ПОПЕРЕДНЬОЇ сторінки,
 * і тест то падав, то ні. `toHaveText` над списком повторює спробу, доки
 * перелік не збіжиться, тож чекання виражене там, де воно й потрібне.
 */
function крихти(page: Page): Locator {
	/* Заміткою, а не за `aria-label`: назва орієнтира — текст для людини, і
	   вона перекладається; чіплятися за неї означало б ламати перевірку від
	   зміни формулювання. */
	return page.getByTestId('galaxy-crumbs-nav').locator('a');
}

test.describe('крихта «звідки прийшов»', () => {
	test('прямий захід на перелік лишає саму галактику', async ({ page }) => {
		await gotoReady(page, ГРУПИ);

		/*
		 * Доти тут стояло «Всі фестивалі» — випадковий сусід, який нікуди не
		 * веде за змістом. Вхід у решту розділів є з самої галактики.
		 */
		await expect(page.getByTestId('galaxy-groups-from-link')).toHaveCount(0);
		await expect(крихти(page)).toHaveText(['Галактика випускників']);
	});

	test('перехід із профілю додає крихту ПЕРЕД «всі групи», а не замість неї', async ({ page }) => {
		await gotoReady(page, ПРОФІЛЬ);
		await page.locator(`a[href*="${ГРУПИ}"]:not([href$="/groups/"])`).first().click();
		await expect(page).toHaveURL(new RegExp(`${ГРУПИ}[^/]+/?$`));

		const слід = page.getByTestId('group-from-link');
		await expect(слід, 'слід не доїхав від кліку до розмітки').toBeVisible();
		await expect(слід).toHaveAttribute('href', ПРОФІЛЬ);
		await expect(крихти(page)).toHaveText(['Алік Запольнов', 'Всі групи', 'Галактика випускників']);
	});

	test('слід переживає перезавантаження — інакше він блимав би без причини', async ({ page }) => {
		await gotoReady(page, ПРОФІЛЬ);
		await page.locator(`a[href*="${ГРУПИ}"]:not([href$="/groups/"])`).first().click();
		await expect(page.getByTestId('group-from-link')).toBeVisible();

		await page.reload();
		await expect(page.getByTestId('group-from-link')).toBeVisible();
	});

	test('дубля немає: прийшли з переліку — крихта не повторює «всі групи»', async ({ page }) => {
		await gotoReady(page, ГРУПИ);
		await page.locator(`a[href*="${ГРУПИ}"]:not([href$="/groups/"])`).first().click();
		await expect(page).toHaveURL(new RegExp(`${ГРУПИ}[^/]+/?$`));

		await expect(page.getByTestId('group-from-link')).toHaveCount(0);
		await expect(крихти(page)).toHaveText(['Всі групи', 'Галактика випускників']);
	});

	test('після «Назад» крихта не показує сторінці ЇЇ САМУ', async ({ page }) => {
		await gotoReady(page, ГРУПИ);
		await page.locator(`a[href*="${ГРУПИ}"]:not([href$="/groups/"])`).first().click();
		await expect(page).toHaveURL(new RegExp(`${ГРУПИ}[^/]+/?$`));

		await page.goBack();
		await expect(page).toHaveURL(new RegExp(`${ГРУПИ}$`));

		/*
		 * Найтонше місце всієї функції: у пам'яті лишився запис «звідки: перелік
		 * груп», і без прив'язки до цілі крихта запропонувала б повернутися на
		 * сторінку, на якій людина стоїть.
		 *
		 * Чекання виражене саме цим порівнянням, а не окремою міткою сторінки:
		 * адреса після `goBack` міняється раніше за вміст, а перелік груп —
		 * найважча сторінка розділу, і під паралельним прогоном вона відновлюється
		 * довше за типові п'ять секунд. Заміряно: з міткою тест падав приблизно раз
		 * на п'ятнадцять прогонів, і падав на мітці, а не на самій крихті.
		 */
		await expect(крихти(page)).toHaveText(['Галактика випускників'], { timeout: 20_000 });
		await expect(page.getByTestId('galaxy-groups-from-link')).toHaveCount(0);
	});
});
