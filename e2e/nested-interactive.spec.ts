import { expect, test } from '@playwright/test';
import { gotoReady } from './ready';
import { PUBLIC_PAGES } from './pages';

/**
 * Вкладені інтерактивні елементи. Два випадки, і вони РІЗНІ за наслідками —
 * заміряно 2026-08-31, обидва на цій самій збірці.
 *
 * ## `<a>` всередині `<a>` — валить сторінку
 *
 * Розбирач HTML не пускає посилання в посилання: він РОЗРИВАЄ зовнішній тег і
 * переставляє вміст. Svelte у dev натомість валить сторінку цілком
 * (`node_invalid_placement_ssr`): анкета Марини Вішталюк не рендерилася взагалі
 * — спрацьовувала межа помилки, а в консолі було лише «[object Object]».
 * Терпимість тут нульова.
 *
 * ## Чому перевірка по ЗІБРАНОМУ сайту взагалі щось бачить
 *
 * Це не самоочевидно, і перевірялося окремо. Якби вкладеність доживала лише до
 * розбирача, у збірці її вже не було б — розбирач розірвав би зовнішній тег, у
 * DOM лишилися б сусіди, і перевірка мовчала б саме там, де дефект є. Але
 * гідратація створює вузли програмно, ПОВЗ розбирач, тож вкладеність доживає до
 * DOM. Заміряно зворотним експериментом: із поверненою обгорткою прогін по
 * збірці впав і назвав `a[galaxy-card-play-link-9] → a[rich-text-link-1]`.
 *
 * ## `<button>` всередині `<a>` — інша річ, і вона тут ДОЗВОЛЕНА поіменно
 *
 * Спокусливо скласти обидва випадки в один — але три заміри кажуть, що це буде
 * неправда:
 *
 *   • Svelte у dev мовчить: головна з 15 такими кнопками дала 390 карток,
 *     0 меж помилки, 0 помилок сторінки.
 *   • axe мовчить: правило `nested-interactive` ЗАПУСКАЛОСЬ на головній і
 *     порушень не знайшло (0 порушень усього на тегах wcag2a/2aa/21a/21aa).
 *     Тобто твердження «axe завалює збірку на цьому», що довго стояло в
 *     коментарях, для цього випадку хибне.
 *   • Розбирач не переставляє вміст: кнопка лишається там, де написана.
 *
 * А головне — так вирішено навмисно. `AGENTS.md` («Клікабельність карток»)
 * вимагає, щоб УСЯ картка була єдиним `<a>` без `::after` хаків, і кнопка
 * відео опиняється всередині як наслідок цієї вимоги. Тому виняток названий
 * поіменно, а не зроблений загальним послабленням: будь-яка НОВА кнопка в
 * посиланні впаде тут і змусить прийняти рішення свідомо.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Обгорнути рядок вистави Марини в посилання на виставу, не прибравши
 * посилання на групу зсередини, — перевірка назве сторінку й обидва елементи.
 * Дати кнопці відео в картці інший `data-testid` — впаде так само, бо виняток
 * прив'язаний саме до її імені.
 */
/** Сторінки поза `PUBLIC_ENTRIES`: у них власні генератори адрес. */
const EXTRA_PAGES = [
	'/projects/galaxy-graduates/Alik',
	'/projects/galaxy-graduates/maryna-vishtaliuk-sukhanova',
	'/projects/galaxy-graduates/groups',
	'/projects/galaxy-graduates/groups/zakhysnyky-teatralnykh-kulis',
	'/projects/galaxy-graduates/festivals',
	'/projects/galaxy-graduates/festivals/slovianskyi-vinok',
	'/projects/galaxy-graduates/plays/mnymyi-bolnoi-2011',
	'/residents/adults/fedir-tkach'
];

/*
 * Українських адрес досить: англійські дзеркала малюються тією самою розміткою,
 * а подвоєння прогону коштувало б хвилин на кожній збірці.
 */
const PAGES = [...PUBLIC_PAGES.filter((p) => !p.startsWith('/en')), ...EXTRA_PAGES];

test.describe('вкладені інтерактивні елементи', () => {
	test.skip(({ isMobile }) => !!isMobile, 'розмітка та сама — досить одного проєкту');

	for (const path of PAGES) {
		test(`${path}`, async ({ page }) => {
			await gotoReady(page, path);

			const nested = await page.evaluate(() => {
				const SELECTOR = 'a[href], button, [role="button"]';
				/*
				 * Єдиний іменований виняток: кнопка відео в картці вмісту.
				 * Обґрунтування — у докблоці зверху, разом із замірами. Ім'я
				 * вужче за «будь-яка кнопка в картці» навмисно.
				 */
				const ДОЗВОЛЕНО = /-(video-btn|video-link)-\d+$/;
				const out: string[] = [];
				for (const el of document.querySelectorAll(SELECTOR)) {
					const parent = el.parentElement?.closest(SELECTOR);
					if (!parent) continue;
					const дозволений =
						el.tagName === 'BUTTON' &&
						parent.tagName === 'A' &&
						ДОЗВОЛЕНО.test(el.getAttribute('data-testid') ?? '');
					if (дозволений) continue;
					const name = (node: Element) =>
						`${node.tagName.toLowerCase()}` +
						(node.getAttribute('data-testid')
							? `[${node.getAttribute('data-testid')}]`
							: `.${(node.className || '').toString().replace(/\s*s-\w+/g, '').trim().slice(0, 30)}`);
					out.push(`${name(parent)} → ${name(el)}`);
				}
				return [...new Set(out)];
			});

			expect(
				nested,
				`${path}: інтерактивний елемент усередині іншого. Браузер таку розмітку ` +
					`лагодить мовчки, а Svelte у dev валить сторінку цілком:\n  ` +
					nested.join('\n  ')
			).toEqual([]);
		});
	}
});
