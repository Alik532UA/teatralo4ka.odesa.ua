import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
	acceptsShortcut,
	captureKeyboard,
	isKeyboardCaptured,
	isPlainKey,
	isTypingTarget
} from './keyboard';

/**
 * Захист полів вводу й захоплення клавіатури — головне, що тут перевіряється.
 *
 * Причина місцева: в адмінці є форми з довгими текстами й редактор статей на
 * `contenteditable`, де фокус стоїть на вкладеному вузлі — саме той випадок, який
 * перевірка за `tagName` пропускає. Літера `t` у назві статті не має міняти тему,
 * а `r`, набране пʼять разів, не має стирати локальні дані.
 */

/** Мінімальний фейк події: справжній `KeyboardEvent` тут не потрібен. */
function stroke(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
	return {
		code: 'KeyT',
		repeat: false,
		target: { closest: () => null },
		ctrlKey: false,
		metaKey: false,
		altKey: false,
		...overrides
	} as unknown as KeyboardEvent;
}

const INSIDE_FIELD = { closest: () => ({}) } as unknown as EventTarget;

describe('isTypingTarget', () => {
	it('бачить поле, коли ним є сама ціль', () => {
		expect(isTypingTarget(INSIDE_FIELD)).toBe(true);
	});

	it('бачить вкладений вузол contenteditable — те, що перевірка за tagName пропускає', () => {
		// Фокус усередині редагованого блоку стоїть на `SPAN`, не на `INPUT`.
		const span = { closest: () => ({}) } as unknown as EventTarget;
		expect(isTypingTarget(span)).toBe(true);
	});

	it('не бачить поля там, де його немає', () => {
		expect(isTypingTarget({ closest: () => null } as unknown as EventTarget)).toBe(false);
	});

	it('не кидає на цілі без closest', () => {
		expect(isTypingTarget(null)).toBe(false);
		expect(isTypingTarget(undefined)).toBe(false);
		expect(isTypingTarget({} as unknown as EventTarget)).toBe(false);
	});
});

describe('isPlainKey', () => {
	it('пропускає одиночну клавішу', () => {
		expect(isPlainKey(stroke())).toBe(true);
	});

	it.each(['ctrlKey', 'metaKey', 'altKey'] as const)('відкидає %s', (modifier) => {
		expect(isPlainKey(stroke({ [modifier]: true }))).toBe(false);
	});

	it('НЕ відкидає Shift: він не змінює code', () => {
		expect(isPlainKey(stroke({ shiftKey: true }))).toBe(true);
	});
});

describe('захоплення клавіатури', () => {
	it('поки ніхто не захопив — скорочення працюють', () => {
		expect(isKeyboardCaptured()).toBe(false);
		expect(acceptsShortcut(stroke())).toBe(true);
	});

	it('захоплена клавіатура глушить скорочення сайту', () => {
		const release = captureKeyboard();
		expect(isKeyboardCaptured()).toBe(true);
		// Саме цей випадок: відкрита накладка забрала клавіатуру собі.
		expect(acceptsShortcut(stroke())).toBe(false);
		release();
		expect(acceptsShortcut(stroke())).toBe(true);
	});

	it('глушить і Escape: накладка закриває себе сама', () => {
		const release = captureKeyboard();
		expect(acceptsShortcut(stroke({ code: 'Escape' }))).toBe(false);
		release();
	});

	it('лічильник, а не прапорець: дві накладки віддають клавіатуру лише разом', () => {
		const releaseFirst = captureKeyboard();
		const releaseSecond = captureKeyboard();

		releaseSecond();
		expect(isKeyboardCaptured(), 'нижня накладка ще відкрита').toBe(true);

		releaseFirst();
		expect(isKeyboardCaptured()).toBe(false);
	});

	it('подвійне звільнення не заганяє лічильник у мінус', () => {
		const release = captureKeyboard();
		release();
		// HMR у Svelte може викликати cleanup двічі; з мінусом клавіатура лишилася
		// б «зайнятою» назавжди.
		release();
		expect(isKeyboardCaptured()).toBe(false);
		expect(acceptsShortcut(stroke())).toBe(true);
	});
});

describe('acceptsShortcut', () => {
	it('НЕ пропускає літеру, коли фокус у полі', () => {
		expect(acceptsShortcut(stroke({ target: INSIDE_FIELD }))).toBe(false);
	});

	it('пропускає Escape із поля: закрити панель більше нічим', () => {
		expect(acceptsShortcut(stroke({ code: 'Escape', target: INSIDE_FIELD }))).toBe(true);
	});

	it('НЕ пропускає Ctrl+Escape: комбінація належить системі', () => {
		expect(acceptsShortcut(stroke({ code: 'Escape', ctrlKey: true }))).toBe(false);
	});
});

