// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
	BlocksSchema,
	GalleryWidgetConfigSchema,
	MenuConfigOverrideSchema,
	NewsWidgetConfigSchema,
	TickerConfigSchema,
	parseOrUndefined,
	withoutUndefined
} from './settings';

/**
 * Перевіряється не «чи приймає схема правильні дані» — це очевидно — а те, що
 * зіпсовані дані ДЕГРАДУЮТЬ, а не ламають сторінку, і що схема не підміняє
 * собою типові значення з `settings.ts`.
 *
 * Налаштування пише адміністратор через форму, а зберігаються вони в Firestore
 * без жодної перевірки на боці бази. Один запис неправильного типу — і раніше
 * він потрапляв просто в UI.
 */

describe('BlocksSchema', () => {
	it('приймає коректний список', () => {
		const out = BlocksSchema.parse([
			{ id: 'hero', visible: true, order: 0 },
			{ id: 'news', visible: false, order: 1 }
		]);
		expect(out).toHaveLength(2);
		expect(out[1].visible).toBe(false);
	});

	it('відкидає блок із невідомим id, решту зберігає', () => {
		// Набір блоків уже змінювався, тож у збережених налаштуваннях
		// залишаються записи від видалених.
		const out = BlocksSchema.parse([
			{ id: 'hero', visible: true, order: 0 },
			{ id: 'нема-такого', visible: true, order: 1 },
			{ id: 'gallery', visible: true, order: 2 }
		]);
		expect(out.map((b) => b.id)).toEqual(['hero', 'gallery']);
	});

	it('відкидає блок із полем неправильного типу', () => {
		const out = BlocksSchema.parse([
			{ id: 'hero', visible: 'так', order: 0 },
			{ id: 'news', visible: true, order: 1 }
		]);
		expect(out.map((b) => b.id)).toEqual(['news']);
	});

	it('порожній список лишається порожнім, а не стає помилкою', () => {
		expect(BlocksSchema.parse([])).toEqual([]);
	});
});

describe('віджети: зіпсоване поле зникає, а не набуває значення', () => {
	it('недопустимий режим показу стає undefined', () => {
		const out = NewsWidgetConfigSchema.parse({ defaultView: 'мозаїка', autoplay: true });
		expect(out.defaultView).toBeUndefined();
		expect(out.autoplay).toBe(true);
	});

	it('інтервал поза діапазоном зникає', () => {
		expect(NewsWidgetConfigSchema.parse({ autoplayInterval: 100000 }).autoplayInterval).toBeUndefined();
		expect(NewsWidgetConfigSchema.parse({ autoplayInterval: 0 }).autoplayInterval).toBeUndefined();
		expect(NewsWidgetConfigSchema.parse({ autoplayInterval: 12 }).autoplayInterval).toBe(12);
	});

	it('галерея: pinnedIndex = -1 допустимий, -7 ні', () => {
		expect(GalleryWidgetConfigSchema.parse({ pinnedIndex: -1 }).pinnedIndex).toBe(-1);
		expect(GalleryWidgetConfigSchema.parse({ pinnedIndex: -7 }).pinnedIndex).toBeUndefined();
	});

	it('тікер: час іншої форми зникає — інакше зламалося б порівняння', () => {
		expect(TickerConfigSchema.parse({ startTime: '21:30' }).startTime).toBe('21:30');
		expect(TickerConfigSchema.parse({ startTime: '9:00' }).startTime).toBeUndefined();
		expect(TickerConfigSchema.parse({ startTime: 'опівдні' }).startTime).toBeUndefined();
	});

	it('тікер: сила знебарвлення поза 0..100 зникає', () => {
		expect(TickerConfigSchema.parse({ grayscaleStrength: 500 }).grayscaleStrength).toBeUndefined();
		expect(TickerConfigSchema.parse({ grayscaleStrength: 40 }).grayscaleStrength).toBe(40);
	});
});

describe('withoutUndefined', () => {
	it('прибирає ключі з undefined, щоб злиття не затерло типові значення', () => {
		// Саме тут і живе весь сенс: `{ ...DEFAULT, ...validated }` із явним
		// undefined затер би типове значення на undefined.
		const merged = { autoplay: true, defaultView: 'carousel' as const, ...withoutUndefined({ autoplay: undefined, maxItemsGrid: 4 }) };
		expect(merged.autoplay).toBe(true);
		expect(merged).toMatchObject({ maxItemsGrid: 4 });
	});

	it('зберігає значення, які не undefined, зокрема false і 0', () => {
		expect(withoutUndefined({ a: false, b: 0, c: '', d: undefined })).toEqual({ a: false, b: 0, c: '' });
	});
});

describe('MenuConfigOverrideSchema', () => {
	// У Firestore лежать накладки на типове меню, а не повні пункти.
	const override = (id: string, extra = {}) => ({ id, href: '/x', visible: true, order: 0, ...extra });

	it('відкидає накладку без id — вона ні до чого не застосовна', () => {
		const out = MenuConfigOverrideSchema.parse({
			items: [override('home', { href: '/' }), { href: '/x', visible: true, order: 1 }],
			sections: []
		});
		expect(out.items?.map((i) => i.id)).toEqual(['home']);
	});

	it('зберігає null: settings.ts читає його як «узяти типове»', () => {
		// Перетворення null на undefined тут непомітно змінило б семантику злиття.
		const out = MenuConfigOverrideSchema.parse({ items: [override('a', { labelUk: null })] });
		expect(out.items?.[0].labelUk).toBeNull();
	});

	it('поле неправильного типу зникає, накладка лишається', () => {
		const out = MenuConfigOverrideSchema.parse({ items: [override('a', { visible: 'так', order: 3 })] });
		expect(out.items?.[0].visible).toBeUndefined();
		expect(out.items?.[0].order).toBe(3);
	});

	it('секція з поламаними пунктами лишається, пункти чистяться', () => {
		const out = MenuConfigOverrideSchema.parse({
			sections: [{ id: 'quick', visible: true, order: 0, items: [override('a'), { href: '/b' }] }]
		});
		expect(out.sections).toHaveLength(1);
		expect(out.sections?.[0].items?.map((i) => i.id)).toEqual(['a']);
	});

	it('порожній документ не є помилкою', () => {
		const out = MenuConfigOverrideSchema.parse({});
		expect(out.items).toBeUndefined();
		expect(out.sections).toBeUndefined();
	});
});

describe('parseOrUndefined', () => {
	it('повертає розібране значення, коли дані придатні', () => {
		expect(parseOrUndefined(MenuConfigOverrideSchema, { items: [], sections: [] })?.items).toEqual([]);
	});

	it('попереджає, коли замість обʼєкта прийшло щось інше', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(parseOrUndefined(MenuConfigOverrideSchema, 'рядок замість меню')).toBeUndefined();
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});

	it('мовчить про відсутнє значення — незбережене налаштування це норма', () => {
		// Попередження на кожне незаповнене поле швидко навчило б не читати
		// консоль узагалі, і тоді справжнє попередження теж лишилося б непоміченим.
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(parseOrUndefined(MenuConfigOverrideSchema, undefined)).toBeUndefined();
		expect(parseOrUndefined(MenuConfigOverrideSchema, null)).toBeUndefined();
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});
});
