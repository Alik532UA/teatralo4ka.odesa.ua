import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEME_CYCLE, nextTheme, type Theme } from './themes';

/**
 * Порядок перебору тем — і те, що обидва його споживачі беруть його ЗВІДСИ.
 *
 * До 2026-08-26 порядок жив однією копією всередині `ui/ServiceLayer.svelte`, і
 * доки читав його лише сам обробник, копії й не було. Копія з'явилася б у мить,
 * коли панель налаштувань почала повідомляти скорочення (`aria-keyshortcuts`,
 * HOTKEYS-v8 § 5): їй потрібно знати, яку кнопку натисне наступне `T`.
 *
 * Розходження двох копій було б ТИХИМ у найгіршому сенсі: підказка вказувала б
 * на кнопку, якої клавіша не натискає, і побачити це можна лише читалкою.
 */

const ROOT = process.cwd();

describe('перебір тем', () => {
	it('перелічує рівно п\'ять тем проєкту', () => {
		expect([...THEME_CYCLE]).toEqual(['light', 'light-yellow', 'yellow', 'dark', 'dark-cyan']);
	});

	it('кожен крок дає наступну, а остання замикає коло', () => {
		expect(nextTheme('light')).toBe('light-yellow');
		expect(nextTheme('light-yellow')).toBe('yellow');
		expect(nextTheme('yellow')).toBe('dark');
		expect(nextTheme('dark')).toBe('dark-cyan');
		expect(nextTheme('dark-cyan')).toBe('light');
	});

	it('перебір із будь-якої теми обходить усі п\'ять й вертається', () => {
		let current: Theme = THEME_CYCLE[0];
		const seen = new Set<Theme>();
		for (let i = 0; i < THEME_CYCLE.length; i++) {
			seen.add(current);
			current = nextTheme(current);
		}
		expect(seen.size, 'перебір застряг або пропускає тему').toBe(THEME_CYCLE.length);
		expect(current, 'коло не замкнулося').toBe(THEME_CYCLE[0]);
	});

	it('невідома тема лікується перебором, а не гасить клавішу', () => {
		// Стара збережена тема або чужий запис у сховищі: `indexOf` дає -1, і
		// (-1 + 1) % 4 === 0 — тобто перше натискання `T` повертає людину в
		// відомий стан замість того, щоб нічого не робити.
		expect(nextTheme('mauve' as Theme)).toBe(THEME_CYCLE[0]);
	});
});

/**
 * Інваріант по джерелах: жоден споживач не тримає власної копії порядку.
 */
describe('порядок перебору має одне джерело', () => {
	const CONSUMERS = [
		'src/lib/components/ui/ServiceLayer.svelte',
		'src/lib/components/HeaderSettingsPanel.svelte'
	];

	it.each(CONSUMERS)('%s бере порядок із config/themes', (file) => {
		const source = readFileSync(join(ROOT, file), 'utf8');
		expect(source, 'модуль не імпортує спільний порядок').toMatch(
			/from ['"]\$lib\/config\/themes['"]/
		);
	});

	it.each(CONSUMERS)('%s не перелічує теми власним літералом', (file) => {
		const source = readFileSync(join(ROOT, file), 'utf8');
		// Саме пара «light-yellow поруч із yellow у одному літералі-кортежі» —
		// ознака другої копії порядку. Окремі згадки тем у `class:active` і
		// `setTheme('light')` законні: це вибір конкретної теми, а не перебір.
		const literals = [...source.matchAll(/\[[^[\]]*'light-yellow'[^[\]]*\]/g)].map((m) => m[0]);
		expect(literals, `копія переліку тем:\n${literals.join('\n')}`).toEqual([]);
	});
});
