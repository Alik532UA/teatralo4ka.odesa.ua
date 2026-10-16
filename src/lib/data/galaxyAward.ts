export interface AwardPlayItem {
	titleUk: string;
	titleEn: string;
	roleUk?: string;
	roleEn?: string;
	year: number;
}

export interface GalaxyAwardData {
	id: string;
	personNameUk: string;
	personNameEn: string;
	certificateNumber: string;
	dateUk: string;
	dateEn: string;
	cityUk: string;
	cityEn: string;
	roleUk: string;
	roleEn: string;
	masterUk: string;
	masterEn: string;
	titleUk: string;
	titleEn: string;
	badgeUk: string;
	badgeEn: string;
	citationLeadUk: string;
	citationLeadEn: string;
	citationBodyUk: string;
	citationBodyEn: string;
	photo: string;
	qrCode: string;
	pageUrl: string;
	plays: AwardPlayItem[];
	mottoUk: string;
	mottoEn: string;
}

export const SOFIIA_PODIAKOVA_AWARD: GalaxyAwardData = {
	id: 'galaxy-award-podiakova',
	personNameUk: 'Софія ПОДЬЯКОВА',
	personNameEn: 'Sofiia PODIAKOVA',
	certificateNumber: '№ 001',
	dateUk: 'Жовтень 2026 року',
	dateEn: 'October 2026',
	cityUk: 'м. Одеса',
	cityEn: 'Odesa',
	roleUk: 'Учениця театрального відділення · вступ 2023 р.',
	roleEn: 'Theatre Department Student · Enrolled 2023',
	masterUk: 'Майстерня Федора Ткача',
	masterEn: 'Workshop of Fedir Tkach',
	titleUk: 'СИМВОЛІЧНА ВІДЗНАКА',
	titleEn: 'HONORARY AWARD',
	badgeUk: 'ПЕРШОВІДКРИВАЧКА ПЛАНЕТИ ТВОРЧОСТІ',
	badgeEn: 'PIONEER OF THE GALAXY OF GRADUATES',
	citationLeadUk:
		'Вручається за сміливість зробити перший крок у безмежний простір шкільного всесвіту, відкритість серця та історичний внесок у відкриття проєкту «Планета Творчості».',
	citationLeadEn:
		'Awarded for the courage to take the very first step into the boundless space of the school universe, open heart, and the historic contribution to launching the Galaxy of Graduates project.',
	citationBodyUk:
		'Перша учениця Одеської дитячої театральної школи, чия персональна зірка засяяла в офіційному цифровому літописі нашої великої шкільної родини.',
	citationBodyEn:
		'The first student of Odesa Children’s Theatre School whose personal star shone in the official digital chronicle of our big school family.',
	photo: '/graduates/sofiia-podiakova-480.webp',
	qrCode: '/qr/sofiia-podiakova-galaxy-qr.svg',
	pageUrl: 'teatralo4ka.odesa.ua/projects/galaxy-graduates/sofiia-podiakova/',
	plays: [
		{
			titleUk: '«Чарівник Країни ОЗ»',
			titleEn: '“The Wizard of Oz”',
			roleUk: 'тітонька Ем, Жвакун-3, Лелека, Вартовий',
			roleEn: 'Aunt Em, Munchkin-3, Stork, Guardian',
			year: 2025
		},
		{
			titleUk: '«Дуже багато SEкретів»',
			titleEn: '“So Many SEcrets”',
			roleUk: 'роль: Ніна',
			roleEn: 'Role: Nina',
			year: 2026
		},
		{
			titleUk: '«Думки вголос»',
			titleEn: '“Thinking Aloud”',
			year: 2025
		},
		{
			titleUk: '«Я пішов на війну»',
			titleEn: '“I Went to War”',
			year: 2024
		},
		{
			titleUk: 'Показ етюдів',
			titleEn: 'Etude Showcase',
			year: 2024
		}
	],
	mottoUk: '«Мистецтво — це шлях до зірок»',
	mottoEn: '“Art is the Path to the Stars”'
};

export interface AwardThemeOption {
	id: string;
	nameUk: string;
	nameEn: string;
	color: string;
}

export const GALAXY_AWARD_THEMES: AwardThemeOption[] = [
	{
		id: 'galaxy-space',
		nameUk: 'Космічна ніч (Глибокий космос)',
		nameEn: 'Deep Space (Cosmic Night)',
		color: 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0c122c 45%, #030712 100%)'
	},
	{
		id: 'galaxy-print-light',
		nameUk: 'Білий пергамент (Ощадний друк)',
		nameEn: 'White Parchment (Ink-saver Print)',
		color: '#ffffff'
	},
	{
		id: 'galaxy-gold',
		nameUk: 'Золота Галактика (Сяйво зірок)',
		nameEn: 'Golden Galaxy (Starlight Glow)',
		color: 'radial-gradient(circle at 50% 20%, #2e2107 0%, #171103 50%, #070501 100%)'
	}
];
