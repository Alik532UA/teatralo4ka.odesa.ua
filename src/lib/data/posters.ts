export type PosterId = 'dance-studio' | 'defenders-hearts' | 'anniversary-28' | 'posviata-invitation' | 'galaxy-award-podiakova' | 'uart-secrets-booklet';

export interface ScheduleItem {
	dayUk: string;
	dayEn: string;
	time: string;
}

export interface TeacherInfo {
	nameUk: string;
	nameEn: string;
	roleUk: string;
	roleEn: string;
	photo: string;
	profileSlug: string;
	subjectsUk: string[];
	subjectsEn: string[];
}

export interface PosterMeta {
	id: PosterId;
	slug: string;
	titleUk: string;
	titleEn: string;
	subtitleUk: string;
	subtitleEn: string;
	dateBadgeUk?: string;
	dateBadgeEn?: string;
}

export interface PosterEventItem {
	dateUk: string;
	dateEn: string;
	time: string;
	roomUk?: string;
	roomEn?: string;
	dayUk: string;
	dayEn: string;
}

export const POSTERS_LIST: PosterMeta[] = [
	{
		id: 'uart-secrets-booklet',
		slug: 'uart-secrets-booklet',
		titleUk: '«Дуже багато SEкретів» (Буклет A4)',
		titleEn: '“Too Many Secrets” (A4 Booklet)',
		subtitleUk: 'Навчальний театр «UArt» · Буклет-програмка (згин навпіл)',
		subtitleEn: 'UArt Educational Theatre · Program Booklet (half-fold)',
		dateBadgeUk: '7 листопада · Прем’єра',
		dateBadgeEn: 'Nov 7 · Premiere'
	},
	{
		id: 'defenders-hearts',
		slug: 'defenders-hearts',
		titleUk: 'Серця, які не втратили здатність любити',
		titleEn: 'Hearts That Kept the Ability to Love',
		subtitleUk: 'До Дня захисників · вірші Ірини Фотуйми',
		subtitleEn: 'Day of Defenders · Poems by Iryna Fotuyma',
		dateBadgeUk: '14 та 17 жовтня',
		dateBadgeEn: 'Oct 14 & 17'
	},
	{
		id: 'galaxy-award-podiakova',
		slug: 'galaxy-award-podiakova',
		titleUk: 'Відзнака «Першовідкривачка Планети Творчості»',
		titleEn: 'Award “Pioneer of the Galaxy of Graduates”',
		subtitleUk: 'Софія ПОДЬЯКОВА · Перша анкета · A4',
		subtitleEn: 'Sofiia PODIAKOVA · First Questionnaire · A4',
		dateBadgeUk: 'Спеціальна відзнака',
		dateBadgeEn: 'Special Award'
	},
	{
		id: 'posviata-invitation',
		slug: 'posviata-invitation',
		titleUk: 'Посвята у Мистецтво (Запрошення)',
		titleEn: 'Initiation into Art (Invitations)',
		subtitleUk: 'A4 горизонтально · 6 карток на аркуш',
		subtitleEn: 'A4 Landscape · 6 cards per sheet',
		dateBadgeUk: '24 жовтня',
		dateBadgeEn: 'Oct 24'
	},
	{
		id: 'dance-studio',
		slug: 'dance-studio',
		titleUk: 'Набір у танцювальний колектив',
		titleEn: 'Dance Studio Enrollment',
		subtitleUk: 'Тетяна СТОГУЛ · 6 клас',
		subtitleEn: 'Tetiana STOHUL · Room 6',
		dateBadgeUk: 'Набір 2026–2027',
		dateBadgeEn: 'Enrollment 2026–2027'
	},
	{
		id: 'anniversary-28',
		slug: 'anniversary-28',
		titleUk: '28-річчя «Театрало4ки»',
		titleEn: '28th Anniversary of Teatralo4ka',
		subtitleUk: 'Святкові заходи (референс)',
		subtitleEn: 'Festive Events (Reference)',
		dateBadgeUk: '29–30 листопада',
		dateBadgeEn: 'Nov 29–30'
	}
];

export interface PosterGroup {
	id: string;
	titleUk: string;
	titleEn: string;
	ids: PosterId[];
}

