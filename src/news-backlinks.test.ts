// @vitest-environment node
// Перевірка читає markdown, реєстр і зріз із диска — DOM їй не потрібен.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { FESTIVALS } from './lib/data/festivals';
import { expertNewsKey, graduateNewsKey, masterNewsKey } from './lib/data/newsBacklinks';

/**
 * Зріз «новини про поїздку» не розійшовся ні з новинами, ні з реєстром.
 *
 * ## Навіщо
 *
 * `static/galaxy/festival-news.json` — ПОХІДНА від посилань у текстах новин, і
 * пише її `scripts/build-festival-news.ts` на `prebuild`. Похідна, яка лежить у
 * репозиторії, старіє тихо: у новину дописали посилання на фестиваль, файл не
 * перегенерували — і розділ на сторінці поїздки мовчить про новину, яка вже
 * вийшла. Локальний `npm run dev` зріз не перебудовує взагалі.
 *
 * Тому перевірка ПЕРЕРАХОВУЄ зріз тією самою логікою й звіряє з файлом. Це той
 * самий храповик, що в `news-cards` і `address-aliases`: згенероване має бути
 * доведеним, а не тим, що колись поклали.
 *
 * ## Друга половина — ключі
 *
 * Посилання в новині можна написати з опискою, і тоді зріз отримає ключ, якому
 * не відповідає жоден фестиваль: розділ не з'явиться ніде, а сама новина вестиме
 * на 404. Це ловить окрема перевірка нижче.
 *
 * ## Зворотний експеримент (`PIT-REVERSE-EXPERIMENT`)
 *
 * Прибрати посилання на `teatr-pro-2026` з новини — перевірка каже, що зріз
 * застарів, і називає саме цю новину. Замінити ключ у зрізі на вигаданий —
 * називає його як фестиваль, якого немає.
 */

const СТОРІНКИ = join('src', 'lib', 'i18n', 'pages');
const ЗРІЗ = join('static', 'galaxy', 'festival-news.json');
const ЗРІЗ_ЛЮДЕЙ = join('static', 'galaxy', 'person-news.json');

const ПОСИЛАННЯ = /\]\(\/(?:en\/)?projects\/galaxy-graduates\/festivals\/([^)/\s]+)\/?\)/g;
const ЛЮДИНА = /\]\(\/(?:en\/)?projects\/galaxy-graduates\/([^)/\s]+)\/?\)/g;
const ФАХІВЕЦЬ = /\]\(\/(?:en\/)?projects\/galaxy-graduates\/experts\/([^)/\s]+)\/?\)/g;
const ВИКЛАДАЧ = /\]\(\/(?:en\/)?residents\/adults\/([^)/\s]+)\/?\)/g;

const РОЗДІЛИ = new Set(
	readdirSync(join('src', 'routes', 'projects', 'galaxy-graduates'), { withFileTypes: true })
		.filter((e) => e.isDirectory() && !e.name.startsWith('['))
		.map((e) => e.name)
);

const випускники = JSON.parse(
	readFileSync(join('src', 'lib', 'data', 'graduates.index.json'), 'utf8')
) as { id: string; slug: string; code?: string }[];
const заАдресою = new Map<string, string>();
for (const g of випускники) {
	заАдресою.set(g.code ?? g.slug, g.id);
	if (!заАдресою.has(g.slug)) заАдресою.set(g.slug, g.id);
}

const слугФахівця = new Set(
	(
		JSON.parse(readFileSync(join('src', 'lib', 'data', 'experts.data.json'), 'utf8')) as {
			slug: string;
		}[]
	).map((e) => e.slug)
);
const слугВикладача = new Set(
	(
		JSON.parse(readFileSync(join('src', 'lib', 'data', 'masters.index.json'), 'utf8')) as {
			slug: string;
		}[]
	).map((m) => m.slug)
);

/**
 * Хто саме шукається в текстах — і як зветься його ключ.
 *
 * Три роди людей, три форми адреси. Перелік тут окремо від самого проходу, бо
 * забути один рід — це рівно те, що вже сталося: зріз знав лише випускників,
 * тоді як у новинах стояли посилання й на викладачів, і на фахівця.
 */
const РОДИ: { вираз: RegExp; ключ: (адреса: string) => string | null }[] = [
	{
		вираз: ЛЮДИНА,
		ключ: (адреса) => {
			if (РОЗДІЛИ.has(адреса)) return null;
			const хто = заАдресою.get(адреса);
			return хто ? graduateNewsKey(хто) : null;
		}
	},
	{ вираз: ФАХІВЕЦЬ, ключ: (а) => (слугФахівця.has(а) ? expertNewsKey(а) : null) },
	{ вираз: ВИКЛАДАЧ, ключ: (а) => (слугВикладача.has(а) ? masterNewsKey(а) : null) }
];

interface Картка {
	title: string;
	date: string;
	published?: boolean;
}

