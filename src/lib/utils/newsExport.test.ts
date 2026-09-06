// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
	buildNewsExport,
	newsExportFileName,
	NEWS_EXPORT_KIND,
	NEWS_EXPORT_VERSION
} from './newsExport';
import type { StoredArticle } from '$lib/services/articles';

/**
 * Файл, який автор віддає AI-агенту, мусить нести ВСЕ потрібне конвертерові.
 *
 * ## Що саме стережеться
 *
 * Дефект тут тихий і дорогий: якщо з файла випаде `id`, новина в коді не зможе
 * заявити `replacesArticleId` — і після перенесення стоятиме в переліку двічі.
 * Якщо випаде `dateISO`, конвертерові нема з чого зробити теку
 * `static/news/<дата>/`. Помітити обидва можна лише після збірки, тобто пізно.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Проведено: з `buildNewsExport` прибрано `id` — упала перевірка про `id`;
 * `dateISO` замінено на `null` завжди — упала перевірка дати; сортування
 * перевернуто — упала перевірка порядку.
 */

const мітка = (iso: string) => ({ toDate: () => new Date(iso), toMillis: () => Date.parse(iso) });

function стаття(id: string, опції: Partial<StoredArticle> = {}): StoredArticle {
	return {
		id,
		slug: `slug-${id}`,
		type: 'article',
		category: 'news',
		author: '',
		dateMode: 'createdAt',
		createdAt: мітка('2026-09-01T10:00:00.000Z'),
		updatedAt: мітка('2026-09-02T10:00:00.000Z'),
		translations: {
			uk: {
				title: `назва ${id}`,
				content: '## текст',
				contentFormat: 'markdown',
				isPublished: true,
				coverUrl: 'https://хостінг.приклад/фото.jpg',
				media: [{ kind: 'photo', url: 'https://хостінг.приклад/фото.jpg', alt: '' }]
			},
			en: { title: '', content: '', isPublished: false }
		},
		...опції
	} as unknown as StoredArticle;
}

const ЗАРАЗ = new Date('2026-09-06T12:00:00.000Z');

describe('файл із відібраними новинами', () => {
	it('позначений форматом і версією — інакше його не відрізнити від чернетки редактора', () => {
		const файл = buildNewsExport([стаття('a')], ЗАРАЗ);
		expect(файл.kind).toBe(NEWS_EXPORT_KIND);
		expect(файл.version).toBe(NEWS_EXPORT_VERSION);
		expect(файл.exportedAt).toBe('2026-09-06T12:00:00.000Z');
		expect(файл.count).toBe(1);
	});

	it('несе `id` статті — за ним новина в коді заявить `replacesArticleId`', () => {
		const файл = buildNewsExport([стаття('aBcD1234')], ЗАРАЗ);
		expect(файл.items[0].id, 'без `id` перенесена новина стоятиме в переліку двічі').toBe(
			'aBcD1234'
		);
	});

	it('несе дату в ISO — з неї конвертер робить теку знімків', () => {
		const свій = стаття('b', {
			dateMode: 'custom',
			customDate: мітка('2026-07-04T00:00:00.000Z')
		} as Partial<StoredArticle>);
		expect(buildNewsExport([свій], ЗАРАЗ).items[0].dateISO).toBe('2026-07-04T00:00:00.000Z');
		expect(buildNewsExport([стаття('a')], ЗАРАЗ).items[0].dateISO).toBe(
			'2026-09-01T10:00:00.000Z'
		);
	});

	it('прихована дата — `null`, а не сьогоднішнє число', () => {
		const без = стаття('c', { dateMode: 'hidden' } as Partial<StoredArticle>);
		expect(buildNewsExport([без], ЗАРАЗ).items[0].dateISO).toBeNull();
	});

	it('несе обидві мови й повні адреси зображень', () => {
		const пункт = buildNewsExport([стаття('a')], ЗАРАЗ).items[0];
		expect(Object.keys(пункт.translations)).toEqual(['uk', 'en']);
		expect(пункт.translations.uk.coverUrl).toBe('https://хостінг.приклад/фото.jpg');
		expect(пункт.translations.uk.media?.[0].url, 'конвертерові нема звідки взяти знімок').toBe(
			'https://хостінг.приклад/фото.jpg'
		);
		expect(пункт.translations.uk.contentFormat).toBe('markdown');
	});

	it('порядок у файлі — найстаріші перші', () => {
		const старіша = стаття('стара', {
			createdAt: мітка('2020-01-01T00:00:00.000Z')
		} as Partial<StoredArticle>);
		const ids = buildNewsExport([стаття('нова'), старіша], ЗАРАЗ).items.map((i) => i.id);
		expect(ids).toEqual(['стара', 'нова']);
	});

	it('порожній відбір дає порожній файл, а не помилку', () => {
		const файл = buildNewsExport([], ЗАРАЗ);
		expect(файл.count).toBe(0);
		expect(файл.items).toEqual([]);
	});

	it('ім’я файла має дату й кількість', () => {
		expect(newsExportFileName(ЗАРАЗ, 7)).toBe('news-batch-2026-09-06-7.json');
	});

	it('увесь файл перетворюється на JSON без втрат', () => {
		// Мітки часу Firestore — об'єкти з методами: сирий `JSON.stringify` зробив
		// би з них `{}`, і дата поїхала б порожньою.
		const текст = JSON.stringify(buildNewsExport([стаття('a')], ЗАРАЗ));
		const назад = JSON.parse(текст);
		expect(назад.items[0].dateISO).toBe('2026-09-01T10:00:00.000Z');
		expect(назад.items[0].translations.uk.title).toBe('назва a');
	});
});
