/**
 * Одноразовий інструмент міграції: знімає вміст Google Sites у `.temp/`.
 *
 * ## Чому Playwright, а не fetch
 *
 * Google Sites віддає застосунок, а не сторінку: у HTML першої відповіді немає
 * ані тексту, ані посилань — усе домальовує JavaScript. `fetch` тут повернув би
 * оболонку, і краулер «успішно» зібрав би нуль сторінок. Playwright у проєкті
 * вже стоїть заради E2E, тож нової залежності це не додає.
 *
 * ## Що виявилося при першому обході (і чому скрипт саме такий)
 *
 * Структура сайту не така, як здається з навігації:
 *
 *   • сторінок усього ЧОТИРИ — `/GG`, `/Actor-business-cards`, `/Donation`,
 *     `/Photo-archive`;
 *   • випускники — НЕ окремі сторінки. Усі вони лежать одним документом `/GG`
 *     (22 487 px висоти), а «сторінка випускника» — це `<section>` усередині,
 *     на яку веде якір `#h.xxxxxxxx`. Тому обхід за посиланнями сам собою дав
 *     би 4 файли й жодного випускника; записи дістаються з `sections`.
 *   • `[role="main"]` існує й містить 21 символ — тобто це НЕ контейнер вмісту.
 *     Перша версія цього скрипта чекала на текст саме в ньому й не дочекалася.
 *     Тому корінь вибирається за найдовшим текстом серед кандидатів, а обраний
 *     селектор пишеться в манифест — щоб зміна розмітки Google була видима, а
 *     не тиха.
 *   • зображення ліниві: без прокрутки завантажується 8 із усіх. Тому
 *     `autoScroll` обов'язковий, і без нього дамп фотографій був би майже
 *     порожній — при зеленому виводі.
 *
 * ## Чому НЕ в postbuild
 *
 * Це не гейт і не крок збірки. Збірка сайту не має залежати від доступності
 * чужого хостингу: інакше падіння Google Sites стає падінням нашого деплою.
 * Запускається руками: `npm run crawl:ats`.
 *
 * ## Що на виході (усе в `.temp/ats-ua/`, каталог у .gitignore)
 *
 *   manifest.json      машинний індекс: сторінки, секції, зображення, посилання
 *   pages/<slug>.md    текст сторінки з розбиттям на секції — читати очима
 *   raw/<slug>.html    відрендерений HTML — звідси дістається структура картки
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_URL = 'https://sites.google.com/view/ats-ua';

/** Межа обходу: усе, що не під цим шляхом, вважається зовнішнім. */
const SCOPE = '/view/ats-ua';

/**
 * Кандидати на корінь вмісту, у порядку спадання довіри. Вибирається той, у
 * якого найдовший текст: `[role="main"]` у цьому сайті майже порожній, і
 * покладатися на один селектор виявилося неможливо.
 */
const CONTENT_ROOTS = ['[role="main"]', 'main', '.UtePc', 'body'];

const args = new Map(
	process.argv.slice(2).map((a) => {
		const [key, value] = a.replace(/^--/, '').split('=');
		return [key, value ?? 'true'] as const;
	})
);

const OUT_DIR = args.get('out') ?? path.join('.temp', 'ats-ua');
const DELAY_MS = Number(args.get('delay') ?? 700);
/** Стеля на випадок, якщо межа обходу виявиться ширшою, ніж очікували. */
const LIMIT = Number(args.get('limit') ?? 50);

interface ImageRef {
	src: string;
	alt: string;
	width: number;
	height: number;
}

interface SectionRecord {
	id: string;
	heading: string;
	textLength: number;
	text: string;
	images: ImageRef[];
	links: string[];
}

interface PageRecord {
	url: string;
	slug: string;
	file: string;
	title: string;
	contentRoot: string;
	textLength: number;
	sections: SectionRecord[];
	images: ImageRef[];
	internalLinks: string[];
	externalLinks: string[];
}

