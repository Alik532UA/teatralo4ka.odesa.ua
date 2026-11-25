export interface BookletPhoto {
	src: string;
	altUk: string;
	altEn: string;
	captionUk?: string;
	captionEn?: string;
}

export interface BookletPageData {
	pageNumber: number;
	type: 'cover' | 'history' | 'hymn' | 'centerfold' | 'back-cover';
	yearsBadge?: string;
	titleUk: string;
	titleEn: string;
	subtitleUk?: string;
	subtitleEn?: string;
	paragraphsUk: string[];
	paragraphsEn: string[];
	photos: BookletPhoto[];
	hymnLyrics?: {
		titleUk: string;
		titleEn: string;
		subtitleUk?: string;
		subtitleEn?: string;
		verses: {
			type: 'verse' | 'chorus' | 'coda';
			linesUk: string[];
			linesEn?: string[];
		}[];
	};
}

export const ANNIVERSARY_BOOKLET_DATA: {
	titleUk: string;
	titleEn: string;
	schoolNameUk: string;
	schoolNameEn: string;
	pages: BookletPageData[];
} = {
	titleUk: 'Ювілейний буклет «ДНК — ДТШ»',
	titleEn: 'Anniversary Booklet “DNA — DTS”',
	schoolNameUk: 'Одеська театральна школа',
	schoolNameEn: 'Odesa Theatre School',
	pages: [
		// 1 ст. Обкладинка
		{
			pageNumber: 1,
			type: 'cover',
			titleUk: 'Ювілейний буклет\n«ДНК — ДТШ»',
			titleEn: 'Anniversary Booklet\n“DNA — DTS”',
			subtitleUk: 'до 30-річчя Одеської театральної школи',
			subtitleEn: 'for the 30th Anniversary of Odesa Theatre School',
			paragraphsUk: [
				'1996 — 2026',
				'Три десятиліття творчості, натхнення та любові до Театру',
				'Одеса · 1 грудня 2026 року'
			],
			paragraphsEn: [
				'1996 — 2026',
				'Three decades of creativity, inspiration and love for Theatre',
				'Odesa · December 1, 2026'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/p01-school-building.webp',
					altUk: 'Історична будівля Одеської театральної школи на Софіївській, 24',
					altEn: 'Historic building of Odesa Theatre School on Sofiivska, 24'
				}
			]
		},

		// 2 ст. 1996 – 2001
		{
			pageNumber: 2,
			type: 'history',
			yearsBadge: '1996 — 2001',
			titleUk: 'Точка відліку · Перше п’ятиріччя',
			titleEn: 'Point of Origin · First Five Years',
			subtitleUk: 'Народження маленької школи, яка стала долею',
			subtitleEn: 'The birth of a small school that became destiny',
			paragraphsUk: [
				'І ось ми в самій точці відліку. Фінальна серія нашого іменинного дайджесту переносить нас у дивовижний світ, де кожен спогад назавжди закарбувався у серці.',
				'Свідоцтво про народження нашої школи — офіційний наказ від 1 грудня 1996 року. Чи знала тоді, у далекому 96-му, ця крихітна школа, якою великою та крутою вона стане через 30 років? Скільки сцен підкорить, скільки викликів витримає і скількох талановитих людей випустить у великий світ? Скількох вона прихистить у своїх стінах — ставши для них справжнім домом, родиною та порятунком?',
				'Школа просто росла... І з кожним роком ставала все красивішою, талановитішою та неймовірнішою! Ось її перші кроки, ось її перше 5-річчя. Перші випускники створили власний театр — грали легендарні «Замарашку» та «Мину Мазайла», бо піти звідси назавжди просто неможливо. А ще — незабутній, теплий та веселий Новий рік Собаки!'
			],
			paragraphsEn: [
				'Here we are at the very beginning. The official founding decree dates back to December 1, 1996. Could this tiny school imagine how great it would become in 30 years?',
				'The school simply grew with immense love. The first graduating students founded their own theatre, staging iconic plays like “Zamarashka” and “Myna Mazailo”.'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/p02-nakaz-1996.webp',
					altUk: 'Історичний наказ про заснування школи від 1 грудня 1996 року',
					altEn: 'Founding decree of the school, Dec 1, 1996'
				},
				{
					src: '/posters/anniversary-booklet/p02-collage1.webp',
					altUk: 'Колаж першої 5-річки «Точка відліку» (1996–2001)',
					altEn: 'Collage of the first 5 years (1996–2001)'
				},
				{
					src: '/posters/anniversary-booklet/p02-collage2.webp',
					altUk: 'Перші кроки, діти та маски на Сабанєєвому мосту',
					altEn: 'Early performances and children on Sabaneev Bridge'
				}
			]
		},

		// 3 ст. 2001 – 2006
		{
			pageNumber: 3,
			type: 'history',
			yearsBadge: '2001 — 2006',
			titleUk: 'Перший ювілей · 10 років',
			titleEn: 'First Decade · 10 Years',
			subtitleUk: 'Вихід на велику сцену Українського театру',
			subtitleEn: 'Stepping onto the grand stage of the Ukrainian Theatre',
			paragraphsUk: [
				'Друге п’ятиріччя стало часом стрімкого злету. Театральна родина міцніла, класи наповнювалися дитячим сміхом, творчими пошуками, репетиціями до пізнього вечора.',
				'А ось вже школі виповнилося десять років! Заради її першого великого ювілею ми буквально перекрили Сабанєєв міст і вийшли на величну академічну сцену Одеського академічного українського музично-драматичного театру імені В. Василька!',
				'Історія, що почалася з одного маленького підпису на аркуші паперу, за перші десять років довела: тут росте нова театральна еліта Одеси та України. Попереду відкривався великий шлях!'
			],
			paragraphsEn: [
				'The second five-year period brought rapid growth and recognition. For its 10th anniversary, the school gathered on the grand stage of Odesa Ukrainian Drama Theatre.',
				'What started from a single document blossomed into a true creative galaxy of young talents.'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/p03-collage1.webp',
					altUk: 'Вихід на велику сцену Українського театру до 10-річчя',
					altEn: '10th Anniversary performance at Ukrainian Theatre'
				},
				{
					src: '/posters/anniversary-booklet/p03-collage2.webp',
					altUk: 'Вистави та фольклорні постановки школи',
					altEn: 'School plays and folkloric performances'
				},
				{
					src: '/posters/anniversary-booklet/p03-collage3.webp',
					altUk: 'Театральна родина та перші великі перемоги',
					altEn: 'Theatre family and early major victories'
				}
			]
		},

		// 4 ст. 2006 – 2011
		{
			pageNumber: 4,
			type: 'history',
			yearsBadge: '2006 — 2011',
			titleUk: 'Сабанєєв міст та великий переїзд',
			titleEn: 'Sabaneev Bridge & The Great Relocation',
			subtitleUk: 'Європейські гастролі та новий дім на Софіївській',
			subtitleEn: 'European tours and a new home on Sofiivska',
			paragraphsUk: [
				'Зупинімося на мить... Ламповий дайджест про 2006–2011 роки. Згадуємо «Театралку»-підлітка та трохи ностальгуємо за першим домом на Сабанєєвому мосту.',
				'Головна подія цієї п’ятирічки — великий переїзд! Завдяки підтримці одеської мерії та одеського бізнесмена Дмитра Шпинарьова, школа отримала нову будівлю на Софіївській, 24. Половину обладнання перенесли просто на руках! А перед тим влаштували зворушливий флешмоб «Прощання з Сабанєєвим мостом» — вийшли на вулицю й взяли стару школу в обійми.',
				'До переїзду ми встигли об’їздити пів світу: Чехія (2007), Румунія та Миколаїв (2008), Крим (2009, 2010), Болгарія зі Стамбулом та європейський тур 2011-го (Чехія, Австрія, Німеччина). Там не було звичної сцени — грали на підлозі з роялем, у 2009-му відкрили залу на 2 поверсі, а одну з випускних вистав зіграли в підвалі! У цьому рідному домі випускався майбутній заслужений артист України Григорій Бакланов!'
			],
			paragraphsEn: [
				'The era of the great move! Thanks to city support and benefactor Dmytro Shpynarov, the school moved to Sofiivska, 24. The farewell flashmob at Sabaneev Bridge became legend.',
				'International tours included Czech Republic, Austria, Germany, Romania, Bulgaria and Crimea. Notable graduates included future Honored Artist Hryhorii Baklanov.'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/p04-chequia-2007.webp',
					altUk: 'Гастролі у Чехії, 2007 рік',
					altEn: 'Tour in the Czech Republic, 2007'
				},
				{
					src: '/posters/anniversary-booklet/p04-balloons.webp',
					altUk: 'Флешмоб кульок та прощання з Сабанєєвим мостом',
					altEn: 'Farewell flashmob on Sabaneev Bridge'
				},
				{
					src: '/posters/anniversary-booklet/p04-gallery-mist.webp',
					altUk: 'Музичні та художні вечори у галереї «Міст»',
					altEn: 'Musical and art evenings at “Mist” Gallery'
				}
			]
		},

		// 5 ст. Перший гімн школи
		{
			pageNumber: 5,
			type: 'hymn',
			titleUk: 'Перший гімн школи',
			titleEn: 'The First School Anthem',
			subtitleUk: '«Сабанєєв міст» · Історичний гімн школи',
			subtitleEn: '“Sabaneev Bridge” · Historic Anthem',
			paragraphsUk: [],
			paragraphsEn: [],
			photos: [
				{
					src: '/posters/anniversary-booklet/p05-vintage-poster.webp',
					altUk: 'Вінтажний плакат школи на Сабанєєвому мосту',
					altEn: 'Vintage school poster on Sabaneev Bridge'
				},
				{
					src: '/posters/anniversary-booklet/p05-microphone-sabaneev.webp',
					altUk: 'Музична атмосфера перших сезонів ДТШ',
					altEn: 'Musical atmosphere of early DTS seasons'
				},
				{
					src: '/posters/anniversary-booklet/p05-school-vintage.webp',
					altUk: 'Перші роки театральної школи на Сабанєєвому мосту',
					altEn: 'Early years of the theatre school on Sabaneev Bridge'
				}
			],
			hymnLyrics: {
				titleUk: 'Перший гімн школи',
				titleEn: 'The First School Anthem',
				subtitleUk: '«Сабанєєв міст»',
				subtitleEn: '“Sabaneev Bridge”',
				verses: [
					{
						type: 'verse',
						linesUk: [
							'Каждый день наш путь предельно прост',
							'Мы идём на Сабанеев мост,',
							'В этот добрый старый дом,',
							'Что «Театралкою» зовём',
							'Чудесный дом, в котором мы живём.',
							'Много лет уже мы с ним',
							'И любовь к нему храним',
							'И никому его не отдадим!'
						]
					},
					{
						type: 'verse',
						linesUk: [
							'Наша жизнь, по-прежнему, Игра!',
							'Так пускай горят прожектора',
							'В нашем доме ДТШ,',
							'Куда волнуясь и спеша,',
							'Нас зовёт актёрская душа!',
							'Мы выходим из кулис',
							'И готовы петь на бис',
							'Про то, что театр это наша жизнь!'
						]
					},
					{
						type: 'verse',
						linesUk: [
							'Значит, будем верить и любить,',
							'И Искусство вечное творить!',
							'Пусть же этот яркий свет',
							'Никогда не гаснет, нет,',
							'Пусть в окнах школы горит он много лет!',
							'Он всегда нам смотрит вслед,',
							'И его яснее нет',
							'Эстрадных,',
							'Вокальных,',
							'Художественных,',
							'Инструментальных,',
							'Театральных,',
							'Любимых окон негасимый свет!'
						]
					}
				]
			}
		},

		// 6 ст. Центр буклету: Спільне фото викладачів (ліва половина розвороту)
		{
			pageNumber: 6,
			type: 'centerfold',
			titleUk: 'Серце «Театрало4ки» — наші педагоги',
			titleEn: 'The Heart of Teatralo4ka — Our Faculty',
			subtitleUk: 'Команда майстрів, які запалюють зірки',
			subtitleEn: 'The team of masters who ignite young stars',
			paragraphsUk: [
				'Викладачі та майстри курсів Одеської театральної школи — режисери, актори, художники, музиканти, хореографи та наставники, які вкладають душу в кожну дитину.'
			],
			paragraphsEn: [
				'Masters and teachers of Odesa Theatre School: directors, actors, artists, musicians, choreographers, and mentors shaping every student.'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/teachers-centerfold.webp',
					altUk: 'Спільна фотографія викладачів та майстрів Одеської театральної школи до 30-річчя',
					altEn: 'Faculty and masters collective portrait for 30th Anniversary'
				}
			]
		},

		// 7 ст. Центр буклету: Спільне фото викладачів (права половина розвороту)
		{
			pageNumber: 7,
			type: 'centerfold',
			titleUk: 'Серце «Театрало4ки» — наші педагоги',
			titleEn: 'The Heart of Teatralo4ka — Our Faculty',
			subtitleUk: 'Команда майстрів, які запалюють зірки',
			subtitleEn: 'The team of masters who ignite young stars',
			paragraphsUk: [
				'Викладачі та майстри курсів Одеської театральної школи — режисери, актори, художники, музиканти, хореографи та наставники, які вкладають душу в кожну дитину.'
			],
			paragraphsEn: [
				'Masters and teachers of Odesa Theatre School: directors, actors, artists, musicians, choreographers, and mentors shaping every student.'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/teachers-centerfold.webp',
					altUk: 'Спільна фотографія викладачів та майстрів Одеської театральної школи до 30-річчя',
					altEn: 'Faculty and masters collective portrait for 30th Anniversary'
				}
			]
		},

		// 8 ст. 2011 – 2016
		{
			pageNumber: 8,
			type: 'history',
			yearsBadge: '2011 — 2016',
			titleUk: 'Будівництво дому на Софіївській',
			titleEn: 'Building Our Home on Sofiivska',
			subtitleUk: 'Велика сцена, липи у дворі та нові простори',
			subtitleEn: 'The main stage, linden trees, and new creative spaces',
			paragraphsUk: [
				'Ця п’ятирічка запам’яталася тим, що ми буквально з нуля будували свій дім! У 2011-му в будівлі звичайної школи на Софіївській не було навіть сцени. Перші спектаклі та новорічні покази грали просто в 7-му кабінеті без подіуму.',
				'Далі ми об’єднали два класи — так в 11-й аудиторії з’явився малий театральний зал. У 7-й збудували звуковий балкон, а головне — урочисто відкрили нашу велику головну сцену! На ній відіграли легендарну посвяту «Театральна поліція», зібравши разом випускників-викладачів Кошку, Комадовську та Надопту.',
				'У 2013-му випускники започаткували зелену традицію — висадили липи, які й сьогодні прикрашають двір. Працювало відділення «РоФАМАН» для малюків 5–6 років. Гастролі: Івано-Франківськ (2016), Київ (2015), Буковель (2014), Прилуки (2012, 2013), де познайомилися зі Станіславом Мойсеєвим та Олегом Стефаном! А 15-річчя школи гучно відсвяткували у клубі з повітряними ліхтариками та капсулою часу на 16-річчя!'
			],
			paragraphsEn: [
				'A milestone era of construction: creating the main stage, sound balcony, and studio 11. Traditions were born, including planting linden trees in the courtyard.',
				'Extensive travels spanned Ivano-Frankivsk, Kyiv, Bukovel, and Pryluky, building creative ties with master directors Stanislav Moiseiev and Oleh Stefan.'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/p08-building-stage.webp',
					altUk: 'Час великих змін: будівництво сцени на Софіївській, 24',
					altEn: 'Construction of the main stage on Sofiivska, 24'
				},
				{
					src: '/posters/anniversary-booklet/p08-priluki.webp',
					altUk: 'Гастролі у Прилуках та знайомство з майстрами сцени',
					altEn: 'Pryluky festival and masterclasses'
				},
				{
					src: '/posters/anniversary-booklet/p08-cinema-agenda.webp',
					altUk: 'Нові простори, висадка лип та творчий злет',
					altEn: 'New spaces, planting lindens and creative growth'
				}
			]
		},

		// 9 ст. 2016 – 2021
		{
			pageNumber: 9,
			type: 'history',
			yearsBadge: '2016 — 2021',
			titleUk: 'Кінотабір, «Театр.PRO» та 25 років',
			titleEn: 'Cinema Camp, Teatr.PRO & 25 Years',
			subtitleUk: 'Чверть століття творчих експериментів та нагород',
			subtitleEn: 'A quarter-century of experiments and accolades',
			paragraphsUk: [
				'П’ятирічка розпочалася по-справжньому гучно: ми помпезно відсвяткували 20-річчя школи! Далі — більше: літній кінотабір та зйомки власного кіно, якому присвятили цілий 22-й сезон.',
				'Нетиповий «ковідний» 24-й сезон загнав усіх по домівках, але ми вийшли у прямий онлайн-ефір та приймали привітання з усього світу! А вже 25-й ювілейний сезон урочисто відкрили у дворі — разом із новеньким Гімном! Врятували кицьку Стєшу, яка стала зіркою школи. Пам’ятаємо й бережемо спадщину наших легендарних викладачів, які відійшли у вічність.',
				'Зустрічі з зірками сцени Іваном Уривським та Тетяною Клімовою, семінари для колег з усієї області, три перших фестивалі «Театр.PRO»! Гран-Прі на всеукраїнських сценах, святкові Миколаївські концерти, а у 2018-му школа засяяла оновленим фасадом із фірмовими масочками на ґратах! Фінал — 25 років і 25 яскравих подій!'
			],
			paragraphsEn: [
				'Summer cinema camp, filmmaking 22nd season, and online live streams during the pandemic. The 25th season opened outdoors with a brand-new Anthem.',
				'Workshops with Ivan Uryvskyi, launching the All-Ukrainian Teatr.PRO festival, and facade renovation with branded theatre masks in 2018.'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/p09-anniversary-25.webp',
					altUk: 'Свято 25-річчя школи та відкриття 25-го сезону',
					altEn: '25th Anniversary celebration in the courtyard'
				},
				{
					src: '/posters/anniversary-booklet/p09-stesha-cat.webp',
					altUk: 'Наша пухнаста зірка — врятована кицька Стєша',
					altEn: 'Rescued cat Stesha — the school mascot'
				},
				{
					src: '/posters/anniversary-booklet/p09-stars-meeting.webp',
					altUk: 'Зустріч з театральними зірками (Іван Уривський, Марина Клімова)',
					altEn: 'Meeting theatre stars (Ivan Uryvskyi, Maryna Klimova)'
				}
			]
		},

		// 10 ст. Другий гімн школи
		{
			pageNumber: 10,
			type: 'hymn',
			titleUk: 'Другий гімн школи',
			titleEn: 'The Second School Anthem',
			subtitleUk: '«Світло ДТШ» · Створений до 25-річчя школи',
			subtitleEn: '“The Light of DTS” · Written for the 25th Anniversary',
			paragraphsUk: [
				'Цей гімн став символом єдності школи під час відкриття 25-го ювілейного сезону. У ньому ожили теплі вікна на Софіївській, любов до сцени та щира відданість кожної дитини рідній «Театралочці».'
			],
			paragraphsEn: [
				'Written for the 25th anniversary season, this anthem celebrates the mysterious light of DTS windows on Sofiivska and the sacred theatre bond.'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/p10-spotlight-anthem.webp',
					altUk: 'Світло софітів ДТШ — театральний колаж з масками',
					altEn: 'The Light of DTS — theatrical collage with spotlights'
				},
				{
					src: '/posters/anniversary-booklet/p10-courtyard-starts.webp',
					altUk: 'Затишок одеського дворика на Софіївській та творчі старти',
					altEn: 'Cozy Odesa courtyard on Sofiivska and creative starts'
				},
				{
					src: '/posters/anniversary-booklet/p10-25-celebration.webp',
					altUk: 'Святкування 25-річчя школи у дворі на Софіївській',
					altEn: '25th anniversary celebration in the Sofiivska courtyard'
				}
			],
			hymnLyrics: {
				titleUk: 'Світло ДТШ',
				titleEn: 'Light of DTS',
				verses: [
					{
						type: 'verse',
						linesUk: [
							'Мир не прост, совсем не прост,',
							'Не просто в нём дотянуться до звёзд,',
							'Не просто званье носить — Артист:',
							'Где-то овации, а где-то свист.',
							'Но ведь у нас есть один секрет —',
							'Вот этих окон таинственный свет,',
							'Сияет он, за собой маня, —',
							'Свет ДТШ есть у меня!'
						]
					},
					{
						type: 'chorus',
						linesUk: [
							'Всё, что в жизни есть у меня,',
							'Всё, в чём радость каждого дня,',
							'Всё, о чём тревоги и мечты —',
							'Ты, Театралочка, ты!',
							'Всё, чем я дышу и живу,',
							'Всё, что и во сне, и наяву,',
							'Всё, о чём поёт моя душа —',
							'Ты моя школа, моя ДТШ!'
						]
					},
					{
						type: 'verse',
						linesUk: [
							'В маленьком зале из мини-кулис',
							'Актёров маленьких просят на бис!',
							'Из этих маленьких душ и сердец',
							'Большое искусство рождается здесь!',
							'Занавес поднят, софиты горят,',
							'Музы театра со мной говорят,',
							'Любовь и верность тебе храня —',
							'С той ДТШ, что есть у меня!'
						]
					},
					{
						type: 'coda',
						linesUk: [
							'Д — он для детей, этот дом!',
							'Т — твоим мы в нём и живём!',
							'Ш — широким шагом иди,',
							'Нас, ДТШ, за собою веди!',
							'И каждый день на Софиевской жди —',
							'У Театралочки всё впереди!'
						]
					}
				]
			}
		},

		// 11 ст. 2021 – 2026
		{
			pageNumber: 11,
			type: 'history',
			yearsBadge: '2021 — 2026',
			titleUk: 'Незламність, UArt та 30-й ювілей',
			titleEn: 'Resilience, UArt & 30th Anniversary',
			subtitleUk: '«Мистецтво — теж зброя!» та народження театру UArt',
			subtitleEn: '“Art is also a Weapon!” and the birth of UArt theatre',
			paragraphsUk: [
				'Час викликів, трансформацій та неймовірної єдності! Двічі змінили офіційну назву, презентували новий логотип, створили унікальну «Галактику випускників ДТШ» та потрапили до Вікіпедії! Запустили новаторські предмети: «Шумовий оркестр» та «Аудіотеатр».',
				'У найскладніший 2022 рік ми не працювали лише два тижні! І вже з 14 квітня під гаслом «Мистецтво — теж зброя!» повернулися до занять. Поставили десятки благодійних вистав, отримали відгук від воїна Павла Вишебаби, долучилися до збору для підрозділу ЗСУ звукорежисера Дмитра, а на 28-річчя задонатили 42 000 грн на авто для випускника Віктора Фурдуя та 639-ї зенітно-ракетної бригади ППО.',
				'Випускники підкорюють вершини: Григорій Бакланов — звання заслуженого артиста, Григорій Наумов — кінопремія «Золота Дзиґа», Михайло Ганєв — режисерський успіх! Провели великі концерти, фестиваль ТЕАТР.PRO, святкували 29-річчя в укритті, тріумфували в Яремче (3 перших місця), і відкрили власний навчальний театр «UArt» — нашу новітню гордість!'
			],
			paragraphsEn: [
				'Years of war resilience and unity. Since April 14, 2022, under the motto “Art is also a Weapon!”, classes and charity shows never stopped, raising funds for Armed Forces vehicles and air defence.',
				'Graduates earned Ukraine Honored Artist titles, Dziga cinema awards, while the school launched the UArt Educational Theatre and the Galaxy of Graduates.'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/p11-uart.webp',
					altUk: 'Відкриття навчального театру «UArt»',
					altEn: 'Launch of UArt Educational Theatre'
				},
				{
					src: '/posters/anniversary-booklet/p11-front-podjaka.webp',
					altUk: 'Подяки з фронту від захисників України',
					altEn: 'Gratitude awards from Ukrainian front line'
				},
				{
					src: '/posters/anniversary-booklet/p11-yaremche.webp',
					altUk: 'Три перших місця на фестивалі в Яремче',
					altEn: 'Three 1st place prizes at Yaremche festival'
				}
			]
		},

		// 12 ст. Третій гімн школи (Задня обкладинка)
		{
			pageNumber: 12,
			type: 'back-cover',
			titleUk: 'Третій гімн школи',
			titleEn: 'The Third School Anthem',
			subtitleUk: '«Театралка — the best!» · Сучасний гімн школи',
			subtitleEn: '“Teatralo4ka — the best!” · Modern School Anthem',
			paragraphsUk: [
				'Сучасний гімн Одеської театральної школи звучить на головних сценах, фестивалях та випускних святах. У ньому — драйв нового покоління, гордість за школу та непохитна віра у наше творче майбутнє!'
			],
			paragraphsEn: [
				'The modern anthem vibrates with the energy of the new generation, celebrating the joy of youth, stage magic, and friendship.'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/p12-teatralo4ka-30.webp',
					altUk: 'Святкова емблема «30 років Театралочці»',
					altEn: '30th Anniversary festive emblem'
				},
				{
					src: '/posters/anniversary-booklet/p12-30-years.webp',
					altUk: '30 років «Театралочці» — сучасне покоління школи',
					altEn: '30 years of Teatralo4ka — modern generation of the school'
				},
				{
					src: '/posters/anniversary-booklet/p12-unity-digest.webp',
					altUk: 'Театральна єдність: дайджест 2021–2026 років',
					altEn: 'Theatre unity: 2021–2026 digest'
				}
			],
			hymnLyrics: {
				titleUk: 'Театралка — the best!',
				titleEn: 'Teatralo4ka — The Best!',
				verses: [
					{
						type: 'verse',
						linesUk: [
							'Лунає навкруг «Театралочки» гімн,',
							'І сотні сердець надихаються ним,',
							'Разом б’ються в такт,',
							'Кажуть «Театралці» — так!',
							'Міняла адреси ти та імена,',
							'Але в наших душах ти завжди одна —',
							'Наша alma mater,',
							'Де Мистецтво, Школа, Театр!'
						]
					},
					{
						type: 'chorus',
						linesUk: [
							'«Театралка» — the best!',
							'Тут злітаю до небес,',
							'Тут зіграю кращу роль,',
							'Тут я Блазень і Король!',
							'You’re amazing and cool,',
							'Dear Art Theatre School!',
							'Щастя відчуття —',
							'«Театралка» — це життя!'
						]
					},
					{
						type: 'verse',
						linesUk: [
							'Весь світ — театр, а ти в нім — Актор!',
							'І вже режисер дав команду: «Мотор»!',
							'Виходь з-за лаштунків, відчуй — це твоє!',
							'У тебе в житті «Театрало4ка» є!'
						]
					},
					{
						type: 'coda',
						linesUk: [
							'А тепер аплодуємо в такт биття наших сердець!',
							'Спочатку — художники!',
							'Тепер додаються музиканти!',
							'А тепер всі разом з театралами!'
						]
					}
				]
			}
		}
	]
};
