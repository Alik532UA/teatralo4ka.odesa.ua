import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gotoReady, openStageMenu } from './ready';

/**
 * Театри — `/projects/galaxy-graduates/theatres/`.
 *
 * ## Що саме тут стережеться
 *
 * Розділ з'явився на прохання автора, і воно було не про перелік, а про ОДНЕ
 * посилання: «у неї є "Одеський обласний академічний драматичний театр"
 * замість посилання на сайт театру робимо на внутрішню сторінку а там вже буде
 * посилання на театр».
 *
 * Тому головна перевірка тут третя: абзац «про себе» в анкеті Марини Суханової
 * мусить вести НА САЙТ, а на сторінку театру, і сайт мусить знайтися вже там.
 * Зламатися це може тихо й у двох напрямках — хтось перепише абзац, або зі
 * сторінки театру зникне зовнішнє посилання, — і тоді читач або йде геть із
 * сайту, або не має куди піти взагалі.
 *
 * Решта — те саме, що в закладів освіти: перелік показує всі театри реєстру,
 * вхід із галактики існує (без нього `prerender` сторінку не знайде, бо в
 * `svelte.config.js` її немає), а картка людини відкривається НА МІСЦІ.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Прибрати посилання «Театри» з панелі сцени — впаде друга перевірка. Лишити в
 * анкеті зовнішню адресу театру замість внутрішньої — впаде третя. Прибрати
 * `website` з реєстру — впаде четверта. Показати в переліку лише театри з
 * сайтом — упаде перша й назве обидва числа.
 */

/*
 * Дані читаються з ФАЙЛУ, а не імпортуються, — так само, як у переліках вистав
 * і закладів: `data/theatres.ts` імпортує `$app/types`, недосяжний із
 * Playwright.
 */
const ТЕАТРИ = JSON.parse(readFileSync('src/lib/data/theatres.data.json', 'utf8')) as ReadonlyArray<{
	slug: string;
	name: string;
	website?: string;
	members: ReadonlyArray<{ id: string }>;
}>;

const ПЕРЕЛІК = '/projects/galaxy-graduates/theatres';

/* Посилання на театр у будь-якому режимі — розбір той самий, що в закладах. */
const ПОСИЛАННЯ =
	'[data-testid^="galaxy-theatres-row-link-"], [data-testid^="galaxy-theatres-card-"]';
const НАЙБІЛЬШИЙ = [...ТЕАТРИ].sort((a, b) => b.members.length - a.members.length)[0];
const З_САЙТОМ = ТЕАТРИ.find((t) => t.website)!;

test.describe('театри', () => {
	test('перелік показує всі театри реєстру', async ({ page }) => {
		await gotoReady(page, ПЕРЕЛІК);

		await expect(page.getByTestId('galaxy-theatres-title')).toBeVisible();

		const карток = await page.locator(ПОСИЛАННЯ).count();
		expect(
			карток,
			`у переліку ${карток} театрів, а в реєстрі ${ТЕАТРИ.length} — ` +
				'частина сторінок недосяжна з переліку'
		).toBe(ТЕАТРИ.length);

		await expect(page.getByTestId('galaxy-theatres-total-count')).toHaveText(
			String(ТЕАТРИ.length)
		);
	});

	test('вхід у розділ є на сцені галактики', async ({ page }) => {
		await gotoReady(page, '/projects/galaxy-graduates');
		await openStageMenu(page);

		const посилання = page.getByTestId('galaxy-theatres-link');
		await expect(
			посилання,
			'на сцені немає входу в театри — розділ недосяжний, а збірка його не знайде'
		).toBeVisible();

		await посилання.click();
		await expect(page.getByTestId('galaxy-theatres-title')).toBeVisible();
	});

	/*
	 * Саме те, чого просив автор. Перевіряється ПАРА: посилання в анкеті веде
	 * всередину сайту, а зовнішня адреса театру стоїть уже на його сторінці.
	 */
	test('анкета веде на сторінку театру, а сайт театру — з неї', async ({ page }) => {
		await gotoReady(page, '/projects/galaxy-graduates/maryna-sukhanova');

		const посилання = page
			.locator('a[href*="/projects/galaxy-graduates/theatres/"]')
			.filter({ hasText: 'Одеський обласний академічний драматичний театр' })
			.first();
		await expect(
			посилання,
			'в анкеті немає посилання на сторінку театру — воно знову веде геть із сайту'
		).toBeVisible();

		const href = await посилання.getAttribute('href');
		expect(href, 'посилання з анкети веде не на театр').toContain('/theatres/');

		await посилання.click();
		await expect(page.getByTestId('theatre-title')).toBeVisible();

		const сайт = page.getByTestId('theatre-website-link');
		await expect(сайт, 'на сторінці театру немає посилання на його сайт').toBeVisible();
		await expect(сайт).toHaveAttribute('target', '_blank');
	});

	test('сторінка театру показує людей, і картка відкривається на місці', async ({ page }) => {
		await gotoReady(page, `${ПЕРЕЛІК}/${НАЙБІЛЬШИЙ.slug}`);

		await expect(page.getByTestId('theatre-title')).toHaveText(НАЙБІЛЬШИЙ.name);
		expect(
			await page.locator('[data-testid^="theatre-member-card-"]').count(),
			`людей на сторінці менше, ніж у реєстрі театру (${НАЙБІЛЬШИЙ.members.length})`
		).toBe(НАЙБІЛЬШИЙ.members.length);

		await page.locator('[data-testid^="theatre-member-card-"]').first().click();
		await expect(
			page.getByTestId('galaxy-card-modal'),
			'картка не відкрилася — натискання нікуди не веде'
		).toBeVisible();
		/*
		 * «На місці» — це про СТОРІНКУ, а не про адресу: адреса змінюється
		 * навмисно (`pushState` на особисту сторінку людини), а сторінка театру
		 * мусить лишитися на екрані. Розбір — у `e2e/institutions.spec.ts`.
		 */
		await expect(
			page.getByTestId('theatre-title'),
			'сторінка театру зникла — натискання виявилося справжнім переходом'
		).toHaveText(НАЙБІЛЬШИЙ.name);
	});

	test('сайт театру відкривається в новій вкладці й веде назовні', async ({ page }) => {
		await gotoReady(page, `${ПЕРЕЛІК}/${З_САЙТОМ.slug}`);
		const сайт = page.getByTestId('theatre-website-link');
		await expect(сайт).toHaveAttribute('href', З_САЙТОМ.website!);
		await expect(сайт).toHaveAttribute('rel', /noopener/);
	});
});
