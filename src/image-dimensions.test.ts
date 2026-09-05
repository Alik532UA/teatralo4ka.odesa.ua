// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Кожен `<img>` заявляє свій розмір — або його заявляє контейнер
 * (PERFORMANCE-v8 § 3.2, § 10.2).
 *
 * ## Що ловить
 *
 * Тег без `width`/`height` до завантаження файлу займає нуль місця. Коли файл
 * приходить, усе під ним стрибає — це CLS, і бачить його кожен на повільному
 * звʼязку. Заміряно 2026-08-26: із 49 тегів `<img>` у проєкті 20 не мали жодного
 * з двох атрибутів.
 *
 * ## Чому канонічний інваріант тут не годиться дослівно
 *
 * Канон пропонує «кожен `<img>` має `width` і `height`, крапка». Половина
 * зображень цього проєкту приходить із Firestore — обкладинки статей, фото
 * галереї, — і їхнього розміру в коді НЕ ІСНУЄ. Дослівна перевірка була б
 * червоною завжди, тобто гейтом, який доводиться вимикати; такий гірший за
 * відсутній (CODE-QUALITY-v8 § 6.4.1).
 *
 * Тому вимога сформульована через НАСЛІДОК, а не через атрибут: місце під
 * зображення мусить бути відведене ДО завантаження — атрибутами в тезі або
 * розміром контейнера в CSS. Другий випадок машиною з джерел не доводиться, тож
 * кожен такий тег названий поіменно разом із правилом CSS, яке за нього
 * відповідає. Перелік тільки скорочується: запис, який більше не знаходиться,
 * валить прогін, тобто не перетворюється на памʼятник.
 *
 * ## Чому `{...imageSize(...)}` рахується розміром
 *
 * Помічник має рівно одну роботу — віддати `width` і `height` — і його тип це
 * закріплює: шлях поза мапою розмірів не компілюється. Самі числа звіряються з
 * заголовками файлів на диску (`lib/config/localImages.test.ts`), тобто тут
 * перевіряється наявність, а там — правдивість.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): прибрати `{...imageSize`
 * із герба в `TickerBanner` — перевірка мусить назвати саме його.
 */

const SRC = 'src';

const walk = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) walk(full, out);
		else if (entry.endsWith('.svelte')) out.push(full.replace(/\\/g, '/'));
	}
	return out;
};

