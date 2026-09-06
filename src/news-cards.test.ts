// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { зібрати, картка, слугиНовин } from '../scripts/build-news-cards';
import покажчик from '$lib/data/news-cards.data.json';
import { CODE_NEWS } from '$lib/config/codeNews';

/**
 * Згенерований покажчик карток мусить збігатися з markdown ЗАРАЗ.
 *
 * ## Навіщо
 *
 * `data/news-cards.data.json` — єдине, з чого перелік новин бере назву, дату,
 * плашку й анотацію. Файл згенерований і лежить у репозиторії (щоб
 * `npm run dev` і перевірки працювали без збірки), а отже може відстати: автор
 * виправив назву в markdown, перезібрати забув — і сайт місяцями показує стару.
 * Компілятор цього не бачить: обидва файли валідні.
 *
 * Той самий клас уже стерегли для `static/search/profiles.json`
 * (`src/search-index.test.ts`), і причина та сама.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено: у покажчику змінено назву однієї новини — впала перевірка збігу й
 * назвала саму новину; з нього прибрано запис — упала перевірка повноти; у
 * markdown `status` змінено на `draft` — упала перевірка збігу.
 */

const СТОРІНКИ = join('src', 'lib', 'i18n', 'pages');
const NEWS_CARD_META = покажчик as Record<
	'uk' | 'en',
	Record<string, { title: string; date: string; category: string; excerpt: string; published: boolean }>
>;

describe('покажчик карток новин', () => {
	const наДиску = зібрати();

	it('перевірка жива: новини знайдено обома мовами', () => {
		expect(Object.keys(наДиску.uk).length, 'жодної новини — звіряти нема що').toBeGreaterThan(0);
		expect(Object.keys(наДиску.en).length).toBe(Object.keys(наДиску.uk).length);
	});

	it('покажчик збігається з markdown — обома мовами', () => {
		expect(
			NEWS_CARD_META,
			'покажчик відстав від markdown. Перезібрати: npm run build:news-cards'
		).toEqual(наДиску);
	});

	it('у покажчику є КОЖНА новина реєстру, і жодної зайвої', () => {
		const уРеєстрі = CODE_NEWS.map((item) => item.id).sort();
		for (const мова of ['uk', 'en'] as const) {
			expect(
				Object.keys(NEWS_CARD_META[мова]).sort(),
				`${мова}: перелік новин у покажчику розійшовся з реєстром`
			).toEqual(уРеєстрі);
		}
	});

	it('слуги беруться з диска й дають ключі реєстру', () => {
		// Саме на цьому тримається генератор: `slug` = `news-<id>`.
		const зДиска = слугиНовин().map((x) => x.id).sort();
		expect(зДиска).toEqual(CODE_NEWS.map((item) => item.id).sort());
	});

	it('анотація не порожня — інакше картка стоїть без опису', () => {
		const bad: string[] = [];
		for (const мова of ['uk', 'en'] as const) {
			for (const [id, м] of Object.entries(NEWS_CARD_META[мова])) {
				if (!м.excerpt.trim()) bad.push(`${мова}/${id}`);
				if (!м.title.trim()) bad.push(`${мова}/${id}: без назви`);
				if (!/^\d{4}-\d{2}-\d{2}$/.test(м.date)) bad.push(`${мова}/${id}: дата «${м.date}»`);
			}
		}
		expect(bad, `картка вийде порожньою:\n  ${bad.join('\n  ')}`).toEqual([]);
	});

	it('розбір frontmatter віддає плашку новини, а не рід сторінки', () => {
		/*
		 * `category` у frontmatter для новини завжди `news`; плашку показу автор
		 * ставить полем `newsCategory`. Якщо генератор про це забуде, дві новини
		 * з чотирнадцяти («Благодійність», «Святкування») мовчки стануть
		 * звичайними новинами.
		 */
		const благодійна = readFileSync(
			join(СТОРІНКИ, 'uk', 'news-charity-new-year-play-2025.md'),
			'utf8'
		);
		expect(картка(благодійна).category).toBe('charity');
		expect(NEWS_CARD_META.uk['charity-new-year-play-2025'].category).toBe('charity');
		expect(NEWS_CARD_META.uk['dedication-to-art-2022'].category).toBe('news');
	});
});