export const POSTER_GROUPS: PosterGroup[] = [
	{
		id: '2026-2027',
		titleUk: '2026–2027',
		titleEn: '2026–2027',
		ids: ['uart-secrets-booklet', 'dance-studio', 'defenders-hearts', 'galaxy-award-podiakova']
	},
	{
		id: '2024-2025',
		titleUk: '2024–2025',
		titleEn: '2024–2025',
		ids: ['anniversary-28']
	},
	{
		id: 'posviata-invitation',
		titleUk: 'Запрошення на Посвяту',
		titleEn: 'Initiation Invitations',
		ids: ['posviata-invitation']
	}
];

export const DEFENDERS_HEARTS_POSTER = {
	id: 'defenders-hearts',
	occasionUk: 'До Дня захисників та захисниць України',
	occasionEn: 'Dedicated to the Day of Defenders of Ukraine',
	genreUk: 'Поетична композиція',
	genreEn: 'Poetic Composition',
	authorUk: 'За віршами Ірини Фотуйми',
	authorEn: 'Based on poems by Iryna Fotuyma',
	titleUk: 'Серця, які не втратили здатність любити',
	titleEn: 'Hearts That Kept the Ability to Love',
	heroImage: '/posters/defenders-hearts-art.webp',
	events: [
		{ dateUk: '14 жовтня', dateEn: 'October 14', time: '17:00', roomUk: '17 ауд.', roomEn: 'Classroom 17', dayUk: 'Середа', dayEn: 'Wednesday' },
		{ dateUk: '17 жовтня', dateEn: 'October 17', time: '12:50', roomUk: '17 ауд.', roomEn: 'Classroom 17', dayUk: 'Субота', dayEn: 'Saturday' }
	] satisfies PosterEventItem[],
	location: {
		institutionUk: 'Одеська театральна школа',
		institutionEn: 'Odesa Theatre School',
		addressUk: 'вул. Софіївська, 24',
		addressEn: '24 Sofiivska St.',
		detailsUk: 'Приміщення Одеської театральної школи (вул. Софіївська, 24)',
		detailsEn: 'Odesa Theatre School premises (24 Sofiivska St.)'
	},
	quoteUk: '«Любов сильніша за війну, бо вона оберігає серця й дарує життя»',
	quoteEn: '“Love is stronger than war, because it protects hearts and gives life”',
	schoolUk: 'Одеська театральна школа · Сезон 2026–2027',
	schoolEn: 'Odesa Theatre School · Season 2026–2027'
};

export const DANCE_STUDIO_POSTER = {
	id: 'dance-studio',
	headlineUk: 'НАБІР ДІТЕЙ',
	headlineEn: 'CHILDREN ENROLLMENT',
	subheadlineUk: 'в танцювальний колектив',
	subheadlineEn: 'to the Dance Collective',
	announcementUk: 'Афіша оголошень Одеської театральної школи',
	announcementEn: 'Odesa Theatre School Official Announcement',
	targetAudienceUk: 'Запрошуємо хлопчиків та дівчаток до хореографічної студії',
	targetAudienceEn: 'Inviting boys and girls to the choreography studio',
	teacher: {
		nameUk: 'Тетяна СТОГУЛ',
		nameEn: 'Tetiana STOHUL',
		roleUk: 'викладачка хореографії першої категорії',
		roleEn: 'First Category Choreography Teacher',
		photo: '/masters/portraits/tetiana-stohul.webp',
		profileSlug: 'tetiana-stohul',
		subjectsUk: [
			'Класичний та сучасний танець',
			'Сценічний рух і пластична виразність',
			'Концертні виступи та вистави школи'
		],
		subjectsEn: [
			'Classical & Contemporary Dance',
			'Stage Movement & Plastic Expression',
			'Concert Performances & School Plays'
		]
	} satisfies TeacherInfo,
	schedule: [
		{ dayUk: 'Понеділок', dayEn: 'Monday', time: '18:40' },
		{ dayUk: 'Четвер', dayEn: 'Thursday', time: '18:40' },
		{ dayUk: 'Субота', dayEn: 'Saturday', time: '15:30' }
	] satisfies ScheduleItem[],
	location: {
		roomUk: 'Записуватись у 6 класі',
		roomEn: 'Sign up in Classroom 6',
		buildingUk: 'Приміщення Одеської театральної школи',
		buildingEn: 'Odesa Theatre School premises',
		addressUk: 'вул. Софіївська, 24',
		addressEn: '24 Sofiivska St.',
		detailsUk: 'Приміщення Одеської театральної школи (вул. Софіївська, 24)',
		detailsEn: 'Odesa Theatre School premises (24 Sofiivska St.)'
	},
	quoteUk: 'Інтелект - штучний, а Мистецтво - вічне! Конфуцій 😜',
	quoteEn: 'Intelligence is artificial, but Art is eternal! Confucius 😜',
	schoolUk: 'Одеська театральна школа · Сезон 2026–2027',
	schoolEn: 'Odesa Theatre School · Season 2026–2027'
};

