import { GRADUATES, STUDENTS, graduateAddress, graduateProfilePath } from '$lib/data/graduates';
import { PLAYS, playPath } from '$lib/data/plays';
import { GROUPS, groupProfilePath } from '$lib/data/groups';
import { FESTIVALS, festivalPath } from '$lib/data/festivals';
import { INSTITUTIONS, institutionPath } from '$lib/data/institutions';
import { THEATRES, theatrePath } from '$lib/data/theatres';
import type { SearchEntry } from '$lib/utils/siteSearch';

/**
 * Галактика в пошуку по сайту: люди, вистави, курси, фестивалі, заклади, театри.
 *
 * ## Навіщо окремий модуль, а не рядки в `searchIndex`
 *
 * Не заради порядку, а заради ваги. `SearchOverlay` імпортується шапкою, тобто
 * лежить у критичному шляху КОЖНОЇ сторінки; реєстри ж великі — самі лише
 * випускники важать близько 150 КБ сирого JSON, вистави ще більше. Якби ці
 * імпорти стояли в `searchIndex`, вони приїжджали б до кожного відвідувача
 * головної, який пошуку й не відкривав.
 *
 * Тому модуль підвантажується `import()`-ом у мить, коли накладку відкрили —
 * тим самим прийомом, яким сторінка галактики вантажить вікно оголошення. Поки
 * реєстри їдуть, пошук уже працює по сторінках і новинах.
 *
 * ## Кого сюди НЕ беремо
 *
 * `GRADUATES` — це рівень `listed`, тобто ті, кого показують у переліках. Хто
 * навмисно прихований (рівень `linked`/`direct`, як Володимир Захарченко),
 * у пошук не потрапляє: сторінка в людини лишається, але знайти її можна лише
 * прямим посиланням — саме цього й просили.
 *
 * Учні додаються окремим переліком (`STUDENTS`): у `GRADUATES` їх немає за
 * визначенням, а шукати їх треба — на «Планеті творчості» вони вже стоять.
 *
 * Сторінки статистики й бета-чеклиста в реєстрах не живуть узагалі, тож
 * виключати їх нема де: вони й далі поза пошуком.
 */

/** Рік, майстри й відділення в одному рядку — те, за чим людину шукають. */
function людина(
	запис: { name: string; graduationYear: number | null; kind?: string; code?: string; slug: string },
	підпис: string
): SearchEntry {
	const рік = запис.graduationYear ? `${підпис} ${запис.graduationYear}` : підпис;
	return {
		id: `person:${запис.slug}`,
		title: запис.name,
		href: `${graduateProfilePath(graduateAddress(запис))}/`,
		kind: 'galaxy',
		text: `${запис.name} ${рік}`
	};
}

export function galaxyEntries(): SearchEntry[] {
	const out: SearchEntry[] = [];

	for (const g of GRADUATES) out.push(людина(g, 'випуск'));
	for (const s of STUDENTS) out.push(людина(s, 'учень школи, навчається'));

	for (const p of PLAYS) {
		out.push({
			id: `play:${p.id}`,
			title: p.title,
			href: `${playPath(p.id)}/`,
			kind: 'galaxy',
			/* Автор і курс тут не прикраса: виставу шукають і за п'єсою, і за
			   курсом, який її грав. */
			text: [p.title, p.year, p.author, p.theatreGroup, p.theatreGroupAlt].filter(Boolean).join(' ')
		});
	}

	for (const g of GROUPS) {
		out.push({
			id: `group:${g.slug}`,
			title: g.name,
			href: `${groupProfilePath(g.slug)}/`,
			kind: 'galaxy',
			text: [g.name, g.abbr, ...(g.graduationYears ?? [])].filter(Boolean).join(' ')
		});
	}

	for (const f of FESTIVALS) {
		out.push({
			id: `festival:${f.slug}`,
			title: f.name,
			href: `${festivalPath(f.slug)}/`,
			kind: 'galaxy',
			text: [f.name, f.nameEn, f.city].filter(Boolean).join(' ')
		});
	}

	for (const i of INSTITUTIONS) {
		out.push({
			id: `institution:${i.slug}`,
			title: i.name,
			href: `${institutionPath(i.slug)}/`,
			kind: 'galaxy',
			text: [i.name, i.fullName, i.city].filter(Boolean).join(' ')
		});
	}

	for (const t of THEATRES) {
		out.push({
			id: `theatre:${t.slug}`,
			title: t.name,
			href: `${theatrePath(t.slug)}/`,
			kind: 'galaxy',
			text: [t.name, t.city].filter(Boolean).join(' ')
		});
	}

	return out;
}
