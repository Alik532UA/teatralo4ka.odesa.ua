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
	/**
	 * Знімки групи для банера. Список, а не один рядок: банер їх перегортає, і
	 * кожен відкривається на весь екран. Немає поля — банера просто немає.
	 */
	photos?: string[];
}

export const GROUPS: readonly GraduateGroup[] = [
	{
		slug: 'zakhysnyky-teatralnykh-kulis',
		name: 'Захисники театральних куліс',
		abbr: 'ЗТК',
		nameEn: 'Defenders of Theatre Wings',
		photos: [
			'/groups/zakhysnyky-teatralnykh-kulis.webp',
			'/groups/zakhysnyky-teatralnykh-kulis-2.webp',
			'/groups/zakhysnyky-teatralnykh-kulis-3.webp'
		],
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
	},
	{
		/*
		 * Склад і репертуар зібрані з анкет самих випускниць — у них у полі
		 * `group` стоїть «Скоморохи». Нічого не вигадано: кожна вистава нижче
		 * названа щонайменше в одній анкеті.
		 *
		 * РІК ВИСТАВИ — НАЙРАНІШИЙ З НАЗВАНИХ. Анкети подекуди розходяться на
		 * рік («Детский садик» у Вішталюк 2010, в Індічанської 2011), і замість
		 * вибору навмання діє одне правило: прем'єра там, де рік менший, а
		 * пізніші згадки — це повтори або зсув у пам'яті.
		 *
		 * ШЕСТИ ВИСТАВ ТУТ НЕМАЄ, бо року не назвав НІХТО: «Осминожки»,
		 * «Дом, который построил Джек», «Доктор Айболит», «Синяя птица»,
		 * «Медведь», «Китайский Новый год». Усі шість — в анкетах сестер
		 * Діденко. Щойно роки з'являться, їх можна просто дописати сюди.
		 *
		 * Фотографій групи немає — тому й немає поля `photos`, а банер на
		 * сторінці просто не з'явиться.
		 */
		slug: 'skomorokhy',
		name: 'Скоморохи',
		abbr: null,
		nameEn: 'Skomorokhy',
		masters: [
			{
				id: 'tetiana-isachkina',
				name: 'Ісачкіна Тетяна Валеріївна',
				department: 'theatre'
			}
		],
		teachers: [
			{ id: 'samuil-imas', name: 'Імас Самуїл Михайлович', subject: 'Риторика та поетика' },
			{ id: 'mykola-baldin', name: 'Балдін Микола Олександрович', subject: 'Сценічний рух' }
		],
		/*
		 * Рік ГРУПИ, а не перелік років її людей.
		 *
		 * Тут стояло [2009, 2012, 2013] — усі роки, які трапилися серед
		 * учасників, — і сторінка писала «випуск: 2009, 2012, 2013», ніби курс
		 * випускався тричі. Насправді курс випустився 2012-го, а різні роки в
		 * людей означають, що хтось перейшов до іншої групи раніше, а хтось
		 * пізніше. Їхні власні роки лишаються як є — вони правильні.
		 */
		graduationYears: [2012],
		memberSlugs: [
			'dariia-didenko',
			'ihor-rozvodiuk',
			'oleksandra-indichanska-morozova',
			'maryna-vishtaliuk-sukhanova',
			// 2026-08-29: в анкеті стояло «Скоморошки» — пестлива форма, яку
			// автор підтвердив як ту саму групу. Виправлено й в анкеті, і в
			// індексі: доти назва нікуди не вела, бо `getGroupByTitleOrAbbr`
			// такої групи не знаходив.
			'mariia-mykhailova-didenko',
			// Дописані за списком автора. Група в їхніх записах не стояла
			// взагалі — старий сайт її для них не зберіг, — тож зв'язок
			// прописано в обидва боки: сюди й у `group` кожного запису.
			'dmytro-rozumenko',
			'mykhailo-priadko',
			'stanyslav-stepanov',
			'illia-tryfonov',
			'olena-beluhina',
			'vanessa-serbul'
		],
		plays: [
			{ year: 2004, text: '«Чиполлино»' },
			{ year: 2005, text: '«Гном Вася»' },
			{ year: 2005, text: '«Цветик-семицветик»' },
			{ year: 2006, text: '«Времена года»' },
			{ year: 2006, text: '«Сказка о попе и его работнике Балде»' },
			{ year: 2007, text: '«Чёрная курица, или Подземные жители»' },
			{ year: 2008, text: '«Cat’s» («Кошки»)' },
			{ year: 2009, text: '«Вечер с ангелами»' },
			{ year: 2009, text: '«Звуки музыки»' },
			{ year: 2010, text: '«Детский садик»' },
			{ year: 2010, text: '«Мнимый больной»' },
			{ year: 2012, text: '«Юбилей»' }
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

/**
 * Групи, які веде (або вела) майстриня чи майстер курсу.
 *
 * Зв'язок виводиться з самих груп, а не дублюється в реєстрі майстрів: доти
 * сторінка викладача про свої курси не знала взагалі, і єдиний спосіб дійти до
 * групи був через випускника. Тримати той самий зв'язок у двох місцях означало
 * б, що додана група мовчки не з'явиться на сторінці майстра.
 */
export function getGroupsByMaster(masterId: string): GraduateGroup[] {
	return GROUPS.filter((group) => group.masters.some((master) => master.id === masterId));
}

/** Шлях до сторінки групи */
export function groupProfilePath(slug: string): Pathname {
	return `/projects/galaxy-graduates/groups/${slug}` as Pathname;
}
