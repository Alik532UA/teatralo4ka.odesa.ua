// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Посилання на CSS-змінну, якої не існує, — це найтихіший клас дефектів у
 * проєкті (UI-UX-v8 § 1.6). Він не дає ні помилки збірки, ні попередження
 * svelte-check, ні падіння тесту; сторінка рендериться, просто інакше:
 *
 * - `var(--x, #fff)` підставить `#fff` — правильно виглядає у світлій темі
 *   й біло світиться в темній. Саме тому фолбек тут не страховка, а спосіб
 *   заховати помилку від того, хто її зробив;
 * - `var(--x)` без фолбека робить властивість НЕВАЛІДНОЮ на етапі обчислення.
 *   Не «сірий бордер замість блакитного», а `border: 1px solid` без кольору,
 *   тобто рамки немає взагалі.
 *
 * Перевірку додано після того, як скан джерел знайшов 13 неоголошених змінних
 * на 120 посилань — серед них `--color-border` у 57 місцях (редактори адмінки
 * малювалися без рамок) і `--theme-dynamic-card-bg` у 36 (білі картки в
 * темній темі). Оком не було видно жодної: у світлій темі, у якій працюють,
 * усе виглядало як задумано.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): прибрати
 * `--color-border` із блоку псевдонімів у `global.css` — перевірка має стати
 * червоною з переліком 57 місць. Зроблено, падає.
 */

/** Файли, з яких збираються ГЛОБАЛЬНІ оголошення: теми і базові стилі. */
const GLOBAL_STYLE_DIRS = ['src/lib/styles', 'src/lib/styles/themes'];

/**
 * Змінні, які оголошує один компонент, а вживає інший — через звичайне
 * успадкування CSS. Це валідний патерн, але саме він міг би приховати
 * справжній промах, тому кожен випадок названий поіменно, а не дозволений
 * класом. Стале посилання тут теж ловиться: якщо оголошення зникне, тест
 * впаде на перевірці самого списку.
 */
const CROSS_COMPONENT: Record<string, { declaredIn: string; why: string }> = {
	'--focus-card-width': {
		declaredIn: 'src/lib/components/ContentWidget.svelte',
		why: 'ширину картки задає віджет-обгортка, читає її ContentCard всередині'
	}
};

function walk(dir: string, keep: (name: string) => boolean, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, keep, out);
		else if (keep(entry.name)) out.push(full);
	}
	return out;
}

/** Оголошення виду `--name:` — і в CSS-файлі, і в `<style>` компонента, і в inline-`style`. */
function declarations(source: string): Set<string> {
	return new Set([...source.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
}

/**
 * Змінні, які ставить скрипт: `style.setProperty('--x', …)`.
 * Для них оголошення в CSS немає й бути не може — значення з'являється
 * у рантаймі, а до того працює фолбек у `var()`.
 */
function runtimeDeclarations(source: string): Set<string> {
	return new Set(
		[...source.matchAll(/setProperty\(\s*[`'"](--[\w-]+)/g)].map((m) => m[1])
	);
}

describe('CSS-змінні', () => {
	const sources = walk('src', (n) => n.endsWith('.svelte') || n.endsWith('.ts'));
	const globalCss = GLOBAL_STYLE_DIRS.flatMap((dir) =>
		readdirSync(dir)
			.filter((f) => f.endsWith('.css'))
			.map((f) => readFileSync(join(dir, f), 'utf8'))
	);

	const declaredGlobally = new Set<string>();
	for (const css of globalCss) for (const name of declarations(css)) declaredGlobally.add(name);

	const declaredAtRuntime = new Set<string>();
	for (const file of sources) {
		for (const name of runtimeDeclarations(readFileSync(file, 'utf8'))) {
			declaredAtRuntime.add(name);
		}
	}

	const references = sources.flatMap((file) =>
		[...readFileSync(file, 'utf8').matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => ({
			file,
			name: m[1]
		}))
	);

	it('знаходить джерела, оголошення й посилання — перевірка жива', () => {
		expect(sources.length).toBeGreaterThan(50);
		expect(globalCss.length).toBe(5);
		expect(declaredGlobally.size).toBeGreaterThan(50);
		expect(references.length).toBeGreaterThan(100);
	});

	it('кожна змінна зі списку крос-компонентних справді десь оголошена', () => {
		const stale: string[] = [];
		for (const [name, { declaredIn }] of Object.entries(CROSS_COMPONENT)) {
			if (!declarations(readFileSync(declaredIn, 'utf8')).has(name)) {
				stale.push(`${name}: у ${declaredIn} оголошення немає — виняток застарів`);
			}
		}
		expect(stale, stale.join('\n')).toEqual([]);
	});

	it('немає посилань на неоголошені CSS-змінні', () => {
		const own = new Map(
			sources.map((f) => [f, declarations(readFileSync(f, 'utf8'))] as const)
		);

		const problems = new Map<string, Set<string>>();
		for (const { file, name } of references) {
			if (declaredGlobally.has(name)) continue;
			if (declaredAtRuntime.has(name)) continue;
			if (own.get(file)!.has(name)) continue;
			if (name in CROSS_COMPONENT) continue;

			if (!problems.has(name)) problems.set(name, new Set());
			problems.get(name)!.add(file);
		}

		const report = [...problems.entries()]
			.map(([name, files]) => `${name} — ${[...files].join(', ')}`)
			.join('\n');

		expect(
			[...problems.keys()],
			`неоголошені змінні (підставиться фолбек або властивість стане невалідною):\n${report}`
		).toEqual([]);
	});
});
