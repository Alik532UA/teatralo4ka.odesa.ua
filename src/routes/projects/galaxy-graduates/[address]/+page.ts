import { error } from '@sveltejs/kit';
import { localeFromPath } from '$lib/i18n/routing';
import {
	GRADUATES,
	WITH_PAGE,
	graduateAddress,
	graduateProfileJson,
	hasProfile,
	type GraduateIndexEntry,
	type GraduateProfile
} from '$lib/data/graduates';
import { getMasterById } from '$lib/data/masters';

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
	return WITH_PAGE.map((graduate) => ({ address: graduateAddress(graduate) }));
}

export async function load({ params, fetch, url }) {
	const graduate = GRADUATES.find((candidate) => graduateAddress(candidate) === params.address);
	if (!graduate) error(404, `Немає випускника за адресою ${params.address}`);

	/*
	 * Подробиці є не в кожного — у 437 із 530 файла профілю немає взагалі, і це
	 * НЕ помилка. Сторінка їм однаково належить: ім'я, рік випуску, відділення,
	 * а часто ще група, майстер курсу й вистави приходять із реєстру.
	 *
	 * Питаємо ознаку, а не пробуємо прочитати: 437 відповідей 404 замість
	 * подробиць — це не «немає даних», а зайвий запит і шум у журналі збірки.
	 */
	let profile: GraduateProfile | null = null;
	if (hasProfile(graduate)) {
		// `fetch` саме той, що дає SvelteKit: під час prerender він читає файл із
		// `static/` без мережі й вкладає відповідь у дані сторінки, тож у браузері
		// зайвого запиту немає. Звичайний `import` тут був би гіршим — він утягнув би
		// всі 96 КБ профілів у бандл кожної сторінки.
		const response = await fetch(graduateProfileJson(params.address));
		if (!response.ok) error(404, `Профіль ${params.address} не читається (${response.status})`);
		profile = await response.json();
	}

	return { graduate, profile, seoDescription: describe(graduate, profile, url.pathname) };
}

/**
 * Опис сторінки для `<meta name="description">` — його бере `+layout.svelte`.
 *
 * Складається з РЕЄСТРУ, а подробиці лише додають: без профілю опис однаково
 * мусить бути, інакше 437 сторінок пішли б у пошук з описом сайту замість опису
 * людини. Ім'я, рік випуску й майстри курсу є в реєстрі — цього досить, щоб
 * людину знайшли за іменем.
 */
function describe(
	graduate: GraduateIndexEntry,
	profile: GraduateProfile | null,
	pathname: string
): string {
	const words = SEO[localeFromPath(pathname)] ?? SEO.uk;
	/*
	 * Імена майстрів дістаються з РЕЄСТРУ: у записах зв'язку лежить самий `id`, і
	 * без цього опис сторінки читався б «Майстри курсу: nadiia-rybakova,
	 * fedir-tkach» — саме так він і виглядав у першій версії.
	 *
	 * Реєстр майстрів уже в бандлі цієї сторінки: його тягне `GraduateProfileView`,
	 * щоб показати ті самі імена на екрані. Тож тут це не зайва вага, а той самий
	 * модуль.
	 */
	const rawMasters = profile?.masters ?? graduate.masters ?? [];
	const masterNames = rawMasters.map((m) => {
		/* У записі зв'язку `id` може бути й порожнім — тоді лишається лише те, що
		   там написано словами. */
		const запис = typeof m === 'string' ? { id: m, name: m } : m;
		const знайдений = запис.id ? getMasterById(запис.id) : undefined;
		return знайдений?.displayName ?? запис.name ?? запис.id ?? '';
	}).filter(Boolean);
	const year = profile?.graduationYear ?? graduate.graduationYear;
	const plays = profile?.plays.length ?? 0;
	return [
		year ? `${graduate.name}, ${words.graduated} ${year}` : graduate.name,
		masterNames.length > 0 ? `${words.masters}: ${masterNames.join(', ')}` : '',
		plays > 0 ? words.plays(plays) : ''
	]
		.filter(Boolean)
		.join('. ');
}
