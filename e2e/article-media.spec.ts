import { expect, test } from '@playwright/test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
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

/**
 * Замір після того, як компонент ПОРАХУВАВ, а не одразу після `load`.
 *
 * Ширину стовпця компонент бере не з розмітки, а власною міркою через
 * `ResizeObserver`, і та спрацьовує вже після першого кадру. Доти перевірка
 * міряла раніше: `ширина` в компоненті ще нуль, `fitCount` за домовленістю
 * вертає 1, і збоку стояла одна плитка при п'яти, що влазять. Падало це раз на
 * два прогони — тобто читалося як флак і роками нічого не означало б.
 *
 * Чекаємо не «правильного» числа (це зробило б перевірку тавтологією), а того,
 * щоб воно перестало мінятися: два однакові заміри поспіль.
 */
async function заміряти(page: import('@playwright/test').Page) {
	/* Шрифт міняє висоту тексту на 232 px — саме він і зрушує число плиток. */
	await page.evaluate(() => document.fonts?.ready);
	let однакових = 0;
	let попереднє = -1;
	for (let спроба = 0; спроба < 30; спроба += 1) {
		const зараз = await зчитати(page);
		однакових = зараз.стовпець === попереднє ? однакових + 1 : 0;
		/* ТРИ однакові поспіль, а не два: перші два збігалися ще на нулі, поки
		   спостерігач не відпрацював, і перевірка поверталася зарано. */
		if (однакових >= 3 && зараз.ширина > 0 && зараз.висота > 0) return зараз;
		попереднє = зараз.стовпець;
		await page.waitForTimeout(100);
	}
	return зчитати(page);
}

