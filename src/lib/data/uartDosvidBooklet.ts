import type { UartCastItem, UartCreditItem } from './uartSecretsBooklet';
export { UART_BOOKLET_THEMES, type UartBookletTheme } from './uartSecretsBooklet';

export const UART_DOSVID_BOOKLET = {
	id: 'uart-dosvid-booklet' as const,
	slug: 'uart-dosvid-booklet',
	titleUk: '«Досвід»',
	titleEn: '“Experience”',
	genreUk: 'Підліткові сповіді',
	genreEn: 'Teen Confessions',
	ageBadge: '14+',
	durationUk: '70 хвилин без антракту',
	durationEn: '70 minutes, without intermission',
	durationMainUk: '70 хвилин',
	durationMainEn: '70 minutes',
	durationSubUk: 'без антракту',
	durationSubEn: 'without intermission',
	premiereUk: '21 листопада 2026 р.',
	premiereEn: 'November 21, 2026',
	premiereTime: '18:00',
	authorUk: 'авторка тексту та режисерка-постановниця\nТетяна\u00A0Ісачкіна',
	authorEn: 'author of the text and stage director\nTetiana\u00A0Isachkina',
	directorUk: 'РЕЖИСЕРКА-ПОСТАНОВНИЦЯ: ТЕТЯНА ІСАЧКІНА',
	directorEn: 'STAGE DIRECTOR: TETIANA ISACHKINA',
	synopsisUk:
		'«Досвід» — це чесна сповідь підлітків про почуття, стосунки, про біль, страхи, про що незручно запитувати і складно говорити, про те, що ваша дитина ховає від вас, бо дуже вас любить.',
	synopsisEn:
		'“Experience” is an honest confession of teenagers about feelings, relationships, pain, fears, things that are uncomfortable to ask about and difficult to talk about, things your child hides from you because they love you so much.',
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
	coverLeftImage: '/posters/dosvid-cover-left.webp',
	coverRightImage: '/posters/dosvid-cover-right.webp',
	concertUaQr: '/posters/concert-ua-qr.svg',
	ticketUrl: 'https://concert.ua/uk/event/dosvid-odesa',
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
		{ characterUk: 'Аліса', characterEn: 'Alisa', actorUk: 'Віра Васильєва', actorEn: 'Vira Vasylieva' },
		{ characterUk: 'Марта', characterEn: 'Marta', actorUk: 'Єлизавета Горецька', actorEn: 'Yelyzaveta Horetska' },
		{ characterUk: 'Діана', characterEn: 'Diana', actorUk: 'Майя Чернова', actorEn: 'Maiia Chernova' },
		{ characterUk: 'Ніка', characterEn: 'Nika', actorUk: 'Єва Шестака', actorEn: 'Yeva Shestaka' },
		{ characterUk: 'Лера', characterEn: 'Lera', actorUk: 'Марія Єнькова', actorEn: 'Mariia Yenkova' },
		{ characterUk: 'Іра', characterEn: 'Ira', actorUk: 'Євгенія Іващенко', actorEn: 'Yevheniia Ivashchenko' },
		{
			characterUk: 'Софія',
			characterEn: 'Sofiia',
			actorUk: 'Марія Орлова, Дар’я Овсянникова',
			actorEn: 'Mariia Orlova, Daria Ovsiannykova'
		},
		{ characterUk: 'Поліна', characterEn: 'Polina', actorUk: 'Алісія Лазаренко', actorEn: 'Alisiia Lazarenko' },
		{ characterUk: 'Господь', characterEn: 'The Lord', actorUk: 'Федір Ткач', actorEn: 'Fedir Tkach', slug: 'fedir-tkach' },
		{
			characterUk: 'Пацюк',
			characterEn: 'Rat',
			actorUk: 'Дем’ян Лівітчук, Артем Дейсадзе',
			actorEn: 'Demian Livitchuk, Artem Deisadze'
		}
	] satisfies UartCastItem[],
	crew: [
		{
			roleUk: 'Режисерка-постановниця, авторка тексту',
			roleEn: 'Stage Director & Author',
			namesUk: 'Тетяна\u00A0Ісачкіна',
			namesEn: 'Tetiana\u00A0Isachkina'
		},
		{ roleUk: 'Хореограф', roleEn: 'Choreographer', namesUk: 'Тетяна Стогул', namesEn: 'Tetiana Stohul' },
		{
			roleUk: 'Художнє оформлення',
			roleEn: 'Artistic Design',
			namesUk: 'Ольга Майорова',
			namesEn: 'Olha Maiorova'
		},
		{ roleUk: 'Світло', roleEn: 'Lighting', namesUk: 'Єлизавета Онойченко', namesEn: 'Yelyzaveta Onoichenko' },
		{
			roleUk: 'IT-підтримка, типографіка',
			roleEn: 'IT Support, Typography',
			namesUk: 'Алік Запольнов',
			namesEn: 'Alik Zapolnov'
		}
	] satisfies UartCreditItem[],
	teachers: [
		{
			roleUk: 'Вокал',
			roleEn: 'Vocal',
			namesUk: 'Наталія Бакіна, Ганна Подзігун',
			namesEn: 'Nataliia Bakina, Hanna Podzihun'
		},
		{
			roleUk: 'Сценмовлення',
			roleEn: 'Speech & Diction',
			namesUk: 'Тетяна Ісачкіна',
			namesEn: 'Tetiana Isachkina'
		}
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

