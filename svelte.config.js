import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Хеш інлайн-скрипта теми обчислюється з app.html під час збірки, а не
// вписується руками: вписаний хеш розходиться з файлом при першому ж
// редагуванні, і скрипт після цього блокується мовчки.
//
// Раніше тут стояло, що dev-сервер CSP не застосовує. Це неправда — політика
// діє і в `vite dev`, порушення видно в консолі браузера. Помилку помітно не
// тому, що її нема де побачити, а тому, що заблокований ресурс нічого не
// ламає візуально: сторінка малюється, просто щось тихо не працює.
//
// ## `\r` ОБОВ'ЯЗКОВО прибирається перед хешуванням
//
// Браузер хешує НЕ байти файлу, а текстовий вузол скрипта після розбору HTML, а
// розбір нормалізує `\r\n` у `\n` (HTML Standard, «preprocessing the input
// stream»). Тому на машині, де `src/app.html` лежить із CRLF (Windows +
// `core.autocrlf`), хеш із файлу й хеш браузера РІЗНІ — заміряно 2026-08-23:
//   CRLF → sha256-gZ7ZVRfzFfd5h4FQkuj8N8PLpGEHXZsQmbA0Xk4TmBM=  (ішло в CSP)
//   LF   → sha256-go+B8c0R7F7waorBzlHweJGjRFwYXYU6BXDgSoH7a38=  (вимагав браузер)
//
// Наслідок був не косметичний: блокувався ВЕСЬ скрипт першого кадру, тобто
// разом із ним `data-splash` (заставка-куліси не вмикалася — лишався суцільний
// жовтий фон), анти-FOUC тема і клас смуги прокрутки. Симптом у консолі є, але
// сторінка при цьому малюється, тож дефект жив непоміченим.
//
// На Linux (CI, продакшн) файл із LF, хеші збігалися, і саме тому E2E-перевірка
// `e2e/csp.spec.ts` була зелена там, де дефекту немає, і не запускалася там, де
// він є. Інваріант `src/csp-hash.test.ts` тепер ловить це в юніт-прогоні.
function inlineThemeScript() {
	const html = readFileSync('src/app.html', 'utf8');
	const open = '<script>';
	const close = '</' + 'script>';
	const start = html.indexOf(open);
	const end = html.indexOf(close, start);
	if (start < 0 || end < 0) {
		throw new Error('app.html: інлайн-скрипт теми не знайдено — CSP заблокує його мовчки');
	}
	return html.slice(start + open.length, end).replace(/\r\n/g, '\n');
}

/**
 * Приведення типу тут не косметика, а наслідок того, що цей файл ДОСІ не
 * перевірявся типами: `svelte-check` дивиться на `src/`, а імпортували конфіг
 * лише `scripts/` та `e2e/`, які в перевірку не входять. Щойно його зажадав
 * інваріант із `src/` (`beta-checklist.test.ts`), виявилося сім невідповідностей
 * — усі латентні й усі саме такого роду: SvelteKit чекає літеральні типи
 * (`sha256-${string}`, `/${string}`), а тут стояв широкий `string`.
 *
 * @type {`sha256-${string}`}
 */
const themeScriptHash = `sha256-${createHash('sha256').update(inlineThemeScript()).digest('base64')}`;

/**
 * Публічні сторінки — джерело для `prerender.entries` обох мов.
 *
 * Тримається окремою константою, бо `scripts/generate-sitemap.ts` перевіряє цей
 * самий перелік проти реального `build/`: адреса, якої не існує, валить збірку.
 * Раніше в списку роками жила неіснуюча '/test' і
 * '/projects/spring-Odesa-theatre' із великою «O» — остання збиралася лише тому,
 * що Windows не розрізняє регістр.
 */
