// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
	CTA_GROUP_ID,
	CTA_ITEM_ID,
	OVERFLOW_GROUP_ID,
	ROOT_GROUP_ID,
	menuConfigToFlatItems,
	menuConfigToGroups,
	isPathActive,
	normalizePath,
	resolvedHref,
	withCtaItem,
	withOverflowGroup,
	type NavGroup
} from './navigation';
import type { CtaConfig, MenuConfig, MenuItem, MenuSection } from '$lib/services/settings';

/**
 * Логіка шапки, винесена з `.svelte` саме заради цих перевірок.
 *
 * Помилка тут ламає меню на кожній сторінці сайту, а сама по собі невидима:
 * ані типи, ані збірка не бачать різниці між правильним і неправильним
 * ідентифікатором пункту.
 */

const item = (over: Partial<MenuItem> & { id: string }): MenuItem => ({
	labelUk: 'Пункт',
	labelEn: 'Item',
	linkType: 'page',
	href: '/x',
	visible: true,
	order: 0,
	...over
});

const section = (over: Partial<MenuSection> & { id: string }): MenuSection => ({
	visible: true,
	order: 0,
	items: [],
	...over
});

const config = (over: Partial<MenuConfig> = {}): MenuConfig => ({ items: [], sections: [], ...over });

describe('resolvedHref', () => {
	it('порожня адреса стає "#", а не порожнім href', () => {
		expect(resolvedHref(undefined, 'page')).toBe('#');
		expect(resolvedHref('', 'page')).toBe('#');
	});

	it('зовнішні адреси лишаються як є', () => {
		expect(resolvedHref('https://example.com', 'url')).toBe('https://example.com');
		// http на початку важливіший за linkType: адміністратор міг обрати «page»
		// і вставити повну адресу.
		expect(resolvedHref('https://example.com', 'page')).toBe('https://example.com');
	});

	it('стаття з повним шляхом лишається шляхом', () => {
		expect(resolvedHref('/projects/teatr-pro', 'article')).toBe('/projects/teatr-pro');
	});

	it('стара форма «голий slug» означає новину', () => {
		expect(resolvedHref('yalynka', 'article')).toBe('/news/yalynka');
	});
});

describe('menuConfigToFlatItems', () => {
	it('сортує за order і пропускає невидимі', () => {
		const out = menuConfigToFlatItems(
			config({
				items: [
					item({ id: 'c', order: 2 }),
					item({ id: 'a', order: 0 }),
					item({ id: 'hidden', order: 1, visible: false })
				]
			}),
			'uk'
		);
		expect(out.map((i) => i.id)).toEqual(['a', 'c']);
	});

	it('пункти секцій отримують префікс секції — інакше ключі збігаються', () => {
		// Це не теоретичний випадок: у типовому меню `about` є і в корені,
		// і в секції. Однаковий ключ у `{#each}` — помилка рантайму.
		const out = menuConfigToFlatItems(
			config({
				items: [item({ id: 'about' })],
				sections: [section({ id: 'quick', items: [item({ id: 'about' })] })]
			}),
			'uk'
		);
		expect(out.map((i) => i.id)).toEqual(['about', 'quick/about']);
		expect(new Set(out.map((i) => i.id)).size).toBe(out.length);
	});

	it('невидима секція не дає жодного пункту', () => {
		const out = menuConfigToFlatItems(
			config({ sections: [section({ id: 's', visible: false, items: [item({ id: 'a' })] })] }),
			'uk'
		);
		expect(out).toEqual([]);
	});

	it('мова обирає мітку', () => {
		const cfg = config({ items: [item({ id: 'a', labelUk: 'Головна', labelEn: 'Home' })] });
		expect(menuConfigToFlatItems(cfg, 'uk')[0].label).toBe('Головна');
		expect(menuConfigToFlatItems(cfg, 'en')[0].label).toBe('Home');
	});
});

describe('menuConfigToGroups', () => {
	it('кореневі пункти стають однією безіменною групою з власним id', () => {
		const out = menuConfigToGroups(config({ items: [item({ id: 'a' })] }), 'uk');
		expect(out).toHaveLength(1);
		expect(out[0].id).toBe(ROOT_GROUP_ID);
		expect(out[0].title).toBeUndefined();
	});

	it('без кореневих пунктів безіменної групи немає', () => {
		const out = menuConfigToGroups(config({ sections: [section({ id: 's', items: [item({ id: 'a' })] })] }), 'uk');
		expect(out.map((g) => g.id)).toEqual(['s']);
	});

	it('секція без labelUk лишається без заголовка — це контейнер, а не рубрика', () => {
		const out = menuConfigToGroups(config({ sections: [section({ id: 's', items: [item({ id: 'a' })] })] }), 'uk');
		expect(out[0].title).toBeUndefined();
	});

	it('усі ідентифікатори груп унікальні', () => {
		const out = menuConfigToGroups(
			config({
				items: [item({ id: 'a' })],
				sections: [section({ id: 's1', order: 0 }), section({ id: 's2', order: 1 })]
			}),
			'uk'
		);
		expect(new Set(out.map((g) => g.id)).size).toBe(out.length);
	});
});

