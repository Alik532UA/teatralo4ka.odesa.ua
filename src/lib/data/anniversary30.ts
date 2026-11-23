export interface AnniversaryEventItem {
	id: string;
	dateUk: string;
	dateEn: string;
	titleUk: string;
	titleEn: string;
	subtitleUk?: string;
	subtitleEn?: string;
	noteUk: string;
	noteEn: string;
	channelUk: string;
	channelEn: string;
	badgeUk: string;
	badgeEn: string;
	url?: string;
	isInternalUrl?: boolean;
}

export interface AnniversaryCharityData {
	titleUk: string;
	titleEn: string;
	leadUk: string;
	leadEn: string;
	targetUk: string;
	targetEn: string;
	descriptionUk: string;
	descriptionEn: string;
	jarUrl: string;
	cardNumber: string;
	cardRaw: string;
	qrImage: string;
}

export const ANNIVERSARY_30_EVENTS: readonly AnniversaryEventItem[] = [
	{
		id: 'video-digest',
		dateUk: '25 – 30 листопада',
		dateEn: 'Nov 25 – 30',
		titleUk: 'Відео-дайджест історичних подій\n«Театрало4ки»',
		titleEn: 'Historical Video Digest\nof Teatralo4ka',
		noteUk: 'дивись в Інстаграм',
		noteEn: 'watch on Instagram',
		channelUk: 'Інстаграм',
		channelEn: 'Instagram',
		badgeUk: 'Онлайн',
		badgeEn: 'Online',
		url: 'https://www.instagram.com/teatralo4ka_official_/'
	},
	{
		id: 'art-exhibition',
		dateUk: 'з 25 листопада',
		dateEn: 'From Nov 25',
		titleUk: 'Виставка художнього відділення\n«Квіти для іменинниці»',
		titleEn: 'Art Department Exhibition\n“Flowers for the Birthday School”',
		noteUk: 'дивись у фоє 2 поверху',
		noteEn: '2nd floor foyer',
		channelUk: 'Фоє 2 поверху',
		channelEn: '2nd Floor Foyer',
		badgeUk: 'Виставка',
		badgeEn: 'Exhibition'
	},
	{
		id: 'festive-concert',
		dateUk: '28 листопада',
		dateEn: 'Nov 28',
		titleUk: 'Святковий концерт «Нашій Театралці – 30-ть! Так співайте й веселіться!!!»',
		titleEn: 'Festive Concert “Our Teatralo4ka is 30! Sing and Celebrate!”',
		noteUk: 'дивись квитки на concert.ua',
		noteEn: 'tickets on concert.ua',
		channelUk: 'Concert.ua',
		channelEn: 'Concert.ua',
		badgeUk: 'concert.ua',
		badgeEn: 'concert.ua',
		url: 'https://concert.ua/uk/event/muzichnii-koncert'
	},
	{
		id: 'cinema-zoom',
		dateUk: '30 листопада',
		dateEn: 'Nov 30',
		titleUk: 'Кіно-Зум з випускниками «Театрало4ки»,\nякі вже потрапили у «Фабрику мрій»',
		titleEn: 'Cinema Zoom with Teatralo4ka graduates\nin the Dream Factory',
		noteUk: 'дивись на YouTube',
		noteEn: 'watch on YouTube',
		channelUk: 'YouTube',
		channelEn: 'YouTube',
		badgeUk: 'Зустріч',
		badgeEn: 'Meeting',
		url: 'https://www.youtube.com/@teatralo4ka_odesa'
	},
	{
		id: 'anniversary-booklet',
		dateUk: '1 грудня',
		dateEn: 'Dec 1',
		titleUk: 'Презентація ювілейного буклету\n«ДНК — ДТШ»',
		titleEn: 'Presentation of the Anniversary Booklet\n“DNA — DTS”',
		noteUk: 'дивись історичні фоточки',
		noteEn: 'view historical photos',
		channelUk: 'Ювілейний буклет',
		channelEn: 'Anniversary Booklet',
		badgeUk: 'Буклет',
		badgeEn: 'Booklet',
		url: '/posters?poster=anniversary-booklet',
		isInternalUrl: true
	},
	{
		id: 'tiktok-video',
		dateUk: '1 грудня',
		dateEn: 'Dec 1',
		titleUk: 'Прем’єра відео-роліку\n«The coolfest people in theatre school»',
		titleEn: 'Video Premiere\n“The coolfest people in theatre school”',
		noteUk: 'дивись у Тік-Ток',
		noteEn: 'watch on TikTok',
		channelUk: 'Тік-Ток',
		channelEn: 'TikTok',
		badgeUk: 'Премʼєра',
		badgeEn: 'Premiere',
		url: 'https://www.tiktok.com/@teatralo4ka_official/'
	},
	{
		id: 'graduates-interview',
		dateUk: 'з 1 грудня',
		dateEn: 'From Dec 1',
		titleUk: 'Інтерв’ю з випускниками\nтеатральної школи',
		titleEn: 'Interviews with Theatre School Graduates',
		noteUk: 'дивись на сайті',
		noteEn: 'on the website',
		channelUk: 'Сайт школи',
		channelEn: 'School Website',
		badgeUk: 'Галактика',
		badgeEn: 'Galaxy',
		url: '/projects/galaxy-graduates',
		isInternalUrl: true
	},
	{
		id: 'admission-conference',
		dateUk: '5 грудня',
		dateEn: 'Dec 5',
		titleUk: 'Online конференція щодо вступної кампанії-2027',
		titleEn: 'Online Conference: Admissions 2027',
		subtitleUk: 'з театральним режисером Мирославом Гринишиним та акторами Київського театру Франка',
		subtitleEn: 'with theatre director Myroslav Hrynyshyn & Kyiv Ivan Franko Theatre actors',
		noteUk: 'дивись у Zoom',
		noteEn: 'join on Zoom',
		channelUk: 'Zoom',
		channelEn: 'Zoom',
		badgeUk: 'Конференція',
		badgeEn: 'Conference'
	},
	{
		id: 'children-holiday',
		dateUk: '1 – 4 грудня',
		dateEn: 'Dec 1 – 4',
		titleUk: 'Дитяче свято з дискотекою\n«Навколо Театралки за 30 років»',
		titleEn: 'Children’s Holiday Party & Disco\n“Around Teatralo4ka in 30 Years”',
		noteUk: 'танцюй у 37-й ауд',
		noteEn: 'dance in Classroom 37',
		channelUk: '37-ма аудиторія',
		channelEn: 'Classroom 37',
		badgeUk: 'Свято',
		badgeEn: 'Holiday'
	},
	{
		id: 'anniversary-show',
		dateUk: '1 – 4 грудня',
		dateEn: 'Dec 1 – 4',
		titleUk: 'Ювілейне шоу з дискотекою\n«30 років ДТШ - Дізнайся Таємниці Школи»',
		titleEn: 'Anniversary Show & Disco\n“30 Years of DTH - Discover School Secrets”',
		noteUk: 'дивись у 7-й ауд, а танцюй у 37-й ауд',
		noteEn: 'watch in Room 7, dance in Room 37',
		channelUk: '7-ма та 37-ма ауд.',
		channelEn: 'Rooms 7 & 37',
		badgeUk: 'Шоу',
		badgeEn: 'Show'
	}
];

