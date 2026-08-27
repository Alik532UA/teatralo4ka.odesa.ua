import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { storage } from './storage';
import { visibilityFromUrl, ADULTS_URL_PARAM } from './adultsVisibility.svelte';

vi.mock('$app/environment', () => ({
	browser: true,
	dev: false,
	building: false,
	version: 'test'
}));

const STORAGE_KEY = 'adults_section_revealed';

async function freshModule() {
	vi.resetModules();
	return await import('./adultsVisibility.svelte');
}

describe('adultsVisibility', () => {
	beforeEach(() => {
		storage.remove(STORAGE_KEY);
	});

	afterEach(() => {
		storage.remove(STORAGE_KEY);
		vi.unstubAllGlobals();
	});

	it('reveal() робить розділ видимим і зберігає стан', async () => {
		const { adultsVisibility } = await freshModule();
		adultsVisibility.reveal();

		expect(adultsVisibility.isVisible).toBe(true);
		expect(storage.get(STORAGE_KEY)).toBe('1');
	});

	it('toggle() перемикає стан', async () => {
		const { adultsVisibility } = await freshModule();
		const first = adultsVisibility.toggle();
		expect(first).toBe(adultsVisibility.override);
		expect(adultsVisibility.isVisible).toBe(first);
	});
});

describe('adultsVisibility: вхід за адресою', () => {
	/**
	 * Службовий жест не буває ЄДИНИМ входом (DEBUGGING-v8 § 3.1,
	 * `DBG-KEY-SEQUENCE`): на дотику клавіатури немає, тобто до 2026-08-27 з
	 * телефона цей розділ був недосяжний узагалі — сім натискань `H` нікуди
	 * ввести. Табло версії таку пару має від початку (`?debug=1` поруч із серією
	 * `V`), а тут лишалася сама серія.
	 */
	it('«1» показує, «0» ховає', () => {
		expect(visibilityFromUrl('1')).toBe(true);
		expect(visibilityFromUrl('0')).toBe(false);
	});

	it.each([null, '', 'yes', 'true', '2', 'adults'])('%o нічого не просить', (value) => {
		// Мовчазне «показати» на описці зробило б параметр таким, що спрацьовує
		// випадково — а він відкриває розділ, схований навмисно.
		expect(visibilityFromUrl(value)).toBeNull();
	});

	it('значення ті самі, що й у сховищі — третьої мови для одного стану немає', async () => {
		const { adultsVisibility } = await freshModule();
		adultsVisibility.setVisible(true);
		expect(storage.get(STORAGE_KEY)).toBe('1');
		adultsVisibility.setVisible(false);
		expect(storage.get(STORAGE_KEY)).toBe('0');
	});

	it('setVisible бере значення, а не гортає стан', async () => {
		const { adultsVisibility } = await freshModule();
		adultsVisibility.setVisible(true);
		adultsVisibility.setVisible(true);
		expect(adultsVisibility.isVisible, 'повторний виклик інвертував стан').toBe(true);
	});
});

/**
 * Інваріант по джерелах: другий вхід справді підключений, і він не воює з жестом.
 */
describe('ServiceLayer — параметр адреси поруч із серією', () => {
	const source = readFileSync(join(process.cwd(), 'src/lib/components/ui/ServiceLayer.svelte'), 'utf8');

	it('перевірка жива: серія `H` саме тут', () => {
		expect(source).toContain("code: 'KeyH'");
	});

	it('назва параметра коротка й та сама, що в документації', () => {
		// Адресу диктують уголос і набирають руками на чужому телефоні — саме тому
		// вхід і робився. Довга назва зводила б цю користь нанівець.
		expect(ADULTS_URL_PARAM).toBe('adults');
	});

	it('той самий файл читає параметр адреси', () => {
		expect(source, 'серія лишилася єдиним входом — з телефона розділ недосяжний').toContain(
			`searchParams.get(ADULTS_URL_PARAM)`
		);
		// Саме константа, а не літерал: інакше назва параметра жила б у двох
		// місцях і розійшлася б мовчки — адреса з документації перестала б діяти.
		expect(source, 'назва параметра вписана літералом повз константу').not.toContain(
			`searchParams.get('${ADULTS_URL_PARAM}')`
		);
	});

	it('ефект слухає адресу, а не видимість', () => {
		// Якби він читав `isVisible`, то на сторінці з `?adults=1` серія `H`
		// перестала б ховати розділ: стан змінився → ефект перезапустився →
		// параметр знову наполіг. Тобто другий вхід убив би перший.
		const start = source.indexOf('const raw = page.url.searchParams.get(ADULTS_URL_PARAM)');
		expect(start, 'ефекту не знайдено — перевірка мертва').toBeGreaterThan(-1);
		const body = source.slice(start, source.indexOf('});', start));
		expect(body, 'ефект залежить від стану — параметр скасовуватиме жест').not.toContain(
			'isVisible'
		);
	});
});
