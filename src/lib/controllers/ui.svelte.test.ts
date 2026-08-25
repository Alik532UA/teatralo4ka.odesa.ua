import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { UIState, ui } from './ui.svelte';
import { storage } from '../services/storage';

/**
 * Вимикач одиночних літерних скорочень — виконання WCAG SC 2.1.4
 * «Character Key Shortcuts», рівень A (HOTKEYS-v8 § 3, `HK-WCAG-CHARACTER-KEY`,
 * CRITICAL).
 *
 * ## Що саме тут перевіряється, а що — ні
 *
 * Канон каже прямо: «є перемикач» і «перемикач справді вимикає скорочення» —
 * різні твердження, і друге автоматичною перевіркою не підтверджується. Тому
 * тут три речі, кожна з яких перевіряється:
 *
 *   1. прапорець гідрується зі сховища й типово `true`;
 *   2. запис наскрізний і значення явне (не гортання);
 *   3. ОБРОБНИК справді питає прапорець — інваріант по джерелах.
 *
 * Третій пункт головний. Без нього перемикач лишається полем, яке нічого не
 * робить: рівно та тест-заглушка, яку AI-AGENT-PITFALLS-v8 § 1 називає гіршою за
 * відсутню перевірку. Сам факт вимкнення скорочення в браузері лишається за
 * людиною й записаний у PROJECT-CONTEXT.md.
 */

/**
 * Через фасад, а не через `localStorage` напряму: прямий доступ дозволений лише
 * самому фасадові, модулю міграції та їхнім власним тестам
 * (STORAGE-NAMESPACE-v8, правило `no-restricted-globals` у `eslint.config.js`).
 * Тут перевіряється контролер, а не префікс, тож винятку немає й не треба.
 */
const KEY = 'hotkeysEnabled';

describe('UIState — вимикач гарячих клавіш (HOTKEYS-v8 § 3)', () => {
	beforeEach(() => {
		storage.remove(KEY);
	});

	it('типово скорочення діють: критерій вимагає СПОСОБУ вимкнути, а не вимкненого стану', () => {
		expect(new UIState().hotkeysEnabled).toBe(true);
	});

	it('вимкнення переживає перезавантаження', () => {
		storage.set(KEY, 'false');
		expect(new UIState().hotkeysEnabled).toBe(false);
	});

	it('увімкнення, записане явно, теж читається — а не тоне в типовому значенні', () => {
		storage.set(KEY, 'true');
		expect(new UIState().hotkeysEnabled).toBe(true);
	});

	it('сміття у сховищі не вимикає скорочення мовчки', () => {
		storage.set(KEY, 'yes');
		// `=== 'true'` дало б тут `false`, тобто чужий запис під тим самим ключем
		// (або зміна формату) непомітно забрав би клавіші в усіх, хто нічого не
		// вибирав. Тому значення НЕ 'true'/'false' має читатися як «не сказано».
		expect(new UIState().hotkeysEnabled).toBe(true);
	});

	it('сеттер бере значення, а не гортає стан', () => {
		const state = new UIState();

		state.setHotkeysEnabled(true);
		expect(state.hotkeysEnabled, 'натискання на вже активну кнопку вимкнуло її').toBe(true);

		state.setHotkeysEnabled(false);
		expect(state.hotkeysEnabled).toBe(false);
		expect(storage.get(KEY)).toBe('false');
	});

	it('синглтон має той самий API — його й читає розмітка', () => {
		expect(typeof ui.setHotkeysEnabled).toBe('function');
		expect(typeof ui.hotkeysEnabled).toBe('boolean');
	});
});

/**
 * Інваріант по джерелах: обробник, що виконує `T` і `L`, звіряється з
 * прапорцем.
 *
 * Дивиться у файл, а не в помічник, з тієї ж причини, що й перевірка захисту
 * полів вводу в `services/keyboard.test.ts`: помічник у проєкті вже був, і
 * дефект полягав саме в тому, що його не покликали.
 */
const SERVICE_LAYER = join(process.cwd(), 'src/lib/components/ui/ServiceLayer.svelte');

describe('ServiceLayer — скорочення вимикаються прапорцем', () => {
	const source = readFileSync(SERVICE_LAYER, 'utf8');

	it('файл справді містить обробник літерних скорочень — перевірка жива', () => {
		expect(source).toContain("event.code === 'KeyT'");
		expect(source).toContain("event.code === 'KeyL'");
	});

	it('обробник виходить, коли скорочення вимкнені', () => {
		expect(
			source,
			'перемикач у налаштуваннях є, а обробник його не питає — SC 2.1.4 не виконано'
		).toMatch(/if\s*\(\s*!ui\.hotkeysEnabled\s*\)\s*return/);
	});

	it('перевірка стоїть ДО виконання дії, а не після', () => {
		const guard = source.indexOf('!ui.hotkeysEnabled');
		const action = source.indexOf("event.code === 'KeyT'");
		expect(guard, 'у файлі немає перевірки прапорця').toBeGreaterThan(-1);
		expect(guard, 'перевірка нижча за дію — тема встигне перемкнутися').toBeLessThan(action);
	});

	it('службові серії лишаються поза вимикачем — інакше зникло б аварійне скидання', () => {
		// `R` (скидання) і `V` (табло) — серії від пʼяти натискань; під SC 2.1.4
		// вони не підпадають, і перемикач мусить стояти НИЖЧЕ за їхню обробку.
		const guard = source.indexOf('!ui.hotkeysEnabled');
		const sequences = source.indexOf('resetSequence.handle(event)');
		expect(sequences, 'у файлі немає службових серій').toBeGreaterThan(-1);
		expect(sequences, 'вимикач забирає й аварійне скидання').toBeLessThan(guard);
	});
});