describe('withOverflowGroup', () => {
	const groups: NavGroup[] = [{ id: 'g', items: [{ id: 'news', label: 'Новини', href: '/news' }] }];

	it('без прихованих пунктів нічого не змінює', () => {
		expect(withOverflowGroup(groups, [], 'Ще')).toBe(groups);
	});

	it('додає групу «Ще» першою', () => {
		const out = withOverflowGroup(groups, [{ id: 'x', label: 'Історія', href: '/history' }], 'Ще');
		expect(out[0].id).toBe(OVERFLOW_GROUP_ID);
		expect(out[0].title).toBe('Ще');
		expect(out[0].items.map((i) => i.href)).toEqual(['/history']);
	});

	it('не дублює пункт, який уже є у випадайці', () => {
		// Той самий пункт у headerBar і navDropdown має РІЗНІ id — вони приходять
		// із різних конфігів. Тому порівняння за href, а не за id.
		const out = withOverflowGroup(groups, [{ id: 'інший-id', label: 'Новини', href: '/news' }], 'Ще');
		expect(out).toBe(groups);
	});

	it('не мутує вхідні групи', () => {
		const before = JSON.stringify(groups);
		withOverflowGroup(groups, [{ id: 'x', label: 'Історія', href: '/history' }], 'Ще');
		expect(JSON.stringify(groups)).toBe(before);
	});
});

describe('withCtaItem', () => {
	const cta: CtaConfig = {
		visible: true,
		labelUk: 'Для вступу',
		labelEn: 'Admission',
		linkType: 'page',
		href: '/admission'
	};
	const groups: NavGroup[] = [{ id: 'g', items: [{ id: 'news', label: 'Новини', href: '/news' }] }];

	it('вставляє кнопку першим пунктом першої групи', () => {
		const out = withCtaItem(groups, cta, '/admission', 'uk');
		expect(out[0].items[0]).toMatchObject({ id: CTA_ITEM_ID, href: '/admission', itemType: 'cta' });
		expect(out[0].items.map((i) => i.href)).toEqual(['/admission', '/news']);
	});

	it('не вставляє, якщо така адреса вже є в меню', () => {
		const withAdmission: NavGroup[] = [
			{ id: 'g', items: [{ id: 'adm', label: 'Для вступу', href: '/admission' }] }
		];
		expect(withCtaItem(withAdmission, cta, '/admission', 'uk')).toBe(withAdmission);
	});

	it('прихована кнопка не вставляється', () => {
		expect(withCtaItem(groups, { ...cta, visible: false }, '/admission', 'uk')).toBe(groups);
	});

	it('порожнє меню дає кнопці власну групу', () => {
		const out = withCtaItem([], cta, '/admission', 'uk');
		expect(out).toHaveLength(1);
		expect(out[0].id).toBe(CTA_GROUP_ID);
	});

	it('мова обирає мітку кнопки', () => {
		expect(withCtaItem(groups, cta, '/admission', 'en')[0].items[0].label).toBe('Admission');
	});

	it('не мутує вхідні групи', () => {
		const before = JSON.stringify(groups);
		withCtaItem(groups, cta, '/admission', 'uk');
		expect(JSON.stringify(groups)).toBe(before);
	});
});


describe('isPathActive and normalizePath', () => {
	it('normalizePath обрізає завершальний слеш, query і hash', () => {
		expect(normalizePath('/about/')).toBe('/about');
		expect(normalizePath('/about?tab=1')).toBe('/about');
		expect(normalizePath('/about#section')).toBe('/about');
		expect(normalizePath('')).toBe('/');
		expect(normalizePath('/')).toBe('/');
	});

	it('активна головна сторінка uk та en', () => {
		expect(isPathActive('/', '/')).toBe(true);
		expect(isPathActive('/en/', '/en/')).toBe(true);
		expect(isPathActive('/en', '/en/')).toBe(true);
		expect(isPathActive('/about/', '/')).toBe(false);
	});

	it('активна внутрішня сторінка незалежно від завершального слеша', () => {
		expect(isPathActive('/about/', '/about')).toBe(true);
		expect(isPathActive('/about', '/about/')).toBe(true);
		expect(isPathActive('/en/about/', '/en/about')).toBe(true);
		expect(isPathActive('/history/', '/about')).toBe(false);
	});

	it('ігнорує зовнішні посилання або порожні href', () => {
		expect(isPathActive('/about', '')).toBe(false);
		expect(isPathActive('/about', '#')).toBe(false);
		expect(isPathActive('/about', 'https://example.com')).toBe(false);
		expect(isPathActive('/about', 'mailto:test@test.com')).toBe(false);
	});
});