export const ANNIVERSARY_30_CHARITY: AnniversaryCharityData = {
	titleUk: 'Збір для ЗСУ на честь 30-річчя',
	titleEn: 'AFU Charity Fundraiser for the 30th Anniversary',
	leadUk: 'Протягом усіх святкових днів ми традиційно збираємо кошти для ЗСУ. Хочеш привітати іменинницю – донать сюди!',
	leadEn: 'Throughout all festive days, we traditionally collect funds for the AFU. Want to congratulate the birthday school? Donate here!',
	targetUk: 'На пікапи для 14 ОРБ',
	targetEn: 'Pickups for the 14th Separate Reconnaissance Battalion',
	descriptionUk: 'Одеська театральна школа на честь свого 30-річчя доєдналась до збору на пікапи для 14-го окремого розвідувального батальйону ЗСУ спільно з благодійним фондом "Я Лю Україну"',
	descriptionEn: 'Odesa Theatre School, in honor of its 30th anniversary, joined the fundraiser for pickups for the 14th Separate Reconnaissance Battalion of the AFU together with the charity foundation "Ya Lyu Ukrayinu"',
	jarUrl: 'https://send.monobank.ua/jar/4FvXthaHVH',
	cardNumber: '4874 1000 3561 4919',
	cardRaw: '4874100035614919',
	qrImage: '/posters/monobank-jar-14orb.webp'
};

