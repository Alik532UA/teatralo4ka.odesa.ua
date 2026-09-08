import { expect, test } from '@playwright/test';
import { gotoReady } from './ready';

/**
 * ЛАБОРАТОРІЯ КОЛЬОРІВ — інструмент дизайнера.
 *
 * ## Що саме стережеться
 *
 * Не вигляд панелі, а чотири речі, без яких вона перестає бути інструментом і
 * стає прикрасою. Кожна вже ламалася в цій сесії, і кожну знайшов автор, а не
 * перевірка — тому вони тут.
 *
 * 1. ВХІД АДРЕСОЮ. `?theme-lab=1` — єдиний спосіб відкрити лабораторію на
 *    планшеті: сім натискань `D` там неможливі, бо клавіатури немає. Це рівно
 *    те, що найтихіше зникає при перебудові маршрутизації.
 * 2. ПРАВКА СПРАВДІ ФАРБУЄ САЙТ. Уся суть у тому, що дизайнер бачить сторінку,
 *    а не зразок кольору. Якщо інлайновий стиль перестане перебивати тему,
 *    панель і далі виглядатиме робочою.
 * 3. ЕКСПОРТ НАЗИВАЄ ЧИННУ ТЕМУ. Блок CSS іде у файл теми, і помилка в
 *    селекторі означає правку не тієї теми. Назва вже одного разу застрягала:
 *    її читали з DOM, а це нічого не повідомляє Svelte.
 * 4. ХРЕСТИК ЗГОРТАЄ, А НЕ ЗАКРИВАЄ. Інакше з планшета лабораторію не
 *    повернути — тільки перезаходом за адресою.
 *
 * ## Чому не перевіряється сам жест `D`
 *
 * Серії натискань покриті юніт-інваріантами (`services/keySequence.test.ts`) з
 * усіма шістьма захистами; повторювати це в браузері означало б міряти те саме
 * вдруге й повільніше. Тут — те, чого юніт не бачить: чи фарбується сторінка.
 */
const СТОРІНКА = '/about/';

test.describe('лабораторія кольорів', () => {
	test('відкривається адресою — тим входом, що працює на планшеті', async ({ page }) => {
		await gotoReady(page, `${СТОРІНКА}?theme-lab=1`);
		await expect(page.getByTestId('theme-lab-panel')).toBeVisible();
	});

	test('правка кольору фарбує саму сторінку, а не лише зразок', async ({ page }) => {
		await gotoReady(page, `${СТОРІНКА}?theme-lab=1`);

		const було = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
		await page.getByTestId('theme-lab-bg-page-hex-input').fill('#2b0b2e');
		await expect
			.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
			.toBe('rgb(43, 11, 46)');

		/* І скидання повертає тему — інакше дизайнер лишався б зі своїми пробами назавжди. */
		await page.getByTestId('theme-lab-reset-btn').click();
		await expect
			.poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
			.toBe(було);
	});

	test('експорт називає чинну тему й лише змінені токени', async ({ page }) => {
		await gotoReady(page, `${СТОРІНКА}?theme-lab=1`);

		const блок = page.getByTestId('theme-lab-css-text');
		await expect(блок, 'без правок блок не вдає, що щось є').toContainText('не змінено');

		await page.getByTestId('theme-lab-accent-primary-hex-input').fill('#123456');
		const тема = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
		await expect(блок).toContainText(`.${тема}-theme`);
		await expect(блок).toContainText('--accent-primary: #123456;');
		await expect(блок, 'у блок потрапило те, чого не чіпали').not.toContainText('--bg-page');
	});

	test('хрестик згортає в кнопку, а не прибирає лабораторію', async ({ page }) => {
		await gotoReady(page, `${СТОРІНКА}?theme-lab=1`);

		await page.getByTestId('theme-lab-close-btn').click();
		await expect(page.getByTestId('theme-lab-panel')).toHaveCount(0);
		await expect(page.getByTestId('theme-lab-mini-panel')).toBeVisible();

		await page.getByTestId('theme-lab-expand-btn').click();
		await expect(page.getByTestId('theme-lab-panel')).toBeVisible();

		/* А прибирає окрема кнопка — і аж тоді нічого не лишається. */
		await page.getByTestId('theme-lab-close-btn').click();
		await page.getByTestId('theme-lab-hide-btn').click();
		await expect(page.getByTestId('theme-lab-mini-panel')).toHaveCount(0);
		await expect(page.getByTestId('theme-lab-panel')).toHaveCount(0);
	});


	/**
	 * ЗГОРНУТА ПІЛЮЛЯ — теж інструмент, а не значок.
	 *
	 * Автор написав: «натискаєш кнопку закрити — розгортається вікно». На
	 * зібраній статиці послідовність була правильна, тобто справа не в
	 * обробнику, а в розмірі й сусідстві: хрестик мав 33 × 36 px і стояв упритул
	 * до вдесятеро ширшої кнопки «Кольори». Промах на два пікселі відкривав
	 * вікно. Тому тут міряється ЦІЛЬ ДОТИКУ, а не лише те, що клік працює.
	 */
	test('пілюля рухається, і її хрестик прибирає лабораторію', async ({ page }) => {
		await gotoReady(page, `${СТОРІНКА}?theme-lab=1`);
		await page.getByTestId('theme-lab-close-btn').click();

		const пілюля = page.getByTestId('theme-lab-mini-panel');
		await expect(пілюля).toBeVisible();

		/* Кожна кнопка пілюлі — не менша за ціль дотику WCAG 2.2 SC 2.5.8. */
		const дрібні = await пілюля.evaluate((el) =>
			[...el.querySelectorAll('button')]
				.map((b) => ({ id: b.dataset.testid, h: b.getBoundingClientRect().height, w: b.getBoundingClientRect().width }))
				.filter((b) => b.h < 44 || b.w < 24)
		);
		expect(дрібні, 'кнопка пілюлі дрібніша за палець').toEqual([]);

		/* Перетягування за ручку. */
		const до = (await пілюля.boundingBox())!;
		const ручка = (await page.getByTestId('theme-lab-mini-move-btn').boundingBox())!;
		await page.mouse.move(ручка.x + ручка.width / 2, ручка.y + ручка.height / 2);
		await page.mouse.down();
		await page.mouse.move(ручка.x - 300, ручка.y + 300, { steps: 8 });
		await page.mouse.up();
		const після = (await пілюля.boundingBox())!;
		expect(Math.abs(після.x - до.x) + Math.abs(після.y - до.y), 'пілюля не зрушила').toBeGreaterThan(100);

		/* І хрестик прибирає саме лабораторію, а не розгортає вікно. */
		await page.getByTestId('theme-lab-hide-btn').click();
		await expect(page.getByTestId('theme-lab-mini-panel')).toHaveCount(0);
		await expect(page.getByTestId('theme-lab-panel'), 'хрестик розгорнув вікно замість прибрати').toHaveCount(0);
	});

	test('звичайний відвідувач лабораторії не бачить', async ({ page }) => {
		/*
		 * Перевірка жива саме цим: панель ХОВАЄТЬСЯ за жестом і адресою, а не
		 * просто існує в розмітці з `display: none`. Якби вона малювалася завжди,
		 * усі чотири перевірки вище лишалися б зеленими.
		 */
		await gotoReady(page, СТОРІНКА);
		await expect(page.getByTestId('theme-lab-panel')).toHaveCount(0);
		await expect(page.getByTestId('theme-lab-mini-panel')).toHaveCount(0);
	});
});
