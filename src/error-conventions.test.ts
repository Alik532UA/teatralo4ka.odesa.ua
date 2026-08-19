// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Три форми обробки помилок, кожна з яких ламає щось тихо
 * (ERROR-HANDLING-v8 § 7, CODE-QUALITY-v8 § 1).
 *
 * Спільна риса: жодну з них не бачить ані `svelte-check`, ані ESLint. Порожній
 * `catch` для компілятора — законний код; `throw 'рядок'` — теж; `catch (e: any)`
 * дає попередження `no-explicit-any`, але воно в цьому проєкті `warn`, тобто
 * тоне серед решти боргу.
 *
 * Скануються і `src`, і `scripts`: гейти збірки живуть у другому, і саме там
 * `catch (error: any)` знайшовся вживу — `error.message` на рядковому винятку
 * друкував би «Reason: undefined» замість причини падіння збірки.
 */

const DIRS = ['src', 'scripts'];

const walk = (dir: string, out: string[] = []): string[] => {
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry).replace(/\\/g, '/');
		if (statSync(full).isDirectory()) walk(full, out);
		else if (/\.(ts|svelte)$/.test(entry) && !/\.(test|spec)\.ts$/.test(entry)) out.push(full);
	}
	return out;
};

/** Коментарі замінюються переносами: інакше перевірка падає на власній документації. */
const withoutComments = (source: string): string =>
	source
		.replace(/<!--[\s\S]*?-->/g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length))
		.replace(/\/\*[\s\S]*?\*\//g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length))
		.replace(/^[ \t]*\/\/.*$/gm, '');

const sources = DIRS.flatMap((dir) => walk(dir));

/**
 * Дві перевірки з трьох читають джерела БЕЗ коментарів, а одна — з ними, і це
 * не недогляд.
 *
 * `catch (e: any)` і `throw 'рядок'` цитуються в документації (зокрема в цьому
 * файлі), тож без вирізання коментарів перевірка падає на власній прозі. А от
 * «порожній `catch`» саме навпаки: коментар ПРИЧИНИ всередині блоку і є тим, що
 * відрізняє свідоме рішення від проглинутої помилки. Вирізавши коментарі, я
 * отримав чотири хибні знахідки в `Minimap` і `PageScrollbar`, де причина
 * записана рівно так, як канон і вимагає.
 */
function hits(pattern: RegExp, { keepComments = false } = {}): string[] {
	const found: string[] = [];
	for (const file of sources) {
		const raw = readFileSync(file, 'utf8');
		const text = keepComments ? raw : withoutComments(raw);
		for (const match of text.matchAll(pattern)) {
			const line = (text.slice(0, match.index ?? 0).match(/\n/g) ?? []).length + 1;
			found.push(`${file}:${line} — ${match[0].replace(/\s+/g, ' ').slice(0, 60)}`);
		}
	}
	return found;
}

describe('обробка помилок', () => {
	it('перевірка жива: джерела знайдено', () => {
		expect(sources.length, 'сканер шукає не там').toBeGreaterThan(50);
	});

	it('перевірка жива: шаблони ловлять власні приклади', () => {
		expect(/catch\s*\([^)]*:\s*any\s*\)/.test('} catch (e: any) {')).toBe(true);
		expect(/catch\s*\([^)]*\)?\s*\{\s*\}/.test('try { x() } catch (e) {}')).toBe(true);
		expect(/throw\s+['"`]/.test("throw 'oops';")).toBe(true);
	});

	/**
	 * `catch (e: any)` — це `any`, який ще й не видно в жодному типі: усе, що з
	 * нього читають, стає `any` далі за кодом. Правильна форма — `unknown` плюс
	 * `instanceof Error`, і саме її вимагає AGENTS.md.
	 */
	it('немає catch (e: any)', () => {
		const bad = hits(/catch\s*\([^)]*:\s*any\s*\)/g);
		expect(bad, `у catch має бути unknown зі звуженням:\n${bad.join('\n')}`).toEqual([]);
	});

	/**
	 * Порожній `catch` — рішення проігнорувати помилку, прийняте без слів. Якщо
	 * ігнорувати справді правильно (а буває — `setPointerCapture` кидає на
	 * вказівнику, якого браузер уже не вважає активним), у тілі стоїть коментар
	 * із причиною; тоді це вже не порожній блок, і перевірка його не бачить.
	 * Саме тому тут джерела читаються РАЗОМ із коментарями.
	 */
	it('немає порожнього catch', () => {
		const bad = hits(/catch\s*(\([^)]*\))?\s*\{\s*\}/g, { keepComments: true });
		expect(bad, `помилка ковтається без слова причини:\n${bad.join('\n')}`).toEqual([]);
	});

	/**
	 * `throw 'рядок'` втрачає стек: у звіті лишається текст без місця, де він
	 * стався, а `error instanceof Error` на такому винятку — false, тобто кожен
	 * обробник вище піде гілкою «невідома помилка».
	 */
	it('немає throw рядком', () => {
		const bad = hits(/throw\s+['"`]/g);
		expect(bad, `кидати треба Error, а не рядок:\n${bad.join('\n')}`).toEqual([]);
	});
});
