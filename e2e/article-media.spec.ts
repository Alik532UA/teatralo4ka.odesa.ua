import { expect, test } from '@playwright/test';
import { gotoReady } from './ready';

/**
 * Медіа новини: стовпець плиток, лайтбокс і плеєр.
 *
 * ## Чому саме прогоном
 *
 * Тут перевіряється те, чого не видно ні в джерелах, ні в юніт-тесті: скільком
 * плиткам стати збоку, вирішує ЗАМІРЯНА висота тексту, а вона залежить від
 * шрифту, мови й ширини вікна. Чиста функція `fitCount` перевірена окремо
 * (`utils/articleMedia.test.ts`); тут — що в неї приходять живі числа.
 *
 * Це не теоретична обережність. 2026-09-05 заміряно: `bind:clientHeight` у
 * Svelte давав 1347 при справжніх 1579 і більше не оновлювався — стовпець
 * показував чотири плитки там, де влізало п'ять. Замір переписаний на власний
 * `utils/measureHeight`, і саме ця перевірка стереже, щоб число знову не
 * застигло.
 *
 * ## Межа
 *
 * Перевірка НЕ каже, що плитки красиві. Вона каже три речі: жодне медіа не
 * загубилося (стовпець + решта = скільки їх є), поділ відповідає заміряним
 * розмірам, і знімок відкривається на весь екран.
 */
const АДРЕСА = '2026-year-30th-season-18-students';
/** Проміжок між плитками — те саме число, що в `ArticleMedia`. */
const ПРОМІЖОК = 12;

async function заміряти(page: import('@playwright/test').Page) {
	return page.evaluate(() => {
		const стовпець = document.querySelector('.article-media');
		const решта = document.querySelector('.article-media-rest');
		const текст = document.querySelector('.article-main');
		return {
			стовпець: стовпець?.children.length ?? 0,
			решта: решта?.children.length ?? 0,
			висота: Math.round(текст?.getBoundingClientRect().height ?? 0),
			ширина: Math.round(стовпець?.getBoundingClientRect().width ?? 0)
		};
	});
}

test.describe('медіа новини', () => {
	test.skip(({ isMobile }) => !!isMobile, 'стовпець збоку — розкладка широкого екрана');

	test('плитки діляться за заміряною висотою тексту, і жодна не губиться', async ({ page }) => {
		await gotoReady(page, `/news/${АДРЕСА}`);

		const широко = await заміряти(page);
		expect(широко.стовпець + широко.решта, 'частина знімків зникла зі сторінки').toBe(12);
		expect(широко.ширина, 'стовпця немає — нема чого ділити').toBeGreaterThan(0);
		expect(
			широко.стовпець,
			`збоку ${широко.стовпець} плиток при тексті ${широко.висота}px і плитці ${широко.ширина}px`
		).toBe(Math.max(1, Math.floor((широко.висота + ПРОМІЖОК) / (широко.ширина + ПРОМІЖОК))));

		/*
		 * Вужче вікно міняє І висоту тексту, І ширину плитки. Якщо замір застигне,
		 * як застигала прив'язка Svelte, рівність нижче розійдеться — саме на це
		 * перевірка й розрахована.
		 */
		await page.setViewportSize({ width: 900, height: 900 });
		await page.waitForTimeout(600);

		const вузько = await заміряти(page);
		expect(вузько.стовпець + вузько.решта, 'при звуженні знімки загубилися').toBe(12);
		expect(
			вузько.стовпець,
			`після звуження збоку ${вузько.стовпець} плиток при тексті ${вузько.висота}px і плитці ${вузько.ширина}px`
		).toBe(Math.max(1, Math.floor((вузько.висота + ПРОМІЖОК) / (вузько.ширина + ПРОМІЖОК))));
	});

	test('знімок відкривається на весь екран', async ({ page }) => {
		await gotoReady(page, `/news/${АДРЕСА}`);

		// Саме те, чого бракувало авторові: «зображення, яке не відкривається на
		// весь екран при натисканні».
		await page.locator('[data-testid^="article-media-photo-btn-"]').first().click();
		await expect(page.getByTestId('photo-lightbox-img')).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.getByTestId('photo-lightbox-img')).toBeHidden();
	});

	test('одне фото й одне відео лишаються одним контейнером', async ({ page }) => {
		/*
		 * Друга новина — рівно та пара, яку автор просив не чіпати: «коли одна
		 * фотографія і одне відео, то як зараз вони міняються в середині одного
		 * контейнера».
		 */
		await gotoReady(page, '/news/30th-season-opened-2026');

		await expect(page.getByTestId('article-cover-img')).toBeVisible();
		await expect(
			page.locator('[data-testid^="article-media-photo-btn-"]'),
			'пара розсипалася на плитки'
		).toHaveCount(0);

		await page.getByTestId('article-cover-video-btn').click();
		await expect(page.getByTestId('article-cover-video-container')).toBeVisible();
	});
});
