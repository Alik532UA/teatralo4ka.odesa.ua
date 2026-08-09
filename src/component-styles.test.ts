// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Клас, який стилізує ІНШИЙ компонент приватно, до цього не застосується.
 *
 * Svelte скоупить стилі по компоненту. Якщо винести шматок розмітки в окремий
 * компонент, а правила лишити в батьківському `<style>`, розмітка мовчки
 * втратить вигляд: жодної помилки, жодного попередження — просто інша сторінка.
 *
 * Так сталося при винесенні `ArticleCategoryPicker`: три кнопки категорії
 * використовували `.mode-toggle-group` і `.mode-btn`, які лишилися в
 * `ArticleForm`, і група-перемикач перетворилася на простий стовпчик.
 *
 * Перевірка навмисно ВУЗЬКА. «Кожен клас має мати правило» дало б 20
 * спрацювань на семантичних іменах без стилів (`admin-card`, `error-page`) —
 * такий список одразу перетворився б на виняток, який ніхто не читає. Тут же
 * сигнал однозначний: правило існує, але не там, де знадобилося.
 */

const GLOBAL_STYLE_DIRS = ['src/lib/styles', 'src/lib/styles/themes'];

function svelteFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...svelteFiles(full));
		else if (entry.name.endsWith('.svelte')) out.push(full);
	}
	return out;
}

/** Класи в `<style>` компонента. */
function styledClasses(source: string): Set<string> {
	const style = source.match(/<style[^>]*>([\s\S]*)<\/style>/)?.[1] ?? '';
	return new Set([...style.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
}

/**
 * Класи в розмітці.
 *
 * Береться лише статичний `class="..."`: динамічні `class:foo={...}` і
 * шаблони з виразами тут не потрібні — вони не бувають перенесені разом із
 * розміткою так, щоб про них забули.
 */
function usedClasses(source: string): Set<string> {
	return new Set(
		[...source.matchAll(/class="([^"{]*)"/g)]
			.flatMap((m) => m[1].split(/\s+/))
			.filter(Boolean)
	);
}

describe('стилі компонентів', () => {
	const files = svelteFiles('src');
	const globalCss = GLOBAL_STYLE_DIRS.flatMap((dir) =>
		readdirSync(dir)
			.filter((f) => f.endsWith('.css'))
			.map((f) => readFileSync(join(dir, f), 'utf8'))
	).join('\n');

	const owned = new Map(files.map((f) => [f, styledClasses(readFileSync(f, 'utf8'))]));

	it('компоненти знайдено — перевірка жива', () => {
		expect(files.length).toBeGreaterThan(10);
		expect(globalCss.length).toBeGreaterThan(0);
	});

	it('жоден компонент не покладається на приватні стилі іншого', () => {
		const problems: string[] = [];

		for (const file of files) {
			const source = readFileSync(file, 'utf8');
			for (const cls of usedClasses(source)) {
				if (owned.get(file)!.has(cls)) continue;
				if (globalCss.includes(`.${cls}`)) continue;

				const elsewhere = files.filter((other) => other !== file && owned.get(other)!.has(cls));
				if (elsewhere.length > 0) {
					problems.push(
						`${file}: .${cls} стилізує ${elsewhere.join(', ')} — скоуп Svelte сюди не дістає`
					);
				}
			}
		}

		expect(problems, problems.join('\n')).toEqual([]);
	});
});
