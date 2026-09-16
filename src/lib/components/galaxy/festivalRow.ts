import { Users, Theater } from 'lucide-svelte';
import type { Festival } from '$lib/data/festivals';
import { festivalPath, latestYear, showsCountryName } from '$lib/data/festivals';
import { localizedPath } from '$lib/i18n/routing';
import type { GalaxyRow } from './galaxyRow';

/**
 * Переклад запису фестивалю в рядок переліку — ОДИН на всі сторінки.
 *
 * Сторінок дві: повний перелік поїздок і загальна сторінка Театр.PRO, де
 * стоять лише випуски власного фестивалю. Рядок у них мусить бути тим самим —
 * автор попросив саме це, — і дві копії тридцяти рядків розійшлися б від
 * першої ж правки однієї з них: у переліку з'явився б підпис, якого немає в
 * Театр.PRO, і читач побачив би два різні списки того самого.
 *
 * Тут немає ані пошуку, ані сортування, ані вибору режиму: це переклад форми,
 * а не сторінка. Порядок і відбір лишаються тому, хто кличе — переліку
 * потрібне сортування за роком і назвою, Театр.PRO вистачає року.
 */
export interface FestivalRowOptions {
	/** Англійська сторінка бере `nameEn`, коли він є. */
	isEn: boolean;
	lang: 'uk' | 'en';
	/** Словник сторінки: назви країн знає вона, а не рядок. */
	t: (key: string) => string;
}

/** Роки списком: поїздка буває дворічною, і тоді в рядку стоять обидва. */
const yearsOf = (years: readonly number[]) => [...years].sort((x, y) => x - y).join(', ');

export function festivalRow(f: Festival, { isEn, lang, t }: FestivalRowOptions): GalaxyRow {
	return {
		key: f.slug,
		href: localizedPath(festivalPath(f.slug), lang),
		year: latestYear(f),
		yearLabel: yearsOf(f.years),
		title: isEn && f.nameEn ? f.nameEn : f.name,
		badge: f.note,
		/*
		 * Лише місто: назва країни в рядку не пишеться, щоб не дублювати прапор праворуч.
		 * У режимі «Плитка» назва країни залишається поряд із прапором.
		 */
		subtitle: f.city,
		memberIds: f.memberIds,
		flags: f.countries.map((c) => ({
			code: c,
			/* Без підпису для тих самих країн: `title` малює браузер при
			   наведенні, тобто це той самий текст, якого просили не писати. */
			label: showsCountryName(c) ? t(`galaxy.country.${c}`) : undefined
		})),
		marks: [
			...(f.memberIds.length ? [{ icon: Users, text: String(f.memberIds.length) }] : []),
			...(f.playIds.length ? [{ icon: Theater, text: String(f.playIds.length) }] : [])
		]
	};
}
