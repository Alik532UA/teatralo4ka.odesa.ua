// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Кнопка, яка не кнопка, мусить активуватися з клавіатури
 * (ACCESSIBILITY-v8 § 2, WCAG 2.1.1, рівень A).
 *
 * `role="button"` разом із `tabindex="0"` — це обіцянка перед читалкою й перед
 * Tab-порядком: елемент називається кнопкою і отримує фокус. Якщо на ньому лише
 * `onclick`, Enter не робить нічого. Це найтихіший вид недоступності: фокус
 * видно, помилки немає ніде, а дія недосяжна.
 *
 * ## Чому інваріантом, а не axe і не компілятором
 *
 * axe цього не бачить у принципі — він читає атрибути, а не обробники
 * (ACCESSIBILITY-v8 § 10.1: покриття приблизно третина критеріїв). Компілятор
 * Svelte попереджає (`a11y_click_events_have_key_events`), але попередження
 * знімається коментарем `svelte-ignore` — і саме так обидві плитки галереї
 * прожили з непрацюючим Enter: коментар стояв, причини поруч не було.
 *
 * ## Чому саме `tabindex` у переліку умов
 *
 * Без нього елемент не у Tab-порядку, і жоден користувач клавіатури до нього не
 * дійде — тоді претензія не до обробника, а до фокусування, і це інший дефект.
 * Пара «фокусується + названий кнопкою + не активується» — рівно той випадок,
 * коли обіцянка вже дана.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): прибрати `onkeydown` із
 * плитки галереї на головній — перевірка мусить назвати саме її.
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

/**
 * Коментарі замінюються переносами, а не вирізаються: інакше поїдуть номери
 * рядків у звіті, а саме за ними знаходять місце.
 */
const withoutComments = (source: string): string =>
	source.replace(/<!--[\s\S]*?-->/g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length));

/**
 * Відкриваючі теги.
 *
 * Наївний `/<div[^>]*>/` тут не працює, і це не дрібниця: у розмітці Svelte
 * атрибут містить стрілку `=>`, тобто символ `>` — і тег обривається посеред
 * обробника. Перша редакція цієї перевірки саме через це «не знайшла» обидві
 * плитки галереї, які й були приводом її написати. Тому кінець тега — перший
 * `>` поза фігурними дужками, який не є частиною `=>`.
 */
function openingTags(source: string): Array<{ index: number; tag: string }> {
	const tags: Array<{ index: number; tag: string }> = [];
	for (let i = 0; i < source.length; i += 1) {
		if (source[i] !== '<') continue;
		let depth = 0;
		let j = i + 1;
		for (; j < source.length; j += 1) {
			const c = source[j];
			if (c === '{') depth += 1;
			else if (c === '}') depth -= 1;
			else if (c === '>' && depth === 0 && source[j - 1] !== '=') break;
		}
		tags.push({ index: i, tag: source.slice(i, j + 1) });
		i = j;
	}
	return tags;
}

const files = walk(SRC);

describe('активація з клавіатури', () => {
	it('перевірка жива: компоненти знайдено', () => {
		expect(files.length, 'жодного .svelte — сканер шукає не там').toBeGreaterThan(10);
	});

	it('перевірка жива: розбір тега не ламається на стрілці в атрибуті', () => {
		const [only] = openingTags('<div onclick={() => go(1)} role="button">');
		expect(only.tag, 'тег обірвано на `=>` — саме так дефект і ховався').toBe(
			'<div onclick={() => go(1)} role="button">'
		);
	});

	it('елемент із role="button" і tabindex активується Enter/Space (WCAG 2.1.1)', () => {
		const naked: string[] = [];

		for (const file of files) {
			const source = withoutComments(readFileSync(file, 'utf8'));
			for (const { index, tag } of openingTags(source)) {
				if (!/^<(?:div|span|li|section|article|figure|td|tr|p)\b/.test(tag)) continue;
				if (!/\bonclick=/.test(tag)) continue;
				if (!/\brole="button"/.test(tag)) continue;
				if (!/\btabindex=/.test(tag)) continue;
				if (/\bon(?:keydown|keyup|keypress)=/.test(tag)) continue;

				const line = (source.slice(0, index).match(/\n/g) ?? []).length + 1;
				naked.push(`${file}:${line} — ${tag.split(/\s+/).slice(0, 4).join(' ')}…`);
			}
		}

		expect(
			naked,
			'названий кнопкою і фокусується, але Enter не робить нічого — ' +
				`додати onkeydown={activateOnKey(...)}:\n${naked.join('\n')}`
		).toEqual([]);
	});
});

