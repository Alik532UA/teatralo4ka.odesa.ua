// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { placePanel } from './dropdownPlace';

/**
 * Дефект, від якого написано і функцію, і ці перевірки: панель відкривалася
 * завжди вниз і обрізалася кінцем сторінки, тож останні пункти були недосяжні.
 *
 * Помітити це можна лише на конкретній сторінці з конкретною висотою вікна —
 * тобто випадково. Тут же кожен випадок задається числами.
 */

const VIEWPORT = { width: 1280, height: 800 };
/** Кнопка десь посередині: місця вдосталь з обох боків. */
const MIDDLE = { top: 300, bottom: 340, left: 400, width: 240 };

describe('placePanel', () => {
	it('місця вдосталь — відкривається вниз, під кнопкою', () => {
		const p = placePanel(MIDDLE, VIEWPORT);
		expect(p.above).toBe(false);
		expect(p.top).toBe(348);
		expect(p.maxHeight).toBe(320);
	});

	it('кнопка біля низу — відкривається ВГОРУ', () => {
		const p = placePanel({ ...MIDDLE, top: 740, bottom: 780 }, VIEWPORT);
		expect(p.above).toBe(true);
		// Панель закінчується над кнопкою, а не лізе під край екрана.
		expect(p.top + p.maxHeight).toBeLessThanOrEqual(740);
	});

	it('вниз тісно, але вгорі ще тісніше — лишається внизу', () => {
		// Кнопка майже на всю висоту вікна: угору 60, вниз 100. Умова «не влазить
		// бажана висота» відправила б панель угору й обрізала б її зверху.
		const p = placePanel({ ...MIDDLE, top: 68, bottom: 692 }, { width: 1280, height: 800 });
		expect(p.above).toBe(false);
	});

	it('висота обмежується наявним місцем, а не бажаною', () => {
		const p = placePanel({ ...MIDDLE, top: 500, bottom: 540 }, VIEWPORT);
		// Вниз лишається 800 - 540 - 8 = 252.
		expect(p.maxHeight).toBe(252);
	});

	it('панель не вужча за задане, навіть коли кнопка вузька', () => {
		const p = placePanel({ ...MIDDLE, width: 90 }, VIEWPORT, { minWidth: 200 });
		expect(p.width).toBe(200);
	});

	it('панель ширша за кнопку не вилазить за правий край', () => {
		const p = placePanel({ ...MIDDLE, left: 1200, width: 60 }, VIEWPORT, { minWidth: 200 });
		expect(p.left + p.width).toBeLessThanOrEqual(VIEWPORT.width);
	});

	it('на вузькому вікні лівий край не стає відʼємним', () => {
		const p = placePanel({ ...MIDDLE, left: 10, width: 60 }, { width: 320, height: 800 }, {
			minWidth: 400
		});
		expect(p.left).toBeGreaterThanOrEqual(0);
	});

	it('місця немає з обох боків — панель усе одно придатна', () => {
		// Крихітне вікно: підлога `minHeight` лишає панель зі власною прокруткою.
		const p = placePanel({ top: 40, bottom: 80, left: 0, width: 200 }, { width: 320, height: 120 });
		expect(p.maxHeight).toBeGreaterThanOrEqual(120);
	});
});
