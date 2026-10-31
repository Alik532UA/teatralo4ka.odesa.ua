export interface UartCastItem {
	characterUk: string;
	characterEn: string;
	actorUk: string;
	actorEn: string;
	slug?: string;
}

export interface UartCreditItem {
	roleUk: string;
	roleEn: string;
	namesUk: string;
	namesEn: string;
}

export interface UartBookletTheme {
	id: string;
	nameUk: string;
	nameEn: string;
	bg: string;
	text: string;
	muted: string;
	accent: string;
	gold: string;
	border: string;
	sheet2Bg: string;
	sheet2Text: string;
	sheet2Muted: string;
	sheet2Accent: string;
	sheet2Border: string;
}

export const UART_BOOKLET_THEMES: readonly UartBookletTheme[] = [
	{
		id: 'uart-dark',
		nameUk: 'Темний театральний (Оригінал)',
		nameEn: 'Theatrical Dark (Original)',
		bg: '#161217',
		text: '#ffffff',
		muted: '#cbd5e1',
		accent: '#ffed00',
		gold: '#ffd600',
		border: 'rgba(255, 237, 0, 0.25)',
		sheet2Bg: '#161217',
		sheet2Text: '#ffffff',
		sheet2Muted: '#cbd5e1',
		sheet2Accent: '#ffed00',
		sheet2Border: 'rgba(255, 237, 0, 0.2)'
	},
	{
		id: 'uart-light',
		nameUk: 'Білий ощадний (Економний друк)',
		nameEn: 'Ink-saver White (Economic Print)',
		bg: '#161217',
		text: '#ffffff',
		muted: '#cbd5e1',
		accent: '#ffed00',
		gold: '#ffd600',
		border: 'rgba(255, 255, 255, 0.2)',
		sheet2Bg: '#ffffff',
		sheet2Text: '#111827',
		sheet2Muted: '#475569',
		sheet2Accent: '#0f172a',
		sheet2Border: 'rgba(0, 0, 0, 0.12)'
	}
];

