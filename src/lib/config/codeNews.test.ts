// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CODE_NEWS, codeNewsById } from './codeNews';
import { LOCAL_IMAGE_SIZES } from './localImages';
import { SEARCHABLE_PAGES } from './searchablePages';

/**
 * Новина в коді тримається на ЧОТИРЬОХ файлах, які нічим не пов'язані.
 *
 * ## Що саме тут стережеться
 *
 * Один запис у `CODE_NEWS` посилається на markdown двома мовами, на теку зі
 * знімками в `static/` і на записи в мапі розмірів. Жоден із цих зв'язків не
 * перевіряє ані компілятор, ані `svelte-check`: `slug` — рядок, шлях до знімка
 * — рядок, і розходження виявиться або порожньою сторінкою, або галереєю з
 * битими зображеннями. Причому саме тоді, коли новину вже опублікували.
 *
 * ## Чому не досить наявних гейтів
 *
 * `localImages.test.ts` звіряє розміри з файлами — але лише для тих шляхів, що
 * в мапі вже є; про знімок, який реєстр новини називає, а мапа не знає, він
 * мовчить. `validate-content` перевіряє frontmatter — але не те, що на цей
 * файл хтось посилається. `searchablePages.test.ts` вимагає, щоб файл був у
 * пошуку — але не те, що адреса в пошуку веде на справжню новину.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено на трьох дефектах: `slug` змінено на неіснуючий — впала перевірка
 * markdown і назвала обидві мови; `01.jpg` перейменовано — впала перевірка
 * файлів; запис прибрано з `LOCAL_IMAGE_SIZES` — впала перевірка розмірів.
 */
/**
 * Знімки новини — це елементи `media` виду `photo`.
 *
 * Раніше поле звалося `photos` і містило лише їх; тепер один перелік тримає й
 * записи, тож у перевірок файлів і розмірів мусить бути ця вибірка, а не все
 * підряд: у відео немає ані файлу в `static`, ані рядка в мапі розмірів.
 */
const знімки = (item: (typeof CODE_NEWS)[number]) => item.media.filter((m) => m.kind === 'photo');

describe('новини в коді', () => {
	const СТОРІНКИ = join('src', 'lib', 'i18n', 'pages');

	it('перевірка жива: новина в коді є', () => {
		expect(CODE_NEWS.length, 'жодної новини в коді — перевіряти нема що').toBeGreaterThan(0);
	});

	it('ключі адрес унікальні й придатні для адреси', () => {
		const bad = CODE_NEWS.filter((item) => !/^[a-z0-9-]+$/.test(item.id)).map((item) => item.id);
		expect(bad, `не годиться в адресу: ${bad.join(', ')}`).toEqual([]);
		const ids = CODE_NEWS.map((item) => item.id);
		const дублі = ids.filter((id, i) => ids.indexOf(id) !== i);
		expect([...new Set(дублі)], 'два записи з тим самим ключем').toEqual([]);
	});

	it('markdown існує ОБОМА мовами', () => {
		const bad: string[] = [];
		for (const item of CODE_NEWS) {
			for (const мова of ['uk', 'en']) {
				const файл = join(СТОРІНКИ, мова, `${item.slug}.md`);
				if (!existsSync(файл)) bad.push(`${item.id}: немає ${мова}/${item.slug}.md`);
			}
		}
		expect(
			bad,
			'сторінка новини без тексту віддала б порожнє місце, а не 404 — ' +
				`«loadPageWithMetadata» лише попереджає в консоль:\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});

	it('категорія markdown — саме `news`', () => {
		const bad: string[] = [];
		for (const item of CODE_NEWS) {
			for (const мова of ['uk', 'en']) {
				const файл = join(СТОРІНКИ, мова, `${item.slug}.md`);
				if (!existsSync(файл)) continue;
				const текст = readFileSync(файл, 'utf8');
				if (!/^category:\s*"?news"?\s*$/m.test(текст)) {
					bad.push(`${мова}/${item.slug}.md`);
				}
			}
		}
		expect(
			bad,
			'новина з іншою категорією стане в один ряд із розділами сайту — ' +
				`саме «news» у «pageMetadataSchema» і є місцем, передбаченим під це:\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});

	it('кожен знімок лежить у static і має розмір у localImages', () => {
		const bad: string[] = [];
		let перевірено = 0;
		for (const item of CODE_NEWS) {
			for (const фото of знімки(item)) {
				перевірено += 1;
				if (!existsSync(join('static', фото.url))) bad.push(`${item.id}: немає static${фото.url}`);
				if (!(фото.url in LOCAL_IMAGE_SIZES)) bad.push(`${item.id}: ${фото.url} поза мапою розмірів`);
			}
		}
		expect(перевірено, 'жодного знімка — перевірка нічого не стверджує').toBeGreaterThan(0);
		expect(bad, `галерея показала б битий знімок:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('розмір у реєстрі збігається з мапою розмірів', () => {
		const bad: string[] = [];
		for (const item of CODE_NEWS) {
			for (const фото of знімки(item)) {
				const у_мапі = LOCAL_IMAGE_SIZES[фото.url as keyof typeof LOCAL_IMAGE_SIZES];
				if (!у_мапі) continue;
				if (фото.width !== у_мапі.width || фото.height !== у_мапі.height) {
					bad.push(
						`${фото.url}: реєстр ${фото.width}×${фото.height}, мапа ${у_мапі.width}×${у_мапі.height}`
					);
				}
			}
		}
		expect(
			bad,
			'два числа про той самий файл розійшлися, і правдиве з них звіряє з ' +
				`диском лише мапа:\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});

	it('у теці знімків немає файлів, яких реєстр не знає', () => {
		const bad: string[] = [];
		const теки = new Set(
			CODE_NEWS.flatMap((item) => знімки(item).map((ф) => ф.url.replace(/\/[^/]+$/, '')))
		);
		const відомі = new Set(CODE_NEWS.flatMap((item) => знімки(item).map((ф) => ф.url)));
		for (const тека of теки) {
			const шлях = join('static', тека);
			if (!existsSync(шлях)) continue;
			for (const файл of readdirSync(шлях)) {
				if (!відомі.has(`${тека}/${файл}`)) bad.push(`${тека}/${файл}`);
			}
		}
		expect(
			bad,
			'файл лежить у збірці, а в галереї його немає — або дописати в реєстр, ' +
				`або прибрати з «static»:\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});

	it('адреса в пошуку веде на наявну новину', () => {
		const bad = SEARCHABLE_PAGES.filter((p) => p.slug.startsWith('news-'))
			.filter((p) => !CODE_NEWS.some((item) => item.slug === p.slug))
			.map((p) => p.slug);
		expect(bad, `у пошуку є новина, якої немає в реєстрі: ${bad.join(', ')}`).toEqual([]);

		const поза = CODE_NEWS.filter(
			(item) => !SEARCHABLE_PAGES.some((p) => p.slug === item.slug)
		).map((item) => item.slug);
		expect(поза, `новину в коді не знайти пошуком: ${поза.join(', ')}`).toEqual([]);
	});

	it('`codeNewsById` знаходить своє й не вигадує чужого', () => {
		expect(codeNewsById(CODE_NEWS[0].id)?.slug).toBe(CODE_NEWS[0].slug);
		expect(codeNewsById('такого-немає')).toBeUndefined();
	});
});
