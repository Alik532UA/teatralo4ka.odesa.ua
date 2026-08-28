import type { Pathname } from '$app/types';

export interface GroupPlay {
	year: number;
	text: string;
}

export interface GroupMaster {
	id: string;
	name: string;
	department?: string | null;
}

export interface GraduateGroup {
	slug: string;
	name: string;
	abbr: string | null;
	nameEn?: string;
	masters: GroupMaster[];
	graduationYears: number[];
	memberSlugs: string[];
	plays: GroupPlay[];
	bio?: string[];
	photo?: string;
}

export const GROUPS: readonly GraduateGroup[] = [
	{
		slug: 'zakhysnyky-teatralnykh-kulis',
		name: 'Захисники театральних куліс',
		abbr: 'ЗТК',
		nameEn: 'Defenders of Theatre Wings',
		photo: '/groups/zakhysnyky-teatralnykh-kulis.webp',
		masters: [
			{
				id: 'tetiana-isachkina',
				name: 'Ісачкіна Тетяна Валеріївна',
				department: 'theatre'
			}
		],
		graduationYears: [2012, 2014],
		memberSlugs: [
			'alik-zapolnov',
			'volodymyr-chalchynskyi',
			'anastasiia-kozova',
			'oleksandr-chehlatonev',
			'anastasiia-chalchynska',
			'krystyna-manchenko'
		],
		plays: [
			{
				year: 2012,
				text: '«Чайка», одноактовки'
			},
			{
				year: 2011,
				text: '«Мнимый больной»'
			},
			{
				year: 2010,
				text: '«Маленький принц»'
			},
			{
				year: 2009,
				text: '«Вперед Котенок»'
			},
			{
				year: 2008,
				text: '«Кощеевы страсти»'
			},
			{
				year: 2007,
				text: '«Дядюшка Кролик против дядюшки Ягуара»'
			}
		]
	}
];

/** Знаходить групу за slug */
export function getGroupBySlug(slug: string): GraduateGroup | undefined {
	return GROUPS.find((g) => g.slug === slug);
}

/** Знаходить групу за назвою або абревіатурою */
export function getGroupByTitleOrAbbr(query: string): GraduateGroup | undefined {
	const clean = query.trim().toLowerCase();
	return GROUPS.find(
		(g) =>
			g.name.toLowerCase() === clean ||
			(g.abbr && g.abbr.toLowerCase() === clean) ||
			(g.nameEn && g.nameEn.toLowerCase() === clean)
	);
}

/** Знаходить групу за slug випускника */
export function getGroupByMember(memberSlug: string): GraduateGroup | undefined {
	return GROUPS.find((g) => g.memberSlugs.includes(memberSlug));
}

/** Шлях до сторінки групи */
export function groupProfilePath(slug: string): Pathname {
	return `/projects/galaxy-graduates/groups/${slug}` as Pathname;
}