export const UART_SECRETS_BOOKLET = {
	id: 'uart-secrets-booklet' as const,
	slug: 'uart-secrets-booklet',
	titleUk: '«Дуже багато SEкретів»',
	titleEn: '“Too Many Secrets”',
	ageBadge: '14+',
	durationUk: '80 хвилин',
	durationEn: '80 minutes',
	premiereUk: '7 листопада 2026 р.',
	premiereEn: 'November 7, 2026',
	authorUk: 'за п’єсою Ніни Захоженко та співавторок «Статеве виховання»',
	authorEn: 'Based on the play by Nina Zakhozhenko and co-authors “Sex Education”',
	directorUk: 'РЕЖИСЕР-ПОСТАНОВНИК: ФЕДІР ТКАЧ',
	directorEn: 'STAGE DIRECTOR: FEDIR TKACH',
	artisticDirectorUk: 'Художній керівник навчального театру «UArt» — Федір Ткач',
	artisticDirectorEn: 'Artistic Director of UArt Educational Theatre — Fedir Tkach',
	theatreUk: 'Навчальний театр «UArt»',
	theatreEn: 'Educational Theatre “UArt”',
	presentersUk: [
		'Департамент культури, туризму та охорони культурної спадщини\nОдеської міської ради',
		'Громадська організація «PRO.ТЕАТР»',
		'Одеська театральна школа',
		'Навчальний театр «UArt»'
	],
	presentersEn: [
		'Department of Culture, Tourism and Cultural Heritage Protection\nof Odesa City Council',
		'NGO “PRO.THEATRE”',
		'Odesa Theatre School',
		'Educational Theatre “UArt”'
	],
	coverLeftImage: '/posters/stateve-vykhovannia-cover-left.webp',
	coverRightImage: '/posters/stateve-vykhovannia-cover-right.webp',
	logos: [
		{
			id: 'uart',
			src: '/posters/uart-logo-dark.webp',
			altUk: 'Навчальний театр «UArt»',
			altEn: 'Educational Theatre UArt'
		},
		{
			id: 'school',
			src: '/posters/teatralo4ka-crest-dark.svg',
			altUk: 'Одеська театральна школа',
			altEn: 'Odesa Theatre School'
		},
		{
			id: 'pro-teatr',
			src: '/posters/pro-teatr-logo-dark.webp',
			altUk: 'ГО «PRO.ТЕАТР»',
			altEn: 'NGO PRO.THEATRE'
		}
	],
	cast: [
		{ characterUk: 'Настя', characterEn: 'Nastya', actorUk: 'Катерина Тютюнник', actorEn: 'Kateryna Tiutiunnyk' },
		{ characterUk: 'Ліза', characterEn: 'Liza', actorUk: 'Анастасія Загородна', actorEn: 'Anastasiia Zahorodna' },
		{ characterUk: 'Аліна', characterEn: 'Alina', actorUk: 'Кіра Любинська', actorEn: 'Kira Liubynska' },
		{ characterUk: 'Іванка', characterEn: 'Ivanka', actorUk: 'Поліна Койчева', actorEn: 'Polina Koicheva' },
		{ characterUk: 'Ніна', characterEn: 'Nina', actorUk: 'Софія Подьякова', actorEn: 'Sofiia Podiakova', slug: 'sofiia-podiakova' },
		{ characterUk: 'Яна', characterEn: 'Yana', actorUk: 'Маргарита Ковтун', actorEn: 'Marharyta Kovtun' },
		{ characterUk: 'Віра', characterEn: 'Vira', actorUk: 'Крістіна Садоєва', actorEn: 'Kristina Sadoieva' },
		{ characterUk: 'Олюня', characterEn: 'Oliunia', actorUk: 'Тетяна Чупровська', actorEn: 'Tetiana Chuprovska' },
		{
			characterUk: 'Вчителька, Макс, батько,\nхлопець, мама, лікар',
			characterEn: 'Teacher, Max, father,\nboyfriend, mother, doctor',
			actorUk: 'Павло Примак',
			actorEn: 'Pavlo Prymak',
			slug: 'pavlo-prymak'
		}
	] satisfies UartCastItem[],
	crew: [
		{ roleUk: 'Режисери', roleEn: 'Directors', namesUk: 'Федір Ткач, Павло Примак', namesEn: 'Fedir Tkach, Pavlo Prymak' },
		{ roleUk: 'Хореограф', roleEn: 'Choreographer', namesUk: 'Тетяна Стогул', namesEn: 'Tetiana Stohul' },
		{
			roleUk: 'Художнє оформлення',
			roleEn: 'Stage Design & Art',
			namesUk: 'Ольга Майорова,\nОлександр Шалашний, Наталія Литвинова',
			namesEn: 'Olha Maiorova,\nOleksandr Shalashnyi, Nataliia Lytvynova'
		},
		{ roleUk: 'Звук', roleEn: 'Sound', namesUk: 'Валентин Пінчук', namesEn: 'Valentyn Pinchuk' },
		{ roleUk: 'Світло', roleEn: 'Lighting', namesUk: 'Єлизавета Онойченко', namesEn: 'Yelyzaveta Onoichenko' },
		{
			roleUk: 'Відео, робота з AI',
			roleEn: 'Video & AI',
			namesUk: 'Ганна Комадовська',
			namesEn: 'Hanna Komadovska'
		},
		{
			roleUk: 'IT-підтримка, типографіка',
			roleEn: 'IT Support & Typography',
			namesUk: 'Алік Запольнов',
			namesEn: 'Alik Zapolnov'
		},
		{ roleUk: 'Афіша', roleEn: 'Poster & Graphic Design', namesUk: 'Анастасія Загородна', namesEn: 'Anastasiia Zahorodna' }
	] satisfies UartCreditItem[],
	teachers: [
		{ roleUk: 'Вокал', roleEn: 'Vocal', namesUk: 'Наталія Бакіна, Ганна Подзігун', namesEn: 'Nataliia Bakina, Hanna Podzihun' },
		{ roleUk: 'Сценрух', roleEn: 'Stage Movement', namesUk: 'Павло Примак', namesEn: 'Pavlo Prymak' },
		{ roleUk: 'Сценмовлення', roleEn: 'Speech & Diction', namesUk: 'Тетяна Ісачкіна, Ірина Тільняк', namesEn: 'Tetiana Isachkina, Iryna Tilniak' }
	] satisfies UartCreditItem[],
	administrationNamesUk: 'Олена Ткач, Оксана Панченко, Наталія Шалашна',
	administrationNamesEn: 'Olena Tkach, Oksana Panchenko, Nataliia Shalashna',
	administration: [
		{
			roleUk: 'Адміністрація',
			roleEn: 'Administration',
			namesUk: 'Олена Ткач, Оксана Панченко, Наталія Шалашна',
			namesEn: 'Olena Tkach, Oksana Panchenko, Nataliia Shalashna'
		}
	] satisfies UartCreditItem[]
};

