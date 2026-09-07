import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gotoReady, waitForAnimations } from './ready';

/**
 * Кольори ГАЛАКТИКИ не залежать від теми сайту — і це заміряно, а не обіцяно.
 *
 * ## Що це стереже
 *
 * У галактиці дві палітри, і межа між ними проходить не по адресі, а по класу
 * `body.page-galaxy`. Він є на сцені й на сторінці випускника на широкому
 * екрані; його НЕМАЄ в переліках (фестивалі, театри, заклади, групи, вистави),
 * на телефоні й на сторінці учня. Тобто ті самі компоненти малюються то на
 * майже чорному космосі, то на тлі теми — а тем шість.
 *
 * Звідси два дзеркальні дефекти, обидва знайдені живим заміром 7 вересня 2026:
 *
 *   • колір ТЕМИ на космічному тлі — крапки фотобанера через `light-dark()`
 *     ставали чорними на чорному, коли на сайті обрано світлу тему;
 *   • колір КОСМОСУ на тлі теми — жорсткий #bfe0ff у ряду облич давав контраст
 *     1,13 у «світлій жовтій», а #ffffff імені майстра на сторінці учня — рівно
 *     1,00 у світлій, тобто напису не було видно взагалі.
 *
 * ## Чому не axe
 *
 * `theme-contrast.spec.ts` уже ганяє axe по шести темах, і сторінка учня в
 * ньому є. Білого напису на білому тлі він НЕ показав: правило `color-contrast`
 * відмовляється рахувати, коли не може визначити фон (градієнт, напівпрозорий
 * предок, `backdrop-filter`), і відносить такий вузол до `incomplete`, а не до
 * `violations` — а перевірка дивиться лише на другі. Тут фон складається
 * вручну: шари напівпрозорих предків, середній колір градієнта і тло
 * псевдоелемента, який лежить поверх (саме таке кільце в індексі бази).
 *
 * ## Чому тема перемикається в сторінці, а не перезавантаженням
 *
 * Так її перемикає САМ САЙТ: `applyThemeToDocument` ставить атрибут
 * `data-theme` і клас `${тема}-theme` на `html` — рівно те саме робить
 * `застосувати()` нижче. Шість перезавантажень на кожну з п'яти сторінок — це
 * тридцять переходів замість п'яти, а міряють вони те саме. Що перемикання
 * справді спрацювало, перевіряється окремо: тло сторінки у світлій і темній
 * мусить відрізнятися.
 *
 * ПЕРЕХОДИ ГЛУШАТЬСЯ, і це не косметика: у `body` стоїть
 * `transition: background-color`, а `getComputedStyle` під час переходу вертає
 * ПРОМІЖНЕ значення. Без глушіння перший замір після зміни теми показував
 * старе тло — і перша редакція цього обходу через те нарахувала два десятки
 * неіснуючих дефектів у підвалі.
 *
 * ## Межі заміру
 *
 * Міряється лише `main`: шапка й підвал — спільна обшивка всього сайту, їх
 * стереже `a11y.spec.ts`. Світлини пропускаються — колір фону під фотографією
 * не обчислити, її стереже око.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено на зібраній статиці, тобто на тому CSS, який справді віддає
 * сервер: у `GraduateAvatarRow` колір літери повернено до жорсткого #bfe0ff —
 * перевірка почервоніла на трьох сторінках і назвала теми поіменно (1,13
 * «світла жовта», 1,16 «жовта»). Ім'я майстра повернено до #ffffff —
 * почервоніла сторінка учня з контрастом 1,00. Після повернення токенів —
 * знову зелена.
 */

const ТЕМИ = ['light', 'dark', 'yellow', 'light-yellow', 'dark-cyan', 'dark-blue'] as const;

/** Мінімум WCAG AA: 4,5 для звичайного тексту, 3,0 для великого. */
const МІНІМУМ = 4.5;
const МІНІМУМ_ВЕЛИКИЙ = 3;