const PUBLIC_ENTRIES = [
	'/',
	'/about',
	'/history',
	'/contacts',
	'/admission',
	'/documents',
	'/documents/statute',
	'/news',
	'/projects',
	'/departments/theatre',
	'/departments/aesthetic',
	'/departments/music',
	'/departments/art',
	'/residents/adults',
	'/residents/kids',
	'/residents/graduates',
	'/projects/teatr-pro',
	'/projects/festival',
	'/projects/galaxy-graduates',
	'/projects/creativity-planet',
	// Дві адреси, які існують заради ПРЕВ'Ю в месенджері: посилання на
	// оголошення й на анкету роздають руками, а `?update=open` / `?form=open`
	// власного підпису мати не можуть — query-рядок у мета-теги не потрапляє.
	// Тут вони обов'язкові: prerender знаходить сторінки за ПОСИЛАННЯМИ, а на
	// ці двоє з сайту нічого не веде (їх роздають зовні). Заміряно: без цих
	// рядків у `build/` не з'явилося жодного з чотирьох файлів (дві сторінки
	// × дві мови), хоч dev-сервер їх віддавав.
	'/projects/galaxy-graduates/update',
	'/projects/galaxy-graduates/form',
	// Новина, яка живе в коді. Тут вона обов'язкова з ДВОХ причин, і кожну
	// заміряно на цій самій новині:
	//
	//   1. `entries()` у `news/[id]/+page.ts` дає лише українську адресу —
	//      англійська (`/en/news/…`) народжується з цього переліку, бо мовний
	//      префікс у цьому проєкті робить хук `reroute`, а не маршрут. Без
	//      рядка в `build/` був `news/2026-09-04/`, а `en/news/2026-09-04/` не
	//      було, і мапа сайту показала 1484 українські проти 1365 англійських.
	//   2. Той самий висновок, що вже записаний нижче для адрес-прев'ю:
	//      prerender шукає сторінки за ПОСИЛАННЯМИ, а на чернетку з переліку
	//      новин нічого не веде — тобто без цього рядка її не збирала б і
	//      українська гілка, щойно новина перестане бути єдиною.
	'/news/2026-year-30th-season-18-students',
	// Друга новина в коді — і саме той випадок, який передбачає пункт 2 вище:
	// новина перестала бути єдиною, і без цього рядка англійської сторінки в
	// `build/` не з'являлося (заміряно: `news/30th-season-opened-2026/` був,
	// `en/news/30th-season-opened-2026/` — ні, мапа сайту 1543 проти 1424).
	'/news/30th-season-opened-2026',
	// Стара адреса тієї самої новини: сторінка перенаправлення. Розбір — у
	// `src/lib/config/newsAliases.ts`.
	'/news/30-y-sezon-i-17-studentiv-2026',
	'/projects/photo-archive',
	'/projects/spring-odesa-theatre',
	'/projects/support-production',
	'/fest-odesa-teatr-pro',
	'/fest-odessa-teatr-pro'
];

/**
 * Службові сторінки: збираються, але поза індексом.
 *
 * Окремою константою від `PUBLIC_ENTRIES` навмисно. Обидва переліки їдуть у
 * `prerender.entries` — тобто сторінка мусить існувати в кожній мові, і
 * `generate-sitemap.ts` це перевіряє, — але плутати їх не можна: у службової
 * немає ані canonical, ані hreflang, і перевірка «canonical є» падала б на ній
 * щоразу.
 *
 * Джерело переліку — `src/lib/config/hiddenRoutes.ts` (BETA-CHECKLIST-v8 § 4.1).
 * Тут воно повторене дослівно, бо цей файл — конфіг збірки, а не модуль
 * застосунку: аліаса `$lib` і TypeScript тут немає. Збіг двох написань тримає
 * інваріант `src/beta-checklist.test.ts` — інакше це були б два списки, які
 * розходяться.
 */
