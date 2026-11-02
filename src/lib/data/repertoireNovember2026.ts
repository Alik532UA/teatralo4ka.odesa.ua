export interface RepertoireEvent {
	id: string;
	dateDay: string;
	dateMonthUk: string;
	dateMonthEn: string;
	dayOfWeekUk: string;
	dayOfWeekEn: string;
	dayOfWeekFullUk: string;
	dayOfWeekFullEn: string;
	time: string;
	titleUk: string;
	titleEn: string;
	genreUk: string;
	genreEn: string;
	ageBadge?: string;
	theatreUk?: string;
	theatreEn?: string;
	authorUk?: string;
	authorEn?: string;
	directorUk?: string;
	directorEn?: string;
	image: string;
	tagUk?: string;
	tagEn?: string;
}

export interface RepertoireContactPhone {
	raw: string;
	formatted: string;
}

export interface RepertoireMonthData {
	id: string;
	monthYearUk: string;
	monthYearEn: string;
	subtitleUk: string;
	subtitleEn: string;
	events: RepertoireEvent[];
	eventsMerged: RepertoireEvent[];
	contactPhones: RepertoireContactPhone[];
	contactPhone: string;
	contactPhoneFormatted: string;
	locationUk: string;
	locationEn: string;
	ticketQrCode: string;
	ticketUrl: string;
}

