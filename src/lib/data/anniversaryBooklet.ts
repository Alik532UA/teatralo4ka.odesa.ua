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
					src: '/photo/hero-dsc-1405-1088.webp',
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
					src: '/posters/anniversary-booklet/p02-photo1.webp',
					altUk: 'Перші кроки та перші учні школи (1996–2001)',
					altEn: 'First steps and students (1996–2001)'
				},
				{
					src: '/posters/anniversary-booklet/p02-photo2.webp',
					altUk: 'Перші вистави на Сабанєєвому мосту',
					altEn: 'Early performances on Sabaneev Bridge'
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
					src: '/posters/anniversary-booklet/p03-photo1.webp',
					altUk: '10-річчя школи та святковий виступ',
					altEn: '10th Anniversary festive performance'
				},
				{
					src: '/posters/anniversary-booklet/p03-photo2.webp',
					altUk: 'Юні актори на сцені Українського театру',
					altEn: 'Young actors on Ukrainian Theatre stage'
				},
				{
					src: '/posters/anniversary-booklet/p03-photo3.webp',
					altUk: 'Святковий ретро-колаж до 10-річчя',
					altEn: 'Festive retro collage for 10th anniversary'
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
					src: '/posters/anniversary-booklet/p04-photo1.webp',
					altUk: 'Затишний дворик та вистави на Сабанєєвому мосту',
					altEn: 'Cosy courtyard and plays on Sabaneev Bridge'
				},
				{
					src: '/posters/anniversary-booklet/p04-chequia-2007.webp',
					altUk: 'Гастролі у Чехії, 2007 рік',
					altEn: 'Tour in the Czech Republic, 2007'
				},
				{
					src: '/posters/anniversary-booklet/p04-photo2.webp',
					altUk: 'Легендарний випуск на сходах школи',
					altEn: 'Legendary graduation on school stairs'
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
			paragraphsUk: [
				'Перший гімн школи народився в стінах старої будівлі на Сабанєєвому мосту. Ці теплі й щирі рядки назавжди стали камертоном нашого дитинства, запаху куліс, скрипу паркету під рояль та перших кроків на сцені.'
			],
			paragraphsEn: [
				'The first school anthem was born within the walls of the old building on Sabaneev Bridge, capturing the timeless spirit of theatrical childhood.'
			],
			photos: [
				{
					src: '/posters/anniversary-booklet/p05-sabaneev-hall.webp',
					altUk: 'Історична зала з роялем на Сабанєєвому мосту',
					altEn: 'Historic hall with piano on Sabaneev Bridge'
				},
				{
					src: '/posters/anniversary-booklet/p05-galereya-mist.webp',
					altUk: 'Музичні та художні вечори у галереї «Міст»',
					altEn: 'Musical and art evenings at “Mist” Gallery'
				}
			],
			hymnLyrics: {
				titleUk: 'Перший гімн школи',
				titleEn: 'The First School Anthem',
				subtitleUk: '«Сабанєєв міст» (повний текст буде додано згодом)',
				subtitleEn: '“Sabaneev Bridge” (full lyrics coming soon)',
				verses: [
					{
						type: 'verse',
						linesUk: [
							'Каждый день наш путь предельно прост —',
							'мы идем на Сабонеев мост…'
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
					src: '/posters/anniversary-booklet/p08-photo1.webp',
					altUk: 'Урочисте відкриття сцени на Софіївській, 24',
					altEn: 'Ceremonial opening of the main stage on Sofiivska, 24'
				},
				{
					src: '/posters/anniversary-booklet/p08-photo2.webp',
					altUk: 'Легендарна вистава «Театральна поліція»',
					altEn: 'Legendary performance “Theatre Police”'
				},
				{
					src: '/posters/anniversary-booklet/p08-priluki.webp',
					altUk: 'Гастролі у Прилуках та знайомство з майстрами',
					altEn: 'Pryluky festival and meeting masters'
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
					src: '/posters/anniversary-booklet/p09-photo1.webp',
					altUk: '20-річчя школи та літній кінотабір',
					altEn: '20th Anniversary & summer cinema camp'
				},
				{
					src: '/posters/anniversary-booklet/p09-anniversary-25.webp',
					altUk: 'Свято 25-річчя школи у фірмовому дворику',
					altEn: '25th Anniversary celebration in the courtyard'
				},
				{
					src: '/posters/anniversary-booklet/p09-photo2.webp',
					altUk: 'Зустріч з Іваном Уривським та майстер-класи',
					altEn: 'Meeting Ivan Uryvskyi & masterclasses'
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
					src: '/posters/anniversary-booklet/p10-hymn2-art.webp',
					altUk: 'Арт-плакат до 25-річчя та гімну «Світло ДТШ»',
					altEn: 'Art poster for 25th Anniversary and DTS Anthem'
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
					src: '/posters/anniversary-booklet/p11-front-podjaka.webp',
					altUk: 'Подяки з фронту від воїнів ЗСУ',
					altEn: 'Gratitude awards from the front line'
				},
				{
					src: '/posters/anniversary-booklet/p11-donat-avto.webp',
					altUk: 'Збір на авто для 639-ї бригади ППО',
					altEn: 'Car fundraiser for 639th Air Defence Brigade'
				},
				{
					src: '/posters/anniversary-booklet/p11-uart.webp',
					altUk: 'Відкриття навчального театру «UArt»',
					altEn: 'Launch of UArt Educational Theatre'
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
