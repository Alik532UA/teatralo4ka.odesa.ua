export type PosterId = 'dance-studio' | 'anniversary-28';

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

export const POSTERS_LIST: PosterMeta[] = [
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
}

export const DEFAULT_POSTER_THEME = 'yellow-brand';

export const POSTER_THEMES: readonly PosterTheme[] = [
	{
		id: 'yellow-brand',
		nameUk: 'Фірмовий жовтий',
		nameEn: 'Brand Yellow',
		color: '#ffed00'
	},
	{
		id: 'yellow-sun',
		nameUk: 'Тепле сонце',
		nameEn: 'Warm Sun',
		color: '#ffd600'
	},
	{
		id: 'paper-white',
		nameUk: 'Білий аркуш',
		nameEn: 'Paper White',
		color: '#ffffff'
	},
	{
		id: 'warm-cream',
		nameUk: 'Ніжний крем',
		nameEn: 'Soft Cream',
		color: '#fffbeb'
	},
	{
		id: 'mint-fresh',
		nameUk: 'Мʼятний',
		nameEn: 'Fresh Mint',
		color: '#ecfdf5'
	},
	{
		id: 'sky-light',
		nameUk: 'Небесний',
		nameEn: 'Light Sky',
		color: '#cfe2f3'
	},
	{
		id: 'theatre-gold',
		nameUk: 'Золота охра',
		nameEn: 'Theatre Gold',
		color: '#fef08a'
	},
	{
		id: 'peach-blush',
		nameUk: 'Персиковий',
		nameEn: 'Peach',
		color: '#ffedd5'
	}
];

