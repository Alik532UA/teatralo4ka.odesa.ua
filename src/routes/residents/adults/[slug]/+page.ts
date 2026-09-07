import { error, redirect } from '@sveltejs/kit';
import { asset } from '$app/paths';
import {
	getMasterBySlug,
	getGraduatesByMaster,
	getStudentsByMaster,
	masterProfileJson,
	masterProfilePath,
	MASTERS,
	type MasterProfile
} from '$lib/data/masters';
import { getGroupsByMaster } from '$lib/data/groups';
import { linkedGraduateId } from '$lib/data/dualRole';
import { LINKED_GRADUATES } from '$lib/data/graduates';
import { castIdsOf, loadPlayCast } from '$lib/data/playCast';
import { localeFromPath } from '$lib/i18n/routing';
import { RENAMED_MASTER_SLUGS } from '$lib/config/renamedAddresses';
import type { PageLoad, EntryGenerator } from './$types';

export const prerender = true;

/*
 * Разом із чинними — СТАРІ адреси, перейменовані. Без них стара адреса не
 * пререндериться, і людина за посиланням із мережі бачить «Сторінку не
 * знайдено» замість перенаправлення. Розбір і замір — у
 * `config/renamedAddresses.ts`.
 */
export const entries: EntryGenerator = () => {
	return [
		...MASTERS.map((m) => ({ slug: m.slug })),
		...Object.keys(RENAMED_MASTER_SLUGS).map((slug) => ({ slug }))
	];
};

export const load: PageLoad = async ({ params, fetch, url }) => {
	const renamedTo = RENAMED_MASTER_SLUGS[params.slug];
	if (renamedTo) {
		redirect(301, masterProfilePath(renamedTo, localeFromPath(url.pathname)));
	}

	const master = getMasterBySlug(params.slug);
	if (!master) {
		throw error(404, 'Master not found');
	}

	let profile: MasterProfile | null = null;
	try {
		const response = await fetch(masterProfileJson(master.slug));
		if (response.ok) {
			const json = await response.json();
			profile = {
				...json,
				photo: json.photo ? asset(json.photo) : undefined
			};
		}
	} catch {
		// Fallback to index entry if profile JSON fetch fails
	}

	const masterData = profile ? { ...master, ...profile } : master;
	const students = getStudentsByMaster(master.id);

	/*
	 * `graduates` — лише записи ВИПУСКНИКІВ, і фільтр тут не косметика: серед
	 * `students` тепер бувають колеги-майстри, які самі вчилися в цього майстра, а
	 * в переліку випускників їх немає. Доти рядок був `students.map((s) => s.graduate)`
	 * і на такому записі дав би `undefined` у масиві.
	 */
	const graduates = getGraduatesByMaster(master.id);

	/*
	 * Той самий працівник у реєстрі випускників — для кнопки «сторінка
	 * випускника». `null` у більшості: таких людей одинадцять зі 141; рівень
	 * `direct` зв'язок обрізає (`dualRole`), `linked` — ні.
	 *
	 * Пошук по `LINKED_GRADUATES`, а не по повному JSON: цей масив уже без рівня
	 * `direct`, тож кнопка не може повести на запис, якого не показують.
	 */
	const alsoGraduateKey = linkedGraduateId(master.id);
	const alsoGraduate = alsoGraduateKey
		? (LINKED_GRADUATES.find((g) => g.id === alsoGraduateKey) ?? null)
		: null;

	/*
	 * Опис для прев'ю — ТУТ, а не в `<svelte:head>`: у `og:description` доходить
	 * лише `seoDescription`. Розбір — у докблоці `config/seoDetail.ts`.
	 *
	 * `roleTitle` — це вже готовий людський текст із реєстру («завідувачка
	 * театральним відділенням, викладачка…»), тож слів звідкись брати не треба.
	 * Немає його в 41 із 147 записів — тоді лишається саме ім'я, і це чесніше за
	 * вигадану посаду.
	 */
	const seoDescription = masterData.roleTitle
		? `${masterData.displayName} — ${masterData.roleTitle}`
		: masterData.displayName;

	return {
		master: masterData,
		seoDescription,
		/*
		 * Ключі людей на кожен показ — звідси, а не імпортом зрізу в компонент.
		 * Зріз лежить у `static/galaxy/play-cast.json`: розбір і замір у докблоці
		 * `data/playCast.ts`. Тут потрібні лише ключі — ряди облич під виставами
		 * майстра; ролі й уривки читає сторінка самого показу.
		 */
		castIds: castIdsOf(await loadPlayCast(fetch)),
		students,
		graduates,
		alsoGraduate,
		// Групи виводяться з `GROUPS`, а не з реєстру майстрів: див. докблок
		// `getGroupsByMaster`. Порожній масив — майстер груп не веде, і секція
		// на сторінці просто не з'явиться.
		groups: getGroupsByMaster(master.id)
	};
};
