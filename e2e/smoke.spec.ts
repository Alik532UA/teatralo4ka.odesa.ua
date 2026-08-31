import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { PUBLIC_PAGES } from './pages';
import { gotoReady } from './ready';
import { stripLocale } from '../src/lib/i18n/routing';

/**
 * Перевірка тотожності — перший тест не випадково.
 *
 * У цій екосистемі вже було: Playwright одного проєкту під'єднався до
 * dev-сервера іншого на спільному порту й пройшов повністю, перевіряючи чужий
 * сайт. Якщо на 5195 опиниться щось стороннє, прогін має впасти тут, а не
 * видати зелене на чужій розмітці.
 */
test('на порту саме цей сайт, а не сусідній проєкт', async ({ page }) => {
	await page.goto('/');
	// Обидві мови: desktop-проєкт ходить українською, mobile — англійською.
	await expect(page).toHaveTitle(/Одеська театральна школа|Odesa Theatre School/);
	/**
	 * Маркер мусить бути в ПРЕРЕНДЕРЕНОМУ HTML, інакше цей тест перевіряє не
	 * тотожність сайту, а швидкість мережі.
	 *
	 * Раніше тут стояв `burger-menu-btn`, якого в `build/index.html` немає
	 * зовсім (перевірено grep-ом): уся шапка за `{#if headerReady}`, а
	 * `headerReady` вмикається лише після відповіді `getHeaderSettings()`. У
	 * тестовому середовищі Firestore віддає 400 — прапорець усе одно
	 * виставляється у `.finally()`, але вже після провалу запиту, і чекання в
	 * 5 секунд цю гонку іноді втрачало. Той самий race один раз віддав сторінку
	 * помилки замість головної.
	 *
	 * Кнопка піаніно в підвалі підходить краще за все: вона є в статиці й
	 * навряд чи трапиться на сусідньому проєкті.
	 */
	await expect(page.getByTestId('footer-piano-btn').first()).toBeAttached();
});

/**
 * Сторінки, чий вміст приходить із Firestore уже в браузері. Для них «застряг
 * на завантаженні» — нормальний проміжний стан, а без мережі й кінцевий, тож
 * перевіряти на ньому нема чого.
 */
const CONTENT_FROM_FIRESTORE = ['/', '/news', '/projects'];

/** Індикатори завантаження обома мовами. */
const LOADING = /Завантаження|Loading/i;

test.describe('сторінки віддають вміст', () => {
	for (const path of PUBLIC_PAGES) {
		test(`${path} — не порожня`, async ({ page }) => {
			const response = await gotoReady(page, path);
			expect(response?.status(), `${path} має віддавати 200`).toBe(200);

			// Поріг 120, а не «на око»: найкоротші справжні сторінки проєкту дають
			// близько 180 символів разом із шапкою й підвалом, а зламана — близько
			// 60 («← Усі проєкти / Завантаження…»). Число стоїть між ними.
			const text = (await page.locator('body').innerText()).trim();
			expect(text.length, `${path}: тіло майже порожнє`).toBeGreaterThan(120);

			// Порівнюється шлях БЕЗ мовного префікса: `/en/` — це та сама головна,
			// що й `/`, і вміст їй так само приходить із Firestore уже в браузері.
			// Без цього англійські дзеркала трьох сторінок падали на «Loading…»,
			// хоч поводилися рівно так, як їхні українські відповідники.
			if (!CONTENT_FROM_FIRESTORE.includes(stripLocale(path))) {
				// Саме так виглядав /projects/spring-odesa-theatre: маршрут просив
				// файл з іншим регістром, glob його не знаходив, і сторінка назавжди
				// лишалася на «Завантаження…». Ані типи, ані збірка цього не бачили.
				const main = (await page.locator('main').innerText()).trim();
				expect(main, `${path}: вміст так і не завантажився`).not.toMatch(LOADING);
			}
		});
	}
});

