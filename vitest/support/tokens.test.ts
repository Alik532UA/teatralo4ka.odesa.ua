import { describe, expect, it } from 'vitest';
import { THEMES, TokenResolver, contrast, luminance, parseColor } from './tokens';

/**
 * Тести на сам розв'язувач, а не на стилі проєкту.
 *
 * Він з'явився не як допоміжний код, а як джерело трьох власних хибних
 * висновків підряд: `transparent` як чорний, коментар як оголошення,
 * напівпрозоре як непрозоре. Перевірка контрасту спирається на нього цілком,
 * тож помилка тут не червоніє ніде — вона просто робить сусідню перевірку
 * тихішою, ніж вона має бути.
 */

describe('parseColor', () => {
	it('розбирає hex у трьох і шести символах, у будь-якому регістрі', () => {
		expect(parseColor('#fff')).toEqual([255, 255, 255]);
		expect(parseColor('#00242F')).toEqual([0, 36, 47]);
		expect(parseColor('#00b5ec')).toEqual([0, 181, 236]);
	});

	it('розбирає rgb() і повністю непрозоре rgba()', () => {
		expect(parseColor('rgb(0, 54, 70)')).toEqual([0, 54, 70]);
		expect(parseColor('rgba(0, 54, 70, 1)')).toEqual([0, 54, 70]);
	});

	it('напівпрозоре — НЕ колір: без знання того, що під ним, контраст не рахується', () => {
		expect(parseColor('rgba(0, 36, 47, 0.1)')).toBeNull();
		expect(parseColor('rgba(255, 255, 255, 0.5)')).toBeNull();
	});

	it('transparent — НЕ чорний', () => {
		// Перша версія вважала його [0,0,0], і `background: transparent` читалося
		// як чорне тло. Це давало близько двадцяти хибних дефектів на кнопках
		// із прозорим тлом.
		expect(parseColor('transparent')).toBeNull();
	});

	it('color-mix, градієнт і сміття не вдають із себе колір', () => {
		expect(parseColor('color-mix(in srgb, #fff, transparent 15%)')).toBeNull();
		expect(parseColor('linear-gradient(to top, #000, #fff)')).toBeNull();
		expect(parseColor('inherit')).toBeNull();
		expect(parseColor('')).toBeNull();
	});
});

describe('contrast', () => {
	it('крайні значення відомі', () => {
		expect(contrast([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 1);
		expect(contrast([255, 255, 255], [255, 255, 255])).toBeCloseTo(1, 5);
	});

	it('порядок аргументів не впливає', () => {
		const a: [number, number, number] = [0, 181, 236];
		const b: [number, number, number] = [255, 255, 255];
		expect(contrast(a, b)).toBeCloseTo(contrast(b, a), 10);
	});

	it('збігається зі значеннями, поміряними в браузері', () => {
		// Числа взяті з живого замірювання на елементі, не з голови.
		expect(contrast([255, 255, 255], [0, 181, 236])).toBeCloseTo(2.38, 2);
		expect(contrast([0, 36, 47], [0, 181, 236])).toBeCloseTo(6.82, 2);
		expect(contrast([255, 255, 255], [0, 54, 70])).toBeCloseTo(12.99, 2);
		expect(contrast([0, 36, 47], [229, 247, 253])).toBeCloseTo(14.73, 2);
	});

	it('яскравість чорного й білого — межі 0 і 1', () => {
		expect(luminance([0, 0, 0])).toBeCloseTo(0, 10);
		expect(luminance([255, 255, 255])).toBeCloseTo(1, 10);
	});
});

describe('TokenResolver', () => {
	const r = new TokenResolver();

	it('розв\'язує ланцюжок var() до кольору в кожній темі', () => {
		for (const theme of THEMES) {
			// --bg-card → var(--palette-*) → #hex
			expect(r.resolve('--bg-card', theme), theme).not.toBeNull();
			expect(r.resolve('--text-main', theme), theme).not.toBeNull();
			expect(r.resolve('--accent-primary', theme), theme).not.toBeNull();
		}
	});

	it('коментар із текстом «--токен:» не вдає із себе оголошення', () => {
		// Саме через це перевірка контрасту мовчки пропускала
		// `.footer__btn-order:hover` у світлій темі: коментар у light.css
		// містить рядок «--text-on-accent:», і токен ставав нерозв'язним.
		expect(r.resolve('--text-on-accent', 'light')).toEqual([0, 36, 47]);
		expect(r.resolve('--text-on-nav-active', 'light')).toEqual([255, 255, 255]);
	});

	it('тема переважує global.css, а не навпаки', () => {
		// --bg-card у світлій темі білий, у темній — navy-page.
		expect(r.resolve('--bg-card', 'light')).toEqual([255, 255, 255]);
		expect(r.resolve('--bg-card', 'dark')).toEqual([0, 54, 70]);
	});

	it('фолбек у var() спрацьовує, коли токена немає', () => {
		// Назва латиницею навмисно: імена CSS-змінних у проєкті латинські, і
		// перша версія цього тесту з кириличною назвою впала не через резолвер,
		// а через власну назву — регулярка імені токена її не приймає.
		expect(r.resolveValue('var(--no-such-token, #ff0000)', 'light')).toEqual([255, 0, 0]);
		expect(r.resolveValue('var(--no-such-token)', 'light')).toBeNull();
	});

	it('напівпрозорий токен теми не розв\'язується — і це правильна відповідь', () => {
		// --border-main у жовтих темах rgba(0,36,47,0.1).
		expect(r.resolve('--border-main', 'yellow')).toBeNull();
		expect(r.resolve('--border-main', 'light')).not.toBeNull();
	});
});
