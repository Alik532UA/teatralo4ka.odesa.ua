// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Кожен код країни з реєстрів має і НАЗВУ, і ПРАПОР.
 *
 * ## Що зламалося
 *
 * 2026-09-05 у реєстр театрів додали Тбіліський театр імені Грибоєдова з кодом
 * `GE`. Прапор для нього в `CountryFlag` був, а назви в словнику — ні, і
 * сторінка театру показувала читачеві сирий ключ «galaxy.country.GE». Помітити
 * це можна лише відкривши саму сторінку: жоден гейт кодів не звіряв.
 *
 * Половина перевірки вже існувала — але лише для ФЕСТИВАЛІВ і лише про прапор
 * (`data/festivals.test.ts`). Тобто клас був відомий, а закритий рівно на
 * третину: заклади освіти й театри лишалися поза нею, а словник назв — поза
 * нею для всіх трьох.
 *
 * ## Чому обидва боки
 *
 * Прапор без назви — сирий ключ у тексті; назва без прапора — літери «GE»
 * замість прапорця (у системних шрифтах Windows емодзі-прапорців немає, тому
 * компонент і малює SVG). Обидва боки видно лише оком, тож перевіряються разом.
 *
 * ## Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * Прибрати `"GE"` зі `uk.json` — перевірка падає й називає і код, і запис, який
 * його вживає. Те саме, якщо прибрати гілку `upperCode === 'GE'` з компонента.
 */

const ФЛАГИ = 'src/lib/components/icons/CountryFlag.svelte';

const читати = (шлях: string): unknown => JSON.parse(readFileSync(шлях, 'utf8'));

function записи<T>(файл: string, ключ: string): T[] {
	const дані = читати(`src/lib/data/${файл}`);
	return (Array.isArray(дані) ? дані : ((дані as Record<string, T[]>)[ключ] ?? [])) as T[];
}

/** Усі вжиті коди разом із тим, ХТО їх вживає. */
function вжиті(): Map<string, string[]> {
	const out = new Map<string, string[]>();
	for (const [файл, ключ, підпис] of [
		['festivals.data.json', 'festivals', 'фестиваль'],
		['institutions.data.json', 'institutions', 'заклад'],
		['theatres.data.json', 'theatres', 'театр']
	] as const) {
		for (const x of записи<{ slug: string; countries?: string[] }>(файл, ключ)) {
			for (const код of x.countries ?? []) {
				out.set(код, [...(out.get(код) ?? []), `${підпис} ${x.slug}`]);
			}
		}
	}
	return out;
}

const КОДИ = вжиті();

const словник = (мова: 'uk' | 'en'): Record<string, string> =>
	((читати(`src/lib/i18n/locales/${мова}.json`) as Record<string, Record<string, unknown>>).galaxy
		.country ?? {}) as Record<string, string>;

const прапори = (): Set<string> => {
	const джерело = readFileSync(ФЛАГИ, 'utf8');
	return new Set([...джерело.matchAll(/upperCode === '([A-Z]{2})'/g)].map((m) => m[1]));
};

describe('коди країн', () => {
	it('перевірка жива: коди в реєстрах є', () => {
		expect(КОДИ.size, 'жодного коду — перевіряти нема чого').toBeGreaterThan(5);
	});

	it('перевірка жива: прапори з компонента прочитані', () => {
		expect(прапори().size, 'жодного прапора — розбір компонента зламався').toBeGreaterThan(5);
	});

	it('кожен код має назву обома мовами (CRITICAL)', () => {
		const bad: string[] = [];
		for (const мова of ['uk', 'en'] as const) {
			const назви = словник(мова);
			for (const [код, де] of КОДИ) {
				if (!назви[код]) bad.push(`${мова}: «${код}» (${де.join(', ')})`);
			}
		}
		expect(
			bad,
			'сторінка покаже сирий ключ «galaxy.country.XX» замість назви країни. ' +
				`Дописати назву в galaxy.country обох локалей:\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});

	it('кожен код має прапор', () => {
		const відомі = прапори();
		const bad: string[] = [];
		for (const [код, де] of КОДИ) {
			if (!відомі.has(код)) bad.push(`«${код}» (${де.join(', ')})`);
		}
		expect(
			bad,
			'замість прапорця буде видно літери коду — у системних шрифтах Windows ' +
				`емодзі-прапорців немає:\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});

	it('у словнику немає назв для кодів, яких ніхто не вживає', () => {
		/*
		 * Перелік має скорочуватися, а не ставати пам'ятником: назва країни, якої
		 * немає в жодному реєстрі, — це слід від запису, який колись прибрали.
		 */
		const зайві = Object.keys(словник('uk')).filter((код) => !КОДИ.has(код));
		expect(зайві, `назва є, а коду ніде немає: ${зайві.join(', ')}`).toEqual([]);
	});
});
