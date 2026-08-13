// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Інваріанти кнопки закриття (UI-ELEMENTS-v8 § 3).
 *
 * Кнопка закриття — найчастіший порушник серед дрібних елементів: вона
 * складається з одного значка, і про підпис для читача з екранного диктора
 * згадують останньою чергою. Знайдено саме так: у модальному вікні піаніно
 * кнопка була `<button class="close-btn">&times;</button>` — без `aria-label`,
 * тобто диктор читав її як «раз» (символ × озвучується як знак множення), і з
 * текстовим хрестиком замість значка, тобто вирівнювання й розмір залежали від
 * шрифту.
 *
 * Перевіряються джерела, а не поведінка: обидва дефекти видно в розмітці, і
 * ані типи, ані axe (він не перевіряє осмисленість підпису) їх не ловлять.
 */

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const full = join(dir, name);
		return statSync(full).isDirectory() ? walk(full) : [full];
	});
}

const SVELTE = walk('src').filter((f) => f.endsWith('.svelte'));

/** Відкривальні теги кнопок, у яких локатор закінчується на `-close-btn`. */
function closeButtonTags(): { file: string; tag: string }[] {
	const found: { file: string; tag: string }[] = [];
	for (const file of SVELTE) {
		const text = readFileSync(file, 'utf8');
		for (const m of text.matchAll(/<button[^>]*>/g)) {
			if (/data-testid=["'{`][^>]*-close-btn/.test(m[0])) found.push({ file, tag: m[0] });
		}
	}
	return found;
}

describe('кнопки закриття (UI-ELEMENTS-v8 § 3)', () => {
	const tags = closeButtonTags();

	it('перевірка жива — кнопки знайдено', () => {
		expect(SVELTE.length).toBeGreaterThan(30);
		expect(tags.length, 'жодної кнопки закриття не знайдено').toBeGreaterThan(4);
	});

	it('кожна має aria-label, і він з i18n', () => {
		const bad = tags
			.filter(({ tag }) => !/aria-label=/.test(tag) || /aria-label="[^"{]+"/.test(tag))
			.map(({ file, tag }) => `${file}: ${tag.slice(0, 80)}`);
		expect(
			bad,
			`підпис відсутній або захардкоджений — диктор прочитає значок,\n` +
				`а не дію, або прочитає її не тією мовою:\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});

	it('вміст — значок, а не текстовий хрестик', () => {
		const bad: string[] = [];
		for (const file of SVELTE) {
			const text = readFileSync(file, 'utf8');
			for (const m of text.matchAll(/<button[^>]*data-testid=[^>]*-close-btn[^>]*>([\s\S]{0,80}?)<\/button>/g)) {
				if (/&times;|×/.test(m[1])) bad.push(`${file}: ${m[1].trim().slice(0, 40)}`);
			}
		}
		expect(
			bad,
			`текстовий хрестик замість значка: розмір і вирівнювання залежать від\n` +
				`шрифту, а диктор озвучує × як знак множення:\n  ${bad.join('\n  ')}`
		).toEqual([]);
	});
});
