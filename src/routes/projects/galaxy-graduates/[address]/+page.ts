import { error, redirect } from '@sveltejs/kit';
import { localeFromPath, localizedPath } from '$lib/i18n/routing';
import {
	WITH_PAGE,
	findByAddress,
	graduateAddress,
	completeProfile,
	graduateProfileJson,
	graduateProfilePath,
	hasProfile,
	type GraduateIndexEntry,
	type GraduateProfile
} from '$lib/data/graduates';
import { getMasterById } from '$lib/data/masters';
import { GRADUATE_ALIASES, RENAMED_GRADUATE_ADDRESSES } from '$lib/config/renamedAddresses';
import { masterGender } from '$lib/utils/masterLabel';

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
const SEO: Record<
	string,
	{
		graduated: string;
		masterOne: string;
		masterOneF: string;
		masters: string;
		/**
		 * Опис сторінки УЧНЯ. Без роду («учень/учениця»): стать за іменем не
		 * вгадують, а помилитися в описі, який іде в пошук і в прев'ю
		 * месенджера, — гірше, ніж написати нейтрально.
		 */
		studying: string;
	}
> = {
	uk: {
		studying: 'навчається в Одеській театральній школі. Планета творчості',
		graduated: 'випуск',
		masterOne: 'Майстер курсу',
		masterOneF: 'Майстриня курсу',
		masters: 'Майстри курсу'
	},
	en: {
		studying: 'studying at the Odesa Theatre School. Planet of Creativity',
		graduated: 'graduated',
		masterOne: 'Course master',
		masterOneF: 'Course master',
		masters: 'Course masters'
	}
};

/*
 * Разом із чинними — СТАРІ адреси, перейменовані. Адреса випускника це
 * ідентифікатор, який людина роздавала роками, тож без цього рядка стара
 * адреса показувала б «Сторінку не знайдено» — тобто «людину видалили».
 * Розбір і замір — у `config/renamedAddresses.ts`.
 */
export function entries() {
	return [
		...WITH_PAGE.map((graduate) => ({ address: graduateAddress(graduate) })),
		...Object.keys(RENAMED_GRADUATE_ADDRESSES).map((address) => ({ address })),
		...Object.keys(GRADUATE_ALIASES).map((address) => ({ address }))
	];
}

export async function load({ params, fetch, url }) {
	/*
	 * Перейменування й аліас поводяться однаково, а означають різне: перше — що
	 * адреса БУЛА іншою, друге — що стандартної адреси в людини немає взагалі
	 * (її сторінка живе на особистій, як `Alik` чи `margotcine`). Розбір — у
	 * `config/renamedAddresses.ts`.
	 */
	const renamedTo = RENAMED_GRADUATE_ADDRESSES[params.address] ?? GRADUATE_ALIASES[params.address];
	if (renamedTo) {
		redirect(301, localizedPath(graduateProfilePath(renamedTo), localeFromPath(url.pathname)));
	}

	const graduate = findByAddress(params.address);
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
		// Через `completeProfile`, а не напряму: файл правлять руками, і поля, яких
		// у ньому немає, не мусять валити збірку — розбір у самій функції.
		profile = completeProfile(await response.json());
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
	 * УЧЕНЬ описується інакше, і це не косметика.
	 *
	 * Опис збирається з року випуску й майстрів курсу — у того, хто вчиться
	 * зараз, немає ні першого, ні других. Заміряно на зібраній сторінці Родоміри
	 * Долбишевої: `<meta name="description">` дорівнював самому імені, тобто
	 * сторінка йшла в пошук без жодного слова про те, хто це.
	 */
	if (graduate.kind === 'student') {
		return `${graduate.name} — ${words.studying}.`;
	}
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
	/* Записи реєстру — саме з них правило бере рід (по батькові, прізвище, посада). */
	const masterKeys = rawMasters
		.map((m) => (typeof m === 'string' ? m : m.id))
		.map((id) => (id ? getMasterById(id) : undefined))
		.filter((m) => m !== undefined);
	const masterNames = rawMasters.map((m) => {
		/* У записі зв'язку `id` може бути й порожнім — тоді лишається лише те, що
		   там написано словами. */
		const запис = typeof m === 'string' ? { id: m, name: m } : m;
		const знайдений = запис.id ? getMasterById(запис.id) : undefined;
		return знайдений?.displayName ?? запис.name ?? запис.id ?? '';
	}).filter(Boolean);
	const year = profile?.graduationYear ?? graduate.graduationYear;

	/*
	 * Кількості вистав тут НЕМАЄ, і це не спрощення.
	 *
	 * Той самий рядок іде в `description`, `og:description` і
	 * `twitter:description`, а соцмережі кешують прев'ю надовго. Число ж береться
	 * з `profile.plays.length` — саме з того поля, яке росте: сайт сам кличе
	 * «Заповнити анкету». Заміряно: одного дня воно змінилося приблизно для 110
	 * людей, і сам лічильник з'явився на 175 сторінках замість 93.
	 *
	 * Тобто опис у кеші був би неправильним більшу частину часу, поки його
	 * читають, а просити кожного випускника скидати кеш соцмережі — не робота.
	 * Пошукової користі число теж не давало: людину шукають за іменем.
	 *
	 * Заодно з ним зникла граматика «1 вистав і ролей» — так читалися 29
	 * сторінок, і ще 36 казали «2 вистав» замість «2 вистави».
	 */
	const label =
		masterKeys.length === 1
			? masterGender(masterKeys[0]) === 'f'
				? words.masterOneF
				: words.masterOne
			: words.masters;

	return [
		year ? `${graduate.name}, ${words.graduated} ${year}` : graduate.name,
		masterNames.length > 0 ? `${label}: ${masterNames.join(', ')}` : ''
	]
		.filter(Boolean)
		.join('. ');
}
