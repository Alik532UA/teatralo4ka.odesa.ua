// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolveSiblingLocale, SIBLINGS, siblingUrl } from './siblings';
import { DEFAULT_LOCALE, LOCALES } from './i18n/routing';

/**
 * `siblings.ts` — ОДНА таблиця, скопійована у вісім репозиторіїв, і кожен із них
 * знає правду лише про свій рядок.
 *
 * Сусідні сайти будують посилання сюди з рядка `teatralo4ka`: дві мови,
 * українська на голій адресі, англійська сегментом. Симптом розходження
 * зʼявляється на ЧУЖОМУ сайті й через місяці, тож перевірка стоїть тут:
 * червоніє в тому репозиторії й на тому коміті, що його спричинив.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): прибрати `en` з `LOCALES`
 * — червоніє звірка мов; поміняти `DEFAULT_LOCALE` на `'en'` — червоніє мова
 * голої адреси; поміняти `transport` на `'query'` — червоніє перевірка, що мова
 * тут таки живе в шляху.
 */

const ROW = SIBLINGS.teatralo4ka;

describe('рядок цього сайту в таблиці сусідів', () => {
	it('перелічує ті самі мови, що сайт справді віддає', () => {
		expect([...ROW.locales].sort()).toEqual([...LOCALES].sort());
	});

	it('називає ту саму мову на голій адресі', () => {
		expect(ROW.defaultLocale).toBe(DEFAULT_LOCALE);
	});

	it('несе той самий origin, що й конфіг сайту', () => {
		const source = readFileSync('src/lib/config/site.ts', 'utf8');
		const declared = /SITE_ORIGIN = '([^']+)'/.exec(source)?.[1];
		expect(declared, 'site.ts більше не оголошує SITE_ORIGIN').toBeTruthy();
		expect(ROW.origin).toBe(declared);
	});

	/*
	 * База порожня, бо сайт живе на власному домені. Рядок сусіда
	 * (`/DigitalWorkshop`) дав би тут `teatralo4ka.odesa.ua/teatralo4ka…` —
	 * помилку, яку цей проєкт уже робив із подвійним `SITE_ORIGIN`.
	 */
	it('несе порожню базу, як і конфіг збірки', () => {
		const config = readFileSync('svelte.config.js', 'utf8');
		const declared = /^\s*base: '([^']*)'/m.exec(config)?.[1];
		expect(declared, 'svelte.config.js більше не оголошує базу').toBeDefined();
		expect(ROW.base).toBe(declared);
	});

	it('узгоджений із макетом щодо кінцевого слеша', () => {
		const layout = readFileSync('src/routes/+layout.ts', 'utf8');
		const declared = /trailingSlash = '(\w+)'/.exec(layout)?.[1];
		expect(declared, 'макет більше не оголошує trailingSlash').toBeTruthy();
		expect(ROW.trailingSlash).toBe(declared === 'always');
	});

	it('каже «шляхом», бо мова тут таки живе в адресі', () => {
		const hooks = readFileSync('src/hooks.ts', 'utf8');
		expect(hooks, 'хук reroute зник — мова більше не в адресі').toMatch(
			/export const reroute.*stripLocale/s
		);
		expect(ROW.transport).toBe('path');
	});
});

/**
 * ПРИЙМАЧА ТУТ НЕМАЄ, І ЦЕ НЕ ПРОГАЛИНА.
 *
 * `?lang=` потрібен лише там, де гола адреса означає «вибору не зроблено» й сайт
 * підставляє ЗБЕРЕЖЕНУ мову — інакше відвідувач, що колись обрав там англійську,
 * отримав би її, читаючи тут українською. Цей сайт збереженої мови на старті не
 * читає взагалі: `i18n/index.ts` стартує детерміновано з `uk`, а `+layout.ts`
 * перемикає на мову АДРЕСИ. Тобто `…/?lang=uk` сюди приходить уже правильним, а
 * англійська приходить сегментом `/en/`.
 *
 * Перевірка нижче тримає саме це припущення. Коли зʼявиться задача «запропонувати
 * перехід на /en/ за збереженим вибором», яку планує докблок `i18n/index.ts`,
 * вона почервоніє — і це буде нагадування, що разом із нею треба навчитися читати
 * `?lang=`, бо сусіди його вже шлють.
 */
describe('приймач не потрібен, поки збережена мова не перекриває адресу', () => {
	it('старт i18n не читає збереженої мови', () => {
		const source = readFileSync('src/lib/i18n/index.ts', 'utf8');
		expect(source).toMatch(/initialLocale: 'uk'/);
		expect(source, 'зʼявилося читання сховища — час навчитися читати ?lang=').not.toMatch(
			/initialLocale:\s*(storage|resolveLocale|getLocaleFromNavigator)/
		);
	});

	it('адреса, яку шлють сусіди, і без приймача відкривається правильно', () => {
		// Українська — гола адреса, тобто вже `uk`; параметр лише називає її вголос.
		expect(siblingUrl('teatralo4ka', 'uk')).toBe('https://teatralo4ka.odesa.ua/?lang=uk');
		// Англійська — сегмент, тобто її розбирає `reroute`, а не якийсь приймач.
		expect(siblingUrl('teatralo4ka', 'en')).toBe('https://teatralo4ka.odesa.ua/en/');
	});

	it('містить англійською тих, чиєї мови тут немає', () => {
		expect(resolveSiblingLocale('teatralo4ka', 'de')).toBe('en');
		expect(resolveSiblingLocale('teatralo4ka', 'nl')).toBe('en');
	});
});

describe('«замовити сайт» веде в DigitalWorkshop мовою, якою читають тут', () => {
	const order = (locale: string) =>
		siblingUrl('digitalworkshop', locale, { tab: 'promo', theme: 'colorful' });

	it('не губить вкладку й тему, які посилання вже несло', () => {
		expect(order('en')).toBe(
			'https://alik532ua.github.io/DigitalWorkshop/en/?tab=promo&theme=colorful'
		);
	});

	it('називає українську параметром, бо в сусіда вона на голій адресі', () => {
		expect(order('uk')).toBe(
			'https://alik532ua.github.io/DigitalWorkshop/?tab=promo&theme=colorful&lang=uk'
		);
	});

	it('не лишає жодної тутешньої мови без адреси в сусіда', () => {
		for (const locale of LOCALES) {
			const url = new URL(order(locale));
			const named = url.searchParams.get('lang') ?? url.pathname.split('/')[2];
			expect(named, `DigitalWorkshop не відкривається мовою ${locale}`).toBe(locale);
		}
	});
});
