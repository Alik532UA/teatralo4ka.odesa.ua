// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
	голийТекст,
	записРеєстру,
	значення,
	ключНовини,
	медіаПункту,
	назваДляПошуковика,
	назваЗнімка,
	опис,
	сторінка,
	текаЗнімків,
	транслітерувати,
	змінноюДляТеки,
	type ПунктФайла
} from '../scripts/news-from-firestore';
import { розмірБайтів, формат } from '../scripts/image-header';
import { pageMetadataSchema } from '$lib/i18n/schema';

/**
 * Конвертер новин пише в СІМ файлів, і жоден із них не перевіряє компілятор.
 *
 * ## Що саме стережеться
 *
 * Найдорожча помилка тут тиха: frontmatter, який не проходить
 * `pageMetadataSchema`, валить не конвертер, а наступну збірку — і не в
 * конвертері, а всередині розбору сторінки. Тому головна перевірка нижче не
 * порівнює рядки, а ПРОГАНЯЄ згенерований frontmatter через ту саму схему, якою
 * його читатиме сайт. Межі опису (50–300) і назви (10–100) в ній справжні, і
 * коротка новина — «опис пустий, пізніше буде» — впирається в них одразу.
 *
 * Друга пастка — лапки: розбирач frontmatter навмисно простий і екранування не
 * знає, тож подвійна лапка всередині назви обрізала б рядок мовчки.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v9 § 1.1)
 *
 * Проведено чотири: `опис` перестав доповнювати короткий текст — упала перевірка
 * про схему; `значення` перестало міняти внутрішні лапки — упала перевірка
 * лапок; `ключНовини` перестав зважати на `codeId` — упала перевірка ключа;
 * `записРеєстру` перестав писати `replacesArticleId` — упала перевірка про
 * подвійний показ.
 */

function пункт(поля: Partial<ПунктФайла> = {}): ПунктФайла {
	return {
		id: 'aBcD1234',
		category: 'news',
		author: 'Alik',
		dateISO: '2026-07-04T00:00:00.000Z',
		translations: {
			uk: {
				title: 'Потрійний тріумф учнів «Театрало4ки»',
				content: 'Троє наших учнів привезли з фестивалю три перемоги поспіль.',
				isPublished: true
			},
			en: { title: 'Triple triumph', content: 'Three of our students won.', isPublished: true }
		},
		...поля
	} as ПунктФайла;
}