/**
 * Клавіатура не гейтиться самим лише наведенням (WCAG 2.1.1, рівень A).
 *
 * Другий вид тієї самої тихої недоступності, і знайдений він 2026-08-26. Обидві
 * каруселі проєкту читали ← → з умовою `isHovered`:
 *
 *   - `ContentWidget` — обробник на `window`, тобто межа справді потрібна, але
 *     вираженою вона була ЧЕРЕЗ МИШУ. Людина, яка дійшла Tab-ом, стрілками не
 *     робила нічого;
 *   - `GalleryCarousel` — обробник на самому вузлі, тобто межу вже задає DOM, і
 *     `isHovered` не додавала нічого, крім заборони. Наведення мишею без фокуса
 *     події `keydown` не породжує взагалі.
 *
 * Дефект не видно ні axe (він читає атрибути, не обробники), ні компілятором:
 * `onkeydown` на місці, і формально клавіатура «обробляється».
 *
 * Умова тут навмисно вузька — `!isHovered` як ЄДИНИЙ вхідний захист обробника
 * стрілок. Наведення саме собою законне (пауза автопрокрутки, курсор), і
 * забороняти його цілком означало б боротися з мишею.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): повернути `if (!isHovered)
 * return;` у `handleKeydown` будь-якої каруселі — перевірка мусить назвати саме
 * її.
 */
/**
 * Тіло функції від її оголошення до парної закривної дужки.
 *
 * Не «N символів від початку», і це не педантизм: перша редакція цієї перевірки
 * брала 600 символів і через них ЗАХОПЛЮВАЛА розмітку нижче — а там стоїть
 * `onfocusin={() => { isFocusWithin = true; }}`. Тобто згадка фокуса ПОЗА
 * обробником гасила знахідку всередині нього, і зворотний експеримент лишився
 * зеленим із поверненим дефектом.
 */
function functionBody(source: string, start: number): string {
	const open = source.indexOf('{', start);
	if (open === -1) return '';
	let depth = 0;
	for (let i = open; i < source.length; i += 1) {
		if (source[i] === '{') depth += 1;
		else if (source[i] === '}') {
			depth -= 1;
			if (depth === 0) return source.slice(open, i + 1);
		}
	}
	return source.slice(open);
}

/**
 * Прибрати коментарі JS із фрагмента коду.
 *
 * Теж не педантизм, і теж знайдено зворотним експериментом. `withoutComments`
 * вище вирізає лише розмітку (`<!-- -->`), тож у тілі обробника лишався рядок
 * «// Наведення АБО фокус: … див. `isFocusWithin`» — і згадка фокуса В
 * КОМЕНТАРІ гасила знахідку в коді. Тобто перевірка ловила б дефект лише в тому
 * компоненті, автор якого не пояснив своєї умови словами.
 */
const withoutJsComments = (code: string): string =>
	code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');

describe('стрілки каруселей не залежать від наведення', () => {
	/** Файли з обробником стрілок — тобто ті, до кого перевірка взагалі має справу. */
	const withArrows = files.filter((f) => {
		const source = readFileSync(f, 'utf8');
		return /function handleKeydown/.test(source) && /Arrow(?:Left|Right)/.test(source);
	});

	it('перевірка жива: обробники стрілок знайдено', () => {
		expect(withArrows.length, 'жодного обробника ← → — сканер шукає не там').toBeGreaterThan(0);
	});

	it('жоден обробник стрілок не виходить лише через відсутнє наведення', () => {
		const hoverOnly: string[] = [];

		for (const file of withArrows) {
			const source = withoutComments(readFileSync(file, 'utf8'));
			const start = source.indexOf('function handleKeydown');
			const body = withoutJsComments(functionBody(source, start));
			// `!isHovered` без згадки фокуса поруч: саме та форма, у якій дефект і жив.
			if (/!\s*isHovered\b/.test(body) && !/isFocusWithin|isEngaged|focusWithin/.test(body)) {
				const line = (source.slice(0, start).match(/\n/g) ?? []).length + 1;
				hoverOnly.push(`${file}:${line}`);
			}
		}

		expect(
			hoverOnly,
			'стрілки діють лише на наведенні — клавіатура до каруселі не дістає:\n' +
				hoverOnly.join('\n')
		).toEqual([]);
	});
});
