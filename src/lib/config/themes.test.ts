import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { THEME_CYCLE, PROD_THEME_CYCLE, DEV_THEME_CYCLE, nextTheme, type Theme } from './themes';

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
	it('THEME_CYCLE експортує відповідний перелік тем', () => {
		expect(THEME_CYCLE.length).toBeGreaterThanOrEqual(4);
	});

	it('у dev шість тем (із двома тестовими), у prod — чотири', () => {
		// `yellow` — це «dev-test-light-01», `dark-blue` — «dev-test-dark-01»:
		// підписи видно в панелі, а ключі лишаються технічними.
		expect([...DEV_THEME_CYCLE]).toEqual([
			'light',
			'light-yellow',
			'yellow',
			'dark',
			'dark-cyan',
			'dark-blue'
		]);
		expect([...PROD_THEME_CYCLE]).toEqual(['light', 'light-yellow', 'dark', 'dark-cyan']);
	});

	it('кожен крок у dev дає наступну, а остання замикає коло', () => {
		expect(nextTheme('light', true)).toBe('light-yellow');
		expect(nextTheme('light-yellow', true)).toBe('yellow');
		expect(nextTheme('yellow', true)).toBe('dark');
		expect(nextTheme('dark', true)).toBe('dark-cyan');
		expect(nextTheme('dark-cyan', true)).toBe('dark-blue');
		expect(nextTheme('dark-blue', true)).toBe('light');
	});

	it('тестові теми в prod не з\'являються — і лікуються перебором', () => {
		expect(PROD_THEME_CYCLE).not.toContain('dark-blue');
		expect(nextTheme('dark-blue', false)).toBe(PROD_THEME_CYCLE[0]);
	});

	it('кожен крок у prod перебирає 4 публічні теми', () => {
		expect(nextTheme('light', false)).toBe('light-yellow');
		expect(nextTheme('light-yellow', false)).toBe('dark');
		expect(nextTheme('dark', false)).toBe('dark-cyan');
		expect(nextTheme('dark-cyan', false)).toBe('light');
	});

	it('перебір із будь-якої теми обходить коло й вертається', () => {
		let current: Theme = DEV_THEME_CYCLE[0];
		const seen = new Set<Theme>();
		for (let i = 0; i < DEV_THEME_CYCLE.length; i++) {
			seen.add(current);
			current = nextTheme(current, true);
		}
		expect(seen.size, 'перебір застряг або пропускає тему').toBe(DEV_THEME_CYCLE.length);
		expect(current, 'коло не замкнулося').toBe(DEV_THEME_CYCLE[0]);
	});

	it('невідома або прихована тема лікується перебором, а не гасить клавішу', () => {
		expect(nextTheme('mauve' as Theme, true)).toBe(DEV_THEME_CYCLE[0]);
		expect(nextTheme('yellow', false)).toBe(PROD_THEME_CYCLE[0]);
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
