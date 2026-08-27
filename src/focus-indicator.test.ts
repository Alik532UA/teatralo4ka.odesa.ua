// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `outline: none` без заміни (ACCESSIBILITY-v8 § 3, HIGH).
 *
 * `global.css` малює одне кільце на весь сайт:
 * `:focus-visible { outline: 2px solid var(--accent-primary) }`. Вага цього
 * правила — (0,1,0), а будь-який селектор усередині компонента Svelte отримує
 * ще й клас скоупа, тобто (0,2,0). Через це `outline: none` у компоненті
 * **завжди** перемагає глобальне кільце — і не лише там, де його писали.
 *
 * Наслідок бачить лише той, хто ходить клавіатурою: `Tab` переводить фокус, а
 * на екрані не змінюється НІЧОГО. Людина не знає, де вона, і натискає навмання.
 * axe цього не ловить у принципі — у дереві доступності елемент присутній і
 * сфокусований, невидимий він лише очима.
 *
 * ## Що вважається заміною
 *
 * `outline: none` сам по собі не дефект: у полях цього проєкту кільце навмисно
 * замінене зміною рамки (`.form-input:focus { border-color: accent }`) — одна
 * лінія замість двох. Тому перевірка не забороняє `outline: none`, а вимагає,
 * щоб у ТОМУ САМОМУ файлі знайшлося правило для того самого селектора з
 * `:focus` / `:focus-visible` / `:focus-within`, яке щось малює.
 *
 * ## Знайдено цією перевіркою (2026-08-28)
 *
 * Сім місць із дев'ятнадцяти лишалися без будь-якої заміни:
 *
 * - `ContentWidget` → `.focus-viewport:focus, .focus-viewport:focus-visible
 *   { outline: none }` і нічого більше. Це `<section tabindex="0">` каруселі,
 *   тобто елемент, який СПЕЦІАЛЬНО зроблено фокусованим, щоб ← → гортали слайди;
 * - `SearchOverlay` → `.search__input`: у файлі не було жодного `:focus`;
 * - `RichTextEditor` → чотири редаговані області (`.editor-content`,
 *   `.ProseMirror`, `.html-editor`, `.markdown-editor`);
 * - панель налаштувань → `.form-range`, повзунок, який працює саме стрілками.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): прибрати
 * `.rich-editor:focus-within` — перевірка мусить назвати всі чотири області
 * редактора. Зроблено, падає.
 */

const ROOT = 'src';

function walk(dir: string, keep: (name: string) => boolean, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, keep, out);
		else if (keep(entry.name)) out.push(full);
	}
	return out;
}

/** Коментарі — пробілами, щоб номери рядків у звіті лишилися правдивими. */
function stripComments(text: string): string {
	const blank = (m: string) => m.replace(/[^\n]/g, ' ');
	return text.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/<!--[\s\S]*?-->/g, blank);
}

type Rule = { selector: string; body: string; line: number };
type Declaration = { prop: string; value: string };

/**
 * Правила з тексту — з урахуванням вкладених `@media` / `@container`.
 *
 * Наївний розбір «розбити по `}`» тут не годиться: половина `outline: none` у
 * проєкті лежить усередині медіазапиту, і селектор для них вийшов би порожній,
 * тобто дефект став би невидимим для перевірки, яка нібито його шукає.
 */
function rules(source: string): Rule[] {
	const text = stripComments(source);
	const found: Rule[] = [];
	const stack: { selector: string; start: number; line: number }[] = [];
	let chunkStart = 0;

	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (ch !== '{' && ch !== '}' && ch !== ';') continue;

		if (ch === '{') {
			const raw = text.slice(chunkStart, i);
			stack.push({
				selector: raw.trim(),
				start: i + 1,
				// Рядок ПОЧАТКУ селектора, а не дужки: список із двох рядків
				// (`.a:focus,\n.a:focus-visible {`) інакше вказував би на другий.
				line: text.slice(0, chunkStart + (raw.length - raw.trimStart().length)).split('\n').length
			});
		} else if (ch === '}') {
			const open = stack.pop();
			if (open && !open.selector.startsWith('@')) {
				found.push({
					selector: open.selector.replace(/\s+/g, ' '),
					body: text.slice(open.start, i),
					line: open.line
				});
			}
		}
		chunkStart = i + 1;
	}
	return found;
}

