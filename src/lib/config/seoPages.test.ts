// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { FALLBACK_LANG, SEO_FALLBACK, routeToSeoKey } from './seoPages';

/**
 * Маршрут → ключ SEO, і чому це перевіряється тестом.
 *
 * ## Що зламалося без нього
 *
 * `/projects/galaxy-graduates` не мала кейсу й провалювалася в `default: 'home'`
 * — тобто сторінка галактики роками віддавала опис ГОЛОВНОЇ. Побачити це можна
 * було лише в прев'ю месенджера: посилання підписувалося «Офіційний сайт…
 * Відділи, галерея, історія, контакти та умови вступу», і виглядало це не як
 * помилка, а як опис, який хтось так і написав.
 *
 * Сама функція вже двічі ловила цей самий клас дефекту (хвостова риска й мовний
 * префікс — обидва записані в її докблоці), і обидва рази — постфактум, у
 * зібраному HTML. Тому тепер вона під тестом: кожен провал у `home` — це
 * ТИХЕ запозичення чужого опису.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Прибрати `case '/projects/galaxy-graduates'` — падає перевірка нижче й
 * називає саме цей шлях.
 */
describe('маршрут → ключ SEO', () => {
	it('кожна сторінка з власним описом отримує СВІЙ ключ, а не «home»', () => {
		expect(routeToSeoKey('/')).toBe('home');
		expect(routeToSeoKey('/about/')).toBe('about');
		expect(routeToSeoKey('/projects/galaxy-graduates/')).toBe('galaxy');
	});

	/*
	 * Три написання того самого шляху. Хвостова риска й мовний префікс — рівно
	 * ті дві форми, на яких функція вже падала, тож вони перевіряються не
	 * «про всяк випадок».
	 */
	it('хвостова риска й мовний префікс не міняють ключа', () => {
		for (const path of [
			'/projects/galaxy-graduates',
			'/projects/galaxy-graduates/',
			'/en/projects/galaxy-graduates/'
		]) {
			expect(routeToSeoKey(path), path).toBe('galaxy');
		}
	});

	it('невідомий шлях лишається «home» — це фолбек, а не дефект', () => {
		expect(routeToSeoKey('/такої-сторінки-немає/')).toBe('home');
	});

	/*
	 * Ключ без запасних значень дав би в `<head>` сам КЛЮЧ: prerender малює
	 * `<head>` до того, як `svelte-i18n` встигне ініціалізуватися, і тоді в
	 * прев'ю месенджера поїхало б «seo.pages.galaxy.title».
	 */
	it('у кожного ключа є запасні заголовок і опис обома мовами', () => {
		const keys = Object.keys(SEO_FALLBACK[FALLBACK_LANG].pages);
		const bad: string[] = [];
		for (const lang of ['uk', 'en'] as const) {
			const pages = SEO_FALLBACK[lang].pages as Record<string, { title: string; description: string }>;
			for (const key of keys) {
				const entry = pages[key];
				if (!entry) bad.push(`${lang}: немає ключа «${key}»`);
				else if (!entry.title.trim() || !entry.description.trim())
					bad.push(`${lang}.${key}: порожній заголовок або опис`);
			}
		}
		expect(bad, 'запасні значення розійшлися між мовами:\n  ' + bad.join('\n  ')).toEqual([]);
		expect(keys.length, 'у карті менше сторінок, ніж очікувано').toBeGreaterThan(5);
	});
});
