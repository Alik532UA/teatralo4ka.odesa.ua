import { error } from '@sveltejs/kit';
import { localeFromPath } from '$lib/i18n/routing';
import {
	GRADUATES,
	WITH_PAGE,
	graduateProfileJson,
	type GraduateProfile
} from '$lib/data/graduates';

/**
 * Власна сторінка випускника — і власна адреса.
 *
 * Адреса повторює стару дослівно: `sites.google.com/view/ats-ua/GG/2015/15K`
 * ставало `/projects/galaxy-graduates/15K`. Це не косметика — випускники роками
 * роздавали ці посилання, і код сторінки для них ідентифікатор, а не деталь
 * реалізації.
 *
 * `entries()` тут, а не в `prerender.entries` у `svelte.config.js`: перелік
 * виводиться з даних, а не дублюється руками вісімдесятьма рядками. Заодно це
 * означає, що нова анкета з'явиться в збірці сама, щойно потрапить в індекс.
 */
export const prerender = true;

/**
 * Шаблон опису для пошуку — тут, а не у словниках i18n.
 *
 * `load` виконується ДО того, як з'явиться компонент, тож стор `svelte-i18n` тут
 * недосяжний, а тягнути обидва словники в бандл цієї сторінки заради двох слів
 * дорожче за саме дублювання. Опис збирається з даних: ім'я, рік випуску,
 * майстри курсу й кількість вистав — тобто те, за чим людину справді шукають.
 */
const SEO: Record<string, { graduated: string; masters: string; plays: (n: number) => string }> = {
	uk: {
		graduated: 'випуск',
		masters: 'Майстри курсу',
		plays: (n) => `${n} вистав і ролей на сторінці`
	},
	en: {
		graduated: 'graduated',
		masters: 'Course masters',
		plays: (n) => `${n} plays and roles listed`
	}
};

export function entries() {
	return WITH_PAGE.map((graduate) => ({ code: graduate.code as string }));
}

export async function load({ params, fetch, url }) {
	const graduate = GRADUATES.find((candidate) => candidate.code === params.code);
	if (!graduate) error(404, `Немає випускника з кодом сторінки ${params.code}`);

	// `fetch` саме той, що дає SvelteKit: під час prerender він читає файл із
	// `static/` без мережі й вкладає відповідь у дані сторінки, тож у браузері
	// зайвого запиту немає. Звичайний `import` тут був би гіршим — він утягнув би
	// всі 96 КБ профілів у бандл кожної сторінки.
	const response = await fetch(graduateProfileJson(params.code));
	if (!response.ok) error(404, `Профіль ${params.code} не читається (${response.status})`);

	const profile: GraduateProfile = await response.json();
	return { graduate, profile, seoDescription: describe(graduate.name, profile, url.pathname) };
}

/** Опис сторінки для `<meta name="description">` — його бере `+layout.svelte`. */
function describe(name: string, profile: GraduateProfile, pathname: string): string {
	const words = SEO[localeFromPath(pathname)] ?? SEO.uk;
	const masterNames = profile.masters.map((m) => (typeof m === 'string' ? m : m.name));
	return [
		profile.graduationYear ? `${name}, ${words.graduated} ${profile.graduationYear}` : name,
		masterNames.length > 0 ? `${words.masters}: ${masterNames.join(', ')}` : '',
		profile.plays.length > 0 ? words.plays(profile.plays.length) : ''
	]
		.filter(Boolean)
		.join('. ');
}