/**
 * Адреса до порівнянного вигляду.
 *
 * Хеш відрізається навмисно: сотні посилань `/GG#h.xxxx` — це якорі однієї
 * сторінки, і без цього краулер обходив би `/GG` дев'ятсот разів. Регістр НЕ
 * нормалізується — у цього сайту він значущий (`/GG`, `/Actor-business-cards`).
 */
function normalize(raw: string): string | null {
	let url: URL;
	try {
		url = new URL(raw, ROOT_URL);
	} catch {
		return null;
	}
	if (url.hostname !== 'sites.google.com') return null;
	if (!url.pathname.startsWith(SCOPE)) return null;

	url.search = '';
	url.hash = '';
	if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
		url.pathname = url.pathname.slice(0, -1);
	}
	return url.toString();
}

/**
 * Ім'я файлу зі шляху адреси.
 *
 * Кириличні адреси приходять percent-encoded, тож спершу декодуються — інакше
 * файли звалися б `%D0%93%D0%B0…`. Далі викидається все, чого Windows не
 * дозволяє в іменах. Відповідність «slug ↔ адреса» лишається в манифесті, тож
 * жодна адреса не губиться навіть після заміни символів.
 */
function slugFor(url: string): string {
	const tail = new URL(url).pathname.slice(SCOPE.length).replace(/^\//, '');
	if (!tail) return '_home';

	let decoded: string;
	try {
		decoded = decodeURIComponent(tail);
	} catch {
		decoded = tail;
	}

	return decoded
		.replace(/\//g, '__')
		.replace(/[<>:"\\|?*]/g, '-')
		.replace(/\s+/g, '-')
		.replace(/-{2,}/g, '-')
		.slice(0, 120);
}

/** Три й більше переносів підряд → один порожній рядок. */
function collapseBlankLines(text: string): string {
	return text
		.split('\n')
		.map((line) => line.trimEnd())
		.join('\n')
		.replace(/\n\s*\n(\s*\n)+/g, '\n\n')
		.trim();
}

/**
 * Прокрутити всю сторінку, щоб доїхали ліниві зображення.
 *
 * Заміряно на `/GG`: без прокрутки в DOM 8 зображень, і саме вони пішли б у
 * дамп. Скрипт при цьому завершився б успішно — рівно той клас тихої втрати,
 * від якого не рятує код виходу.
 */
async function autoScroll(page: Page): Promise<void> {
	await page.evaluate(async () => {
		const step = Math.max(400, window.innerHeight - 100);
		for (let y = 0; y < document.body.scrollHeight; y += step) {
			window.scrollTo(0, y);
			await new Promise((resolve) => setTimeout(resolve, 150));
		}
		window.scrollTo(0, 0);
		await new Promise((resolve) => setTimeout(resolve, 400));
	});
}

/**
 * Витягує все потрібне одним заходом у сторінку — менше раундтрипів.
 *
 * УВАГА до форми запису. Усередині `page.evaluate` немає жодної названої
 * функції й жодного `const`-стрілки: `tsx` (esbuild) обгортає такі оголошення
 * хелпером `__name`, якого в контексті сторінки не існує, і виклик падає з
 * `ReferenceError: __name is not defined`. Тому лише анонімні колбеки на місці.
 *
 * Текст беремо з найдовшого кандидата, а зображення — завжди з `body`:
 * заміряно, що `.UtePc` містить 12 656 символів тексту й НУЛЬ зображень, тобто
 * прив'язати те й те до одного кореня не можна.
 */
async function extract(page: Page, roots: string[]) {
	return page.evaluate((candidates: string[]) => {
		let rootSelector = 'body';
		let root: Element = document.body;
		let best = (document.body.innerText ?? '').trim().length;

		for (const selector of candidates) {
			const el = document.querySelector(selector);
			const len = el ? ((el as HTMLElement).innerText ?? '').trim().length : 0;
			if (el && len > best) {
				root = el;
				rootSelector = selector;
				best = len;
			}
		}

		// Зображення збираються ОДИН раз, разом із посиланням на елемент: далі
		// секції відбирають свої через `contains`, і другого проходу не потрібно.
		// Прозорі пікселі-розпірки та іконки інтерфейсу відкидаються за розміром.
		const allImages = [...document.body.querySelectorAll('img')]
			.map((img) => ({
				el: img as Element,
				src: img.currentSrc || img.src,
				alt: img.alt ?? '',
				width: img.naturalWidth,
				height: img.naturalHeight
			}))
			.filter((i) => i.src.startsWith('http') && (i.width > 32 || i.height > 32));

		// Секції — це і є «сторінки випускників»: на кожну веде якір #h.xxxx.
		// Порожні службові обгортки Google Sites відсіюються за довжиною тексту.
		const sections = [...document.querySelectorAll('section[id]')]
			.map((el) => ({
				id: el.id,
				heading: el.querySelector('h1, h2, h3, h4')?.textContent?.trim() ?? '',
				text: ((el as HTMLElement).innerText ?? '').trim(),
				images: allImages
					.filter((i) => el.contains(i.el))
					.map((i) => ({ src: i.src, alt: i.alt, width: i.width, height: i.height })),
				links: [
					...new Set(
						[...el.querySelectorAll('a[href]')].map((a) => (a as HTMLAnchorElement).href)
					)
				]
			}))
			.filter((s) => s.text.length > 20);

		return {
			rootSelector,
			title: (document.querySelector('h1')?.textContent ?? document.title).trim(),
			text: ((root as HTMLElement).innerText ?? '').trim(),
			html: root.innerHTML,
			images: allImages.map((i) => ({ src: i.src, alt: i.alt, width: i.width, height: i.height })),
			sections,
			// Навігація живе ПОЗА коренем вмісту, а саме нею сторінки й знаходяться.
			hrefs: [
				...new Set(
					[...document.querySelectorAll('a[href]')].map((a) => (a as HTMLAnchorElement).href)
				)
			]
		};
	}, roots);
}

async function visit(page: Page, url: string): Promise<PageRecord | null> {
	const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
	if (response && response.status() >= 400) {
		console.warn(`  ! ${response.status()} — пропущено`);
		return null;
	}

	// Не `networkidle`: Google Sites тримає довгі з'єднання й затихає не завжди.
	// Ознака готовності — що на сторінці з'явився текст.
	await page
		.waitForFunction(() => document.body.innerText.trim().length > 200, undefined, {
			timeout: 20_000
		})
		.catch(() => {
			console.warn('  ! текст не набрався за 20 c — беремо, що є');
		});

	await autoScroll(page);

	const raw = await extract(page, CONTENT_ROOTS);

	// Порожні рядки стискаються тут, а не в `page.evaluate`.
	//
	// Причина прозаїчна й варта запису: `innerText` віддає до десятка порожніх
	// рядків між блоками Google Sites, і без стискання файл читати неможливо.
	// А робити це всередині evaluate не варто — там регулярка з екрануванням
	// двічі приїхала у файл справжнім переносом і зламала розбір скрипта.
	const data = { ...raw, text: collapseBlankLines(raw.text) };
	const slug = slugFor(url);

	const internal: string[] = [];
	const external: string[] = [];
	for (const href of data.hrefs) {
		const inScope = normalize(href);
		if (inScope) internal.push(inScope);
		else if (/^https?:/.test(href)) external.push(href.split('#')[0]);
	}

	fs.writeFileSync(path.join(OUT_DIR, 'raw', `${slug}.html`), data.html, 'utf8');

	const lines = [
		'---',
		`url: "${url}"`,
		`title: ${JSON.stringify(data.title)}`,
		`contentRoot: "${data.rootSelector}"`,
		`sections: ${data.sections.length}`,
		`images: ${data.images.length}`,
		'---',
		''
	];

	if (data.sections.length > 0) {
		// Секціями, а не одним полотном: у `/GG` кожна секція — окремий
		// випускник, і саме в такому вигляді цей файл читається як база.
		for (const section of data.sections) {
			lines.push(`## ${section.heading || section.id}`, '', `<!-- anchor: #${section.id} -->`, '');
			lines.push(section.text, '');
			for (const image of section.images) {
				lines.push(`![${image.alt}](${image.src}) <!-- ${image.width}x${image.height} -->`);
			}
			lines.push('', '---', '');
		}
	} else {
		lines.push(data.text, '');
	}

	fs.writeFileSync(path.join(OUT_DIR, 'pages', `${slug}.md`), lines.join('\n'), 'utf8');

	return {
		url,
		slug,
		file: `pages/${slug}.md`,
		title: data.title,
		contentRoot: data.rootSelector,
		textLength: data.text.length,
		sections: data.sections.map((s) => ({ ...s, textLength: s.text.length })),
		images: data.images,
		internalLinks: [...new Set(internal)].sort(),
		externalLinks: [...new Set(external)].sort()
	};
}

async function main() {
	for (const sub of ['pages', 'raw']) {
		fs.mkdirSync(path.join(OUT_DIR, sub), { recursive: true });
	}

	const start = normalize(ROOT_URL);
	if (!start) throw new Error(`ROOT_URL поза межею обходу: ${ROOT_URL}`);

	const queue: string[] = [start];
	const seen = new Set<string>([start]);
	const records: PageRecord[] = [];

	let browser: Browser | null = null;
	try {
		browser = await chromium.launch();
		const context = await browser.newContext({
			locale: 'uk-UA',
			viewport: { width: 1440, height: 1000 }
		});
		const page = await context.newPage();

		while (queue.length > 0 && records.length < LIMIT) {
			const url = queue.shift()!;
			console.log(`[${records.length + 1}/${seen.size}] ${url}`);

			const record = await visit(page, url);
			if (record) {
				records.push(record);
				console.log(
					`      секцій ${record.sections.length}, зображень ${record.images.length}, тексту ${record.textLength}`
				);
				for (const link of record.internalLinks) {
					if (!seen.has(link)) {
						seen.add(link);
						queue.push(link);
					}
				}
			}

			if (queue.length > 0) await page.waitForTimeout(DELAY_MS);
		}

		if (queue.length > 0) {
			console.warn(
				`! ліміт ${LIMIT} досягнуто, у черзі лишилося ${queue.length} — підніміть --limit`
			);
		}
	} finally {
		await browser?.close();
	}

	// Зовнішні хости окремим переліком: саме вони показують, на що вміст
	// спирається (YouTube, Facebook, Instagram) — і саме їм знадобляться
	// директиви CSP, коли вміст переїде до нас.
	const externalHosts = [
		...new Set(records.flatMap((r) => r.externalLinks).map((u) => new URL(u).hostname))
	].sort();

	const manifest = {
		root: ROOT_URL,
		crawledAt: new Date().toISOString(),
		pages: records.length,
		discovered: seen.size,
		totalSections: records.reduce((n, r) => n + r.sections.length, 0),
		totalImages: records.reduce((n, r) => n + r.images.length, 0),
		externalHosts,
		records
	};

	fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

	console.log('');
	console.log(`OK сторінок ${records.length} із ${seen.size} знайдених`);
	console.log(`   секцій ${manifest.totalSections}, зображень ${manifest.totalImages}`);
	console.log(`   зовнішні хости: ${externalHosts.join(', ') || '—'}`);
	console.log(`   ${path.resolve(OUT_DIR)}`);

	// Canary: сторінка без тексту або без секцій означає, що розмітка Google
	// змінилася й селектори більше не влучають. Без цього рядка обхід виглядав
	// би успішним і віддавав порожнечу.
	const suspicious = records.filter((r) => r.textLength < 200);
	if (suspicious.length > 0) {
		console.warn(`! ${suspicious.length} сторінок майже без тексту — перевірте вручну:`);
		for (const record of suspicious) console.warn(`   ${record.url}`);
	}
}

main().catch((error) => {
	console.error('! обхід не завершився:', error);
	process.exit(1);
});
