import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gotoReady } from './ready';

/**
 * Перелік усіх вистав — `/projects/galaxy-graduates/plays/`.
 *
 * ## Що саме тут стережеться
 *
 * Сторінки окремих вистав існували раніше за цей перелік, і дістатися до них
 * можна було лише збоку — з чужої анкети чи з репертуару групи. Сама адреса
 * `/plays/` віддавала 404, хоча під нею лежали 362 сторінки. Тобто розділ був,
 * а входу в нього не було.
 *
 * Тому перевіряється не «сторінка відкривається», а три речі, кожна з яких
 * ламається окремо:
 *
 *   1. У переліку РІВНО стільки карток, скільки вистав у реєстрі. Число
 *      береться з тих самих даних, що й сторінка, а не вписане сюди: інакше
 *      перевірка застаріє на першій же новій виставі й почне брехати.
 *   2. Вхід із галактики існує. Без нього сторінка знову стає недосяжною —
 *      пререндер її будує, бо на неї є посилання, і зникнення посилання
 *      прибрало б заразом і сторінку зі збірки.
 *   3. Дорога назад зі сторінки вистави веде В ПЕРЕЛІК, а не через голову в
 *      галактику.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Прибрати кнопку «Вистави» на сторінці галактики — впаде друга перевірка, і
 * заразом (на наступній збірці) зникне сама сторінка. Показати в переліку лише
 * вистави з відомим складом — впаде перша й назве обидва числа.
 */

const ПЕРЕЛІК = '/projects/galaxy-graduates/plays';

/*
 * Дані читаються з ФАЙЛУ, а не імпортуються: Playwright виконує специфікації як
 * ESM, і статичний імпорт JSON вимагав би `with { type: 'json' }` — синтаксису,
 * якого решта проєкту не вживає. Читання дає той самий реєстр і не заводить
 * винятку в правилах збірки.
 */
const ВИСТАВИ = JSON.parse(
	readFileSync('src/lib/data/plays.data.json', 'utf8')
) as ReadonlyArray<{ id: string; year: number }>;
const УСЬОГО = ВИСТАВИ.length;

test.describe('перелік вистав', () => {
	test('показує всі вистави реєстру, згруповані за роками', async ({ page }) => {
		await gotoReady(page, ПЕРЕЛІК);

		await expect(page.getByTestId('galaxy-plays-title')).toBeVisible();

		const карток = await page.locator('[data-testid^="galaxy-plays-card-"]').count();
		expect(
			карток,
			`у переліку ${карток} карток, а в реєстрі ${УСЬОГО} вистав — частина сторінок ` +
				'лишилася недосяжною з переліку'
		).toBe(УСЬОГО);

		const років = new Set(ВИСТАВИ.map((play) => play.year)).size;
		expect(
			await page.locator('[data-testid^="galaxy-plays-year-section-"]').count(),
			'заголовків років менше, ніж років у реєстрі'
		).toBe(років);

		await expect(page.getByTestId('galaxy-plays-total-count')).toHaveText(String(УСЬОГО));
	});

	test('пошук звужує перелік і чесно каже, коли нічого немає', async ({ page }) => {
		await gotoReady(page, ПЕРЕЛІК);
		const пошук = page.getByTestId('galaxy-plays-search-input');

		await пошук.fill('Цибуліно');
		const знайдено = await page.locator('[data-testid^="galaxy-plays-card-"]').count();
		expect(знайдено, 'пошук за відомою назвою не знайшов нічого').toBeGreaterThan(0);
		expect(знайдено, 'пошук нічого не звузив — фільтр не працює').toBeLessThan(УСЬОГО);
		await expect(page.getByTestId('galaxy-plays-found-count')).toHaveText(String(знайдено));

		await пошук.fill('такогонемаєточно');
		await expect(
			page.getByTestId('galaxy-plays-empty-text'),
			'порожній результат мовчить — читач не розуміє, це помилка чи справді нічого немає'
		).toBeVisible();
	});

	test('у перелік можна потрапити з галактики', async ({ page }) => {
		await gotoReady(page, '/projects/galaxy-graduates');
		const вхід = page.getByTestId('galaxy-plays-link');
		await expect(вхід, 'на сторінці галактики немає входу в перелік вистав').toBeVisible();

		await вхід.click();
		await expect(page).toHaveURL(/\/projects\/galaxy-graduates\/plays\/?$/);
		await expect(page.getByTestId('galaxy-plays-title')).toBeVisible();
	});

	test('картка веде на виставу, а звідти є дорога назад у перелік', async ({ page }) => {
		await gotoReady(page, ПЕРЕЛІК);

		await page.locator('[data-testid^="galaxy-plays-card-"]').first().click();
		await expect(page).toHaveURL(/\/projects\/galaxy-graduates\/plays\/[^/]+\/?$/);
		await expect(page.getByTestId('play-title')).toBeVisible();

		await page.getByTestId('play-back-link').click();
		await expect(
			page,
			'кнопка назад зі сторінки вистави веде не в перелік вистав'
		).toHaveURL(/\/projects\/galaxy-graduates\/plays\/?$/);
	});
});
