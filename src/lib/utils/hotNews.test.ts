import { describe, expect, it } from 'vitest';
import {
	DEFAULT_HOT_NEWS,
	matchesPath,
	seenKey,
	selectHotNews,
	visibleLimit,
	type HotNewsConfig,
	type HotNewsItem
} from './hotNews';

/**
 * Тут перевіряється саме те, від чого залежить, стане сповіщення корисним чи
 * дратівливим: чи справді «один раз» означає один раз, і чи не вискакує
 * новина поверх самої себе.
 */

const item = (over: Partial<HotNewsItem> = {}): HotNewsItem => ({
	id: 'nabir',
	enabled: true,
	frequency: 'once',
	scope: 'exceptOwn',
	order: 0,
	...over
});

const config = (over: Partial<HotNewsConfig> = {}): HotNewsConfig => ({
	...DEFAULT_HOT_NEWS,
	enabled: true,
	items: [item()],
	...over
});

const select = (over: Partial<Parameters<typeof selectHotNews>[0]> = {}) =>
	selectHotNews({
		config: config(),
		pathname: '/',
		seenForever: [],
		seenSession: [],
		...over
	});

describe('вимкнення', () => {
	it('вимкнений блок не показує нічого, навіть якщо новини увімкнені', () => {
		expect(select({ config: config({ enabled: false }) })).toEqual([]);
	});

	it('вимкнена новина не показується, навіть коли блок увімкнено', () => {
		expect(select({ config: config({ items: [item({ enabled: false })] }) })).toEqual([]);
	});
});

describe('де НЕ показувати ніколи', () => {
	it('в адмінці не показується навіть режим «щоразу» зі scope «all»', () => {
		// Попап поверх форми редагування заважає саме тому, хто цю новину й
		// зробив гарячою; жодне налаштування цього не має скасовувати.
		const cfg = config({ items: [item({ frequency: 'always', scope: 'all' })] });
		expect(select({ config: cfg, pathname: '/admin/settings' })).toEqual([]);
		expect(select({ config: cfg, pathname: '/admin' })).toEqual([]);
		expect(select({ config: cfg, pathname: '/about' }), 'а поза адмінкою — показується').toHaveLength(1);
	});
});

describe('частота', () => {
	it('«один раз» більше не показується після показу', () => {
		const cfg = config({ items: [item({ frequency: 'once' })] });
		expect(select({ config: cfg })).toHaveLength(1);
		expect(select({ config: cfg, seenForever: ['nabir'] })).toHaveLength(0);
	});

	it('«один раз» показується ЗНОВУ після редагування новини', () => {
		// Ключ несе версію: інакше виправлену дату набору побачили б лише нові
		// відвідувачі, а всі, хто вже бачив стару, — ніколи.
		const cfg = config({ items: [item({ frequency: 'once', version: 222 })] });
		expect(select({ config: cfg, seenForever: ['nabir@111'] }), 'стара версія не рахується').toHaveLength(1);
		expect(select({ config: cfg, seenForever: ['nabir@222'] })).toHaveLength(0);
	});

	it('«раз на сесію» дивиться на сесію, а не на постійну пам\'ять', () => {
		const cfg = config({ items: [item({ frequency: 'session' })] });
		expect(select({ config: cfg, seenForever: ['nabir'] }), 'постійна позначка тут не діє').toHaveLength(1);
		expect(select({ config: cfg, seenSession: ['nabir'] })).toHaveLength(0);
	});

	it('«щоразу» ігнорує обидві позначки', () => {
		const cfg = config({ items: [item({ frequency: 'always' })] });
		expect(select({ config: cfg, seenForever: ['nabir'], seenSession: ['nabir'] })).toHaveLength(1);
	});
});

describe('де показувати', () => {
	it('exceptOwn: скрізь, окрім сторінки самої новини', () => {
		const it_ = item({ scope: 'exceptOwn' });
		expect(matchesPath(it_, '/')).toBe(true);
		expect(matchesPath(it_, '/about')).toBe(true);
		expect(matchesPath(it_, '/news')).toBe(true);
		expect(matchesPath(it_, '/news/nabir'), 'поверх самої себе — це збій').toBe(false);
	});

	it('кінцева коса риска не робить сторінку іншою', () => {
		// На статичному хостингу адреса приходить і з нею, і без неї.
		expect(matchesPath(item({ scope: 'exceptOwn' }), '/news/nabir/')).toBe(false);
		expect(matchesPath(item({ scope: 'home' }), '/')).toBe(true);
		expect(matchesPath(item({ scope: 'home' }), '')).toBe(true);
	});

	it('home: лише головна', () => {
		const it_ = item({ scope: 'home' });
		expect(matchesPath(it_, '/')).toBe(true);
		expect(matchesPath(it_, '/about')).toBe(false);
		expect(matchesPath(it_, '/news/nabir')).toBe(false);
	});

	it('all: скрізь, зокрема на власній сторінці', () => {
		expect(matchesPath(item({ scope: 'all' }), '/news/nabir')).toBe(true);
	});
});

describe('порядок і кілька новин', () => {
	it('віддає за `order`, а не за порядком у масиві', () => {
		const cfg = config({
			items: [
				item({ id: 'b', order: 2, frequency: 'always' }),
				item({ id: 'a', order: 1, frequency: 'always' })
			]
		});
		expect(select({ config: cfg }).map((i) => i.id)).toEqual(['a', 'b']);
	});

	it('однаковий order розв\'язується стабільно, а не випадково', () => {
		const cfg = config({
			items: [
				item({ id: 'zzz', order: 1, frequency: 'always' }),
				item({ id: 'aaa', order: 1, frequency: 'always' })
			]
		});
		expect(select({ config: cfg }).map((i) => i.id)).toEqual(['aaa', 'zzz']);
	});

	it('обмеження одночасності — справа показу, не відбору', () => {
		// Відбір віддає всі придатні; скільки видно водночас, вирішує режим.
		const cfg = config({
			displayMode: 'queue',
			items: [
				item({ id: 'a', frequency: 'always' }),
				item({ id: 'b', frequency: 'always' })
			]
		});
		expect(select({ config: cfg })).toHaveLength(2);
		expect(visibleLimit('queue')).toBe(1);
		expect(visibleLimit('stack2')).toBe(2);
		expect(visibleLimit('all')).toBe(Number.POSITIVE_INFINITY);
	});
});

describe('seenKey', () => {
	it('без версії — просто id', () => {
		expect(seenKey({ id: 'nabir' })).toBe('nabir');
	});

	it('з версією — id та версія', () => {
		expect(seenKey({ id: 'nabir', version: 17 })).toBe('nabir@17');
	});
});
