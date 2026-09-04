import { resolve } from '$app/paths';

/**
 * Які markdown-сторінки шукаються і на який маршрут ведуть.
 *
 * Перелік ЯВНИЙ і не виводиться з імен файлів, бо відповідність не механічна:
 * `music.md` живе за адресою `/departments/music/`, а `residents-adults.md` —
 * за `/residents/adults/`. Вгадати це з назви файлу неможливо.
 *
 * Адреса — ВІДКЛАДЕНИЙ виклик `resolve()` із літералом, а не готовий рядок.
 * Літерал потрібен, бо перевантаження `resolve()` визначені по кожному маршруту
 * окремо й union їм передати не можна; саме так неіснуючий маршрут або інший
 * регістр не збереться — той клас помилок, через який
 * `/projects/spring-Odesa-theatre` колись доїхало до продакшну.
 *
 * А відкладений — бо на рівні модуля `resolve()` виконався б РАЗ, і під prerender
 * забрав би відносний `base` тієї сторінки, яка імпортувала файл першою.
 *
 * Повнота перевіряється тестом: кожен файл у `i18n/pages/uk` мусить бути або
 * тут, або в `PAGES_WITHOUT_ROUTE` із причиною. Інакше сторінка існує, а
 * знайти її не можна — і дізнатися про це нема як.
 */
export const SEARCHABLE_PAGES: { slug: string; href: () => string }[] = [
	{ slug: 'about', href: () => resolve('/about') },
	{ slug: 'admission', href: () => resolve('/admission') },
	{ slug: 'contacts', href: () => resolve('/contacts') },
	{ slug: 'documents', href: () => resolve('/documents') },
	{ slug: 'statute', href: () => resolve('/documents/statute') },
	{ slug: 'history', href: () => resolve('/history') },
	{ slug: 'aesthetic', href: () => resolve('/departments/aesthetic') },
	{ slug: 'art', href: () => resolve('/departments/art') },
	{ slug: 'music', href: () => resolve('/departments/music') },
	{ slug: 'theatre', href: () => resolve('/departments/theatre') },
	{ slug: 'festival', href: () => resolve('/projects/festival') },
	{ slug: 'galaxy-graduates', href: () => resolve('/projects/galaxy-graduates') },
	{ slug: 'photo-archive', href: () => resolve('/projects/photo-archive') },
	{ slug: 'spring-odesa-theatre', href: () => resolve('/projects/spring-odesa-theatre') },
	{ slug: 'support-production', href: () => resolve('/projects/support-production') },
	{ slug: 'teatr-pro', href: () => resolve('/projects/teatr-pro') },
	{ slug: 'residents-adults', href: () => resolve('/residents/adults') },
	{ slug: 'residents-graduates', href: () => resolve('/residents/graduates') },
	{ slug: 'residents-kids', href: () => resolve('/residents/kids') },
	/*
	 * Новина з коду — єдиний тут запис із ПАРАМЕТРОМ у маршруті.
	 *
	 * Саме заради цього рядка новина й лежить у репозиторії: те, що написано в
	 * базі, у пошук по сайту не потрапляє взагалі (`searchIndex.ts` — сторінки
	 * вже в бандлі, статті ні). Чернетка при цьому шукається так само, як
	 * шукається чернетка `festival.md`: приховує сторінку `archived`, а не
	 * `draft`.
	 */
	{ slug: 'news-30-y-sezon-i-17-studentiv-2026', href: () => resolve('/news/[id]', { id: '30-y-sezon-i-17-studentiv-2026' }) }
];

/**
 * Сторінки, які свідомо НЕ шукаються, із причиною.
 *
 * Це не борг, а рішення: файл існує, але вести на нього нема куди.
 */
export const PAGES_WITHOUT_ROUTE: Record<string, string> = {};
