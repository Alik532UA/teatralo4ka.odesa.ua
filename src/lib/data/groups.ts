import type { Pathname } from '$app/types';

export interface GroupPlay {
	year: number;
	text: string;
	/**
	 * Запис вистави. Саме ПОСИЛАННЯ, а не голий ідентифікатор: розбирає його
	 * `parseVideoUrl` — той самий, що й для новин, — і він же вирішує, чи можна
	 * показати плеєр на сторінці. Тримати тут `id` означало б зашити «це
	 * YouTube» у дані й повторити розбір, який уже написаний і перевірений.
	 */
	videoUrl?: string;
}

export interface GroupMaster {
	id: string;
	name: string;
	department?: string | null;
}

export interface GroupTeacher {
	id: string;
	name: string;
	/** Предмет — те, чим викладач відрізняється від майстра курсу на картці. */
	subject: string;
}

export interface GraduateGroup {
	slug: string;
	name: string;
	abbr: string | null;
	nameEn?: string;
	masters: GroupMaster[];
	/** Викладачі курсу. Немає поля — група їх не має, секція просто не з'явиться. */
	teachers?: GroupTeacher[];
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
		teachers: [
			{ id: 'samuil-imas', name: 'Імас Самуїл Михайлович', subject: 'Риторика та поетика' },
			{ id: 'mykola-baldin', name: 'Балдін Микола Олександрович', subject: 'Сценічний рух' },
			{ id: 'iryna-ovcharenko', name: 'Овчаренко Ірина Григоріївна', subject: 'Вокал' },
			{ id: 'olena-konnikova', name: 'Коннікова Олена Костянтинівна', subject: 'Історія театру' },
			{ id: 'iryna-yershova', name: 'Єршова Ірина', subject: 'Хореографія' },
			{
				id: 'iryna-ulianenko',
				name: 'Ульяненко Ірина Андріївна',
				subject: 'Індивідуальна сценічна мова'
			},
			{
				id: 'vira-yemtsova-datsiuk',
				name: 'Ємцова-Дацюк Віра Вікторівна',
				subject: 'Індивідуальна сценічна мова'
			}
		],
		graduationYears: [2012],
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
				text: '«Чайка», одноактовки',
				videoUrl: 'https://www.youtube.com/watch?v=FGwjAn3NqJQ'
			},
			{
				year: 2011,
				text: '«Мнимый больной»',
				videoUrl: 'https://www.youtube.com/watch?v=CP56qEi4sWY'
			},
			{
				year: 2010,
				text: '«Маленький принц»',
				videoUrl: 'https://www.youtube.com/watch?v=UTLPVBLLJYs'
			},
			{
				year: 2009,
				text: '«Вперед Котенок»',
				videoUrl: 'https://www.youtube.com/watch?v=Sbes3lG9HOc'
			},
			{
				year: 2008,
				text: '«Кощеевы страсти»',
				videoUrl: 'https://www.youtube.com/watch?v=L1S6Z-bGUMU'
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
