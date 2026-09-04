import { redirect } from '@sveltejs/kit';
import { localeFromPath, localizedPath } from '$lib/i18n/routing';
import { loadPageWithMetadata } from '$lib/i18n/loader';
import { CODE_NEWS, codeNewsById } from '$lib/config/codeNews';
import { RENAMED_NEWS_IDS } from '$lib/config/newsAliases';

/**
 * Новина приходить із ДВОХ джерел, і маршрут у них один.
 *
 * ## Чому `prerender = true`, хоч новини з бази пререндерити нема як
 *
 * Доти тут стояло `prerender = false`, і сторінка новини не збиралася НІКОЛИ:
 * заміряно в `build/` — є лише `news/index.html`, жодної `news/<id>/`. Адреси з
 * бази й далі віддає `fallback: '404.html'`, а клієнтський роутер добирає вміст
 * із Firestore; це та сама механіка, якою живуть перейменовані адреси вистав.
 *
 * Новина з коду цього не потребує й не має потребувати: її текст лежить у
 * репозиторії, тож сторінку можна скласти на збірці — з мета-тегами, з описом
 * для прев'ю і з вмістом у HTML для того, хто читає без JavaScript. `entries()`
 * називає рівно ці адреси, тому пререндер бере їх і не чіпає решту.
 *
 * ## Чому вміст добирається ТУТ, а не в розмітці
 *
 * `og:description` доходить лише з `page.data.seoDescription` — розбір у
 * докблоці `config/seoDetail.ts`. `<svelte:head>` у самій сторінці до `og:` не
 * дістає, тобто прев'ю новини в соцмережах узяло б опис головної сторінки.
 */
export const prerender = true;

/*
 * Разом із новими адресами — СТАРІ, перейменовані. Без них стара адреса не
 * пререндериться, і той, хто розкриває посилання в соцмережі, побачив би
 * сторінку 404 замість перенаправлення. Розбір — у `config/newsAliases.ts`.
 */
export function entries() {
	return [
		...CODE_NEWS.map((item) => ({ id: item.id })),
		...Object.keys(RENAMED_NEWS_IDS).map((id) => ({ id }))
	];
}

export function load({ params, url }) {
	const перейменовано = RENAMED_NEWS_IDS[params.id];
	if (перейменовано) {
		redirect(
			301,
			localizedPath(`/news/${перейменовано}`, localeFromPath(url.pathname))
		);
	}

	const код = codeNewsById(params.id);
	if (!код) {
		/*
		 * Новина з бази: вміст добере клієнт. Повертаємо `null`, а не кидаємо
		 * 404 — на цьому маршруті `id` із Firestore цілком законний, і рішення
		 * «немає такої» ухвалює `DetailPage` після запиту.
		 */
		return { code: null, photos: [], uk: null, en: null, seoDescription: undefined, seoTitle: undefined };
	}

	const uk = loadPageWithMetadata('uk', код.slug);
	const en = loadPageWithMetadata('en', код.slug);

	/*
	 * Назва й опис — З МОВИ АДРЕСИ, а не завжди українські.
	 *
	 * Заміряно на першій же збірці: `build/en/news/2026-09-04/index.html` мав
	 * англійський бренд у `<title>`, але українську назву новини й український
	 * `og:description`. Причина в тому, що мовний префікс тут робить хук
	 * `reroute`, тобто `params` про мову не знає нічого — знає лише шлях, і саме
	 * так її читають сусідні сторінки-подробиці (`plays/[id]`, `detailWords`).
	 */
	const своя = localeFromPath(url.pathname) === 'en' ? (en ?? uk) : uk;

	return {
		code: код,
		photos: код.photos,
		uk,
		en,
		seoDescription: своя?.metadata.seo.description,
		seoTitle: своя?.metadata.title
	};
}
