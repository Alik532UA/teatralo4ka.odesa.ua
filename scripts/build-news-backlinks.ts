import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Зріз «які новини про це розповідають» — рахується з САМИХ НОВИН.
 *
 * Двом сторінкам потрібне те саме: фестивалю — новини про фестиваль, людині —
 * новини, де її згадали. Обидва зрізи роблять з ОДНОГО проходу по текстах, бо
 * прохід один і той самий, а два скрипти розійшлися б правилами розбору.
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
const ІНДЕКС = join('src', 'lib', 'data', 'graduates.index.json');
const ФЕСТИВАЛІ = join('static', 'galaxy', 'festival-news.json');
const ЛЮДИ = join('static', 'galaxy', 'person-news.json');

/** Посилання на сторінку поїздки — та сама форма, що й у `ProsePeopleLinks`. */
const ПОСИЛАННЯ = /\]\(\/(?:en\/)?projects\/galaxy-graduates\/festivals\/([^)/\s]+)\/?\)/g;

/**
 * Посилання на людину: один сегмент після `galaxy-graduates`, тобто НЕ розділ
 * і не вкладена сторінка. Розділи відсіюються нижче за теками маршрутів — так
 * само, як у `prose-people-links.test.ts`.
 */
const ЛЮДИНА = /\]\(\/(?:en\/)?projects\/galaxy-graduates\/([^)/\s]+)\/?\)/g;

const РОЗДІЛИ = new Set(
	readdirSync(join('src', 'routes', 'projects', 'galaxy-graduates'), { withFileTypes: true })
		.filter((e) => e.isDirectory() && !e.name.startsWith('['))
		.map((e) => e.name)
);

/**
 * Адреса з тексту → стійкий `id` випускника.
 *
 * Ключ зрізу — `id`, а не адреса, і це не дрібниця: адресу законно виправляють
 * («п'ятьох випускників привели до порядку ім'я-прізвище»), а `id` не
 * міняється ніколи. Запасний хід по `slug` — бо в текстах трапляється й він.
 */
const випускники = JSON.parse(readFileSync(ІНДЕКС, 'utf8')) as {
	id: string;
	slug: string;
	code?: string;
}[];
const заАдресою = new Map<string, string>();
for (const g of випускники) {
	заАдресою.set(g.code ?? g.slug, g.id);
	if (!заАдресою.has(g.slug)) заАдресою.set(g.slug, g.id);
}

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

const фестивалі: Record<string, Новина[]> = {};
const люди: Record<string, Новина[]> = {};
const бачені = new Set<string>();

/** Картка новини, або `null` — коли її немає чи вона ще чернетка. */
function новина(id: string): Новина | null {
	const uk = картки.uk?.[id];
	if (!uk) {
		console.error(`⚠️  новина «${id}» посилається кудись, але картки для неї немає`);
		return null;
	}
	// Чернетка в розділі не з'являється: на сайті її ще немає.
	if (uk.published === false) return null;
	return { id, date: uk.date, title: { uk: uk.title, en: картки.en?.[id]?.title ?? uk.title } };
}

function додати(куди: Record<string, Новина[]>, ключ: string, id: string) {
	// Українська й англійська версії однієї новини дають ОДИН запис: інакше в
	// розділі вона стояла б двічі.
	const мітка = `${ключ}|${id}`;
	if (бачені.has(мітка)) return;
	бачені.add(мітка);
	const н = новина(id);
	if (н) (куди[ключ] ??= []).push(н);
}

for (const мова of readdirSync(СТОРІНКИ)) {
	const тека = join(СТОРІНКИ, мова);
	for (const файл of readdirSync(тека)) {
		if (!файл.startsWith('news-') || !файл.endsWith('.md')) continue;
		const id = файл.slice('news-'.length, -'.md'.length);
		const текст = readFileSync(join(тека, файл), 'utf8');

		for (const m of текст.matchAll(ПОСИЛАННЯ)) додати(фестивалі, m[1], id);

		for (const m of текст.matchAll(ЛЮДИНА)) {
			if (РОЗДІЛИ.has(m[1])) continue;
			const кого = заАдресою.get(m[1]);
			if (!кого) {
				console.error(`⚠️  новина «${id}» посилається на «${m[1]}», а такого випускника немає`);
				continue;
			}
			додати(люди, кого, id);
		}
	}
}

/* Ключі за абеткою, новини від найновішої — щоб файл не давав диф там, де
   нічого не змінилося. */
function впорядкувати(зріз: Record<string, Новина[]>) {
	for (const список of Object.values(зріз)) список.sort((a, b) => b.date.localeCompare(a.date));
	return Object.fromEntries(Object.entries(зріз).sort(([a], [b]) => a.localeCompare(b)));
}

const впорядковано = впорядкувати(фестивалі);
const людиВпорядковано = впорядкувати(люди);

writeFileSync(ФЕСТИВАЛІ, `${JSON.stringify(впорядковано, null, '	')}
`);
writeFileSync(ЛЮДИ, `${JSON.stringify(людиВпорядковано, null, '	')}
`);

const рахунок = (з: Record<string, Новина[]>) =>
	Object.values(з).reduce((сума, список) => сума + список.length, 0);
console.log(
	`📰 зворотні посилання новин: ${рахунок(впорядковано)} на ${Object.keys(впорядковано).length} ` +
		`фестивалях, ${рахунок(людиВпорядковано)} на ${Object.keys(людиВпорядковано).length} людях`
);