const HIDDEN_ENTRIES = ['/beta-test-checklists', '/projects/galaxy-graduates/stats'];
import adapter from '@sveltejs/adapter-static';
import { relative, sep } from 'node:path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// defaults to rune mode for the project, except for `node_modules`. Can be removed in svelte 6.
		runes: ({ filename }) => {
			const relativePath = relative(import.meta.dirname, filename);
			const pathSegments = relativePath.toLowerCase().split(sep);
			const isExternalLibrary = pathSegments.includes('node_modules');

			return isExternalLibrary ? undefined : true;
		}
	},
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			/*
			 * ПОПЕРЕДНЬОГО стискання немає, і це не економія на швидкості.
			 *
			 * Сайт публікується на GitHub Pages, а вона стискає відповіді на льоту
			 * й не робить узгодження на кшталт `gzip_static`: сусідній файл
			 * `index.html.gz` вона не віддасть нікому ніколи. Тобто 6444 файли, які
			 * створювало це вмикання, були мертвою вагою в артефакті.
			 *
			 * Але головне не вага, а те, що з нею збірка ПАДАЛА. `compress()` в
			 * `@sveltejs/kit` робить `Promise.all` без жодного обмеження й по два
			 * потоки на кожен формат: чотири дескриптори на файл, усі одночасно.
			 * Заміряно на цій збірці: 3220 файлів під стискання, тобто 12 880
			 * дескрипторів; процес умирав на 5726 із `EMFILE: too many open files`.
			 *
			 * Довго це виглядало як вада оточення — «на Windows мало дескрипторів».
			 * Насправді межа тут ні до чого: жодне оточення не витримає дванадцяти
			 * тисяч одночасних потоків, і на Linux у CI збірка теж підійшла б до
			 * межі, просто пізніше.
			 *
			 * Якщо колись з'явиться хост, що віддає передстиснуте, повертати треба
			 * не цей прапорець, а власний крок у `postbuild` з обмеженою
			 * паралельністю.
			 */
			precompress: false,
			strict: true
		}),
		// Домени взято зі зібраного бандла, а не зі здогадок: Firebase Auth,
		// Firestore, Google Analytics. Забути connect-src означає, що запити
		// блокуються мовчки, а код виглядає робочим.
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': [
					'self',
					themeScriptHash,
					'https://www.googletagmanager.com',
					'https://apis.google.com',
					// reCAPTCHA, яку підтягує Firebase Auth. Знайдено не в бандлі,
					// а в консолі браузера: сам виклик робить SDK у рантаймі.
					'https://www.google.com',
					'https://www.gstatic.com'
				],
				'connect-src': [
					'self',
					'https://*.googleapis.com',
					'https://*.google-analytics.com',
					'https://*.analytics.google.com',
					'https://securetoken.google.com',
					// reCAPTCHA не лише завантажується, а й шле власні запити.
					// Знайдено в консолі браузера вже після того, як script-src
					// був виправлений: кожен шар CSP відкриває наступний.
					'https://www.google.com',
					// Те саме з клієнтом Google API: він є в script-src, а телеметрію
					// шле на /js/gen_204. Спіймав E2E на одній сторінці з двадцяти —
					// запит іде не завжди, тож око його могло б і не побачити.
					'https://apis.google.com',
					'https://*.sentry.io',
					'https://*.ingest.sentry.io'
				],
				'img-src': ['self', 'data:', 'blob:', 'https:'],
				// Без цієї директиви `default-src 'self'` мовчки блокував звуки
				// піаніно: сторінка й далі малювалася, клавіші підсвічувалися,
				// не було лише звуку. Локальний метроном тікера покривається
				// `self`, зовнішні семпли — ні.
				'media-src': ['self', 'https://carolinegabriel.com'],
				'style-src': ['self', 'unsafe-inline'],
				'font-src': ['self', 'data:'],
				'frame-src': [
					'self',
					'https://*.firebaseapp.com',
					'https://accounts.google.com',
					'https://www.google.com',
					'https://docs.google.com',
					// Санітайзер статей навмисно дозволяє <iframe> заради вбудованого
					// відео (`DOMPURIFY_HTML_CONFIG.ADD_TAGS`). Без цих джерел вийшло б
					// те саме, що зі звуком піаніно: розмітка проходить санітизацію, а
					// показати її політика не дає — і виглядає це як порожня рамка.
					'https://www.youtube.com',
					'https://www.youtube-nocookie.com',
					'https://player.vimeo.com'
				],
				// Firebase App Check створює Worker із blob-адреси.
				//
				// У продакшні це проходило через фолбек на `script-src`, а в dev —
				// ні. Причина в тому, що політика доставляється по-різному: dev-сервер
				// віддає її ЗАГОЛОВКОМ і додає nonce, adapter-static кладе мета-тегом
				// без nonce. Покладатися на фолбек уже двічі коштувало (media-src,
				// frame-src), тож директива задається явно й однаково для обох.
				'worker-src': ['self', 'blob:'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self']
			}
		},
		paths: {
			base: ''
		},
		prerender: {
			crawl: true,
			// Перелік перевіряється після збірки (scripts/generate-sitemap.ts):
			// `handleUnseenRoutes: 'ignore'` мовчки пропускає адресу, якої немає,
			// тож без перевірки помилка тут не видно ніде. Так у списку роками
			// жила неіснуюча '/test' і '/projects/spring-Odesa-theatre' з великою
			// «O» — остання збиралася лише тому, що Windows не розрізняє регістр.
			// Приведення на весь перелік, а не на кожен спред: `Array.map()` віддає
			// широкий `string[]`, і без цього кожен елемент масиву не збігався б із
			// очікуваним `/${string}` — сім помилок на рівному місці. Причина, чому
			// їх не бачили раніше, — у коментарі до `themeScriptHash`.
			entries: /** @type {Array<'*' | `/${string}`>} */ ([
				// Публічні сторінки перелічені ОДИН раз, а англійські адреси
				// виводяться з них нижче. Два списки поруч розійшлися б на першій
				// же новій сторінці, і розходження було б тихим: сторінка є
				// українською, англійською її немає, збірка зелена.
				//
				// Мову в шляху обробляє хук `reroute` (src/hooks.ts): маршрут
				// шукається за адресою без префікса, тож окремих файлів для
				// `/en/…` не існує й існувати не повинно.
				...PUBLIC_ENTRIES,
				...PUBLIC_ENTRIES.map((path) => (path === '/' ? '/en/' : `/en${path}`)),
				// Службові сторінки — так само двома мовами. § 5.5 канону вимагає
				// перевіряти саме існування сторінки в КОЖНІЙ мові: зникнути може не
				// сторінка, а лише англійське дзеркало, і це найтихіший з варіантів.
				...HIDDEN_ENTRIES,
				...HIDDEN_ENTRIES.map((path) => `/en${path}`),
				// Адмінка мови в адресі не має: вона за входом, рендериться на
				// клієнті й закрита `Disallow: /admin/` у robots.txt.
				'/admin',
				'/admin/login'
			]),
			// 'fail', а не 'warn': попередження в логу збірки не бачить ніхто —
			// CI показує результат кроку, а він і з попередженнями зелений.
			// Ловить сторінку, чий `load` віддає помилку під час prerender.
			//
			// ЧОГО ЦЕ НЕ ЛОВИТЬ — і це перевірено, а не припущено. Посилання на
			// шлях, якого немає серед маршрутів, сюди НЕ доходить: із
			// `fallback: '404.html'` адаптер у режимі SPA, і незіставлений шлях
			// не є помилкою. Експеримент: додано <a href="/does-not-exist-anywhere">
			// на прередерену сторінку — збірка пройшла з кодом 0, і адреса не
			// згадана в логу жодного разу.
			//
			// Тобто биті внутрішні посилання нічим не перевіряються. Перевірка
			// для них можлива лише над `build/` (SEO-v8 § 6.1) і мусить уміти
			// відрізняти їх від адрес динамічних маршрутів `/news/[id]` та
			// `/projects/[slug]`, яких у `build/` немає навмисно.
			handleHttpError: 'fail',
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;