/** `.x:focus-visible::before` → `.x`. Псевдокласи стану до селектора не належать. */
function base(selector: string): string {
	return selector
		.replace(/::?[a-z-]+(\([^)]*\))?/gi, (m) => (m.startsWith('::') ? '' : STATE.test(m) ? '' : m))
		.trim();
}

/** Псевдокласи стану, які знімаються при пошуку «того самого елемента». */
const STATE = /^:(focus|focus-visible|focus-within|hover|active|visited|target|checked)\b/i;

/** Кожен селектор списку окремо: `a, b:focus { … }` — це два селектори. */
function selectors(list: string): string[] {
	return list
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

/**
 * Оголошення САМОГО правила, без вкладених блоків.
 *
 * Розбирається значення, а не текст. Регулярка тут була б не спрощенням, а
 * дефектом: перша редакція шукала `box-shadow\s*:\s*(?!none)` — і `\s*` після
 * двокрапки відкочувався на нуль символів, тож `box-shadow: none` збігалося як
 * «щось малює». Через це `.focus-viewport` вважався врятованим ВЛАСНИМ
 * `outline: none`, тобто перевірка мовчала саме на тому дефекті, проти якого
 * стоїть.
 */
function ownDeclarations(body: string): Declaration[] {
	let depth = 0;
	let own = '';
	for (const ch of body) {
		if (ch === '{') depth++;
		else if (ch === '}') depth--;
		else if (depth === 0) own += ch;
	}

	const out: Declaration[] = [];
	for (const chunk of own.split(';')) {
		const colon = chunk.indexOf(':');
		if (colon === -1) continue;
		out.push({
			prop: chunk.slice(0, colon).trim().toLowerCase(),
			value: chunk.slice(colon + 1).trim().toLowerCase().replace(/\s*!important$/, '')
		});
	}
	return out;
}

/** Значення, які не малюють нічого. */
const INVISIBLE = new Set(['none', '0', 'transparent', 'initial', 'unset', 'revert', '']);

/** Властивості, зміна яких у стані фокуса читається як індикатор. */
const DRAW_PROPS = new Set([
	'outline',
	'box-shadow',
	'border',
	'border-color',
	'border-bottom-color',
	'border-top-color',
	'border-left-color',
	'border-right-color',
	'background',
	'background-color',
	'text-decoration'
]);

function killsOutline(body: string): boolean {
	return ownDeclarations(body).some(
		(d) => d.prop === 'outline' && (d.value === 'none' || d.value.startsWith('0'))
	);
}

function draws(body: string): boolean {
	return ownDeclarations(body).some((d) => DRAW_PROPS.has(d.prop) && !INVISIBLE.has(d.value));
}

/**
 * Місця, де заміну малює НЕ той самий селектор, а предок.
 *
 * Автоматично цього не вивести: `.editor-content` і `.rich-editor:focus-within`
 * — різні селектори, і спорідненість між ними живе в розмітці, а не в CSS.
 * Тому кожен випадок названий поіменно, з тим, ХТО саме малює, — і перевірка
 * нижче падає, якщо названий рятівник зник із файлу.
 */
const DRAWN_BY_ANCESTOR: Record<string, { drawnBy: string; why: string }> = {
	'src/lib/components/ui/RichTextEditor.svelte': {
		drawnBy: '.rich-editor:focus-within',
		why:
			'редаговані області (візуальний редактор, ProseMirror, HTML і Markdown) ' +
			'займають усю картку, і кільце навколо кожної було б лінією всередині ' +
			'рамки картки; рамку міняє сама картка — той самий приклад, що у полів'
	},
	'src/lib/styles/global.css': {
		drawnBy: '.has-input-tools--framed:focus-within',
		why:
			'поле всередині обгортки-рамки: кільце було б ДРУГОЮ лінією всередині ' +
			'неї. Причина записана коментарем поруч із самим правилом'
	}
};

describe('фокус видно очима (ACCESSIBILITY-v8 § 3)', () => {
	const files = walk(ROOT, (n) => n.endsWith('.svelte') || n.endsWith('.css'));
	const parsed = files.map((file) => ({
		file: file.replace(/\\/g, '/'),
		rules: rules(readFileSync(file, 'utf8'))
	}));

	it('перевірка жива: правила й глобальне кільце знайдено', () => {
		const all = parsed.flatMap((p) => p.rules);
		expect(all.length, 'розбір не знайшов жодного правила').toBeGreaterThan(500);

		const killers = all.filter((r) => killsOutline(r.body));
		// 19 на момент коміту. Нуль означав би, що регулярка перестала збігатися.
		expect(killers.length, 'жодного outline: none — сканер шукає не там').toBeGreaterThan(5);

		const global = parsed.find((p) => p.file.endsWith('lib/styles/global.css'));
		expect(
			global?.rules.some((r) => r.selector === ':focus-visible' && draws(r.body)),
			'глобального кільця :focus-visible немає — тоді вся ця перевірка міряє не те'
		).toBe(true);
	});

	it('розбір живий: селектор, стан і вкладеність визначаються правильно', () => {
		const nested = rules('@media (max-width: 10px) { .a:focus { outline: none; } }');
		expect(nested, 'правило всередині @media мусить лишитися видимим').toHaveLength(1);
		expect(nested[0].selector).toBe('.a:focus');

		expect(base('.a:focus-visible')).toBe('.a');
		expect(base('.a:hover')).toBe('.a');
		expect(base('.a::before')).toBe('.a');
		expect(base('.a:not(.b)'), ':not() — не стан, а частина селектора').toBe('.a:not(.b)');

		expect(killsOutline('outline: none;')).toBe(true);
		expect(killsOutline('outline: 0;')).toBe(true);
		expect(killsOutline('outline-offset: 2px;'), 'offset кільця не знімає').toBe(false);

		expect(draws('border-color: red;')).toBe(true);
		expect(draws('box-shadow: 0 0 0 4px red;')).toBe(true);
		expect(draws('box-shadow: none;'), 'none нічого не малює').toBe(false);
		expect(draws('opacity: 1;'), 'прозорість — не індикатор').toBe(false);
	});

	it('кожен виняток-предок справді малює те, що обіцяє', () => {
		const stale: string[] = [];
		for (const [file, { drawnBy }] of Object.entries(DRAWN_BY_ANCESTOR)) {
			const entry = parsed.find((p) => p.file === file);
			if (!entry) {
				stale.push(`${file}: файла немає — виняток застарів`);
				continue;
			}
			const rescuer = entry.rules.some(
				(r) => selectors(r.selector).some((s) => s === drawnBy) && draws(r.body)
			);
			if (!rescuer) stale.push(`${file}: правила ${drawnBy} з видимою заміною більше немає`);
		}
		expect(stale, stale.join('\n')).toEqual([]);
	});

	it('кожен outline: none має видиму заміну', () => {
		const broken: string[] = [];

		for (const { file, rules: fileRules } of parsed) {
			if (file in DRAWN_BY_ANCESTOR) continue;

			for (const rule of fileRules) {
				if (!killsOutline(rule.body)) continue;

				// `:focus:not(:focus-visible)` — канонічний спосіб прибрати кільце
				// САМЕ для вказівника, лишивши його клавіатурі. Тут знімати нічого:
				// правило за побудовою не діє тоді, коли кільце потрібне.
				if (selectors(rule.selector).every((s) => /:not\(\s*:focus-visible\s*\)/i.test(s))) {
					continue;
				}

				for (const selector of selectors(rule.selector)) {
					const target = base(selector);
					if (!target) continue;

					const replaced = fileRules.some((other) =>
						selectors(other.selector).some(
							(s) => STATE.test(s.slice(target.length)) && s.startsWith(target) && draws(other.body)
						)
					);
					if (!replaced) broken.push(`${file}:${rule.line} — ${selector}`);
				}
			}
		}

		expect(
			[...new Set(broken)].sort(),
			'кільце фокуса знято, а замість нього не малюється нічого: клавіатурний ' +
				'користувач переводить фокус і не бачить, куди він потрапив. Треба або ' +
				'лишити кільце, або намалювати заміну для того самого селектора, або ' +
				`назвати предка у DRAWN_BY_ANCESTOR:\n  ${[...new Set(broken)].sort().join('\n  ')}`
		).toEqual([]);
	});
});
