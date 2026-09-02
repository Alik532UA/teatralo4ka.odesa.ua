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
import { localeFromPath } from '$lib/i18n/routing';
import type { PageLoad, EntryGenerator } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return MASTERS.map((m) => ({ slug: m.slug }));
};

/**
 * Старий slug → новий. Перейменування адреси людини, а не помилка даних.
 *
 * ## Чому тут, а не окремим маршрутом-заглушкою, як `fest-odessa-teatr-pro`
 *
 * Прецедент із `fest-*` виглядав придатним, але він тримається на трьох речах,
 * яких у сторінки майстра немає, і кожна перевірена, а не припущена:
 *
 *  1. **Заглушку не можна просто пререндерити.** `scripts/generate-sitemap.ts`
 *     збирає sitemap ОБХОДОМ `build/` (`builtPages`), а `checkNoEmptyPages`
 *     валить збірку на будь-якій сторінці з `meta refresh`. Тобто пререндерена
 *     заглушка обов'язково мусить бути в реєстрі `config/redirects.ts` — інакше
 *     `npm run build` червоніє.
 *  2. **Реєстр вимагає МОВНЕ ДЗЕРКАЛО, якого в майстрів не буває.**
 *     `REDIRECT_PAGES` виводить `/en/…` для кожного запису, а `e2e/redirects.spec.ts`
 *     чекає на кожній адресі 200. Англійських сторінок майстрів у `build/` лише
 *     **29 зі 118** (вони з'являються обходом посилань, а не з `entries()`), і
 *     `/en/residents/adults/romanko` не існувало НІКОЛИ. Тобто запис у реєстрі
 *     створив би обіцянку, якої цей маршрут не виконує.
 *  3. **`target` у реєстрі — «хвіст шляху», і для сусіда він не працює.**
 *     `resolve()` віддає ВІДНОСНІ адреси, тож перехід між сусідніми сторінками
 *     дає `../andrii-romanko/`, у якому хвоста `residents/adults/andrii-romanko`
 *     немає, і `expect(meta).toContain(target)` не спрацював би.
 *
 * Тому редирект живе тут: стара адреса НЕ пререндериться (її немає в `entries()`),
 * а віддає її `fallback: '404.html'` — той самий шлях, яким у цьому проєкті
 * працюють `/news/[id]` і `/projects/[slug]`. Клієнтський роутер виконує цей
 * `load`, бачить старий slug і веде на новий. Ціна відома й прийнята: у статиці
 * стара адреса лишається кодом 404, тобто краулер без JS редиректу не побачить.
 * Повний варіант із `meta refresh` вимагає ще й `PUBLIC_ENTRIES`,
 * `config/redirects.ts` і заявки маршруту у вкладці `betaChecklist` — це рішення
 * про інфраструктуру, а не про дані однієї людини.
 *
 * Мовний префікс зберігається: `/en/residents/adults/romanko` веде на
 * `/en/residents/adults/andrii-romanko`.
 */
const RENAMED_SLUGS: Record<string, string> = {
	// 2026-08-24: запис був без імені («Романко»), автор дав «Романко Андрій»,
	// і slug приведено до конвенції `ім'я-прізвище`. Стара адреса була в
	// sitemap.xml, тож просто зникнути вона не може.
	romanko: 'andrii-romanko',
	// 2026-08-24: slug був на ініціалі, хоч імʼя лежало в тому самому записі
	// («Надія РИБАКОВА», `fullName` «Рибакова Надія В.») — вигадувати не
	// довелося нічого. Разом зі slug перейменований і `id`: на нього вказують
	// ТРИ випускники (`masters[].id` у `graduates.index.json` і в профілях
	// `17M`, `20M`, `20M_1`), і без цього вона втратила б усіх трьох учнів —
	// сторінка лишилася б цілою, просто порожньою.
	'n-rybakova': 'nadiia-rybakova'
};

export const load: PageLoad = async ({ params, fetch, url }) => {
	const renamedTo = RENAMED_SLUGS[params.slug];
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

	return {
		master: masterData,
		students,
		graduates,
		alsoGraduate,
		// Групи виводяться з `GROUPS`, а не з реєстру майстрів: див. докблок
		// `getGroupsByMaster`. Порожній масив — майстер груп не веде, і секція
		// на сторінці просто не з'явиться.
		groups: getGroupsByMaster(master.id)
	};
};
