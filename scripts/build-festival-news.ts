import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Зріз «які новини розповідають про цю поїздку» — рахується з САМИХ НОВИН.
 *
 * ## Чому не поле в реєстрі фестивалів
 *
 * Зв'язок «новина ↔ фестиваль» уже існує, і живе він у тексті новини:
 * `[…](/projects/galaxy-graduates/festivals/teatr-pro-2026)`. Друге місце, де
 * те саме доводилося б писати руками (`newsIds` у `festivals.data.json`),
 * розійшлося б із першим на першій же правці — і розійшлося б ТИХО: сторінка
 * фестивалю показувала б новину, якої в тексті вже немає, або мовчала б про ту,
 * що є.
 *
 * Тому джерело одне — посилання в тексті, — а цей скрипт лише повертає його
 * другим боком. Переставили посилання в новині — розділ на сторінці фестивалю
 * змінився сам.
 *
 * ## Чому в `static/`, а не в бандлі
 *
 * Розділ читає ОДНА сторінка — сама поїздка, — а бандл проєкту тісний: стеля
 * коду `check-bundle-budget` рахується в сотнях байтів. Те саме рішення й з
 * тієї ж причини, що в `festivalDetails` і `playCast`: зріз лежить у `static/`
 * і приходить `fetch`ем із `load`.
 *
 * ## Що всередині
 *
 * Ключ — адреса фестивалю, значення — новини, від найновішої. Назва й дата
 * беруться з `news-cards.data.json` (його пише `build-news-cards`), тобто з
 * того самого місця, що й картки в переліку новин: двох різних назв в однієї
 * новини бути не може.
 */

const СТОРІНКИ = join('src', 'lib', 'i18n', 'pages');
const КАРТКИ = join('src', 'lib', 'data', 'news-cards.data.json');
const ЦІЛЬ = join('static', 'galaxy', 'festival-news.json');

/** Посилання на сторінку поїздки — та сама форма, що й у `ProsePeopleLinks`. */
const ПОСИЛАННЯ = /\]\(\/(?:en\/)?projects\/galaxy-graduates\/festivals\/([^)/\s]+)\/?\)/g;

interface Картка {
	title: string;
	date: string;
	published?: boolean;
}

const картки = JSON.parse(readFileSync(КАРТКИ, 'utf8')) as Record<string, Record<string, Картка>>;

interface Новина {
	id: string;
	date: string;
	title: { uk: string; en: string };
}

const зріз: Record<string, Новина[]> = {};
const бачені = new Set<string>();

for (const мова of readdirSync(СТОРІНКИ)) {
	const тека = join(СТОРІНКИ, мова);
	for (const файл of readdirSync(тека)) {
		if (!файл.startsWith('news-') || !файл.endsWith('.md')) continue;
		const id = файл.slice('news-'.length, -'.md'.length);
		const текст = readFileSync(join(тека, файл), 'utf8');
		for (const m of текст.matchAll(ПОСИЛАННЯ)) {
			const фестиваль = m[1];
			const ключ = `${фестиваль}|${id}`;
			// Українська й англійська версії однієї новини дають ОДИН запис:
			// інакше в розділі вона стояла б двічі.
			if (бачені.has(ключ)) continue;
			бачені.add(ключ);

			const uk = картки.uk?.[id];
			const en = картки.en?.[id];
			if (!uk) {
				console.error(`⚠️  новина «${id}» посилається на ${фестиваль}, але картки для неї немає`);
				continue;
			}
			// Чернетка в розділі не з'являється: на сайті її ще немає.
			if (uk.published === false) continue;

			(зріз[фестиваль] ??= []).push({
				id,
				date: uk.date,
				title: { uk: uk.title, en: en?.title ?? uk.title }
			});
		}
	}
}

for (const список of Object.values(зріз)) список.sort((a, b) => b.date.localeCompare(a.date));

/* Ключі за абеткою — щоб файл не давав диф там, де нічого не змінилося. */
const впорядковано = Object.fromEntries(Object.entries(зріз).sort(([a], [b]) => a.localeCompare(b)));

writeFileSync(ЦІЛЬ, `${JSON.stringify(впорядковано, null, '\t')}\n`);

const новин = Object.values(впорядковано).reduce((сума, список) => сума + список.length, 0);
console.log(`📰 новини поїздок: ${новин} на ${Object.keys(впорядковано).length} фестивалях → ${ЦІЛЬ}`);