const ЛЮДИ = JSON.parse(
	readFileSync(new URL('../src/lib/data/graduates.index.json', import.meta.url), 'utf8')
) as { slug: string; code?: string; kind?: string }[];
const УЧЕНЬ = ЛЮДИ.find((г) => г.kind === 'student');

/**
 * Сторінки взято так, щоб кожна принесла СВОЇ компоненти:
 * перелік фестивалів — ряд облич і рядки реєстру, заклади — плашку з числом
 * людей, сторінка учня — картку випускника в темі сайту, індекс бази —
 * кольори «як воно».
 */
const СТОРІНКИ = [
	'/projects/galaxy-graduates/festivals/',
	/* Сторінка поїздки: ряд облич, плашки країн і кнопка запису — усе те, що
	   народилося в космічній палітрі, а живе в темі сайту. */
	'/projects/galaxy-graduates/festivals/zymova-kazka-2007/',
	'/projects/galaxy-graduates/institutions/',
	'/projects/galaxy-graduates/theatres/',
	'/projects/galaxy-graduates/stats/'
];

async function зібрати(page: import('@playwright/test').Page, теми: readonly string[]) {
	return page.evaluate(
		async ({ теми, МІНІМУМ, МІНІМУМ_ВЕЛИКИЙ }) => {
			type RGBA = [number, number, number, number];
			const cv = document.createElement('canvas');
			cv.width = cv.height = 1;
			const ctx = cv.getContext('2d', { willReadFrequently: true })!;
			const кеш = new Map<string, RGBA>();
			/*
			 * Колір переганяється ПОЛОТНОМ, а не регуляркою: `color-mix()` Chrome
			 * вертає як `color(srgb 0.89 0.96 0.99 / 0.5)` або `oklab(…)`, і розбір
			 * «усіх чисел підряд» брав 0,89 за 89 % від 255, тобто майже чорний.
			 * Полотно приймає будь-який синтаксис і віддає sRGB.
			 */
			const колір2 = (c: string): RGBA => {
				const було = кеш.get(c);
				if (було) return було;
				ctx.fillStyle = '#010203';
				ctx.fillStyle = c;
				ctx.clearRect(0, 0, 1, 1);
				ctx.fillRect(0, 0, 1, 1);
				const d = ctx.getImageData(0, 0, 1, 1).data;
				const r: RGBA = [d[0], d[1], d[2], d[3] / 255];
				кеш.set(c, r);
				return r;
			};
			const накласти = (верх: RGBA, низ: RGBA): RGBA => {
				const a = верх[3] + низ[3] * (1 - верх[3]);
				if (a === 0) return [0, 0, 0, 0];
				const см = (i: number) => (верх[i] * верх[3] + низ[i] * низ[3] * (1 - верх[3])) / a;
				return [см(0), см(1), см(2), a];
			};
			/** Середній колір градієнта; `null` — світлина або нічого. */
			const зГрадієнта = (img: string): RGBA | null => {
				if (!img || img === 'none' || img.includes('url(')) return null;
				const стопи = img.match(
					/(?:rgba?|oklab|oklch|lab|lch|hsla?|color)\([^()]*(?:\([^()]*\))?[^()]*\)/g
				);
				if (!стопи?.length) return null;
				const сп = стопи.map(колір2);
				const сума = сп.reduce(
					(a, c) => [a[0] + c[0] * c[3], a[1] + c[1] * c[3], a[2] + c[2] * c[3], a[3] + c[3]],
					[0, 0, 0, 0] as RGBA
				);
				if (сума[3] === 0) return [0, 0, 0, 0];
				return [сума[0] / сума[3], сума[1] / сума[3], сума[2] / сума[3], сума[3] / сп.length];
			};
			/**
			 * Псевдоелемент предка, який лежить ПОВЕРХ вмісту, теж є шаром тла.
			 *
			 * Саме так зроблене кільце індексу в статистиці: `::after` з
			 * `inset: 4px` і суцільним тлом закриває конічний градієнт, а напис
			 * лежить уже на ньому. Без цього замір порівнював білий відсоток із
			 * градієнтом під кільцем і давав дефект, якого на екрані немає.
			 */
			const псевдоШар = (вузол: Element): RGBA | null => {
				for (const яке of ['::before', '::after'] as const) {
					const cs = getComputedStyle(вузол, яке);
					if (!cs.content || cs.content === 'none') continue;
					if (cs.position !== 'absolute' && cs.position !== 'fixed') continue;
					const c = колір2(cs.backgroundColor);
					if (c[3] > 0) return c;
				}
				return null;
			};
			let наСвітлині = false;
			const тлоПід = (el: Element): RGBA => {
				let шар: RGBA = [0, 0, 0, 0];
				let вузол: Element | null = el;
				наСвітлині = false;
				let перший = true;
				while (вузол) {
					if (!перший) {
						const п = псевдоШар(вузол);
						if (п) {
							шар = накласти(шар, п);
							if (шар[3] >= 0.999) return шар;
						}
					}
					перший = false;
					const cs = getComputedStyle(вузол);
					const град = зГрадієнта(cs.backgroundImage);
					if (град) шар = накласти(шар, град);
					else if (cs.backgroundImage.includes('url(')) наСвітлині = true;
					const c = колір2(cs.backgroundColor);
					if (c[3] > 0) шар = накласти(шар, c);
					if (шар[3] >= 0.999) return шар;
					вузол = вузол.parentElement;
				}
				return накласти(шар, колір2('white'));
			};
			const яскр = ([r, g, b]: RGBA) => {
				const л = [r, g, b].map((v) => {
					const s = v / 255;
					return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
				});
				return 0.2126 * л[0] + 0.7152 * л[1] + 0.0722 * л[2];
			};
			const контраст = (a: RGBA, b: RGBA) =>
				(Math.max(яскр(a), яскр(b)) + 0.05) / (Math.min(яскр(a), яскр(b)) + 0.05);
			const у16 = ([r, g, b]: RGBA) =>
				'#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
			const ключ = (el: Element): string => {
				const t = el.getAttribute('data-testid');
				if (t) return `[${t}]`;
				const класи = [...el.classList].filter((c) => !/^s-[A-Za-z0-9_-]{6,}$/.test(c));
				return `${el.tagName.toLowerCase()}${класи.length ? '.' + класи.slice(0, 2).join('.') : ''}`;
			};
			const застосувати = (тема: string) => {
				document.documentElement.setAttribute('data-theme', тема);
				for (const т of теми) document.documentElement.classList.remove(`${т}-theme`);
				document.documentElement.classList.add(`${тема}-theme`);
			};

			const знахідки: {
				ключ: string;
				текст: string;
				тема: string;
				колір: string;
				тло: string;
				к: number;
			}[] = [];
			const тлаСторінки: Record<string, string> = {};
			let оглянуто = 0;

			for (const тема of теми) {
				застосувати(тема);
				await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 120)));
				тлаСторінки[тема] = у16(колір2(getComputedStyle(document.body).backgroundColor));

				const корінь = document.querySelector('main') ?? document.body;
				const видимі = [...корінь.querySelectorAll('*')].filter((el) => {
					const r = el.getBoundingClientRect();
					if (r.width < 6 || r.height < 6) return false;
					const cs = getComputedStyle(el);
					if (cs.visibility === 'hidden' || +cs.opacity < 0.2) return false;
					if (cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)') return true;
					return [...el.childNodes].some(
						(n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0
					);
				});

				for (const el of видимі) {
					const cs = getComputedStyle(el);
					/*
					 * Градієнтний текст — окремий випадок ДВІЧІ: колір беремо з
					 * градієнта (сам `color` там прозорий), а тло — з БАТЬКА, бо
					 * власний градієнт елемента і є той текст.
					 */
					const градТекст = cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)';
					let колір = колір2(cs.color);
					if (градТекст) {
						const g = зГрадієнта(cs.backgroundImage);
						if (!g) continue;
						колір = g;
					}
					const тло = тлоПід(градТекст ? (el.parentElement ?? el) : el);
					if (наСвітлині) continue;
					оглянуто += 1;
					const кегль = parseFloat(cs.fontSize);
					const жирний = parseInt(cs.fontWeight, 10) >= 700;
					const великий = кегль >= 24 || (кегль >= 18.66 && жирний);
					const поріг = великий ? МІНІМУМ_ВЕЛИКИЙ : МІНІМУМ;
					const к = контраст(накласти(колір, тло), тло);
					if (к >= поріг) continue;
					знахідки.push({
						ключ: ключ(el),
						текст: (el.textContent ?? '').trim().slice(0, 26).replace(/\s+/g, ' '),
						тема,
						колір: у16(колір),
						тло: у16(тло),
						к: Number(к.toFixed(2))
					});
				}
			}
			return { знахідки, тлаСторінки, оглянуто };
		},
		{ теми: [...теми], МІНІМУМ, МІНІМУМ_ВЕЛИКИЙ }
	);
}

