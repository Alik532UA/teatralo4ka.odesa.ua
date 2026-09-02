import { describe, expect, it } from 'vitest';
import { VISIBILITY_LEVELS, isLinked, isListed, visibilityOf } from './visibility';

/**
 * Три рівні видимості — і рівно три. Значення в даних стереже
 * `narrowed-fields.test.ts`; тут — сама семантика функцій.
 */
describe('три рівні видимості', () => {
	it('поля немає — усюди', () => {
		expect(visibilityOf({})).toBe('listed');
		expect(isListed({})).toBe(true);
		expect(isLinked({})).toBe(true);
	});

	it("«за зв'язками» — не в переліку, але за зв'язком так", () => {
		expect(isListed({ visibility: 'linked' })).toBe(false);
		expect(isLinked({ visibility: 'linked' })).toBe(true);
	});

	it("«лише за посиланням» — ні в переліку, ні за зв'язком", () => {
		expect(isListed({ visibility: 'direct' })).toBe(false);
		expect(isLinked({ visibility: 'direct' })).toBe(false);
	});

	it('невідоме значення читається як «усюди», а не ховає людину мовчки', () => {
		expect(visibilityOf({ visibility: 'hiden' })).toBe('listed');
	});

	it('перелік рівнів — рівно три', () => {
		expect([...VISIBILITY_LEVELS]).toEqual(['listed', 'linked', 'direct']);
	});
});