export const REPERTOIRE_NOVEMBER_2026: RepertoireMonthData = {
	id: 'repertoire-november-2026',
	monthYearUk: 'репертUArt на листопад 2026',
	monthYearEn: 'repertUArt · November 2026',
	subtitleUk: '',
	subtitleEn: '',
	contactPhones: [
		{ raw: '+380487236304', formatted: '+38 (048) 723-63-04' },
		{ raw: '+380487233259', formatted: '+38 (048) 723-32-59' }
	],
	contactPhone: '+380487236304',
	contactPhoneFormatted: '+38 (048) 723-63-04, +38 (048) 723-32-59',
	locationUk: 'м. Одеса, вул. Софіївська, 24',
	locationEn: '24 Sofiivska St., Odesa',
	ticketQrCode: '/posters/qrcode-talent-uart.svg',
	ticketUrl: 'https://concert.ua/uk/talent/navchalnii-teatr-uart',
	events: [
		{
			id: 'secrets',
			dateDay: '07',
			dateMonthUk: 'листопада',
			dateMonthEn: 'November',
			dayOfWeekUk: 'СБ',
			dayOfWeekEn: 'Sat',
			dayOfWeekFullUk: 'Субота',
			dayOfWeekFullEn: 'Saturday',
			time: '18:00',
			titleUk: '«Дуже багато SEКретів»',
			titleEn: '“Too Many Secrets”',
			genreUk: 'підліткова драма',
			genreEn: 'teen drama',
			ageBadge: '14+',
			tagUk: 'ПРЕМʼЄРА',
			tagEn: 'Premiere',
			authorUk: 'за пʼєсою Ніни Захоженко та співавторок',
			authorEn: 'based on the play by Nina Zakhozhenko and co-authors',
			directorUk: 'режисер-постановник Федір Ткач',
			directorEn: 'stage director Fedir Tkach',
			image: '/posters/nov-secrets-2026.jpg'
		},
		{
			id: 'syrnyk-1',
			dateDay: '15',
			dateMonthUk: 'листопада',
			dateMonthEn: 'November',
			dayOfWeekUk: 'НД',
			dayOfWeekEn: 'Sun',
			dayOfWeekFullUk: 'Неділя',
			dayOfWeekFullEn: 'Sunday',
			time: '11:00',
			titleUk: '«Пригоди Пана Сирника»',
			titleEn: '“Adventures of Mr. Syrnyk”',
			genreUk: 'дитяча вистава',
			genreEn: 'children’s play',
			ageBadge: '6+',
			tagUk: 'ДІТИ — ДІТЯМ',
			tagEn: 'Children for Children',
			authorUk: 'за оповіданнями Світлани Лининської',
			authorEn: 'based on stories by Svitlana Lynynska',
			directorUk: 'режисер-постановник Любов Савіна',
			directorEn: 'stage director Liubov Savina',
			image: '/posters/nov-syrnyk-2026.jpg'
		},
		{
			id: 'dosvid',
			dateDay: '21',
			dateMonthUk: 'листопада',
			dateMonthEn: 'November',
			dayOfWeekUk: 'СБ',
			dayOfWeekEn: 'Sat',
			dayOfWeekFullUk: 'Субота',
			dayOfWeekFullEn: 'Saturday',
			time: '18:00',
			titleUk: '«Досвід»',
			titleEn: '“Experience”',
			genreUk: 'підліткові сповіді',
			genreEn: 'teen confessions',
			ageBadge: '14+',
			tagUk: 'ПРЕМʼЄРА',
			tagEn: 'Premiere',
			authorUk: 'режисер-постановник та',
			authorEn: 'stage director and',
			directorUk: 'автор тексту Тетяна Ісачкіна',
			directorEn: 'author of the text Tetiana Isachkina',
			image: '/posters/nov-dosvid-2026.jpg'
		},
		{
			id: 'concert',
			dateDay: '28',
			dateMonthUk: 'листопада',
			dateMonthEn: 'November',
			dayOfWeekUk: 'СБ',
			dayOfWeekEn: 'Sat',
			dayOfWeekFullUk: 'Субота',
			dayOfWeekFullEn: 'Saturday',
			time: '18:00',
			titleUk: 'Нашій «Театралці» — 30-ть!\nТак співайте й веселіться!',
			titleEn: 'Our Teatralo4ka is 30!\nSing and Celebrate!',
			genreUk: 'святковий концерт',
			genreEn: 'festive concert',
			ageBadge: '6+',
			tagUk: 'ДО 30-РІЧЧЯ ШКОЛИ',
			tagEn: '30th Anniversary',
			authorUk: 'викладачів та вихованців школи',
			authorEn: 'teachers and students of the school',
			directorUk: 'музичний керівник Ганна Ніколаєва',
			directorEn: 'music director Hanna Nikolaieva',
			image: '/posters/nov-concert-2026.jpg'
		},
		{
			id: 'syrnyk-2',
			dateDay: '29',
			dateMonthUk: 'листопада',
			dateMonthEn: 'November',
			dayOfWeekUk: 'НД',
			dayOfWeekEn: 'Sun',
			dayOfWeekFullUk: 'Неділя',
			dayOfWeekFullEn: 'Sunday',
			time: '11:00',
			titleUk: '«Пригоди Пана Сирника»',
			titleEn: '“Adventures of Mr. Syrnyk”',
			genreUk: 'дитяча вистава',
			genreEn: 'children’s play',
			ageBadge: '6+',
			tagUk: 'ДІТИ — ДІТЯМ',
			tagEn: 'Children for Children',
			authorUk: 'за оповіданнями Світлани Лининської',
			authorEn: 'based on stories by Svitlana Lynynska',
			directorUk: 'режисер-постановник Любов Савіна',
			directorEn: 'stage director Liubov Savina',
			image: '/posters/nov-syrnyk-2026.jpg'
		}
	],
	eventsMerged: [
		{
			id: 'secrets',
			dateDay: '07',
			dateMonthUk: 'листопада',
			dateMonthEn: 'November',
			dayOfWeekUk: 'СБ',
			dayOfWeekEn: 'Sat',
			dayOfWeekFullUk: 'Субота',
			dayOfWeekFullEn: 'Saturday',
			time: '18:00',
			titleUk: '«Дуже багато SEКретів»',
			titleEn: '“Too Many Secrets”',
			genreUk: 'підліткова драма',
			genreEn: 'teen drama',
			ageBadge: '14+',
			tagUk: 'ПРЕМʼЄРА',
			tagEn: 'Premiere',
			authorUk: 'за пʼєсою Ніни Захоженко та співавторок',
			authorEn: 'based on the play by Nina Zakhozhenko and co-authors',
			directorUk: 'режисер-постановник Федір Ткач',
			directorEn: 'stage director Fedir Tkach',
			image: '/posters/nov-secrets-2026.jpg'
		},
		{
			id: 'syrnyk-merged',
			dateDay: '15, 29',
			dateMonthUk: 'листопада',
			dateMonthEn: 'November',
			dayOfWeekUk: 'НД',
			dayOfWeekEn: 'Sun',
			dayOfWeekFullUk: 'Неділя (два покази: 15 та 29.11)',
			dayOfWeekFullEn: 'Sunday (two shows: Nov 15 & 29)',
			time: '11:00',
			titleUk: '«Пригоди Пана Сирника»',
			titleEn: '“Adventures of Mr. Syrnyk”',
			genreUk: 'дитяча вистава',
			genreEn: 'children’s play',
			ageBadge: '6+',
			tagUk: 'ДІТИ — ДІТЯМ',
			tagEn: 'Children for Children',
			authorUk: 'за оповіданнями Світлани Лининської',
			authorEn: 'based on stories by Svitlana Lynynska',
			directorUk: 'режисер-постановник Любов Савіна',
			directorEn: 'stage director Liubov Savina',
			image: '/posters/nov-syrnyk-2026.jpg'
		},
		{
			id: 'dosvid',
			dateDay: '21',
			dateMonthUk: 'листопада',
			dateMonthEn: 'November',
			dayOfWeekUk: 'СБ',
			dayOfWeekEn: 'Sat',
			dayOfWeekFullUk: 'Субота',
			dayOfWeekFullEn: 'Saturday',
			time: '18:00',
			titleUk: '«Досвід»',
			titleEn: '“Experience”',
			genreUk: 'підліткові сповіді',
			genreEn: 'teen confessions',
			ageBadge: '14+',
			tagUk: 'ПРЕМʼЄРА',
			tagEn: 'Premiere',
			authorUk: 'режисер-постановник та',
			authorEn: 'stage director and',
			directorUk: 'автор тексту Тетяна Ісачкіна',
			directorEn: 'author of the text Tetiana Isachkina',
			image: '/posters/nov-dosvid-2026.jpg'
		},
		{
			id: 'concert',
			dateDay: '28',
			dateMonthUk: 'листопада',
			dateMonthEn: 'November',
			dayOfWeekUk: 'СБ',
			dayOfWeekEn: 'Sat',
			dayOfWeekFullUk: 'Субота',
			dayOfWeekFullEn: 'Saturday',
			time: '18:00',
			titleUk: 'Нашій «Театралці» — 30-ть!\nТак співайте й веселіться!',
			titleEn: 'Our Teatralo4ka is 30!\nSing and Celebrate!',
			genreUk: 'святковий концерт',
			genreEn: 'festive concert',
			ageBadge: '6+',
			tagUk: 'ДО 30-РІЧЧЯ ШКОЛИ',
			tagEn: '30th Anniversary',
			authorUk: 'викладачів та вихованців школи',
			authorEn: 'teachers and students of the school',
			directorUk: 'музичний керівник Ганна Ніколаєва',
			directorEn: 'music director Hanna Nikolaieva',
			image: '/posters/nov-concert-2026.jpg'
		}
	]
};
