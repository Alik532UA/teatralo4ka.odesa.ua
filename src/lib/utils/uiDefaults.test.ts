// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { defaultsToApply, type AdminDefaults, type StoredChoices } from './uiDefaults';

/**
 * Головне правило цього модуля — власний вибір відвідувача не перебивається.
 *
 * Перевіряти варто саме його: типові значення задає адміністратор, і якби вони
 * застосовувалися беззастережно, налаштування відвідувача зникало б після кожної
 * правки в адмінці. Виглядало б це не як «адмін змінив типове», а як поламане
 * збереження — тобто помилка, яку шукали б у сховищі.
 */

const NOTHING_SAVED: StoredChoices = {
	backgroundType: null,
	enableDynamicBackground: null,
	enableBlurEffect: null,
	scrollbarMode: null
};

const ADMIN: AdminDefaults = {
	defaultBackground: 2,
	defaultBlur: false,
	defaultScrollbar: 'minimap-full'
};

describe('defaultsToApply', () => {
	it('відвідувач нічого не вибирав — застосовується все', () => {
		expect(defaultsToApply(NOTHING_SAVED, ADMIN)).toEqual({
			backgroundType: 2,
			enableDynamicBackground: true,
			enableBlurEffect: false,
			scrollbarMode: 'minimap-full'
		});
	});

	it('свій вибір смуги лишається, решта застосовується', () => {
		const out = defaultsToApply({ ...NOTHING_SAVED, scrollbarMode: 'standard' }, ADMIN);
		expect(out.scrollbarMode).toBeUndefined();
		expect(out.enableBlurEffect).toBe(false);
		expect(out.backgroundType).toBe(2);
	});

	it('свій вибір blur лишається', () => {
		const out = defaultsToApply({ ...NOTHING_SAVED, enableBlurEffect: 'true' }, ADMIN);
		expect(out.enableBlurEffect).toBeUndefined();
		expect(out.scrollbarMode).toBe('minimap-full');
	});

	it('«Немає» вимикає динамічний фон і не задає тип', () => {
		const out = defaultsToApply(NOTHING_SAVED, { ...ADMIN, defaultBackground: 0 });
		expect(out.enableDynamicBackground).toBe(false);
		expect(out.backgroundType).toBeUndefined();
	});

	/**
	 * Фон — два ключі, і торкнутися можна лише одного.
	 *
	 * Відвідувач, який вибрав «Немає», зберіг тільки `enableDynamicBackground`:
	 * `backgroundType` при виборі нуля не пишеться взагалі. Якби умова дивилася
	 * лише на `backgroundType`, цей вибір перебивався б типовим значенням — і
	 * саме він, бо це єдиний варіант без запису типу.
	 */
	it('вибір «Немає» не перебивається, хоч тип фону й не збережений', () => {
		const out = defaultsToApply({ ...NOTHING_SAVED, enableDynamicBackground: 'false' }, ADMIN);
		expect(out.enableDynamicBackground).toBeUndefined();
		expect(out.backgroundType).toBeUndefined();
	});

	it('збережений лише тип фону — теж вважається вибором', () => {
		const out = defaultsToApply({ ...NOTHING_SAVED, backgroundType: '1' }, ADMIN);
		expect(out.backgroundType).toBeUndefined();
		expect(out.enableDynamicBackground).toBeUndefined();
	});
});
