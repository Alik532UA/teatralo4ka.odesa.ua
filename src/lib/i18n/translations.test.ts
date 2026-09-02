// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Паритет перекладів (I18N-v8 § 7.1).
 *
 * Найдешевша перевірка з усіх і та, що ловить найбільше: ключ, доданий в один
 * словник і забутий в іншому, не падає ні на збірці, ні на типах — він просто
 * показує сирий ключ або порожнечу тим, хто читає сайт другою мовою.
 *
 * Те саме для markdown-сторінок: сторінка, що існує лише українською, при
 * перемиканні мови віддає порожньо.
 */

const LOCALES_DIR = 'src/lib/i18n/locales';
const PAGES_DIR = 'src/lib/i18n/pages';
const BASE = 'uk';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function flatten(value: Json, prefix = ''): string[] {
	if (value === null || typeof value !== 'object') return [prefix];
	if (Array.isArray(value)) return value.flatMap((v, i) => flatten(v, `${prefix}[${i}]`));
	return Object.entries(value).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
}

function leaves(value: Json, prefix = ''): [string, Json][] {
	if (value === null || typeof value !== 'object') return [[prefix, value]];
	if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${prefix}[${i}]`));
	return Object.entries(value).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

/**
 * Шукає повтори ключів на одному рівні об'єкта в JSON (те, що `JSON.parse` затирає мовчки).
 */
export function findDuplicateJsonKeys(jsonText: string): string[] {
	const duplicates: string[] = [];
	type Frame = { type: 'object'; keys: Set<string>; path: string } | { type: 'array' };
	const stack: Frame[] = [];
	let inString = false;
	let isEscaped = false;
	let currentString = '';
	let lastKey: string | null = null;
	let expectingKey = false;

	for (let i = 0; i < jsonText.length; i++) {
		const char = jsonText[i];

		if (inString) {
			if (isEscaped) {
				isEscaped = false;
			} else if (char === '\\') {
				isEscaped = true;
			} else if (char === '"') {
				inString = false;
				if (expectingKey) {
					lastKey = currentString;
					expectingKey = false;
				}
			} else {
				currentString += char;
			}
			continue;
		}

		if (char === '"') {
			inString = true;
			currentString = '';
		} else if (char === '{') {
			const parent = stack
				.filter((f): f is { type: 'object'; keys: Set<string>; path: string } => f.type === 'object')
				.map((f) => f.path)
				.filter(Boolean)
				.join('.');
			stack.push({
				type: 'object',
				keys: new Set(),
				path: lastKey ? (parent ? `${parent}.${lastKey}` : lastKey) : parent
			});
			expectingKey = true;
			lastKey = null;
		} else if (char === '}') {
			stack.pop();
			lastKey = null;
			expectingKey = false;
		} else if (char === '[') {
			stack.push({ type: 'array' });
			lastKey = null;
			expectingKey = false;
		} else if (char === ']') {
			stack.pop();
			lastKey = null;
			expectingKey = false;
		} else if (char === ':') {
			const top = stack.at(-1);
			if (top && top.type === 'object' && lastKey !== null) {
				if (top.keys.has(lastKey)) {
					const fullKey = top.path ? `${top.path}.${lastKey}` : lastKey;
					duplicates.push(fullKey);
				} else {
					top.keys.add(lastKey);
				}
			}
		} else if (char === ',') {
			const top = stack.at(-1);
			if (top && top.type === 'object') {
				expectingKey = true;
			}
			lastKey = null;
		}
	}
	return duplicates;
}

const locales = readdirSync(LOCALES_DIR)
	.filter((f) => f.endsWith('.json'))
	.map((f) => f.replace('.json', ''));

const dict = Object.fromEntries(
	locales.map((l) => [l, JSON.parse(readFileSync(join(LOCALES_DIR, `${l}.json`), 'utf8')) as Json])
);

describe('переклади', () => {
	const baseKeys = flatten(dict[BASE]).sort();

	it('словники знайдено — перевірка жива', () => {
		expect(locales.length).toBeGreaterThan(1);
		expect(baseKeys.length).toBeGreaterThan(0);
	});

	for (const lang of locales) {
		it(`${lang}: жодного дубліката ключів у JSON-словнику`, () => {
			const raw = readFileSync(join(LOCALES_DIR, `${lang}.json`), 'utf8');
			const dups = findDuplicateJsonKeys(raw);
			expect(dups, `дублікати ключів у ${lang}.json: ${dups.join(', ')}`).toEqual([]);
		});
	}

	for (const lang of locales.filter((l) => l !== BASE)) {
		it(`${lang}: той самий набір ключів, що й ${BASE}`, () => {
			const keys = flatten(dict[lang]).sort();
			const missing = baseKeys.filter((k) => !keys.includes(k));
			const extra = keys.filter((k) => !baseKeys.includes(k));

			expect(
				{ missing, extra },
				`ключі розійшлися:\nбракує в ${lang}: ${missing.join(', ')}\nзайві в ${lang}: ${extra.join(', ')}`
			).toEqual({ missing: [], extra: [] });
		});

		it(`${lang}: жодного порожнього рядка`, () => {
			const empty = leaves(dict[lang])
				.filter(([, v]) => typeof v === 'string' && v.trim() === '')
				.map(([k]) => k);
			expect(empty, `порожні значення: ${empty.join(', ')}`).toEqual([]);
		});

		it(`${lang}: жодного значення, не перекладеного з ${BASE}`, () => {
			// Однакове значення двома мовами саме по собі нормальне, але довгий
			// збіг у тексті означає скопійований і не перекладений блок.
			//
			// Мовно-нейтральні значення виключаються: URL, email, телефон, час
			// роботи. Перша ж прогонка спіймала саме їх — посилання на соцмережі
			// однакові за визначенням, і без цього фільтра перевірка сварилася б
			// на правильні дані, а таку перевірку швидко вимикають.
			const LANGUAGE_NEUTRAL = /^(https?:\/\/|mailto:|tel:|[+\d\s()–-]+$|[\d:\s–-]+$)/;

			const baseLeaves = new Map(leaves(dict[BASE]));
			const same = leaves(dict[lang])
				.filter(([k, v]) => typeof v === 'string' && v.length > 25 && baseLeaves.get(k) === v)
				.filter(([, v]) => !LANGUAGE_NEUTRAL.test(v as string))
				.map(([k]) => k);
			expect(same, `схоже, не перекладено: ${same.join(', ')}`).toEqual([]);
		});
	}
});

describe('markdown-сторінки', () => {
	const langs = readdirSync(PAGES_DIR);
	const slugs = Object.fromEntries(
		langs.map((l) => [l, readdirSync(join(PAGES_DIR, l)).filter((f) => f.endsWith('.md')).map((f) => f.replace('.md', ''))])
	);

	it('сторінки знайдено — перевірка жива', () => {
		expect(langs.length).toBeGreaterThan(0);
		expect(slugs[BASE]?.length ?? 0).toBeGreaterThan(0);
	});

	for (const lang of langs.filter((l) => l !== BASE)) {
		it(`${lang}: той самий набір сторінок, що й ${BASE}`, () => {
			const missing = slugs[BASE].filter((s) => !slugs[lang].includes(s));
			const extra = slugs[lang].filter((s) => !slugs[BASE].includes(s));
			expect(
				{ missing, extra },
				`сторінки розійшлися:\nбракує в ${lang}: ${missing.join(', ')}\nзайві в ${lang}: ${extra.join(', ')}`
			).toEqual({ missing: [], extra: [] });
		});
	}
});