/** Коментарі розмітки й CSS: у них теж пишуть `<img>`, і це не теги. */
const withoutComments = (source: string): string =>
	source
		.replace(/<!--[\s\S]*?-->/g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length))
		.replace(/\/\*[\s\S]*?\*\//g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length));

/**
 * Теги `<img>` із їхніми межами.
 *
 * Кінець тега — перший `>` поза фігурними дужками, що не є частиною `=>`: у
 * розмітці Svelte стрілка в обробнику містить `>`, і наївний `/<img[^>]*>/`
 * обриває тег посеред атрибута. Той самий розбір і з тієї ж причини живе в
 * `keyboard-activation.test.ts`.
 */
function imgTags(source: string): Array<{ index: number; tag: string }> {
	const tags: Array<{ index: number; tag: string }> = [];
	let from = 0;
	for (;;) {
		const start = source.indexOf('<img', from);
		if (start === -1) break;
		const next = source[start + 4];
		if (next && !/[\s/>]/.test(next)) {
			from = start + 4;
			continue;
		}
		let depth = 0;
		let j = start + 1;
		for (; j < source.length; j += 1) {
			const c = source[j];
			if (c === '{') depth += 1;
			else if (c === '}') depth -= 1;
			else if (c === '>' && depth === 0 && source[j - 1] !== '=') break;
		}
		tags.push({ index: start, tag: source.slice(start, j + 1) });
		from = j + 1;
	}
	return tags;
}

/** Тег сам каже свій розмір: двома атрибутами або типізованим розгортанням. */
const declaresSize = (tag: string): boolean =>
	(/\bwidth[=\s]/.test(tag) && /\bheight[=\s]/.test(tag)) || tag.includes('{...imageSize(');

/**
 * Теги, під які місце відводить CSS. Ключ — `файл | ознака в тезі`, значення —
 * правило, що відповідає за місце, і причина, чому атрибутів тут бути не може.
 *
 * Ознака — фрагмент самого тега (клас або вираз `src`), а не номер рядка:
 * рядки їдуть від будь-якої правки вище, і перелік почав би брехати вже на
 * наступному коміті.
 *
 * УСІ записи — зображення з Firestore. Своїх файлів тут немає й бути не може:
 * для них є мапа розмірів.
 */
const RESERVED_BY_CSS: Record<string, string> = {
	'src/lib/components/ContentCard.svelte | class={imgClass}':
		'.focus-card__img-wrap / .grid-card__img-wrap — flex-basis 40 % і 35 % від картки; ' +
		'.list-item__img-wrap — 90px × aspect-ratio 9/16. Обкладинка приходить із Firestore',
	'src/lib/components/ArticleView.svelte | class="article-cover__img"':
		'.article-cover__media — aspect-ratio 9/16 на всю ширину; ' +
		'та сама пропорція в плеєра, щоб вміст не стрибав при перемиканні',
	'src/lib/components/StaticPage.svelte | class="page-cover__img"':
		'.page-cover — aspect-ratio 9/16, sticky-колонка сторінки',
	'src/lib/components/ui/Toast.svelte | class="toast-card__img"':
		'.toast-card__media — 110px × min-height 130px',
	'src/lib/components/GalaxyUpdateTeacherRow.svelte | class="tip__portrait"':
		'.tip__portrait — 62px завширшки, висота від `align-self: stretch`: ' +
		'портрет тягнеться на висоту підказки, яку задає текст поруч. ' +
		'Число тут розійшлося б із нею на першому ж довгому імені, ' +
		'а сама підказка накладка — під нею вміст сторінки не рухається',
	'src/lib/components/PhotoLightbox.svelte | class="lightbox-img"':
		'накладка поверх сторінки: розмір задають max-width 90vw / max-height 78dvh, ' +
		'і зсунути вона може лише саму себе — під нею вміст сторінки не рухається',
	'src/lib/components/admin/ArticleForm.svelte | src={translations.uk.coverUrl}':
		'.cover-preview — 90px × aspect-ratio 9/16 інлайном',
	'src/lib/components/admin/ArticleForm.svelte | src={translations[lang].coverUrl}':
		'.cover-preview — 70px × aspect-ratio 9/16 інлайном',
	'src/routes/admin/articles/+page.svelte | src={getCoverUrl(article)}':
		'.al-thumb — 84 × 84 px (60 × 60 на вузькому екрані)',
	'src/routes/admin/content/+page.svelte | src={getCoverUrl(item)}':
		'.cl-thumb — 84 × 84 px (60 × 60 на вузькому екрані)',
	'src/routes/admin/pages/+page.svelte | src={getCoverUrl(page)}':
		'.pl-thumb — 84 × 84 px (60 × 60 на вузькому екрані)'
};

const files = walk(SRC);

/** Усі теги проєкту разом із файлом — рахується один раз на прогін. */
const allImages = files.flatMap((file) => {
	const source = withoutComments(readFileSync(file, 'utf8'));
	return imgTags(source).map(({ index, tag }) => ({
		file,
		tag,
		line: (source.slice(0, index).match(/\n/g) ?? []).length + 1
	}));
});

/** Який запис переліку описує цей тег, якщо взагалі якийсь. */
function matchingException(file: string, tag: string): string | undefined {
	return Object.keys(RESERVED_BY_CSS).find((key) => {
		const [keyFile, marker] = key.split(' | ');
		return keyFile === file && tag.includes(marker);
	});
}

describe('розміри зображень (PERFORMANCE-v8 § 3.2)', () => {
	it('перевірка жива: теги знайдено', () => {
		expect(allImages.length, 'жодного <img> — сканер шукає не там').toBeGreaterThan(20);
	});

	it('перевірка жива: розбір тега не обривається на стрілці в атрибуті', () => {
		const [only] = imgTags('<img src={x} onload={() => go(1)} width="1" height="2" />');
		expect(only.tag, 'тег обірвано на `=>`').toContain('height="2"');
	});

	it('кожен <img> має розміри або названий у переліку з причиною', () => {
		const naked = allImages
			.filter(({ tag }) => !declaresSize(tag))
			.filter(({ file, tag }) => !matchingException(file, tag))
			.map(({ file, line, tag }) => `${file}:${line} — ${tag.slice(0, 70).replace(/\s+/g, ' ')}…`);

		expect(
			naked,
			'зображення без відведеного місця — розкладка стрибне на завантаженні. ' +
				'Свій файл: додати {...imageSize(шлях)}. Чужий: відвести місце в CSS і ' +
				`назвати тег у RESERVED_BY_CSS разом із правилом:\n${naked.join('\n')}`
		).toEqual([]);
	});

	it('перелік винятків не містить записів, яким уже нічого не відповідає', () => {
		const stale = Object.keys(RESERVED_BY_CSS).filter(
			(key) => !allImages.some(({ file, tag }) => matchingException(file, tag) === key)
		);

		expect(
			stale,
			'запис нічого не описує: тег зник або змінив ознаку. Перелік має ' +
				`скорочуватися, а не ставати памʼятником:\n${stale.join('\n')}`
		).toEqual([]);
	});

	it('кожен виняток пояснює, ЩО саме відводить місце', () => {
		const mute = Object.entries(RESERVED_BY_CSS)
			.filter(([, reason]) => reason.trim().length < 20)
			.map(([key]) => key);
		expect(mute, `причина не написана:\n${mute.join('\n')}`).toEqual([]);
	});

	it('в одному компоненті не більше одного fetchpriority="high"', () => {
		// § 3.1: пріоритет має сенс, поки він в одного. Межа саме компонентна, а
		// не проєктна: обкладинка статті й знімок головної — LCP РІЗНИХ сторінок,
		// і кожна має право на свій.
		const greedy = files
			.map((file) => ({
				file,
				count: (readFileSync(file, 'utf8').match(/fetchpriority=["']high["']/g) ?? []).length
			}))
			.filter(({ count }) => count > 1)
			.map(({ file, count }) => `${file}: ${count}`);

		expect(greedy, `пріоритет у двох дорівнює пріоритету в жодного:\n${greedy.join('\n')}`).toEqual(
			[]
		);
	});
});
