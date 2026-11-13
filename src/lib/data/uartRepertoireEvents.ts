export interface UartRepertoireEvent {
	id: string;
	titleUk: string;
	titleEn: string;
	genreUk: string;
	genreEn: string;
	ageBadge: string;
	tagUk?: string;
	tagEn?: string;
	dateBadgeUk: string;
	dateBadgeEn: string;
	scheduleDateUk: string;
	scheduleDateEn: string;
	time: string;
	authorUk: string;
	authorEn: string;
	directorUk: string;
	directorEn: string;
	directorSlug?: string;
	directorRoleUk?: string;
	directorRoleEn?: string;
	performersUk?: string;
	performersEn?: string;
	courseHref?: string;
	courseNameUk?: string;
	courseNameEn?: string;
	galaxyPlayHref?: string;
	ticketUrl: string;
	videoUrl?: string;
	posterUrl: string;
	posterAltUk: string;
	posterAltEn: string;
}

export const UART_REPERTOIRE_EVENTS: UartRepertoireEvent[] = [
	{
		id: 'secrets',
		titleUk: '«Дуже багато SEКретів»',
		titleEn: '“Too Many Secrets”',
		genreUk: 'Підліткова драма',
		genreEn: 'Teen Drama',
		ageBadge: '14+',
		tagUk: 'ПРЕМʼЄРА',
		tagEn: 'Premiere',
		dateBadgeUk: '7 лист. • 18:00',
		dateBadgeEn: 'Nov 7 • 18:00',
		scheduleDateUk: '7 листопада 2026, 18:00 (субота)',
		scheduleDateEn: 'November 7, 2026, 18:00 (Saturday)',
		time: '18:00',
		authorUk: 'за п’єсою Ніни Захоженко та спів­авторок «Статеве виховання»',
		authorEn: 'based on the play "Sex Education" by Nina Zakhozhenko and co-authors',
		directorUk: 'Федір Ткач, Павло Примак',
		directorEn: 'Fedir Tkach, Pavlo Prymak',
		directorSlug: 'fedir-tkach',
		directorRoleUk: 'Художній керівник, режисер',
		directorRoleEn: 'Artistic director, stage director',
		courseHref: '/projects/galaxy-graduates/groups/repete',
		courseNameUk: 'Курс «RePeTe»',
		courseNameEn: 'Course "RePeTe"',
		galaxyPlayHref: '/projects/galaxy-graduates/plays/stateve-vykhovannia-2026',
		ticketUrl: 'https://concert.ua/uk/event/duzhe-bagato-sekretiv-odesa',
		videoUrl: 'https://www.youtube.com/watch?v=ugtir0Z_4Gw',
		posterUrl: '/posters/nov-secrets-2026.jpg',
		posterAltUk: 'Афіша вистави: «Дуже багато SEкретів»',
		posterAltEn: 'Play poster: "Too Many Secrets"'
	},
	{
		id: 'syrnyk',
		titleUk: '«Пригоди Пана Сирника»',
		titleEn: '“Adventures of Mr. Syrnyk”',
		genreUk: 'Дитяча вистава',
		genreEn: 'Children’s Play',
		ageBadge: '6+',
		tagUk: 'ДІТИ — ДІТЯМ',
		tagEn: 'Children for Children',
		dateBadgeUk: '15 та 29 лист. • 11:00',
		dateBadgeEn: 'Nov 15 & 29 • 11:00',
		scheduleDateUk: '15 та 29 листопада 2026, 11:00 (неділя, два покази)',
		scheduleDateEn: 'November 15 & 29, 2026, 11:00 (Sunday, two shows)',
		time: '11:00',
		authorUk: 'за казковими оповіданнями Світлани Лининської',
		authorEn: 'based on fairytale stories by Svitlana Lynynska',
		directorUk: 'Любов Савіна',
		directorEn: 'Liubov Savina',
		directorSlug: 'liubov-savina',
		directorRoleUk: 'Режисерка-постановниця',
		directorRoleEn: 'Stage director',
		performersUk: 'Юні вихованці Одеської театральної школи',
		performersEn: 'Young students of Odesa Theatre School',
		galaxyPlayHref: '/projects/galaxy-graduates/plays/pryhody-pana-syrnyka-2025',
		ticketUrl: 'https://concert.ua/uk/events/pryhody-pana-syrnyka-odesa',
		posterUrl: '/posters/nov-syrnyk-2026.jpg',
		posterAltUk: 'Афіша вистави: «Пригоди Пана Сирника»',
		posterAltEn: 'Play poster: "Adventures of Mr. Syrnyk"'
	},
	{
		id: 'dosvid',
		titleUk: '«Досвід»',
		titleEn: '“Experience”',
		genreUk: 'Підліткові сповіді',
		genreEn: 'Teen Confessions',
		ageBadge: '14+',
		tagUk: 'ПРЕМʼЄРА',
		tagEn: 'Premiere',
		dateBadgeUk: '21 лист. • 18:00',
		dateBadgeEn: 'Nov 21 • 18:00',
		scheduleDateUk: '21 листопада 2026, 18:00 (субота)',
		scheduleDateEn: 'November 21, 2026, 18:00 (Saturday)',
		time: '18:00',
		authorUk: 'автор тексту та режисерка Тетяна Ісачкіна',
		authorEn: 'author of the text and stage director Tetiana Isachkina',
		directorUk: 'Тетяна Ісачкіна',
		directorEn: 'Tetiana Isachkina',
		directorSlug: 'tetiana-isachkina',
		directorRoleUk: 'Режисерка-постановниця, авторка тексту',
		directorRoleEn: 'Stage director, author of text',
		performersUk: 'Підлітковий курс Одеської театральної школи',
		performersEn: 'Teen course of Odesa Theatre School',
		galaxyPlayHref: '/projects/galaxy-graduates/plays/dosvid-2026',
		ticketUrl: 'https://concert.ua/uk/event/dosvid-odesa',
		posterUrl: '/posters/nov-dosvid-2026.jpg',
		posterAltUk: 'Афіша вистави: «Досвід»',
		posterAltEn: 'Play poster: "Experience"'
	},
	{
		id: 'concert',
		titleUk: 'Нашій «Театралці» — 30-ть!\nТак співайте й веселіться!',
		titleEn: 'Our Teatralo4ka is 30!\nSing and Celebrate!',
		genreUk: 'Святковий ювілейний концерт',
		genreEn: 'Anniversary Festive Concert',
		ageBadge: '6+',
		tagUk: 'ДО 30-РІЧЧЯ ШКОЛИ',
		tagEn: '30th Anniversary',
		dateBadgeUk: '28 лист. • 18:00',
		dateBadgeEn: 'Nov 28 • 18:00',
		scheduleDateUk: '28 листопада 2026, 18:00 (субота)',
		scheduleDateEn: 'November 28, 2026, 18:00 (Saturday)',
		time: '18:00',
		authorUk: 'святковий концерт викладачів та вихованців школи',
		authorEn: 'festive concert by teachers and students of the school',
		directorUk: 'Ганна Ніколаєва',
		directorEn: 'Hanna Nikolaieva',
		directorSlug: 'hanna-nikolaieva',
		directorRoleUk: 'Музична керівниця, завідувачка музичного відділення',
		directorRoleEn: 'Music director, Head of Music Department',
		performersUk: 'Викладачі та вихованці школи',
		performersEn: 'Teachers and students of the school',
		ticketUrl: 'https://concert.ua/uk/event/muzichnii-koncert',
		posterUrl: '/posters/nov-concert-2026.jpg',
		posterAltUk: 'Афіша: Святковий концерт до 30-річчя школи',
		posterAltEn: 'Poster: 30th Anniversary School Concert'
	}
];

