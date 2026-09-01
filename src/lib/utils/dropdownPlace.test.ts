// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { placePanel, createsFixedContainingBlock } from './dropdownPlace';

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
		expect(p.minWidth).toBe(200);
	});

	it('панель ширша за кнопку не вилазить за правий край', () => {
		const p = placePanel({ ...MIDDLE, left: 1200, width: 60 }, VIEWPORT, { minWidth: 200 });
		expect(p.left + p.maxWidth).toBeLessThanOrEqual(VIEWPORT.width);
	});

	/**
	 * Через це й переписано ширину: панель фіксованого розміру різала двомовні
	 * підписи навіть тоді, коли на екрані було вдосталь місця — від «Оголошення»
	 * лишалося «О..».
	 */
	it('за наявного місця можна бути ширшою за кнопку', () => {
		const p = placePanel({ ...MIDDLE, width: 240 }, VIEWPORT);
		expect(p.maxWidth).toBeGreaterThan(240);
	});

	it('стеля ширини не перевищується навіть на широкому екрані', () => {
		const p = placePanel({ ...MIDDLE, left: 20, width: 100 }, { width: 3840, height: 1200 }, {
			maxWidthCap: 640
		});
		expect(p.maxWidth).toBe(640);
	});

	it('на вузькому вікні межі не суперечать одна одній', () => {
		// minWidth не може бути більшим за maxWidth: інакше браузер розтягнув би
		// панель за край екрана, бо min перемагає max.
		const p = placePanel({ ...MIDDLE, left: 10, width: 60 }, { width: 320, height: 800 }, {
			minWidth: 400
		});
		expect(p.minWidth).toBeLessThanOrEqual(p.maxWidth);
		expect(p.left + p.maxWidth).toBeLessThanOrEqual(320);
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

/**
 * Чи створює набір стилів контейнер для `position: fixed`.
 *
 * ## Що саме стережеться
 *
 * Головне — ПОВНОТА переліку. Підказка з іменем однокурсника з'їхала на 208
 * пікселів саме тому, що `transform` картки ніхто не врахував; забути тут
 * `filter` чи `contain` означає повторити ту саму помилку на іншій сторінці.
 *
 * Друге — типові значення НЕ вважаються контейнером. `transform: none`,
 * `will-change: auto`, `contain: none` стоять на майже кожному елементі
 * сторінки, і якби вони спрацьовували, обхід зупинявся б на першому ж предку й
 * підказка з'їжджала б завжди.
 *
 * ## Зворотні експерименти (AI-AGENT-PITFALLS-v8 § 1.1)
 *
 * 1. Прибрати `filter` із перевірки — падає «filter створює контейнер».
 * 2. Замінити умову `значення !== 'none'` на просто `Boolean(значення)` —
 *    падає «типові значення не вважаються контейнером».
 * 3. Звузити `contain` до самого `paint` — падає перевірка `contain: layout`.
 *
 * Усі три прогнані.
 */
describe('createsFixedContainingBlock', () => {
	it('transform створює контейнер — саме на цьому з’їхала підказка', () => {
		expect(createsFixedContainingBlock({ transform: 'matrix(1, 0, 0, 1, 0, 12)' })).toBe(true);
	});

	it('filter, perspective і scale — теж', () => {
		expect(createsFixedContainingBlock({ filter: 'blur(4px)' })).toBe(true);
		expect(createsFixedContainingBlock({ perspective: '400px' })).toBe(true);
		expect(createsFixedContainingBlock({ scale: '1.05' })).toBe(true);
		expect(createsFixedContainingBlock({ translate: '0 12px' })).toBe(true);
		expect(createsFixedContainingBlock({ rotate: '3deg' })).toBe(true);
	});

	it('will-change враховується лише коли в ньому transform', () => {
		expect(createsFixedContainingBlock({ willChange: 'transform' })).toBe(true);
		expect(createsFixedContainingBlock({ willChange: 'opacity' })).toBe(false);
	});

	it('contain: paint, layout, strict і content', () => {
		expect(createsFixedContainingBlock({ contain: 'paint' })).toBe(true);
		expect(createsFixedContainingBlock({ contain: 'layout' })).toBe(true);
		expect(createsFixedContainingBlock({ contain: 'strict' })).toBe(true);
		expect(createsFixedContainingBlock({ contain: 'content' })).toBe(true);
		expect(createsFixedContainingBlock({ contain: 'size' }), 'size не про малювання').toBe(false);
	});

	it('ТИПОВІ значення контейнера не створюють', () => {
		expect(
			createsFixedContainingBlock({
				transform: 'none',
				translate: 'none',
				rotate: 'none',
				scale: 'none',
				filter: 'none',
				perspective: 'none',
				willChange: 'auto',
				contain: 'none'
			})
		).toBe(false);
		expect(createsFixedContainingBlock({}), 'порожній набір — теж ні').toBe(false);
	});
});