/**
 * Ніхто не визначає поле вводу за `tagName` (HOTKEYS-v8 § 2, HK-TEXT-ENTRY-GUARD,
 * CRITICAL).
 *
 * Юніт-тести вище доводять, що `isTypingTarget` бачить `contenteditable`. Вони
 * не доводять, що ним КОРИСТУЮТЬСЯ: до 2026-08-20 `ContentWidget` мав власний
 * захист `['INPUT','TEXTAREA'].includes(activeElement.tagName)` на обробнику
 * рівня `window` — тобто на кожній сторінці з віджетом вмісту. У редакторі
 * статей (`contenteditable`, фокус на вкладеному `SPAN`) стрілки пересували б
 * карусель замість курсора, і жодна перевірка цього не бачила.
 *
 * Перевірка читає джерела, бо саме там живе дефект: правильний помічник у
 * проєкті вже був, його просто не покликали.
 *
 * Зворотний експеримент (AI-AGENT-PITFALLS-v8 § 1.1): повернути порівняння
 * `tagName === 'INPUT'` у будь-який компонент — перевірка мусить назвати саме
 * його.
 */
describe('захист поля вводу — лише через isTypingTarget', () => {
	const SRC = 'src';

	const walk = (dir: string, out: string[] = []): string[] => {
		for (const entry of readdirSync(dir)) {
			const full = join(dir, entry).replace(/\\/g, '/');
			if (statSync(full).isDirectory()) walk(full, out);
			else if (/\.(ts|svelte)$/.test(entry) && !/\.(test|spec)\.ts$/.test(entry)) out.push(full);
		}
		return out;
	};

	/** Помічник — єдине місце, де порівняння з тегами доречне. */
	const ALLOWED = ['src/lib/services/keyboard.ts'];

	const sources = walk(SRC).filter((f) => !ALLOWED.includes(f));

	it('перевірка жива: джерела знайдено', () => {
		expect(sources.length, 'сканер шукає не там').toBeGreaterThan(50);
	});

	it('жодного власного визначення поля вводу за тегом', () => {
		// `tagName` поруч зі згадкою INPUT/TEXTAREA/SELECT — і не важливо, у якій
		// формі: масив із `includes`, ланцюжок `===` або `switch`.
		const re = /tagName[\s\S]{0,80}?['"](?:INPUT|TEXTAREA|SELECT)['"]|['"](?:INPUT|TEXTAREA|SELECT)['"][\s\S]{0,80}?tagName/;
		const bad = sources.filter((f) => re.test(readFileSync(f, 'utf8')));
		expect(
			bad,
			'поле вводу визначається за тегом — `contenteditable` так не побачити, ' +
				`треба isTypingTarget():\n${bad.join('\n')}`
		).toEqual([]);
	});
});

/**
 * Карта клавіш у шапці `keyboard.ts` не бреше про власний проєкт.
 *
 * ## Що сталося
 *
 * Карта існує рівно для того, щоб «наступний агент не аналізував заново», — так
 * і написано в її заголовку. 2026-08-27 виявилося, що вона застаріла на дві
 * клавіші: `H` стояла як «⏭️ ПРОПУЩЕНО — «на початок» це лого в шапці», хоча
 * сім натискань `H` уже показували й ховали список викладачів, а `G` не
 * згадувалася взагалі, хоч так само була зайнята серією.
 *
 * Ціна така сама, як у будь-якого застарілого числа (AI-AGENT-PITFALLS-v8 § 5.5):
 * наступний, хто шукатиме вільну літеру, повірить карті й займе зайняту.
 *
 * Зворотний експеримент: повернути `H` у рядок «ПРОПУЩЕНО» — перевірка мусить
 * назвати саме її.
 */
describe('карта клавіш описує те, що справді зайнято', () => {
	const MAP = readFileSync(join(process.cwd(), 'src/lib/services/keyboard.ts'), 'utf8');
	const LAYER = readFileSync(
		join(process.cwd(), 'src/lib/components/ui/ServiceLayer.svelte'),
		'utf8'
	);

	/** Літери, які обробник справді читає: `event.code === 'KeyX'` або `code: 'KeyX'`. */
	const used = [...LAYER.matchAll(/'Key([A-Z])'/g)].map((m) => m[1]);

	it('перевірка жива: у службовому шарі знайдено зайняті літери', () => {
		expect(used.length, 'жодної — сканер шукає не там').toBeGreaterThan(2);
	});

	it.each([...new Set(used)])('`%s` не значиться в карті пропущеною', (letter) => {
		const row = MAP.split(/\r?\n/).find((line) => line.includes(`| \`${letter}\` |`));
		expect(row, `клавіші ${letter} немає в карті — обробник є, запису немає`).toBeDefined();
		expect(row, `карта каже «ПРОПУЩЕНО», а обробник читає ${letter}`).not.toContain('ПРОПУЩЕНО');
	});
});