test.describe('canonical і заголовки', () => {
	for (const path of PUBLIC_PAGES) {
		test(`${path} — canonical вказує на власний домен`, async ({ page }) => {
			await gotoReady(page, path);

			const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
			expect(canonical, `${path}: canonical відсутній`).toBeTruthy();

			// Під час prerender `page.url.origin` дорівнює "sveltekit-prerender",
			// а `base` з $app/paths відносний — обидва вже потрапляли в розмітку
			// цього проєкту у вигляді "https://teatralo4ka.odesa.ua../".
			expect(canonical, `${path}: чужий або зламаний origin у canonical`).toMatch(
				/^https:\/\/teatralo4ka\.odesa\.ua(\/|$)/
			);
			expect(canonical).not.toContain('..');
			expect(canonical).not.toContain('sveltekit-prerender');

			const title = await page.title();
			expect(title.trim().length, `${path}: порожній title`).toBeGreaterThan(0);
			// Головна вже і є брендом — дублювання назви ловилося раніше руками.
			expect(title).not.toMatch(/(Одеська театральна школа|Odesa Theatre School).*\1/);
		});
	}
});

test('JSON-LD парситься і не містить сирих кутових дужок', async ({ page }) => {
	await page.goto('/');
	const raw = await page.locator('script[type="application/ld+json"]').innerText();

	// `JSON.stringify` не екранує косу риску, тож рядок "</script>" у словнику
	// перекладу закрив би тег. Екранування `<` перевіряється саме тут.
	expect(raw).not.toContain('<');

	const data = JSON.parse(raw);
	expect(data['@type']).toBe('EducationalOrganization');
	expect(data.logo).toMatch(/^https:\/\/teatralo4ka\.odesa\.ua\//);
	expect(data.logo).not.toContain('..');
});

test('sitemap перелічує тільки адреси, які справді існують', async ({ page }) => {
	// З диска, а не через HTTP: `vite preview` нормалізує шляхи і відповідає на
	// /sitemap.xml перенаправленням 308 на /sitemap.xml/ — артефакт саме превʼю,
	// якого немає на GitHub Pages, де це звичайний статичний файл. Через HTTP
	// тест бачив би порожнечу і падав на рівному місці.
	const xml = readFileSync('build/sitemap.xml', 'utf8');
	const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

	expect(urls.length, 'sitemap порожній').toBeGreaterThan(0);

	/*
	 * Запити йдуть ПАКЕТАМИ, і це не прикраса.
	 *
	 * Доти вони йшли по одному, і при 28 адресах це було непомітно. Сторінки
	 * вистав довели мапу до 1089 адрес (заміряно 2026-08-31), послідовний обхід
	 * перестав укладатися в 30 с — тест почав падати за часом, тобто мовчати про
	 * саму властивість, заради якої існує. Пакет по 25 лишає перевірку тією
	 * самою: жодна адреса не пропущена, просто чекання йде паралельно.
	 *
	 * Помилки збираються ВСІ, а не перша-ліпша: якщо мапа розійшлася з сайтом,
	 * корисно бачити масштаб, а не лише найранішу адресу за абеткою.
	 */
	const ПАКЕТ = 25;
	const биті: string[] = [];
	for (let i = 0; i < urls.length; i += ПАКЕТ) {
		const пакет = urls.slice(i, i + ПАКЕТ);
		const відповіді = await Promise.all(
			пакет.map(async (url) => {
				const path = new URL(url).pathname;
				return { path, status: (await page.request.get(path)).status() };
			})
		);
		биті.push(
			...відповіді.filter((r) => r.status !== 200).map((r) => `${r.path} → ${r.status}`)
		);
	}

	// Попередня версія sitemap будувалася зі списку markdown-файлів і пропонувала
	// пошуковику 28 адрес, з яких існувало 5.
	expect(
		биті,
		`адреси в sitemap, які не віддають 200 (${биті.length} із ${urls.length}):\n  ` +
			биті.slice(0, 20).join('\n  ')
	).toEqual([]);

	expect(urls.some((u) => u.includes('/admin')), 'адмінка не має бути в sitemap').toBe(false);
});

test('robots закриває адмінку', async () => {
	const robots = readFileSync('build/robots.txt', 'utf8');
	expect(robots).toMatch(/Disallow:\s*\/admin/);
	expect(robots).toMatch(/Sitemap:\s*https:\/\/teatralo4ka\.odesa\.ua\/sitemap\.xml/);
});
