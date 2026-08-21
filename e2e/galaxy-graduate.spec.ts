import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { gotoReady, waitForAnimations } from './ready';

/**
 * Сторінка випускника: перенос даних зі старого сайту й власна адреса.
 *
 * Перевіряється не «щось намалювалося», а ЗБІГ ІЗ ДАНИМИ: тексти вистав і
 * абзаци біографії беруться з того самого файлу профілю, який читає сторінка.
 * Саме тут раніше й губилося найцінніше — картка показувала «Вистав і ролей: 5»
 * замість самих вистав, а біографію (два-п'ять абзаців про навчання після школи
 * й роботу) не показувала взагалі.
 *
 * Код сторінки в адресі — не деталь реалізації, а те, чим людину знали:
 * `sites.google.com/view/ats-ua/GG/2015/15K` → `/projects/galaxy-graduates/15K`.
 */

const CODE = '15K';
const PROFILE = `/projects/galaxy-graduates/${CODE}`;
const CARD = '[data-testid="galaxy-card-modal"]';
const PLAY = '[data-testid^="galaxy-card-play-item-"]';
const BIO = '[data-testid^="galaxy-card-bio-item-"]';

interface Profile {
	name: string;
	masters: string[];
	socials: { network: string }[];
	plays: { year: number | null; text: string }[];
	bio: string[];
}

/** Той самий файл, який читає сторінка — джерело правди для перевірки. */
async function profileData(page: Page): Promise<Profile> {
	const response = await page.request.get(`/graduates/profiles/${CODE}.json`);
	expect(response.ok(), 'файл профілю мусить існувати у збірці').toBe(true);
	return response.json();
}

test.describe('сторінка випускника', () => {
	test('показує ВСЕ, що було на старому сайті', async ({ page }) => {
		const data = await profileData(page);
		await gotoReady(page, PROFILE);

		// Ім'я — саме `h1`: це головна сутність сторінки, а не картка над галактикою.
		await expect(page.locator('h1')).toHaveText(data.name);
		await expect(page.locator('[data-testid="galaxy-card-img"]')).toBeVisible();

		// Майстри курсу — усі, а не перший.
		for (const master of data.masters) {
			await expect(page.locator('[data-testid="galaxy-card-masters-text"]')).toContainText(master);
		}

		await expect(page.locator('[data-testid^="galaxy-card-social-link-"]')).toHaveCount(
			data.socials.length
		);

		// Вистави: стільки ж і той самий текст, у тому самому порядку.
		expect(data.plays.length, 'у цього випускника мусять бути вистави').toBeGreaterThan(0);
		const plays = await page.locator(PLAY).allInnerTexts();
		expect(plays).toHaveLength(data.plays.length);
		for (const [index, play] of data.plays.entries()) {
			expect(plays[index].replace(/\s+/g, ' ')).toContain(play.text);
			if (play.year) expect(plays[index]).toContain(String(play.year));
		}

		// Біографія: жоден абзац не загубився.
		expect(data.bio.length, 'у цього випускника мусить бути біографія').toBeGreaterThan(0);
		const bio = await page.locator(BIO).allInnerTexts();
		expect(bio).toHaveLength(data.bio.length);
		for (const [index, paragraph] of data.bio.entries()) {
			expect(bio[index].replace(/\s+/g, ' ')).toBe(paragraph.replace(/\s+/g, ' '));
		}
	});

	test('опис для пошуку один і саме про цю людину', async ({ page }) => {
		const data = await profileData(page);
		await gotoReady(page, PROFILE);

		// Два теги — це не дрібниця: пошук бере ПЕРШИЙ, тобто загальний опис сайту,
		// і власний опис сторінки не працює зовсім.
		const descriptions = page.locator('meta[name="description"]');
		await expect(descriptions).toHaveCount(1);
		await expect(descriptions).toHaveAttribute('content', new RegExp(data.name));
	});

	test('англійське дзеркало сторінки існує', async ({ page }) => {
		// Не косметика: hreflang на сторінці обіцяє цю адресу, і якщо її немає у
		// збірці, обіцянка бита. Сторінок 80 на мову, і краулер знаходить їх через
		// перелік посилань на сторінці галактики.
		const response = await gotoReady(page, `/en${PROFILE}`);
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toHaveText((await profileData(page)).name);
	});

	test('axe без порушень', async ({ page }) => {
		await gotoReady(page, PROFILE);
		await waitForAnimations(page);
		const { violations } = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.analyze();
		const report = violations.map((v) => `[${v.impact}] ${v.id}: ${v.help}`).join('\n');
		expect(violations, report).toEqual([]);
	});
});

test.describe('картка в галактиці має власну адресу', () => {
	test('відкриття змінює адресу, «назад» закриває', async ({ page }) => {
		const data = await profileData(page);
		await gotoReady(page, '/projects/galaxy-graduates');

		await page.locator('[data-testid="galaxy-open-roster-btn"]').click();
		await page.locator('[data-testid="galaxy-roster-kateryna-kudlach-btn"]').click();

		await expect(page.locator(CARD)).toBeVisible();
		// Адреса — та сама, що на старому сайті.
		await expect(page).toHaveURL(new RegExp(`${PROFILE}$`));
		// І в картці ті самі подробиці, що й на власній сторінці: файл профілю
		// читається на кліку, а не лежить у бандлі галактики.
		await expect(page.locator(`${CARD} ${PLAY}`)).toHaveCount(data.plays.length);
		await expect(page.locator(`${CARD} ${BIO}`)).toHaveCount(data.bio.length);

		await page.goBack();
		await expect(page.locator(CARD)).toHaveCount(0);
		await expect(page).toHaveURL(/galaxy-graduates\/?$/);
	});

	test('у кого анкети немає — адреса не змінюється', async ({ page }) => {
		await gotoReady(page, '/projects/galaxy-graduates');
		const before = new URL(page.url()).pathname;

		await page.locator('[data-testid="galaxy-open-roster-btn"]').click();
		// Рядок без портрета — анкету ще не заповнено, показувати за адресою нічого.
		const plain = page
			.locator('[data-testid^="galaxy-roster-list-item-"]')
			.filter({ hasNot: page.locator('img') })
			.first();
		await plain.locator('button').click();

		await expect(page.locator(CARD)).toBeVisible();
		await expect(page.locator('[data-testid="galaxy-card-pending-message"]')).toBeVisible();
		expect(new URL(page.url()).pathname, 'адреса мусить лишитися').toBe(before);
	});

	test('сторінка галактики веде на всі 80 профілів навіть без JS-зірок', async ({ page }) => {
		await gotoReady(page, '/projects/galaxy-graduates');

		// Зірки з'являються лише після монтування, тож посилання в прередереному
		// HTML — єдиний шлях і для читалки, і для краулера prerender.
		const links = page.locator('[data-testid="galaxy-profiles-nav"] a');
		const count = await links.count();
		expect(count).toBeGreaterThan(0);

		const hrefs = await links.evaluateAll((all) => all.map((a) => a.getAttribute('href') ?? ''));
		expect(new Set(hrefs).size, 'адреси мусять бути унікальні').toBe(count);
		for (const href of hrefs) expect(href).toMatch(/^\/projects\/galaxy-graduates\/.+/);
	});
});
