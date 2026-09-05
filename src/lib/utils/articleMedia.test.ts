// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
	coverOf,
	fitCount,
	isSwapPair,
	legacyMedia,
	shapeFactor,
	shapeRatio,
	type ArticleMediaItem
} from './articleMedia';

/**
 * Правила показу медіа — тестом, бо ламаються вони ТИХО.
 *
 * Сторінка не падає ні від того, що пара «фото + відео» розсипалася на дві
 * плитки, ні від того, що стовпець порахував нуль плиток. Вона просто показує
 * не те, що просив автор, і побачити це можна лише на конкретній новині з
 * конкретною довжиною тексту.
 */

const фото = (url: string): ArticleMediaItem => ({ kind: 'photo', url });
const відео = (url: string): ArticleMediaItem => ({ kind: 'video', url });

describe('пропорція плитки', () => {
	it('ТИПОВА — вертикальна, а не квадрат', () => {
		/*
		 * Перша редакція робила типовим квадрат, і всі наявні новини — зокрема ті,
		 * що прийшли з бази й пропорції не задавали, — стали квадратними. Автор
		 * виправив: типове значення мусить лишати сайт таким, яким він був, а
		 * квадрат ставиться там, де його попросили.
		 */
		expect(shapeRatio()).toBe('9 / 16');
		expect(shapeFactor()).toBeCloseTo(16 / 9);
	});

	it('усі три на місці', () => {
		expect(shapeRatio('square')).toBe('1 / 1');
		expect(shapeRatio('portrait')).toBe('9 / 16');
		expect(shapeRatio('landscape')).toBe('16 / 9');
	});
});

describe('множник висоти', () => {
	it('квадрат — одиниця, вертикаль вища за ширину, горизонталь нижча', () => {
		// Це число множить ЗАМІРЯНУ ширину колонки: висоту плитки задає пропорція,
		// і саме від неї залежить, скільком плиткам стати збоку від тексту.
		expect(shapeFactor('square')).toBe(1);
		expect(shapeFactor('portrait')).toBeCloseTo(16 / 9);
		expect(shapeFactor('landscape')).toBeCloseTo(9 / 16);
	});
});

describe('пара «одне фото + одне відео»', () => {
	it('пара — саме коли одне й одне', () => {
		expect(isSwapPair([фото('a.jpg'), відео('https://youtu.be/x')])).toBe(true);
		expect(isSwapPair([відео('https://youtu.be/x'), фото('a.jpg')])).toBe(true);
	});

	it('усе інше — не пара', () => {
		// Саме тут і починається стовпець плиток; помилка тут означала б, що
		// сторінка з трьома знімками показує один і ховає два.
		expect(isSwapPair([фото('a.jpg')])).toBe(false);
		expect(isSwapPair([фото('a.jpg'), фото('b.jpg')])).toBe(false);
		expect(isSwapPair([відео('https://youtu.be/x'), відео('https://youtu.be/y')])).toBe(false);
		expect(isSwapPair([фото('a.jpg'), фото('b.jpg'), відео('https://youtu.be/x')])).toBe(false);
		expect(isSwapPair([])).toBe(false);
	});
});

describe('старі поля', () => {
	it('обкладинка й відео стають переліком, знімок перший', () => {
		const media = legacyMedia('/cover.jpg', 'https://youtu.be/x', 'Назва');
		expect(media.map((m) => m.kind)).toEqual(['photo', 'video']);
		expect(media[0].url).toBe('/cover.jpg');
		expect(media[0].alt).toBe('Назва');
	});

	it('порожні поля не дають порожніх елементів', () => {
		// `''` і пробіли трапляються в базі: адмінка зберігає незаповнене поле
		// рядком, а не відсутністю.
		expect(legacyMedia('', '')).toEqual([]);
		expect(legacyMedia('   ', '  ')).toEqual([]);
		expect(legacyMedia(undefined, null)).toEqual([]);
		expect(legacyMedia(null, 'https://youtu.be/x').map((m) => m.kind)).toEqual(['video']);
	});
});

describe('обкладинка переліку', () => {
	it('перше ФОТО, а не перший елемент', () => {
		// Інакше новина, яка починається з відео, показувала б у переліку картку
		// без зображення — при тому, що знімок у неї є.
		const media = [відео('https://youtu.be/x'), фото('/a.jpg')];
		expect(coverOf(media)?.url).toBe('/a.jpg');
	});

	it('немає фото — немає обкладинки', () => {
		expect(coverOf([відео('https://youtu.be/x')])).toBeUndefined();
	});
});

describe('скільком плиткам стати в стовпець', () => {
	it('рахує по висоті тексту, а не константою', () => {
		// 280 плитка + 24 проміжок: 900 px тексту вміщають три, 600 — дві.
		expect(fitCount(900, 280, 24)).toBe(3);
		expect(fitCount(600, 280, 24)).toBe(2);
	});

	it('щонайменше одна — навіть коли тексту майже немає', () => {
		/*
		 * Це не округлення вгору «на всяк випадок», а названий випадок: у новині
		 * 5 вересня тексту поки один рядок, і нуль плиток означав би сторінку
		 * без обкладинки взагалі.
		 */
		expect(fitCount(0, 280, 24)).toBe(1);
		expect(fitCount(40, 280, 24)).toBe(1);
	});

	it('нульова плитка не ділить на нуль', () => {
		// Перший кадр після монтування: розміри ще не заміряні.
		expect(fitCount(900, 0, 24)).toBe(1);
	});
});
