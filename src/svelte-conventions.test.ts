// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Конвенції Svelte, яких не покриває жоден плагін
 * (SVELTE-UI-v8 § 4, SVELTE-CORE-v8 § 6).
 *
 * Три різні класи, спільна риса одна: компілятор і ESLint їх не бачать, а ціна
 * помітна лише згодом.
 */

const walk = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry).replace(/\\/g, '/');
		if (statSync(full).isDirectory()) walk(full, out);
		else out.push(full);
	}
	return out;
};

const all = walk('src');
const components = all.filter((f) => f.endsWith('.svelte'));
const sources = all.filter((f) => /\.(ts|svelte)$/.test(f) && !/\.(test|spec)\.ts$/.test(f));

/** Джерело без коментарів; переноси зберігаються, щоб не поїхали номери рядків. */
const withoutComments = (source: string): string =>
	source
		.replace(/<!--[\s\S]*?-->/g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length))
		.replace(/\/\*[\s\S]*?\*\//g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length))
		.replace(/^[ \t]*\/\/.*$/gm, '');

describe('перевірка жива', () => {
	it('компоненти й джерела знайдено', () => {
		expect(components.length, 'жодного .svelte — сканер шукає не там').toBeGreaterThan(10);
		expect(sources.length).toBeGreaterThan(50);
	});
});

/**
 * SVELTE-UI-v8 § 1 — API Svelte 4 у проєкті на рунах.
 *
 * Порушень тут нуль, і саме тому перевірка додана: канон прямо каже, що правило
 * з нулем порушень ставиться в `error`, а не лишається побажанням
 * (CODE-QUALITY-v8 § 6.4.1). Правила ESLint на це немає: `svelte/no-deprecated-slot`
 * у `eslint-plugin-svelte` 3.22 **не існує** — у пакеті лишилися тільки
 * `no-dynamic-slot-name` і `experimental-require-slot-types`. Тобто канонічний
 * рядок конфігу з § 4 у чинній версії плагіна валить lint помилкою «Definition
 * for rule not found». Перевірено переліком правил у node_modules.
 */
describe('немає API Svelte 4', () => {
	const BANNED: Array<[RegExp, string]> = [
		[/<slot[\s/>]/, '<slot> — замість нього сніпети ({#snippet} / {@render})'],
		[/\son:[a-z]+[=\s>]/, 'on:подія — замість неї атрибут onподія'],
		[/<svelte:component/, '<svelte:component> — у рунах компонент рендериться напряму'],
		[/createEventDispatcher/, 'createEventDispatcher — замість нього колбек у пропсах'],
		[/\bexport\s+let\s/, 'export let — замість нього $props()']
	];

	it.each(BANNED)('%s', (pattern, _hint) => {
		const bad = components.filter((f) => pattern.test(withoutComments(readFileSync(f, 'utf8'))));
		expect(bad, `${_hint}:\n${bad.join('\n')}`).toEqual([]);
	});
});

/**
 * SVELTE-UI-v8 § 4 — кожен `svelte-ignore` має поруч записану причину.
 *
 * Клас дефекту заміряний у цьому проєкті 2026-08-20: плитки галереї мали
 * `role="button"`, `tabindex="0"` і `onclick` без клавіатури, а попередження
 * компілятора було зняте голим `svelte-ignore`. Коментар без причини читається
 * як розглянутий випадок — і саме тому дефект прожив довго. Два таких місця
 * виявилися справжніми порушеннями WCAG 2.1.1.
 *
 * ## Чому причина ОКРЕМИМ коментарем, а не текстом у самому `svelte-ignore`
 *
 * Форма з канону (`<!-- svelte-ignore code причина -->`) у цьому проєкті
 * НЕПРАЦЕЗДАТНА, і це перевірено прямим експериментом, а не вичитано: правило
 * `svelte/no-unused-svelte-ignore` рівня `error` розбирає кожне слово після
 * коду як окремий код і дає по помилці на слово. Один рядок пояснення дав
 * чотири помилки lint. Тому причина живе в сусідньому коментарі — його ані
 * Svelte, ані ESLint не розбирають.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): прибрати коментар-причину
 * над будь-яким `svelte-ignore` — перевірка мусить назвати саме це місце.
 */
describe('svelte-ignore несе причину', () => {
	/** Скільки змістовних символів робить коментар поясненням, а не міткою. */
	const MIN_REASON = 40;

	const IGNORE_LINE = /^[ \t]*<!--[ \t]*svelte-ignore\b/;

	function nakedIgnores(file: string): string[] {
		const lines = readFileSync(file, 'utf8').split('\n');
		const problems: string[] = [];

		for (let i = 0; i < lines.length; i += 1) {
			if (!IGNORE_LINE.test(lines[i])) continue;
			// Початок пробігу: кілька `svelte-ignore` підряд прикриває одна причина.
			if (i > 0 && IGNORE_LINE.test(lines[i - 1])) continue;

			let j = i - 1;
			while (j >= 0 && lines[j].trim() === '') j -= 1;
			if (j < 0 || !lines[j].trimEnd().endsWith('-->')) {
				problems.push(`${file}:${i + 1} — над ним немає коментаря з причиною`);
				continue;
			}

			// Тіло сусіднього коментаря: від його `<!--` до `-->`.
			let start = j;
			while (start >= 0 && !lines[start].includes('<!--')) start -= 1;
			if (start < 0) {
				problems.push(`${file}:${i + 1} — коментар над ним не має початку`);
				continue;
			}
			const body = lines
				.slice(start, j + 1)
				.join(' ')
				.replace(/<!--|-->/g, '')
				.trim();
			if (IGNORE_LINE.test(lines[start])) {
				problems.push(`${file}:${i + 1} — над ним інший svelte-ignore, а не причина`);
			} else if (body.replace(/\s+/g, '').length < MIN_REASON) {
				problems.push(
					`${file}:${i + 1} — причина коротша за ${MIN_REASON} символів: «${body.slice(0, 40)}»`
				);
			}
		}
		return problems;
	}

	it('перевірка жива: у проєкті є що перевіряти', () => {
		const withIgnore = components.filter((f) =>
			readFileSync(f, 'utf8').split('\n').some((l) => IGNORE_LINE.test(l))
		);
		expect(withIgnore.length, 'жодного svelte-ignore — перевіряти нема що').toBeGreaterThan(0);
	});

	it('кожен svelte-ignore має поруч причину', () => {
		const problems = components.flatMap(nakedIgnores);
		expect(
			problems,
			'знята заборона без записаної причини читається як розглянутий випадок:\n' +
				problems.join('\n')
		).toEqual([]);
	});
});

/**
 * SVELTE-CORE-v8 § 3.3 і § 6 — контекст лише через типізований аксесор.
 *
 * Рядковий ключ контексту не перевіряється нічим: описка в одному з двох місць
 * дає `undefined` у рантаймі, а не помилку типів. Порушень зараз нуль — контекст
 * у проєкті не вживається взагалі, і перевірка тримає саме цей стан: якщо
 * контекст зʼявиться, він зʼявиться правильним.
 *
 * Негативний lookbehind відсікає `canvas.getContext('2d')` — інакше кожен
 * проєкт із фоном на canvas дає знахідку (у нас це `backgrounds/engine`).
 */
describe('контекст без рядкових ключів', () => {
	const RE_CTX = /(?<![.\w])(get|set)Context\s*(<[^>]*>)?\s*\(\s*(['"`])/g;

	it('перевірка жива: canvas.getContext не вважається порушенням', () => {
		expect(RE_CTX.test("const ctx = canvas.getContext('2d');")).toBe(false);
		RE_CTX.lastIndex = 0;
		expect(RE_CTX.test("const v = getContext('theme');")).toBe(true);
		RE_CTX.lastIndex = 0;
	});

	it('немає рядкових ключів контексту', () => {
		const bad = sources.flatMap((f) =>
			[...withoutComments(readFileSync(f, 'utf8')).matchAll(RE_CTX)].map((m) => `${f}: ${m[0]}`)
		);
		expect(
			bad,
			`рядковий ключ контексту — описка стає undefined у рантаймі:\n${bad.join('\n')}`
		).toEqual([]);
	});
});
