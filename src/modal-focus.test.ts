import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Інваріант: кожна модалка з `aria-modal="true"` має пастку фокуса.
 *
 * ACCESSIBILITY-v8 називає модалку без пастки й без повернення фокуса
 * порушенням рівня HIGH. Перевірка потрібна саме тут, бо це той клас, який не
 * ловить НІЩО інше:
 *
 * - `svelte-check` бачить типи, не поведінку;
 * - axe перевіряє наявність ролі й атрибута — модалка без пастки проходить
 *   аудит повністю зеленою;
 * - око теж не бачить: щоб помітити, треба тиснути Tab доти, доки фокус
 *   вийде за межі модалки, а мишею цього не відтворити взагалі.
 *
 * Саме тому сім модалок у проєкті прожили з `aria-modal="true"` і без жодної
 * пастки, маючи при цьому зелений прогін axe у CI.
 */

const ROOT = 'src';

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (p.endsWith('.svelte')) out.push(p.split('\\').join('/'));
	}
	return out;
}

/**
 * Усі відкривальні теги файлу, кожен цілком.
 *
 * Написано сканером, а не регуляркою «від `<` до `>`», і причина конкретна.
 * Перший варіант був саме такий — і оголосив `PhotoLightbox` модалкою без
 * пастки, хоч пастка там стояла. Тег обрізався на першому ж `>`, а він у цьому
 * тезі трапляється всередині атрибута:
 *
 * ```svelte
 * onclick={(e) => { if (e.target === e.currentTarget) onclose(); }}
 * ```
 *
 * Стрілка `=>`, порівняння, тіло у фігурних дужках — усе це `>` і `<`
 * усередині значення атрибута. Тому дужки й лапки рахуються: тег закінчується
 * на `>`, який стоїть на нульовій глибині `{}` і поза лапками.
 *
 * Помилка була б тихою в інший бік не менше: якби сканер обрізав тег ПІСЛЯ
 * `{@attach}`, перевірка вважала б пастку наявною там, де її немає.
 */
function openingTags(source: string): { tag: string; index: number }[] {
	const tags: { tag: string; index: number }[] = [];
	for (let i = 0; i < source.length; i++) {
		if (source[i] !== '<' || !/[A-Za-z]/.test(source[i + 1] ?? '')) continue;

		let depth = 0;
		let quote = '';
		let j = i + 1;
		for (; j < source.length; j++) {
			const c = source[j];
			if (quote) {
				if (c === quote) quote = '';
				continue;
			}
			if (c === '"' || c === "'") quote = c;
			else if (c === '{') depth++;
			else if (c === '}') depth--;
			else if (c === '>' && depth === 0) break;
		}
		tags.push({ tag: source.slice(i, j + 1), index: i });
		i = j;
	}
	return tags;
}

describe('модалки', () => {
	const files = walk(ROOT);

	it('кожен aria-modal="true" має {@attach focusTrap(...)} на тому самому елементі', () => {
		const missing: string[] = [];

		for (const file of files) {
			const source = readFileSync(file, 'utf8');
			for (const { tag, index } of openingTags(source)) {
				if (!/aria-modal=["']true["']/.test(tag)) continue;
				if (/\{@attach\s+focusTrap\s*\(/.test(tag)) continue;
				missing.push(`${file}:${source.slice(0, index).split('\n').length}`);
			}
		}

		expect(
			missing,
			`модалки з aria-modal="true" без пастки фокуса (ACCESSIBILITY-v8, HIGH):\n${missing.join('\n')}`
		).toEqual([]);
	});

	it('перевірка справді знаходить модалки, а не порожній набір', () => {
		// Без цього попередній тест лишався б зеленим, якби `walk` зламався або
		// атрибут у проєкті записали інакше. Порожній вхід — це та сама
		// тест-заглушка, лише непомітна (AI-AGENT-PITFALLS-v8 § 1).
		const total = files.reduce(
			(n, f) =>
				n +
				openingTags(readFileSync(f, 'utf8')).filter((t) => /aria-modal=["']true["']/.test(t.tag))
					.length,
			0
		);
		expect(total).toBeGreaterThanOrEqual(7);
	});
});