export const ANNIVERSARY_30_POSTER = {
	id: 'anniversary-30',
	headerBadgeUk: '1996 – 2026 · 30 РОКІВ РАЗОМ',
	headerBadgeEn: '1996 – 2026 · 30 YEARS TOGETHER',
	subtitleUk: 'Афіша святкових заходів',
	subtitleEn: 'Festive Events Playbill',
	titleUk: 'Одеській театральній школі – 30 років!!!',
	titleEn: 'Odesa Theatre School – 30 Years Old!',
	datesRangeUk: '25 листопада – 5 грудня 2026',
	datesRangeEn: 'Nov 25 – Dec 5, 2026',
	events: ANNIVERSARY_30_EVENTS,
	charity: ANNIVERSARY_30_CHARITY,
	schoolUk: '«Театрало4ка» – 30 сезонів: Гра триває!',
	schoolEn: '“Teatralo4ka” – 30 seasons: The play goes on!'
};

export interface PosterParticle {
	iconFile: string;
	nameUk: string;
	nameEn: string;
	top: number;
	x: number;
	size: number;
	rot: number;
	opacity: number;
}

const PARTICLE_ICONS = [
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon01_2026.svg', nameUk: 'Зірка слави', nameEn: 'Star' },
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon02_2026.svg', nameUk: 'Електрогітара', nameEn: 'Guitar' },
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon03_2026.svg', nameUk: 'Книга та перо', nameEn: 'Book' },
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon04_2026.svg', nameUk: 'Творчий олівець', nameEn: 'Pencil' },
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon05_2026.svg', nameUk: 'Сценічний софіт', nameEn: 'Spotlight' },
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon06_2026.svg', nameUk: 'Сценічний мікрофон', nameEn: 'Microphone' },
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon07_2026.svg', nameUk: 'Скрипковий ключ', nameEn: 'Clef' },
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon08_2026.svg', nameUk: 'Храм театру', nameEn: 'Temple' },
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon09_2026.svg', nameUk: 'Кінокамера', nameEn: 'Camera' },
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon10_2026.svg', nameUk: 'Режисерська хлопавка', nameEn: 'Clapperboard' },
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon11_2026.svg', nameUk: 'Театральні маски', nameEn: 'Masks' },
	{ file: '/miniIcon/svg/t4_logo_IndividualParticles_MiniIcon12_2026.svg', nameUk: 'Палітра художника', nameEn: 'Palette' }
] as const;

function generateSideParticles(seedOffset: number): readonly PosterParticle[] {
	const count = 28;
	const particles: PosterParticle[] = [];
	for (let i = 0; i < count; i++) {
		const top = +(1.5 + (i / (count - 1)) * 96).toFixed(1);
		const col = (i + seedOffset) % 3;
		let x: number;
		let size: number;
		let opacity: number;

		if (col === 0) {
			x = 14 + (((i * 7 + seedOffset) % 11) - 5);
			size = 42 + (((i * 5 + seedOffset) % 9) - 4);
			opacity = 0.92;
		} else if (col === 1) {
			x = 48 + (((i * 11 + seedOffset) % 13) - 6);
			size = 29 + (((i * 3 + seedOffset) % 7) - 3);
			opacity = 0.85;
		} else {
			x = 82 + (((i * 13 + seedOffset) % 11) - 5);
			size = 19 + (((i * 4 + seedOffset) % 5) - 2);
			opacity = 0.78;
		}

		const rot = ((i * 37 + seedOffset * 17) % 64) - 32;
		const icon = PARTICLE_ICONS[(i * 5 + seedOffset) % PARTICLE_ICONS.length];

		particles.push({
			iconFile: icon.file,
			nameUk: icon.nameUk,
			nameEn: icon.nameEn,
			top,
			x,
			size,
			rot,
			opacity
		});
	}
	return particles;
}

export const ANNIVERSARY_30_LEFT_PARTICLES: readonly PosterParticle[] = generateSideParticles(0);
export const ANNIVERSARY_30_RIGHT_PARTICLES: readonly PosterParticle[] = generateSideParticles(7);
