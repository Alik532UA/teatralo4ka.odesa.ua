import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gotoReady } from './ready';

/**
 * «Планета творчості» — сторінка поточних учнів.
 *
 * ## Що саме стережеться
 *
 * 1. На планеті стоять УСІ учні реєстру й ніхто більше. Число в лічильнику
 *    береться з тих самих даних, тож розходження між ним і кількістю облич
 *    означало б, що когось не намалювали.
 * 2. Учня НЕМАЄ в галактиці випускників. Це головна межа всієї роботи: галактика
 *    для тих, хто випустився чи перестав учитися, планета — для тих, хто вчиться
 *    зараз. Межу тримає видимість `linked` у реєстрі, і без цієї перевірки вона
 *    зникла б від одного забутого поля.
 * 3. Натискання відкриває картку з ВЛАСНОЮ адресою людини — тією самою, що буде
 *    в неї після випуску: сторінка учня від першого дня та сама, і посилання,
 *    роздане учнем, переїзд у галактику переживе.
 * 4. У картці учня немає року випуску — замість нього «навчається». Саме цього
 *    просив автор: «така сама концепція, як у випускника, але без поля рік
 *    випуску».
 *
 * Дані читаються ФАЙЛОМ, а не імпортом `$lib/data/graduates`: той модуль тягне
 * JSON, а завантажувач Node у прогоні Playwright вимагає для цього
 * `import ... with { type: 'json' }` — без нього спека не збирається взагалі
 * (те саме вже ловило `theme-contrast.spec.ts`).
 */
const ПЛАНЕТА = '/projects/creativity-planet/';

const РЕЄСТР = JSON.parse(
	readFileSync(new URL('../src/lib/data/graduates.index.json', import.meta.url), 'utf8')
) as { id: string; slug: string; name: string; kind?: string; visibility?: string }[];

const УЧНІ = РЕЄСТР.filter((г) => г.kind === 'student');

