// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * «Прибрати розмітку з тексту» має рівно одну реалізацію.
 *
 * Цей дефект повертався тричі, і щоразу однаково: замість спільного
 * `getContentExcerpt` у сторінці з'являлася власна копія на один рядок —
 * `content.replace(/[#*`_[\]()]/g, '')`. Вона викидає ДУЖКИ, лишаючи те, що
 * було між ними, тож markdown-посилання `[«Одеса.Театр.PRO»](http://…)`
 * показувалося як «Одеса.Театр.PROhttp://Одеса.Театр.PRO» — тобто адміністратор
 * і відвідувач бачили внутрішню будову посилання.
 *
 * Виправлення в одному місці не рятує: копії живуть у різних сторінках і
 * розходяться мовчки. Тому перевіряється не поведінка, а саме джерело —
 * КОЖНА функція `getExcerpt` мусить кликати спільний помічник.
 *
 * Пошукові фільтри навмисно не під забороною: вони чистять текст для
 * ЗІСТАВЛЕННЯ, а не для показу, і склеєна адреса там нікому не видна.
 */

const ROOT = 'src';

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const full = join(dir, name);
		return statSync(full).isDirectory() ? walk(full) : [full];
	});
}

const SOURCES = walk(ROOT).filter((f) => /\.(svelte|ts)$/.test(f) && !f.endsWith('.test.ts'));

describe('опис статті будується в одному місці', () => {
	it('перевірка жива — файли прочитані й `getExcerpt` знайдено', () => {
		expect(SOURCES.length).toBeGreaterThan(50);
		const withExcerpt = SOURCES.filter((f) => readFileSync(f, 'utf8').includes('function getExcerpt'));
		expect(withExcerpt.length, 'жодної функції getExcerpt не знайдено').toBeGreaterThan(0);
	});

	it('кожна getExcerpt кличе спільний getContentExcerpt', () => {
		const offenders = SOURCES.filter((file) => {
			const src = readFileSync(file, 'utf8');
			const at = src.indexOf('function getExcerpt');
			if (at === -1) return false;
			// Тіло функції — до першого закриття на рівні відступу.
			const body = src.slice(at, src.indexOf('\n\t}', at));
			return !body.includes('getContentExcerpt(');
		});

		expect(
			offenders,
			`ці функції будують опис самі, замість спільного getContentExcerpt із\n` +
				`utils/renderContent. Власна копія викидає дужки markdown і склеює\n` +
				`підпис посилання з адресою:\n  ${offenders.join('\n  ')}`
		).toEqual([]);
	});
});