interface Новина {
	id: string;
	date: string;
	title: { uk: string; en: string };
}

const картки = JSON.parse(
	readFileSync(join('src', 'lib', 'data', 'news-cards.data.json'), 'utf8')
) as Record<string, Record<string, Картка>>;

/** Та сама логіка, що в скрипті: зв'язок живе в посиланні, а не в реєстрі. */
function перерахувати(кого: 'festivals' | 'people'): Record<string, Новина[]> {
	const зріз: Record<string, Новина[]> = {};
	const бачені = new Set<string>();
	for (const мова of readdirSync(СТОРІНКИ)) {
		const тека = join(СТОРІНКИ, мова);
		for (const файл of readdirSync(тека)) {
			if (!файл.startsWith('news-') || !файл.endsWith('.md')) continue;
			const id = файл.slice('news-'.length, -'.md'.length);
			const текст = readFileSync(join(тека, файл), 'utf8');
			const роди =
				кого === 'festivals' ?
					[{ вираз: ПОСИЛАННЯ, ключ: (а: string) => а as string | null }]
				:	РОДИ;
			for (const рід of роди)
				for (const m of текст.matchAll(рід.вираз)) {
					const ключ_ = рід.ключ(m[1]);
					if (!ключ_) continue;
					const ключ = `${ключ_}|${id}`;
					if (бачені.has(ключ)) continue;
					бачені.add(ключ);
					const uk = картки.uk?.[id];
					if (!uk || uk.published === false) continue;
					(зріз[ключ_] ??= []).push({
						id,
						date: uk.date,
						title: { uk: uk.title, en: картки.en?.[id]?.title ?? uk.title }
					});
				}
		}
	}
	for (const список of Object.values(зріз)) список.sort((a, b) => b.date.localeCompare(a.date));
	return Object.fromEntries(Object.entries(зріз).sort(([a], [b]) => a.localeCompare(b)));
}

const наДиску = JSON.parse(readFileSync(ЗРІЗ, 'utf8')) as Record<string, Новина[]>;
const перерахований = перерахувати('festivals');
const людиНаДиску = JSON.parse(readFileSync(ЗРІЗ_ЛЮДЕЙ, 'utf8')) as Record<string, Новина[]>;
const людиПерераховані = перерахувати('people');

describe('новини поїздок (зріз у static)', () => {
	it('перевірка жива: зріз прочитано, і в ньому є що звіряти', () => {
		expect(Object.keys(перерахований).length, 'жодна новина не посилається на фестиваль').toBeGreaterThan(0);
		expect(FESTIVALS.length, 'реєстр фестивалів порожній').toBeGreaterThan(10);
	});

	it('зріз на диску збігається з тим, що кажуть новини', () => {
		expect(
			наДиску,
			'зріз застарів — перезапустити `npm run build:festival-news`:\n' +
				`у новинах ${JSON.stringify(Object.keys(перерахований))}, ` +
				`а у файлі ${JSON.stringify(Object.keys(наДиску))}`
		).toEqual(перерахований);
	});

	it('кожен ключ зрізу має фестиваль у реєстрі', () => {
		const slugs = new Set(FESTIVALS.map((f) => f.slug));
		const сироти = Object.keys(перерахований).filter((slug) => !slugs.has(slug));
		expect(
			сироти,
			`новина посилається на фестиваль, якого немає — і саме посилання веде на 404:\n${сироти.join('\n')}`
		).toEqual([]);
	});
});

describe('новини людей (зріз у static)', () => {
	it('перевірка жива: зріз людей прочитано й у ньому є що звіряти', () => {
		expect(
			Object.keys(людиПерераховані).length,
			'жодна новина не посилається на людину'
		).toBeGreaterThan(0);
	});

	it('зріз на диску збігається з тим, що кажуть новини', () => {
		expect(
			людиНаДиску,
			'зріз застарів — перезапустити `npm run build:news-backlinks`'
		).toEqual(людиПерераховані);
	});

	it('кожен ключ зрізу — жива людина свого роду', () => {
		/*
		 * Ключ у випускника — `id`, а не адреса: адресу законно виправляють, і
		 * зріз, ключований нею, тихо осиротів би на першому ж перейменуванні. У
		 * фахівця й викладача стійкої мітки, окремої від адреси, немає, тому там
		 * `slug` — і саме тому рід записаний у ключі: без нього три набори
		 * звірялися б одним переліком, і сирота знайшовся б не всюди.
		 */
		const живі: Record<string, Set<string>> = {
			graduate: new Set(випускники.map((g) => g.id)),
			expert: слугФахівця,
			master: слугВикладача
		};
		const сироти = Object.keys(людиПерераховані).filter((k) => {
			const межа = k.indexOf(':');
			return !живі[k.slice(0, межа)]?.has(k.slice(межа + 1));
		});
		expect(сироти, `новина посилається на людину, якої немає:\n${сироти.join('\n')}`).toEqual(
			[]
		);
	});
});