test.describe('планета творчості', () => {
	test('у реєстрі є учні — перевірка жива', () => {
		expect(УЧНІ.length, 'без жодного учня сторінка нічого не стереже').toBeGreaterThan(0);
	});

	test('на планеті стоять усі учні й лічильник із ними згоден', async ({ page }) => {
		await gotoReady(page, ПЛАНЕТА);

		await expect(page.getByTestId('creativity-planet-count')).toHaveText(String(УЧНІ.length));

		for (const учень of УЧНІ) {
			const кнопка = page.getByTestId(`creativity-planet-${учень.slug}-btn`);
			await expect(кнопка, `${учень.name} не потрапив на планету`).toBeVisible();
			await expect(кнопка).toContainText(учень.name);
		}

		/* Обличчя стоять НА планеті, а не поруч: перша редакція сторінки
		   виносила крайніх за коло, і одна учениця висіла над текстом. */
		const межі = await page.evaluate((слаг) => {
			const коло = document.querySelector('[data-testid="creativity-planet-list"]')!.getBoundingClientRect();
			const обличчя = document
				.querySelector(`[data-testid="creativity-planet-${слаг}-btn"] span`)!
				.getBoundingClientRect();
			const cx = коло.left + коло.width / 2;
			const cy = коло.top + коло.height / 2;
			const dx = обличчя.left + обличчя.width / 2 - cx;
			const dy = обличчя.top + обличчя.height / 2 - cy;
			return { відстань: Math.hypot(dx, dy) + обличчя.width / 2, радіус: коло.width / 2 };
		}, УЧНІ[УЧНІ.length - 1].slug);
		expect(
			межі.відстань,
			`крайнє обличчя відходить на ${Math.round(межі.відстань)} px від центру, а планета має радіус ${Math.round(межі.радіус)}`
		).toBeLessThanOrEqual(межі.радіус);
	});

	test('учня немає в галактиці випускників', async ({ page }) => {
		await gotoReady(page, '/projects/galaxy-graduates/');
		for (const учень of УЧНІ) {
			await expect(
				page.locator(`[data-testid="galaxy-list-item-${учень.slug}"]`),
				`${учень.name} летить у галактиці, хоч іще вчиться`
			).toHaveCount(0);
		}
	});

	test('на сторінці учня квітка замість зірки й жодних зірок галактики позаду', async ({
		page
	}) => {
		const учень = УЧНІ[0];
		await gotoReady(page, `/projects/galaxy-graduates/${учень.slug}/`);

		/*
		 * Зірка належить ГАЛАКТИЦІ: людина, яка випустилася, світить іздалеку.
		 * Учень стоїть на планеті, і замість зірки в нього квітка — «тут росте».
		 * Автор побачив розходження одразу: на планеті квітка, а на власній
		 * сторінці того самого учня була зірка.
		 */
		await expect(page.getByTestId('galaxy-card-bloom')).toBeVisible();
		await expect(page.locator('.star'), 'зірка лишилася на сторінці учня').toHaveCount(0);

		/* Позаду не летять ВИПУСКНИКИ: це чужий розділ за спиною учня. */
		await expect(page.getByTestId('galaxy-section')).toHaveCount(0);

		/*
		 * І сторінка живе в темі сайту, а не в палітрі космосу: саме клас на тілі
		 * підміняє токени теми, тож його тут бути не мусить.
		 */
		expect(
			await page.evaluate(() => document.body.classList.contains('page-galaxy')),
			'на сторінці учня стоїть клас галактики — тема сайту на неї не подіє'
		).toBe(false);
	});

	test('хрестик на сторінці учня вертає на планету, а не в галактику', async ({ page }) => {
		await gotoReady(page, `/projects/galaxy-graduates/${УЧНІ[0].slug}/`);

		/*
		 * У галактиці учня немає взагалі, тож кнопка «закрити» вела б у перелік,
		 * де його не знайти. Автор побачив це на сторінці Родоміри Долбишевої.
		 */
		await page.getByTestId('graduate-profile-close-btn').click();
		await expect(page).toHaveURL(/\/projects\/creativity-planet\/?$/);
	});

	test('учня ніде не підписують галактикою', async ({ page }) => {
		/*
		 * Скарги автора йшли одна за одною за єдиним зразком: усюди, де учень
		 * користується механікою випускника, підпис і посилання лишалися
		 * випускницькими. Тут зібрано те, що видно читачеві на його сторінці.
		 */
		await gotoReady(page, `/projects/galaxy-graduates/${УЧНІ[0].slug}/`);

		/* Вкладка браузера — свій розділ, а не чужий. */
		await expect(page).toHaveTitle(/Планета творчості/);

		/* Опис для пошуку не порожній і не сам лише рядок імені: у учня немає ні
		   року випуску, ні майстрів курсу, з яких він складається у випускника. */
		const опис = await page.getAttribute('meta[name="description"]', 'content');
		expect(опис ?? '', 'опис сторінки учня').toContain('навчається');
	});

	/**
	 * ГОЛОВНЕ ПРО РОЗКЛАДКУ: ніщо ні на кого не налазить.
	 *
	 * Перевірка з'явилася 2026-09-08 за знімком автора: обличчя стояли спіраллю
	 * й накладалися підписами, з одинадцяти імен читалися п'ять. Тоді ми зробили
	 * три розкладки на вибір; того ж дня автор обрав «Планету й перелік», і
	 * решту прибрано. Перевірка лишилася тією самою по суті — вона про малюнок,
	 * а не про перемикач.
	 */
	test('обличчя не перекриваються, і кожен учень на кулі', async ({ page }) => {
		await gotoReady(page, ПЛАНЕТА);

		for (const учень of УЧНІ) {
			await expect(
				page.getByTestId(`creativity-planet-${учень.slug}-btn`),
				`${учень.name} зник із кулі`
			).toBeVisible();
		}

		/*
		 * Попарне порівняння КІЛ, а не прямокутників.
		 *
		 * Обличчя круглі, і в перших редакціях цієї перевірки стояло перетинання
		 * рамок — воно дало хибну тривогу одразу: два кола по діагоналі одне від
		 * одного не торкаються, а їхні рамки перетинаються кутами. Тому міряється
		 * відстань між центрами, і порівнюється вона з півсумою діаметрів — тобто
		 * рівно з тим, що видно очима. Допуск 1 px — округлення розкладки.
		 */
		const накладки = await page.evaluate((учні: { slug: string; name: string }[]) => {
			const кола = учні.map((у) => {
				/* Перший span усередині кнопки — саме обличчя. */
				const r = document
					.querySelector(`[data-testid="creativity-planet-${у.slug}-btn"] span`)!
					.getBoundingClientRect();
				return { ім: у.name, x: r.left + r.width / 2, y: r.top + r.height / 2, d: r.width };
			});
			const знайдені: string[] = [];
			for (let i = 0; i < кола.length; i++) {
				for (let j = i + 1; j < кола.length; j++) {
					const a = кола[i];
					const b = кола[j];
					const треба = (a.d + b.d) / 2 - 1;
					const є = Math.hypot(a.x - b.x, a.y - b.y);
					if (є < треба) знайдені.push(`${a.ім} ↔ ${b.ім}: ${Math.round(є)} < ${Math.round(треба)}`);
				}
			}
			return знайдені;
		}, УЧНІ.map((у) => ({ slug: у.slug, name: у.name })));
		expect(накладки, 'обличчя налазять одне на одне').toEqual([]);
	});

	/**
	 * НАВЕДЕННЯ ПОКАЗУЄ ІМ'Я В ДВОХ МІСЦЯХ ОДРАЗУ.
	 *
	 * Прохання автора: підсвічувати учня в переліку — це вже працювало — і
	 * ПОКАЗУВАТИ ім'я під самим обличчям, прізвищем з нового рядка. Другого не
	 * було: плашка з іменем стояла лише в розкладці «Орбіти», яку прибрано.
	 *
	 * Два рядки перевіряються не текстом, а ГЕОМЕТРІЄЮ: два `span` з різним
	 * `top` — це і є перенос. Порівнювати рядки марно, бо один `textContent`
	 * однаковий і для «Марина Чебан», і для «Марина
Чебан».
	 */
	test('наведення на обличчя показує ім’я двома рядками й підсвічує в переліку', async ({
		page
	}, testInfo) => {
		test.skip(testInfo.project.name === 'mobile', 'на дотику наведення немає — там натиск');
		await gotoReady(page, ПЛАНЕТА);

		const учень = УЧНІ.find((у) => у.name.includes(' ')) ?? УЧНІ[0];
		await page.getByTestId(`creativity-planet-${учень.slug}-btn`).hover();

		/*
		 * Через локатор, а не одним `evaluate`: плашка проявляється переходом, і
		 * зчитаний одразу після наведення `opacity` — це середина анімації, тобто
		 * майже нуль. Перша редакція перевірки саме на цьому й почервоніла.
		 * `toHaveCSS` перепитує, доки перехід не добіжить.
		 */
		const плашка = page.getByTestId(`creativity-planet-${учень.slug}-tooltip`);
		await expect(плашка, 'плашки з іменем не видно').toHaveCSS('opacity', '1');

		const стан = await плашка.evaluate((el) => {
			const рядки = [...el.querySelectorAll('span')];
			return {
				рядків: рядки.length,
				різнийРівень:
					рядки.length === 2 &&
					рядки[1].getBoundingClientRect().top > рядки[0].getBoundingClientRect().top
			};
		});

		expect(стан.рядків, 'ім’я не розбите на два рядки').toBe(2);
		expect(стан.різнийРівень, 'прізвище стоїть у тому самому рядку').toBe(true);

		await expect(
			page.getByTestId(`creativity-planet-name-${учень.slug}-btn`),
			'у переліку учня не підсвічено'
		).toHaveClass(/is-active/);
	});

	test('пошук звужує перелік імен', async ({ page }) => {
		await gotoReady(page, ПЛАНЕТА);

		const перелік = page.getByTestId('creativity-planet-names-list');
		await expect(перелік.locator('li')).toHaveCount(УЧНІ.length);

		/* Перше слово імені: у реєстрі це прізвище, і воно точно одне. */
		await page.getByTestId('creativity-planet-search-input').fill(УЧНІ[0].name.split(' ')[0]);
		await expect(перелік.locator('li')).toHaveCount(1);
		await expect(перелік).toContainText(УЧНІ[0].name);
	});

	/**
	 * У КОГО НЕМАЄ ФОТО — КВІТКА БЕЗ КОЛА.
	 *
	 * Прохання автора, і концепція та сама, що в галактиці: «у кого є фото, буде
	 * мати більше місця, ніж ті, хто фото немає». Доти квітка сиділа в такому
	 * самому колі, як портрет, — тобто порожній запис важив на малюнку рівно
	 * стільки ж, скільки заповнений.
	 *
	 * Місце під обличчя при цьому те саме — від нього залежить, що ніхто ні на
	 * кого не налазить, і саме тому воно тут теж заміряне.
	 */
	test('без фото — квітка без кола, з фото — коло; місце в обох те саме', async ({ page }) => {
		await gotoReady(page, ПЛАНЕТА);

		/*
		 * Наявність фото питається в DOM, а не в реєстрі: у самому
		 * `graduates.index.json` цього поля немає — воно виводиться при читанні.
		 * Заразом перевірка не застаріє, коли учні почнуть надсилати знімки:
		 * правило звіряється для КОЖНОГО, і кожен потрапляє у свою гілку.
		 */
		const огляд = await page.evaluate((слаги: string[]) =>
			слаги.map((слаг) => {
				const face = document.querySelector(
					`[data-testid="creativity-planet-${слаг}-btn"] span`
				)!;
				const с = getComputedStyle(face);
				return {
					слаг,
					зФото: Boolean(face.querySelector('img')),
					тло: с.backgroundColor,
					рамка: parseFloat(с.borderTopWidth),
					тінь: с.boxShadow,
					ширина: Math.round(face.getBoundingClientRect().width)
				};
			}),
		УЧНІ.map((у) => у.slug));

		const прозоре = /rgba\(0, 0, 0, 0\)|transparent/;
		const біди: string[] = [];
		for (const о of огляд) {
			if (о.зФото) {
				if (о.рамка === 0) біди.push(`${о.слаг}: портрет без кола`);
			} else {
				if (!прозоре.test(о.тло)) біди.push(`${о.слаг}: під квіткою тло ${о.тло}`);
				if (о.рамка !== 0) біди.push(`${о.слаг}: під квіткою рамка ${о.рамка}px`);
				if (о.тінь !== 'none') біди.push(`${о.слаг}: під квіткою тінь`);
			}
			/* Місце те саме в обох випадках — на ньому тримається відсутність накладок. */
			if (о.ширина < 30) біди.push(`${о.слаг}: місце під обличчя лише ${о.ширина}px`);
		}
		expect(біди, біди.join('\n')).toEqual([]);

		/* Перевірка жива: хоч один учень без фото на сторінці таки є. */
		expect(огляд.some((о) => !о.зФото), 'усі з фото — гілка квітки не перевірена').toBe(true);
	});

	test('натискання відкриває картку з власною адресою і без року випуску', async ({
		page
	}, testInfo) => {
		test.skip(
			testInfo.project.name === 'mobile',
			'на вузькому екрані картка не відкривається, а веде на саму сторінку — окрема поведінка'
		);
		await gotoReady(page, ПЛАНЕТА);

		const учень = УЧНІ[0];
		await page.getByTestId(`creativity-planet-${учень.slug}-btn`).click();

		const картка = page.getByTestId('galaxy-card-modal');
		await expect(картка).toBeVisible();
		await expect(картка).toContainText(учень.name);
		await expect(page).toHaveURL(new RegExp(`/${учень.slug}/?$`));

		/* «навчається» замість «випуск ####» — і жодного року поруч з іменем. */
		await expect(картка).not.toContainText(/випуск\s+\d{4}/i);
	});
});
