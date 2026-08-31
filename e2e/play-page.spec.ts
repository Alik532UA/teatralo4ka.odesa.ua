import { expect, test } from '@playwright/test';
import { gotoReady } from './ready';

/**
 * Сторінка вистави: склад береться З АНКЕТ, а не добудовується з групи.
 *
 * ## Що саме тут стережеться
 *
 * Спокуса вивести склад із групи — «усі учасники × усі вистави групи» — це
 * один рядок коду, і саме тому вона небезпечна. Два заміри показують, чому так
 * робити не можна, і обидва перевіряються нижче на живих даних:
 *
 *   1. Алік Запольнов числиться в ЗТК, а «Дядечко Кролик проти дядечка Ягуара»
 *      числиться за ЗТК — але він у ній не грав, бо прийшов у групу пізніше.
 *      Добуток приписав би йому виставу, якої не було.
 *   2. «Уявно хворий» зіграли люди з ТРЬОХ груп, і склад там більший за будь-яку
 *      з них. Межа групи не збігається зі складом ні в один бік.
 *
 * Пояснення з числами — у докблоці `src/lib/data/plays.ts` і в розділі «Хто
 * грав у виставі» в `PROJECT-CONTEXT.md`.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Дописати в склад учасників групи — впаде перевірка про Аліка й назве його
 * поіменно. Прибрати посилання з рядка вистави в анкеті — впаде перша.
 */

const ALIK = '/projects/galaxy-graduates/Alik';
const МНИМИЙ = '/projects/galaxy-graduates/plays/mnymyi-bolnoi-2011';
const КРОЛИК = '/projects/galaxy-graduates/plays/diadiushka-krolyk-protyv-diadiushky-iahuara-2007';
/** Вистава 2026 року: анкет із нею ще немає й довго не буде. */
const БЕЗ_СКЛАДУ = '/projects/galaxy-graduates/plays/vid-bazhana-do-zhadana-2026';

test.describe('сторінка вистави', () => {
	test('рядок вистави в анкеті веде на її сторінку', async ({ page }) => {
		await gotoReady(page, ALIK);
		await page.locator('.profile-layout[data-measured="yes"]').waitFor();

		const links = page.locator('[data-testid^="galaxy-card-play-link-"]');
		const rows = page.locator('.plays li');
		expect(
			await links.count(),
			'жоден рядок вистави не став посиланням — сторінки вистав недосяжні з анкети'
		).toBeGreaterThan(0);
		// У Аліка ключ є в кожного рядка, тож посилань має бути стільки ж.
		expect(await links.count()).toBe(await rows.count());

		await links.first().click();
		await expect(page).toHaveURL(/\/projects\/galaxy-graduates\/plays\/[^/]+\/?$/);
		await expect(page.getByTestId('play-title')).toBeVisible();
	});

	test('склад — з анкет, а не з групи', async ({ page }) => {
		await gotoReady(page, КРОЛИК);

		const cast = await page.evaluate(() =>
			[...document.querySelectorAll('[data-testid^="play-cast-"]')]
				.map((el) => el.getAttribute('data-testid') ?? '')
				.filter((id) => id !== 'play-cast-list' && !id.endsWith('-text'))
		);

		expect(cast.length, 'склад порожній — перевірка нічого не стверджує').toBeGreaterThan(0);
		expect(
			cast,
			'Алік Запольнов у складі «Дядечка Кролика», хоч він прийшов у групу ПІЗНІШЕ ' +
				'за цю виставу. Схоже, склад добудували з учасників групи — так не можна, ' +
				'пояснення в докблоці src/lib/data/plays.ts'
		).not.toContain('play-cast-alik-zapolnov');
	});

	test('склад буває ширший за одну групу', async ({ page }) => {
		await gotoReady(page, МНИМИЙ);

		const cast = await page.locator('[data-testid^="play-cast-"]').count();
		const where = await page.locator('[data-testid^="play-group-link-"]').count();

		// Вісім людей із трьох груп: якби межею був склад однієї, було б шестеро.
		expect(cast, 'склад «Уявно хворого» став меншим — хтось випав з анкет').toBeGreaterThan(6);
		expect(
			where,
			'вистава числиться менш ніж за двома групами — зникла саме та особливість, ' +
				'заради якої ця перевірка існує'
		).toBeGreaterThanOrEqual(2);

		await expect(page.getByTestId('play-cast-alik-zapolnov')).toBeVisible();
		await expect(page.getByTestId('play-cast-maryna-vishtaliuk-sukhanova')).toBeVisible();
	});

	test('вистава без анкет каже про це прямо, а не мовчить', async ({ page }) => {
		await gotoReady(page, БЕЗ_СКЛАДУ);

		await expect(page.getByTestId('play-title')).toBeVisible();
		await expect(
			page.getByTestId('play-cast-empty-text'),
			'сторінка без складу мовчить — читач не розуміє, це помилка чи справді нікого немає'
		).toBeVisible();
	});
});
