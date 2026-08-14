/**
 * Список публічних сторінок для E2E.
 *
 * Береться зі `svelte.config.js` — з того самого `prerender.entries`, який
 * будує сайт, а не переписується руками. Список, скопійований у тест, розходиться
 * з реальністю на першій же новій сторінці, і тест тихо перестає її покривати.
 */
import config from '../svelte.config.js';

const entries = config.kit?.prerender?.entries ?? [];

/**
 * Сторінки, які самі відправляють користувача на чужий сайт (meta refresh).
 *
 * Їх не можна перевіряти нарівні з рештою: браузер піде за перенаправленням, і
 * далі всі перевірки — заголовки, canonical, дублікати testid, axe — стосуються
 * вже не нашої розмітки. Спершу вони мовчки «проходили», перевіряючи Google
 * Sites; це саме той випадок, коли зелений тест нічого не означає.
 *
 * Ключ — шлях, значення — куди він веде. Перенаправлення перевіряється окремо
 * (`redirects.spec.ts`), а вміст призначення нас не стосується.
 */
export const OFFSITE_REDIRECTS: Record<string, string> = {
	'/projects/galaxy-graduates': 'https://sites.google.com/view/ats-ua',
	// Мовне дзеркало веде туди само: сторінка-призначення існує лише українською.
	// Без цього рядка axe пішов за перенаправленням і перевіряв Google Sites —
	// 757 порушень чужої розмітки. Рівно те, що вже сталося з українською
	// версією і що описано вище; мовні адреси просто дали другий примірник.
	'/en/projects/galaxy-graduates': 'https://sites.google.com/view/ats-ua'
};

/**
 * Перенаправлення ВСЕРЕДИНІ сайту — той самий `meta refresh`, лише на власний шлях.
 *
 * Виявлено разом із мовними адресами, хоч проблема стара: ці сторінки лежали в
 * загальному переліку, браузер ішов за перенаправленням, і перевірки «сторінка
 * не порожня» та axe стосувалися вже `/projects/teatr-pro`. Тобто дві сторінки
 * перевірялися двічі, а самі `fest-*` — жодного разу. Зелено було, змісту не було.
 *
 * Значення — фрагмент адреси призначення. Відносний шлях у `meta` різний для
 * кореня (`../`) і для `/en/` (`../../`), тож зіставляється хвіст.
 */
export const INTERNAL_REDIRECTS: Record<string, string> = Object.fromEntries(
	['/fest-odesa-teatr-pro', '/fest-odessa-teatr-pro'].flatMap((p) => [
		[p, 'projects/teatr-pro'],
		[`/en${p}`, 'projects/teatr-pro']
	])
);

/** Усі сторінки-перенаправлення разом — їх перевіряє `redirects.spec.ts`. */
export const REDIRECT_PAGES: Record<string, string> = {
	...OFFSITE_REDIRECTS,
	...INTERNAL_REDIRECTS
};

/** Адмінка живе за входом — E2E без облікових даних її не покриває. */
export const PUBLIC_PAGES: string[] = entries.filter(
	(p: string) => !p.startsWith('/admin') && !(p in REDIRECT_PAGES)
);

if (PUBLIC_PAGES.length === 0) {
	throw new Error('prerender.entries порожній — перевірка була б мертвою');
}
