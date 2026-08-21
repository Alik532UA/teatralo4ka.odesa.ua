import { withLocale, type Locale } from '$lib/i18n/routing';
import { base, resolve } from '$app/paths';
import type { CtaConfig, MenuConfig, MenuLinkType } from '$lib/services/settings';

/**
 * Перетворення конфігу меню на те, що малює шапка.
 *
 * Логіка винесена з `HeaderSection.svelte` не заради розміру файлу, а заради
 * перевірок: усередині `.svelte` ці функції неможливо викликати з тесту, а
 * саме тут живуть найтонші місця — скоуп ідентифікаторів, дедуплікація
 * переповнення і вставляння CTA. Помилка в будь-якому з них ламає шапку на
 * кожній сторінці сайту, а ловиться лише оком.
 */

export interface NavItem {
	/**
	 * Ключ для `{#each}`. Береться з `MenuItem.id` конфігу і скоупиться секцією:
	 * ідентифікатори унікальні всередині секції, але не глобально — у типовому
	 * меню `home` є і в headerBar, і в mobileOverlay.
	 */
	id: string;
	label: string;
	href: string;
	itemType?: 'cta';
}

export interface NavGroup {
	id: string;
	title?: string;
	titleHref?: string;
	items: NavItem[];
}

/** Синтетичні ідентифікатори груп, яких немає в конфігу. */
export const ROOT_GROUP_ID = '__root';
export const OVERFLOW_GROUP_ID = '__overflow';
export const CTA_ITEM_ID = '__cta';
export const CTA_GROUP_ID = '__cta-group';

/**
 * Доводить адресу з конфігу до придатної для `href`.
 *
 * `base`, а не `resolve()`: адресу пише адміністратор в адмінці, тож маршрут
 * не відомий на збірці й типізувати його нема як. Виняток — стара форма
 * «голий slug», яка означає статтю новин: там маршрут відомий.
 */
export function resolvedHref(href: string | undefined, linkType: string, lang = 'uk'): string {
	if (!href) return '#';
	if (linkType === 'url' || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return href;
	let path = href;
	if (linkType === 'article') {
		if (href.startsWith('/')) path = href;
		else path = resolve('/news/[id]', { id: href });
	}
	const localized = withLocale(path, (lang as Locale) || 'uk');
	return `${base}${localized}`;
}

/** Мітка потрібною мовою; порожня англійська падає назад на українську. */
function label(item: { labelUk: string; labelEn: string }, lang: string): string {
	return lang === 'uk' ? item.labelUk : item.labelEn;
}

const visibleInOrder = <T extends { visible: boolean; order: number }>(list: T[]): T[] =>
	list.filter((it) => it.visible).sort((a, b) => a.order - b.order);

function toNavItem(
	it: { id: string; labelUk: string; labelEn: string; href: string; linkType: MenuLinkType; itemType?: 'cta' },
	lang: string,
	idPrefix = ''
): NavItem {
	return {
		id: idPrefix ? `${idPrefix}/${it.id}` : it.id,
		label: label(it, lang),
		href: resolvedHref(it.href, it.linkType, lang),
		itemType: it.itemType
	};
}

/**
 * Плаский список для рядка шапки: спершу кореневі пункти, потім пункти секцій.
 *
 * Ідентифікатори пунктів із секцій скоупляться секцією: тут корінь і секції
 * зливаються в один список, і без префікса `about` з кореня та `about` із
 * секції дали б однаковий ключ — а це помилка рантайму, а не збірки.
 */
export function menuConfigToFlatItems(cfg: MenuConfig, lang: string): NavItem[] {
	return [
		...visibleInOrder(cfg.items).map((it) => toNavItem(it, lang)),
		...visibleInOrder(cfg.sections).flatMap((s) =>
			visibleInOrder(s.items).map((it) => toNavItem(it, lang, s.id))
		)
	];
}

/**
 * Групи для випадайки та мобільного меню.
 *
 * Кореневі пункти стають однією безіменною групою — їй потрібен власний
 * ідентифікатор, бо в конфігу його немає, а `{#each}` вимагає ключа.
 */
export function menuConfigToGroups(cfg: MenuConfig, lang: string): NavGroup[] {
	const groups: NavGroup[] = [];

	const rootItems = visibleInOrder(cfg.items).map((it) => toNavItem(it, lang));
	if (rootItems.length) groups.push({ id: ROOT_GROUP_ID, items: rootItems });

	for (const s of visibleInOrder(cfg.sections)) {
		groups.push({
			id: s.id,
			title: s.labelUk ? label({ labelUk: s.labelUk, labelEn: s.labelEn ?? '' }, lang) : undefined,
			titleHref: s.href ? resolvedHref(s.href, s.linkType ?? 'page', lang) : undefined,
			items: visibleInOrder(s.items).map((it) => toNavItem(it, lang))
		});
	}

	return groups;
}

/**
 * Додає групу «Ще» з пунктів, які не влізли в рядок шапки.
 *
 * Дедуплікація за `href`, а не за `id`: той самий пункт у headerBar і в
 * navDropdown має різні ідентифікатори, бо приходить із різних конфігів, —
 * і без цієї перевірки він показувався б у випадайці двічі.
 *
 * Повертає НОВИЙ масив: вхідні групи приходять із `$derived` і мутувати їх не
 * можна.
 */
export function withOverflowGroup(
	groups: NavGroup[],
	hiddenItems: NavItem[],
	moreLabel: string
): NavGroup[] {
	if (hiddenItems.length === 0) return groups;

	const known = new Set(groups.flatMap((g) => g.items.map((i) => i.href)));
	const overflow = hiddenItems.filter((item) => !known.has(item.href));
	if (overflow.length === 0) return groups;

	return [
		{ id: OVERFLOW_GROUP_ID, title: moreLabel, items: overflow },
		...groups.map((g) => ({ ...g, items: [...g.items] }))
	];
}

/**
 * Вставляє кнопку заклику першим пунктом мобільного меню.
 *
 * Якщо така адреса вже є в меню — не вставляє: інакше «Для вступу» з'являлося б
 * двічі поспіль. Коли меню порожнє, кнопка отримує власну групу.
 */
export function withCtaItem(
	groups: NavGroup[],
	cta: CtaConfig,
	ctaHref: string,
	lang: string
): NavGroup[] {
	if (!cta.visible || !ctaHref) return groups;
	if (groups.some((g) => g.items.some((it) => it.href === ctaHref))) return groups;

	const item: NavItem = {
		id: CTA_ITEM_ID,
		label: label(cta, lang),
		href: ctaHref,
		itemType: 'cta'
	};

	if (groups.length > 0 && groups[0].items.length > 0) {
		return [{ ...groups[0], items: [item, ...groups[0].items] }, ...groups.slice(1)];
	}
	return [{ id: CTA_GROUP_ID, items: [item] }, ...groups];
}


export function normalizePath(p: string): string {
	if (!p) return '/';
	const clean = p.split('?')[0].split('#')[0];
	return clean.replace(/\/+$/, '') || '/';
}

export function isPathActive(currentPath: string, itemHref: string): boolean {
	if (!itemHref || itemHref === '#' || itemHref.startsWith('http') || itemHref.startsWith('mailto:') || itemHref.startsWith('tel:')) {
		return false;
	}
	const current = normalizePath(currentPath);
	const target = normalizePath(itemHref);

	if (target === '/' || target === '/en') {
		return current === target;
	}
	return current === target || current.startsWith(`${target}/`);
}