/** Розбір frontmatter тим самим способом, що й `i18n/loader.ts`. */
function frontmatter(текст: string): Record<string, unknown> {
	const блок = текст.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	expect(блок, 'frontmatter не знайдено — сторінка не має шапки').not.toBeNull();
	const дані: Record<string, unknown> = {};
	let ключ: string | null = null;
	for (const рядок of (блок as RegExpMatchArray)[1].split('\n')) {
		if (!рядок.trim()) continue;
		const відступ = рядок.search(/\S/);
		const частини = рядок.trim().split(':');
		const імʼя = частини[0].trim();
		const значення = частини.slice(1).join(':').trim().replace(/^['"](.*)['"]$/, '$1');
		if (відступ > 0 && ключ) {
			(дані[ключ] as Record<string, string>)[імʼя] = значення;
		} else if (!значення) {
			ключ = імʼя;
			дані[імʼя] = {};
		} else {
			дані[імʼя] = значення;
			ключ = null;
		}
	}
	return дані;
}

describe('конвертер новин', () => {
	it('транслітерація — за нормою КМУ, і без хвостових дефісів', () => {
		expect(транслітерувати('Ювілейний 30-й сезон!')).toBe('iuvileinyi-30-i-sezon');
		expect(транслітерувати('Щастя, їжак і ґанок')).toBe('shchastia-izhak-i-ganok');
		expect(транслітерувати('  ...  ')).toBe('');
	});

	it('ключ адреси: свій із файла перемагає вигаданий', () => {
		expect(ключНовини(пункт())).toBe('potriinyi-triumf-uchniv-teatralo4ky-2026');
		expect(ключНовини(пункт({ codeId: 'triple-triumph-2026' }))).toBe('triple-triumph-2026');
	});

	it('тека знімків — дата новини', () => {
		expect(текаЗнімків(пункт())).toBe('2026-07-04');
	});

	it('внутрішні лапки стають «ялинками» — інакше розбір обріже рядок', () => {
		const рядок = значення('Вистава "Сон" і "Відьма"');
		expect(рядок).toBe('"Вистава «Сон» і «Відьма»"');
		expect(рядок.slice(1, -1)).not.toContain('"');
	});

	it('згенерований frontmatter проходить справжню схему сторінки', () => {
		const текст = сторінка(пункт(), 'uk', '2026-07-04');
		expect(() => pageMetadataSchema.parse(frontmatter(текст))).not.toThrow();
	});

	it('КОРОТКА новина теж проходить схему — саме на ній вона й падала б', () => {
		/* «опис пустий, пізніше буде» — звичайний випадок, а схема вимагає
		   щонайменше 50 символів опису. */
		const короткий = пункт({
			translations: {
				uk: { title: 'Сезон відкрито', content: 'Скоро.', isPublished: true },
				en: { title: 'Season opened', content: 'Soon.', isPublished: true }
			}
		} as Partial<ПунктФайла>);
		for (const мова of ['uk', 'en'] as const) {
			const дані = frontmatter(сторінка(короткий, мова, '2026-09-05'));
			expect(() => pageMetadataSchema.parse(дані)).not.toThrow();
			expect(опис(короткий, мова).length).toBeGreaterThanOrEqual(50);
		}
	});

	it('довга назва не переростає межу в 100 символів', () => {
		const довга = 'о'.repeat(150);
		expect(назваДляПошуковика(довга).length).toBeLessThanOrEqual(100);
		expect(назваДляПошуковика('Сезон').length).toBeGreaterThanOrEqual(10);
	});

	it('чернетка лишається чернеткою', () => {
		const чернетка = пункт({
			translations: {
				uk: { title: 'Ще не готово', content: 'Текст буде.', isPublished: false },
				en: { title: 'Draft', content: 'Text coming.', isPublished: false }
			}
		} as Partial<ПунктФайла>);
		expect(frontmatter(сторінка(чернетка, 'uk', '2026-07-04')).status).toBe('draft');
	});

	it('голий текст знімає і markdown, і HTML', () => {
		expect(голийТекст('## Назва <b>жирним</b> [лінк](http://a)')).toBe('Назва жирним лінк');
	});

	it('старі поля обкладинки й відео читаються, коли переліку медіа немає', () => {
		const старий = пункт({
			translations: {
				uk: {
					title: 'Стара новина',
					content: 'Текст.',
					isPublished: true,
					coverUrl: 'https://хостінг/фото.jpg',
					videoUrl: 'https://youtu.be/abc'
				},
				en: { title: 'Old', content: 'Text.', isPublished: true }
			}
		} as Partial<ПунктФайла>);
		expect(медіаПункту(старий)).toEqual([
			{ kind: 'photo', url: 'https://хостінг/фото.jpg' },
			{ kind: 'video', url: 'https://youtu.be/abc' }
		]);
	});

	it('імена знімків — за порядком, розширення від СПРАВЖНЬОГО формату', () => {
		expect(назваЗнімка(1, 'jpg')).toBe('01.jpg');
		expect(назваЗнімка(12, 'png')).toBe('12.png');
	});

	it('формат визначається підписом байтів, а не назвою', () => {
		/*
		 * Заміряно на першому ж прогоні: знімок прийшов адресою без розширення,
		 * файл назвали «01.jpg», розбирали як JPEG — і отримали «розмір не
		 * читається» замість «це PNG».
		 */
		const png = Buffer.from(
			'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
			'base64'
		);
		expect(формат(png)).toBe('png');
		expect(розмірБайтів(png)).toEqual([5, 5]);
		expect(формат(Buffer.from('не зображення')), 'чужі байти мусять дати `null`').toBeNull();
		expect(розмірБайтів(Buffer.from('не зображення'))).toBeNull();
	});

	it('запис реєстру заявляє статтю, яку заміняє', () => {
		const текст = записРеєстру(
			пункт({ mediaShape: 'square' }),
			'triple-triumph-2026',
			[{ файл: '01.jpg', width: 1280, height: 960, alt: 'Підпис' }],
			[{ kind: 'video', url: 'https://youtu.be/abc', alt: 'Запис' }]
		);
		expect(текст, 'без цього поля новина стоятиме в переліку двічі').toContain(
			"replacesArticleId: 'aBcD1234'"
		);
		expect(текст).toContain("id: 'triple-triumph-2026'");
		expect(текст).toContain("slug: 'news-triple-triumph-2026'");
		expect(текст).toContain("mediaShape: 'square'");
		expect(текст).toContain("медіа_triple_triumph_2026('01.jpg', 1280, 960, \"Підпис\")");
		expect(текст).toContain('відео("https://youtu.be/abc", "Запис")');
	});

	it('імʼя змінної теки — придатний ідентифікатор', () => {
		expect(змінноюДляТеки('triple-triumph-2026')).toBe('медіа_triple_triumph_2026');
		expect(змінноюДляТеки('a-b-c')).not.toContain('-');
	});
});