export interface PosterTheme {
	id: string;
	nameUk: string;
	nameEn: string;
	color: string;
	bgImage?: string;
	forPosters?: readonly PosterId[];
}

export const DEFAULT_POSTER_THEME = 'yellow-brand';
export const DEFAULT_DEFENDERS_THEME = 'defenders-sky';
export const DEFAULT_GALAXY_AWARD_THEME = 'galaxy-space';
export const DEFAULT_UART_BOOKLET_THEME = 'uart-dark';

export const POSTER_THEMES: readonly PosterTheme[] = [
	{ id: 'uart-dark', nameUk: 'Темний театральний (Оригінал)', nameEn: 'Theatrical Dark (Original)', color: '#161217', forPosters: ['uart-secrets-booklet'] },
	{ id: 'uart-light', nameUk: 'Білий ощадний (Економний друк)', nameEn: 'Ink-saver White (Economic Print)', color: '#ffffff', forPosters: ['uart-secrets-booklet'] },
	{ id: 'galaxy-space', nameUk: 'Космічна ніч (Глибокий космос)', nameEn: 'Deep Space (Cosmic Night)', color: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0c122c 45%, #030712 100%)', forPosters: ['galaxy-award-podiakova'] },
	{ id: 'galaxy-print-light', nameUk: 'Білий пергамент (Ощадний друк)', nameEn: 'White Parchment (Ink-saver Print)', color: '#ffffff', forPosters: ['galaxy-award-podiakova'] },
	{ id: 'galaxy-gold', nameUk: 'Золота Галактика', nameEn: 'Golden Galaxy', color: 'radial-gradient(circle at 50% 20%, #2e2107 0%, #171103 50%, #070501 100%)', forPosters: ['galaxy-award-podiakova'] },
	{ id: 'defenders-sky', nameUk: 'Синьо-жовте небо (Захід сонця)', nameEn: 'Blue & Yellow Sky (Sunset)', color: 'linear-gradient(180deg, #162a45 40%, #f59e0b 60%)', bgImage: '/posters/defenders-hearts-sky-bg.webp', forPosters: ['defenders-hearts'] },
	{ id: 'defenders-art', nameUk: 'Художній арт (Захисники та діти)', nameEn: 'Artistic Canvas (Defenders & Children)', color: 'linear-gradient(180deg, #00b5ec 50%, #ffd600 50%)', bgImage: '/posters/defenders-hearts-bg.webp', forPosters: ['defenders-hearts'] },
	{ id: 'yellow-brand', nameUk: 'Фірмовий жовтий', nameEn: 'Brand Yellow', color: '#ffed00' },
	{ id: 'yellow-sun', nameUk: 'Тепле сонце', nameEn: 'Warm Sun', color: '#ffd600' },
	{ id: 'paper-white', nameUk: 'Білий аркуш', nameEn: 'Paper White', color: '#ffffff' },
	{ id: 'warm-cream', nameUk: 'Ніжний крем', nameEn: 'Soft Cream', color: '#fffbeb' },
	{ id: 'mint-fresh', nameUk: 'Мʼятний', nameEn: 'Fresh Mint', color: '#ecfdf5' },
	{ id: 'sky-light', nameUk: 'Небесний', nameEn: 'Light Sky', color: '#cfe2f3' },
	{ id: 'theatre-gold', nameUk: 'Золота охра', nameEn: 'Theatre Gold', color: '#fef08a' },
	{ id: 'peach-blush', nameUk: 'Персиковий', nameEn: 'Peach', color: '#ffedd5' }
];