async function зчитати(page: import('@playwright/test').Page) {
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

	/*
	 * Реєстр новин тут НЕ ІМПОРТУЄТЬСЯ: `config/codeNews.ts` тягне `$app/paths`,
	 * якого в прогоні Playwright не існує — перша редакція цієї перевірки впала
	 * на «Cannot find package '$app'», тобто перевірки просто не було. Та сама
	 * пастка описана в `theme-contrast.spec.ts`.
	 *
	 * Тому джерело — ЗІБРАНІ сторінки: у них видно рівно те, що поїде читачеві.
	 */
	const НОВИНИ = join('build', 'news');
	function сторінкиНовин(): { id: string; html: string }[] {
		return readdirSync(НОВИНИ, { withFileTypes: true })
			.filter((e) => e.isDirectory() && existsSync(join(НОВИНИ, e.name, 'index.html')))
			.map((e) => ({
				id: e.name,
				html: readFileSync(join(НОВИНИ, e.name, 'index.html'), 'utf8')
			}));
	}

	/**
	 * ПАРА «одне фото + одне відео» перевіряється НА ДАНИХ, а не на вписаній адресі.
	 *
	 * Тут стояло `/news/30th-season-opened-2026` — колись у тієї новини справді
	 * було одне фото й один запис, і саме її автор просив не чіпати: «коли одна
	 * фотографія і одне відео, то як зараз вони міняються в середині одного
	 * контейнера». 7 вересня 2026 автор надіслав до неї ще тридцять три знімки, і
	 * перевірка почала шукати обкладинку, якої на сторінці більше немає, — тобто
	 * стерегла не правило, а стан однієї новини.
	 *
	 * Тепер пара шукається серед усіх зібраних новин: правило перевіряється там,
	 * де воно живе. Якщо пари не лишиться жодної, перевірка скаже це вголос —
	 * зеленого мовчання тут не буде.
	 */
	test('одне фото й одне відео лишаються одним контейнером', async ({ page }) => {
		/*
		 * Шукається ЧИСТА пара: фото, запис і більше нічого. Новина з галереєю теж
		 * має обкладинку й кнопку (з 7 вересня 2026 пара може стояти над
		 * галереєю), але «плиток нуль» для неї — уже неправда, і саме на цьому
		 * перевірка почервоніла. Її предмет — випадок «двоє медіа й один
		 * контейнер», тож і сторінка потрібна саме така.
		 */
		const пари = сторінкиНовин().filter(
			(n) =>
				n.html.includes('article-cover-video-btn') &&
				n.html.includes('article-cover-img') &&
				!n.html.includes('article-media-photo-btn-')
		);

		expect(
			пари.length,
			'у зібраних новинах немає жодної пари «фото + запис» — правило зараз ' +
				'перевіряє лише юніт-тест `utils/articleMedia.test.ts`. Якщо так і задумано, ' +
				'приберіть цю перевірку разом із поясненням, а не лишайте її зеленою'
		).toBeGreaterThan(0);

		await gotoReady(page, `/news/${пари[0].id}`);
		await expect(page.getByTestId('article-cover-img')).toBeVisible();
		await expect(
			page.locator('[data-testid^="article-media-photo-btn-"]'),
			'пара розсипалася на плитки'
		).toHaveCount(0);

		await page.getByTestId('article-cover-video-btn').click();
		await expect(page.getByTestId('article-cover-video-container')).toBeVisible();
	});

	/**
	 * ПАРА Й ГАЛЕРЕЯ НА ОДНІЙ СТОРІНЦІ — і в різних пропорціях.
	 *
	 * Автор попросив обидва окремо, і спершу зроблено було лише перше: «прев'ю
	 * всі квадратні» — і квадратною стала й обкладинка з записом, та ще й
	 * розсипалася на дві плитки, бо пара вимагала рівно двох медіа на всю
	 * новину. Друге прохання назвало обидва дефекти: «перше фото і відео
	 * вертикальні» та «фото і відео в одному контейнері».
	 *
	 * Тому тут чотири числа з однієї сторінки: контейнер пари один, він
	 * вертикальний (9/16), плитка галереї квадратна (1/1), і кнопка перемикання
	 * на місці. Кожне ламається тихо — сторінка не падає, вона просто виглядає
	 * не так.
	 */
	test('обкладинка й запис — одна вертикальна пара над квадратною галереєю', async ({ page }) => {
		await gotoReady(page, '/news/30th-season-opened-2026');

		const заміряне = await page.evaluate(() => {
			const рамка = document.querySelector('.media-frame');
			const плитка = document.querySelector('.media-tile');
			return {
				рамок: document.querySelectorAll('.media-frame').length,
				пропорціяПари: рамка ? getComputedStyle(рамка).aspectRatio : '',
				пропорціяПлитки: плитка ? getComputedStyle(плитка).aspectRatio : ''
			};
		});

		expect(заміряне.рамок, 'пара розсипалася або задвоїлася').toBe(1);
		expect(заміряне.пропорціяПари, 'контейнер пари не вертикальний').toBe('9 / 16');
		expect(заміряне.пропорціяПлитки, 'плитка галереї не квадратна').toBe('1 / 1');
		await expect(page.getByTestId('article-cover-img'), 'обкладинки немає').toBeVisible();
		await expect(
			page.getByTestId('article-cover-video-btn'),
			'кнопки перемикання на запис немає'
		).toBeVisible();
	});

	test('велика галерея новини нічого не губить і відкривається', async ({ page }) => {
		await gotoReady(page, '/news/30th-season-opened-2026');

		/* Скільки знімків на сторінці — з неї самої; що жоден не загубився при
		   поділі на стовпець і решту, каже сума нижче. */
		const плитки = page.locator('[data-testid^="article-media-photo-btn-"]');
		const знімків = await плитки.count();
		expect(знімків, 'галерея зникла зі сторінки').toBeGreaterThan(20);

		/*
		 * Стовпець тепер несе ПАРУ (рамка з обкладинкою й кнопка), а не плитки, —
		 * тож у галереї мають опинитися рівно всі знімки, крім того, що в парі.
		 */
		const решта = await page.evaluate(
			() => document.querySelector('.article-media-rest')?.children.length ?? 0
		);
		expect(решта, 'частина знімків не потрапила в галерею').toBe(знімків);

		await page.locator('[data-testid^="article-media-photo-btn-"]').first().click();
		await expect(page.getByTestId('photo-lightbox-img')).toBeVisible();
		await page.keyboard.press('Escape');
	});
});
