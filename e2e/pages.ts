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
	'/projects/galaxy-graduates': 'https://sites.google.com/view/ats-ua'
};

/** Адмінка живе за входом — E2E без облікових даних її не покриває. */
export const PUBLIC_PAGES: string[] = entries.filter(
	(p: string) => !p.startsWith('/admin') && !(p in OFFSITE_REDIRECTS)
);

if (PUBLIC_PAGES.length === 0) {
	throw new Error('prerender.entries порожній — перевірка була б мертвою');
}