test.describe('кольори галактики в шести темах', () => {
	test('у даних є учень — сторінка в темі сайту існує', () => {
		expect(УЧЕНЬ, 'без учня немає сторінки, де картка фарбується темою').toBeTruthy();
	});

	for (const адреса of [...СТОРІНКИ, 'учень']) {
		test(`${адреса}: жоден напис не зникає в жодній темі`, async ({ page }, testInfo) => {
			test.skip(testInfo.project.name === 'mobile', 'мобільна розкладка міряється окремим тестом');
			test.setTimeout(120_000);

			const шлях =
				адреса === 'учень' ? `/projects/galaxy-graduates/${УЧЕНЬ!.slug}/` : адреса;
			await gotoReady(page, шлях);
			await waitForAnimations(page);
			await page.mouse.move(5, 5);
			await page.addStyleTag({
				content: '*,*::before,*::after{transition:none!important;animation:none!important}'
			});

			const { знахідки, тлаСторінки, оглянуто } = await зібрати(page, ТЕМИ);

			/* Поріг за найбіднішою зі сторінок: картка учня дає 13 написів на тему. */
			expect(оглянуто, 'нічого не оглянуто — перевірка зелена ні від чого').toBeGreaterThan(
				10 * ТЕМИ.length
			);
			expect(
				тлаСторінки.light,
				`перемикання теми не спрацювало: у світлій і темній однакове тло ${тлаСторінки.light}`
			).not.toBe(тлаСторінки.dark);

			const рядки = знахідки.map(
				(з) => `${з.тема}: ${з.ключ} «${з.текст}» — ${з.колір} на ${з.тло}, контраст ${з.к}`
			);
			expect(рядки, `нечитні написи на ${шлях}`).toEqual([]);
		});
	}

	test('картка випускника на телефоні: жоден напис не зникає', async ({ page }, testInfo) => {
		/*
		 * ОКРЕМИЙ тест саме на телефон: клас `page-galaxy` ставиться лише на
		 * широкому екрані, тож на вузькому та сама картка випускника малюється
		 * НЕ в космічній палітрі, а в темі сайту. Це половина знайдених дефектів
		 * — і на десктопі їх не видно.
		 */
		test.skip(testInfo.project.name !== 'mobile', 'сенс тесту саме у вузькому екрані');
		test.setTimeout(120_000);

		await gotoReady(page, '/projects/galaxy-graduates/festivals/');
		await waitForAnimations(page);
		await page.addStyleTag({
			content: '*,*::before,*::after{transition:none!important;animation:none!important}'
		});

		const { знахідки, оглянуто } = await зібрати(page, ТЕМИ);
		expect(оглянуто, 'нічого не оглянуто').toBeGreaterThan(10 * ТЕМИ.length);
		const рядки = знахідки.map(
			(з) => `${з.тема}: ${з.ключ} «${з.текст}» — ${з.колір} на ${з.тло}, контраст ${з.к}`
		);
		expect(рядки, 'нечитні написи у вузькій розкладці').toEqual([]);
	});
});
