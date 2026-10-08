// Відносний імпорт, а не `$lib`: так само зроблено в `hiddenRoutes.ts` і
// `redirects.ts` — цей шар читають і скрипти збірки через tsx, де аліасів
// SvelteKit не існує.
import { stripLocale } from '../i18n/routing';

/**
 * SEO-карта сторінок: ключ маршруту, запасні заголовок і опис.
 *
 * ## Чому окремо від `+layout.svelte`
 *
 * Це ДАНІ — двомовні рядки з нулем логіки, — а лежали вони в найгарячішому
 * файлі проєкту, який стоїть на власній стелі розміру. Кожна нова сторінка з
 * власним описом додавала туди десять рядків тексту, тобто ціна опису сторінки
 * була «підняти стелю layout». Той самий аргумент, що для `data/betaChecklist.ts`.
 *
 * ## Навіщо запасні значення, якщо є i18n
 *
 * `safeT` бере переклад, а сюди падає, коли словник ще не завантажився або
 * ключа в ньому немає. Prerender рендерить `<head>` до того, як `svelte-i18n`
 * встигне ініціалізуватися, тож без цих значень у HTML лягав би сам КЛЮЧ
 * (`seo.pages.about.title`) — і саме він поїхав би в прев'ю месенджера.
 */

export type SeoPageKey =
	| 'home'
	| 'about'
	| 'history'
	| 'contacts'
	| 'admission'
	| 'documents'
	| 'statute'
	| 'galaxy'
	| 'galaxyUpdate'
	| 'galaxyForm'
	| 'galaxyFestivals'
	| 'galaxyGroups'
	| 'galaxyPlays'
	| 'galaxyInstitutions'
	| 'galaxyTheatres'
	| 'galaxyFriends'
	| 'galaxyMasters'
	| 'calendar'
	| 'posters'
	| 'projects'
	| 'tkachPerekladach'
	| 'stageSpeech'
	| 'stageSpeechHexameter'
	| 'stageSpeechYarmarok'
	| 'stageSpeechDictionNorm'
	| 'stageSpeechSkoromovky'
	| 'stageSpeechCumulativeTales'
	| 'stageSpeechVoicePower'
	| 'stageSpeechRhythmTrainer'
	| 'brandbook'
	| 'teatrPro'
	| 'supportProduction'
	| 'photoArchive'
	| 'creativityPlanet'
	| 'springOdesaTheatre'
	| 'festival'
	| 'theatreDept'
	| 'musicDept'
	| 'artDept'
	| 'aestheticDept'
	| 'adultsResidents'
	| 'graduatesResidents'
	| 'kidsResidents'
	| 'news';
export type SeoLangKey = 'uk' | 'en';
export const FALLBACK_LANG: SeoLangKey = 'uk';


export const SEO_FALLBACK = {
	uk: {
		brandTitle: 'Одеська театральна школа',
		orgName: 'Одеська театральна школа',
		orgDescription:
			'Одеська театральна школа: музична освіта для дітей та молоді в Одесі, творчий розвиток та концертна діяльність.',
		pages: {
			home: {
				title: 'Одеська театральна школа',
				description:
					'Офіційний сайт Одеської театральної школи. Відділи, галерея, історія, конкурси та умови вступу.'
			},
			galaxy: {
				title: 'Галактика випускників',
				description:
					'Галактика випускників Одеської театральної школи: понад 500 випускників, групи, вистави й фестивалі!'
			},
			galaxyUpdate: {
				title: 'Що нового в галактиці',
				description:
					'Що нового в галактиці випускників: власні сторінки викладачів, груп, вистав і фестивалів, кілька фото в анкеті. Подивіться, що змінилося, і перевірте свою сторінку.'
			},
			galaxyForm: {
				title: 'Анкета випускника',
				description:
					'Анкета випускника Одеської театральної школи: вистави й ролі, майстер курсу, викладачі, фото й соцмережі. Залітай до нас у Галактику Випускників'
			},
			galaxyFestivals: {
				title: 'Фестивалі',
				description:
					'Фестивалі, на які їздила Одеська театральна школа: роки, країни, учасники та показані вистави.'
			},
			galaxyGroups: {
				title: 'Групи',
				description:
					'Навчальні групи «Галактики випускників»: склад, майстри курсу та репертуар вистав.'
			},
			galaxyPlays: {
				title: 'Вистави',
				description:
					'Усі вистави, покази та етюди Одеської театральної школи: рік, автор, група і хто грав.'
			},
			galaxyInstitutions: {
				title: 'Навчальні заклади',
				description:
					'Творчі навчальні заклади України та Європи, куди вступили випускники Одеської театральної школи: хто саме й якого року.'
			},
			galaxyTheatres: {
				title: 'Театри',
				description:
					'Театри, у яких працюють випускники Одеської театральної школи: хто саме, на якій посаді та з якого року.'
			},
			galaxyFriends: {
				title: 'Друзі школи',
				description:
					'Творчі друзі та партнери Одеської театральної школи: митці, діячі культури, колективи та організації.'
			},
			galaxyMasters: {
				title: 'Викладачі та майстри',
				description:
					'Майстри курсів та викладачі «Галактики випускників»: театральні педагоги, режисери, наставники поколінь.'
			},
			calendar: {
				title: 'Навчальний календар',
				description:
					'Навчальний календар Одеської театральної школи: семестри, канікули й державні свята навчального року.'
			},
			about: {
				title: 'Про школу',
				description:
					'Дізнайтеся більше про Одеську театральну школу: творче життя, виступи, викладачі та учні.'
			},
			history: {
				title: 'Історія',
				description: 'Історія Одеської театральної школи від перших згадок до сучасності.'
			},
			contacts: {
				title: 'Конкурси',
				description:
					'Творчі конкурси та фестивалі Одеської театральної школи для підтримки юних талантів.'
			},
			admission: {
				title: 'Для вступу',
				description:
					'Інформація для вступу до Одеської театральної школи: документи, контакти та умови навчання.'
			},
			documents: {
				title: 'Офіційні документи',
				description:
					'Офіційні документи, Статут закладу та публічна інформація Одеської театральної школи.'
			},
			statute: {
				title: 'Статут закладу',
				description:
					'Офіційний повний текст Статуту Одеської театральної школи (нова редакція 2025 року).'
			},
			posters: {
				title: 'Афіші школи',
				description:
					'Офіційні цифрові афіші Одеської дитячої театральної школи: набір у танцювальний колектив, цифровий перегляд та роздруківка у форматі A4.'
			},
			projects: {
				title: 'Проєкти',
				description:
					'Творчі, освітні та партнерські проєкти Одеської театральної школи: медіа, фестивалі, переклади та архів.'
			},
			tkachPerekladach: {
				title: '«Ткач Перекладач»',
				description:
					'Проєкт Федора Ткача з адаптації, інсценування, перекладу художніх творів і популяризації українського Слова.'
			},
			stageSpeech: {
				title: 'Вправи зі сценічної мови',
				description:
					'Практичні матеріали та тренажери для розвитку акторської дикції, дихання та темпоритму: гекзаметр, довгомовка «Ярмарок» та ритм-тренажер.'
			},
			stageSpeechHexameter: {
				title: 'Вправа 1: Гекзаметр',
				description:
					'Вправа на античний гекзаметр Гомера («Одіссея») для опрацювання дихання, цезури та ритму з метрономом.'
			},
			stageSpeechYarmarok: {
				title: 'Вправа 2: Довгомовка «Ярмарок»',
				description:
					'Вправа на тривале безперервне дихання та орфоепічні наголоси за текстом Остапа Вишні «Ярмарок» зі словничком.'
			},
			stageSpeechDictionNorm: {
				title: 'Вправа 3: Дикційна нормативність',
				description:
					'15 нормативних дикційних вправ за книгою А. Гладишевої в адаптації «Ткач-перекладач» для постановки приголосних звуків.'
			},
			stageSpeechSkoromovky: {
				title: 'Вправа 4: Антологія скоромовок',
				description:
					'Велика добірка класичних та сценічних українських скоромовок для розминки артикуляційного апарату з пошуком та фільтрами.'
			},
			stageSpeechCumulativeTales: {
				title: 'Вправа 5: Довгомовки на дихання',
				description:
					'Вправи на нарощування об’єму дихання: «Хатка, яку збудував собі Джек» та довгомовка «Японське ім’я» Івана Неходи.'
			},
			stageSpeechVoicePower: {
				title: 'Вправа 6: Сила голосу та регістри',
				description:
					'Тренування сили та регістрів голосу: сценічний діалог-гукання «Іванко» («Ткач-перекладач») та вправа «Скакалка».'
			},
			stageSpeechRhythmTrainer: {
				title: 'Ритм-тренажер для дикції',
				description:
					'Інтерактивний метроном (40-180 BPM) для контролю темпоритму мовлення, артикуляційних тренувань та скоромовок.'
			},
			brandbook: {
				title: 'Брендбук школи',
				description:
					'Офіційний брендбук та гайдлайн візуального стилю Одеської дитячої театральної школи: кольори, шрифт e-Ukraine та логотипи.'
			},
			teatrPro: {
				title: 'Театр.PRO',
				description:
					'Фестиваль абітурієнтів закладів мистецької освіти України. Творча платформа для підлітків та молоді.'
			},
			supportProduction: {
				title: 'ДТШ-production',
				description:
					'Наш власний медіа-центр: відеопроєкти, короткометражки та творчі колаборації учнів і викладачів школи.'
			},
			photoArchive: {
				title: 'Фотоархів',
				description:
					'Історія Одеської театральної школи у світлинах: від перших вистав до сучасних фестивалів та подій.'
			},
			creativityPlanet: {
				title: 'Планета творчості',
				description:
					'Планета творчості Одеської театральної школи: учні, анкети, майбутні зірки сцени та творче зростання.'
			},
			springOdesaTheatre: {
				title: '«Театральна весна Одеси»',
				description:
					'Дитячий відкритий театральний фестиваль-конкурс «Театральна весна Одеси»: номінації, учасники, переможці.'
			},
			festival: {
				title: 'Фестиваль',
				description:
					'Фестивальне життя Одеської театральної школи: поїздки Україною та Європою, нагороди й виступи.'
			},
			theatreDept: {
				title: 'Театральне відділення',
				description:
					'Театральне відділення Одеської театральної школи: акторська майстерність, сценічна мова, пластика та вистави.'
			},
			musicDept: {
				title: 'Музичне відділення',
				description:
					'Музичне відділення Одеської театральної школи: вокал, фортепіано, сольфеджіо та музичний розвиток.'
			},
			artDept: {
				title: 'Художнє відділення',
				description:
					'Художнє відділення Одеської театральної школи: образотворче мистецтво, живопис, сценографія та композиція.'
			},
			aestheticDept: {
				title: 'Естетичне відділення',
				description:
					'Відділення естетичного виховання Одеської театральної школи: комплексний творчий розвиток для наймолодших.'
			},
			adultsResidents: {
				title: 'Педагогічний колектив',
				description:
					'Викладачі, майстри та керівники Одеської театральної школи: біографії, досвід та творчі здобутки.'
			},
			graduatesResidents: {
				title: 'Випускники школи',
				description:
					'Випускники Одеської театральної школи різних років: їхній творчий шлях, ролі, вступ та досягнення.'
			},
			kidsResidents: {
				title: 'Учні школи',
				description:
					'Учні Одеської театральної школи: юні таланти, перші вистави, творчі відкриття та натхнення.'
			},
			news: {
				title: 'Новини',
				description:
					'Останні новини, події, вистави та досягнення учнів і викладачів Одеської театральної школи.'
			}
		}
	},
	en: {
		brandTitle: 'Odesa Theatre School',
		orgName: 'Odesa Theatre School',
		orgDescription:
			'Odesa Theatre School: music education for children and youth in Odesa, creative growth, and concert activity.',
		pages: {
			home: {
				title: 'Odesa Theatre School',
				description:
					'Official website of Odesa Theatre School. Departments, gallery, history, contacts, and admission details.'
			},
			galaxy: {
				title: 'Galaxy of graduates',
				description:
					'The galaxy of Odesa Theatre School graduates: over 500 graduates, groups, performances and festivals!'
			},
			galaxyUpdate: {
				title: "What's new in the galaxy",
				description:
					"What's new in the graduates galaxy: pages of their own for teachers, groups, performances and festivals, several photos in a profile. See what changed and check your page."
			},
			galaxyForm: {
				title: 'Graduate form',
				description:
					'The Odesa Theatre School graduate form: performances and roles, course master, teachers, photos and social links. Fly into our Galaxy of Graduates'
			},
			galaxyFestivals: {
				title: 'Festivals',
				description:
					'Festivals the Odesa Theatre School travelled to: years, countries, participants and the productions shown.'
			},
			galaxyGroups: {
				title: 'Groups',
				description:
					'Study groups of the graduates galaxy: roster, course masters and the repertoire of plays.'
			},
			galaxyPlays: {
				title: 'Plays',
				description:
					'Every play, showing and study of the Odesa Theatre School: year, author, group and cast.'
			},
			galaxyInstitutions: {
				title: 'Schools and universities',
				description:
					'Performing arts schools in Ukraine and Europe that graduates of the Odesa Theatre School went on to: who exactly and in which year.'
			},
			galaxyTheatres: {
				title: 'Theatres',
				description:
					'Theatres where graduates of the Odesa Theatre School work: who exactly, in which role and since when.'
			},
			galaxyFriends: {
				title: 'Friends of School',
				description:
					'Creative friends and partners of Odesa Theatre School: artists, cultural figures, teams, and organizations.'
			},
			galaxyMasters: {
				title: 'Teachers and Masters',
				description:
					'Course masters and teachers of the Galaxy of Graduates: theatre educators, directors, mentors of generations.'
			},
			calendar: {
				title: 'Academic Calendar',
				description:
					'Academic calendar of Odesa Theatre School: semesters, breaks and state holidays of the school year.'
			},
			about: {
				title: 'About School',
				description:
					'Learn more about Odesa Theatre School: creative life, performances, teachers, and students.'
			},
			history: {
				title: 'History',
				description: 'The history of Odesa Theatre School from early records to the present day.'
			},
			contacts: {
				title: 'Contacts',
				description:
					'Creative contacts and festivals of Odesa Theatre School that support young talents.'
			},
			admission: {
				title: 'Admission',
				description:
					'Admission information for Odesa Theatre School: documents, contacts, and study conditions.'
			},
			documents: {
				title: 'Official Documents',
				description:
					'Official documents, school statute and public information of Odesa Theatre School.'
			},
			statute: {
				title: 'School Statute',
				description:
					'Official text of the Statute of Odesa Theater School (2025 edition).'
			},
			posters: {
				title: 'School Posters',
				description:
					'Official digital posters and playbills of Odesa Children’s Theatre School: dance collective enrollment, interactive view, and A4 print.'
			},
			projects: {
				title: 'Projects',
				description:
					'Creative, educational, and partner projects of Odesa Theatre School: media, festivals, translations, and archives.'
			},
			tkachPerekladach: {
				title: '«Tkach Translator»',
				description:
					'Fedir Tkach’s project on adaptation, staging, translation of literary works and popularization of the Ukrainian Word.'
			},
			stageSpeech: {
				title: 'Stage Speech Exercises',
				description:
					'Practical materials and trainers for acting diction, breathing, and tempo-rhythm: hexameter, the "Fair" tongue-twister, and rhythm trainer.'
			},
			stageSpeechHexameter: {
				title: 'Exercise 1: Hexameter',
				description:
					'Ancient Homeric hexameter exercise with breathing and caesura practice, accompanied by a rhythm metronome.'
			},
			stageSpeechYarmarok: {
				title: 'Exercise 2: Yarmarok Tongue-Twister',
				description:
					'Ukrainian diction exercise based on Ostap Vyshnya’s "Fair" tongue-twister with accurate orthoepic accents and glossary.'
			},
			stageSpeechDictionNorm: {
				title: 'Exercise 3: Diction Normative Practice',
				description:
					'15 systematic speech exercises based on A. Gladysheva with text adaptation by Tkach Translator for precise consonant articulation.'
			},
			stageSpeechSkoromovky: {
				title: 'Exercise 4: Tongue-Twisters Anthology',
				description:
					'Comprehensive collection of classic and theatrical Ukrainian tongue-twisters with live search, sound filters, and warmup mode.'
			},
			stageSpeechCumulativeTales: {
				title: 'Exercise 5: Cumulative Breath Tales',
				description:
					'Cumulative breath training exercises: "The House That Jack Built" and "Japanese Name" by Ivan Nekhoda.'
			},
			stageSpeechVoicePower: {
				title: 'Exercise 6: Voice Power & Registers',
				description:
					'Voice projection and register exercises: "Ivanko" calling dialogue by Tkach Translator and "Jump Rope" breath rhythm drill.'
			},
			stageSpeechRhythmTrainer: {
				title: 'Rhythm Trainer',
				description:
					'Interactive speech metronome (40-180 BPM) for diction, tempo-rhythm control, and stage speech practice.'
			},
			brandbook: {
				title: 'BrandBook',
				description:
					'Official brand identity guidelines of Odesa Children’s Theatre School: colors, e-Ukraine font, logo usage, and graphic assets.'
			},
			teatrPro: {
				title: 'Theater.PRO',
				description:
					'A festival for applicants to Ukraine’s arts education institutions. Creative platform for teenagers and youth.'
			},
			supportProduction: {
				title: 'DTSH-production',
				description:
					'Our own media center: video projects, short films, and creative collaborations of students and teachers.'
			},
			photoArchive: {
				title: 'Photo Archive',
				description:
					'The history of Odesa Theatre School in photographs: from first performances to modern events.'
			},
			creativityPlanet: {
				title: 'Planet of Creativity',
				description:
					'Planet of Creativity of Odesa Theatre School: current students, profiles, future stars, and creative growth.'
			},
			springOdesaTheatre: {
				title: '«Theatre Spring of Odesa»',
				description:
					'Children’s open theatre festival-competition "Theatre Spring of Odesa": nominations, participants, and awards.'
			},
			festival: {
				title: 'Festival',
				description:
					'Festival life of Odesa Theatre School: tours across Ukraine and Europe, awards, and performances.'
			},
			theatreDept: {
				title: 'Theatre Department',
				description:
					'Theatre Department of Odesa Theatre School: acting, stage speech, movement, and theatre productions.'
			},
			musicDept: {
				title: 'Music Department',
				description:
					'Music Department of Odesa Theatre School: vocals, piano, music theory, and musical development.'
			},
			artDept: {
				title: 'Art Department',
				description:
					'Art Department of Odesa Theatre School: fine arts, painting, stage design, and composition.'
			},
			aestheticDept: {
				title: 'Aesthetic Department',
				description:
					'Aesthetic Education Department of Odesa Theatre School: comprehensive creative development for children.'
			},
			adultsResidents: {
				title: 'Teaching Faculty',
				description:
					'Teachers, masters, and leaders of Odesa Theatre School: biographies, experience, and artistic achievements.'
			},
			graduatesResidents: {
				title: 'School Graduates',
				description:
					'Graduates of Odesa Theatre School over the years: their creative paths, roles, admissions, and achievements.'
			},
			kidsResidents: {
				title: 'School Students',
				description:
					'Students of Odesa Theatre School: young talents, debut performances, creative discoveries, and inspiration.'
			},
			news: {
				title: 'News',
				description:
					'Latest news, events, performances, and achievements of students and teachers of Odesa Theatre School.'
			}
		}
	}
} as const;

export function routeToSeoKey(pathname: string): SeoPageKey {
	// This site serves trailing slashes, so pathname arrives as "/about/"
	// while the cases below are written without one. Every page was falling
	// through to the default and inheriting the home page's title and
	// description — the per-page SEO underneath was never reached.
	//
	// Мовний префікс знімається ПЕРЕД зіставленням: сюди приходить
	// `/en/about/`, а кейси написані без префікса. Без цього рядка кожна
	// англійська сторінка провалювалася в `default` і брала заголовок
	// головної — та сама помилка, що й із хвостовою рискою вище, лише
	// повторена через мову. Видно її було лише в зібраному HTML: у
	// `build/en/about/index.html` стояв `<title>Odesa Theatre School</title>`
	// замість «About the school | …».
	const bare = stripLocale(pathname);
	const normalized = bare !== '/' ? bare.replace(/\/+$/, '') : bare;
	switch (normalized) {
		case '/':
			return 'home';
		case '/about':
			return 'about';
		case '/history':
			return 'history';
		case '/contacts':
			return 'contacts';
		case '/admission':
			return 'admission';
		case '/documents':
			return 'documents';
		case '/documents/statute':
			return 'statute';
		case '/calendar':
			return 'calendar';
		case '/posters':
			return 'posters';
		case '/news':
			return 'news';
		case '/projects':
			return 'projects';
		case '/projects/tkach-perekladach':
			return 'tkachPerekladach';
		case '/projects/stage-speech':
			return 'stageSpeech';
		case '/projects/stage-speech/hexameter':
			return 'stageSpeechHexameter';
		case '/projects/stage-speech/yarmarok':
			return 'stageSpeechYarmarok';
		case '/projects/stage-speech/diction-norm':
			return 'stageSpeechDictionNorm';
		case '/projects/stage-speech/skoromovky':
			return 'stageSpeechSkoromovky';
		case '/projects/stage-speech/cumulative-tales':
			return 'stageSpeechCumulativeTales';
		case '/projects/stage-speech/voice-power':
			return 'stageSpeechVoicePower';
		case '/projects/stage-speech/rhythm-trainer':
			return 'stageSpeechRhythmTrainer';
		case '/projects/brandbook':
			return 'brandbook';
		case '/projects/teatr-pro':
			return 'teatrPro';
		case '/projects/support-production':
			return 'supportProduction';
		case '/projects/photo-archive':
			return 'photoArchive';
		case '/projects/creativity-planet':
			return 'creativityPlanet';
		case '/projects/spring-odesa-theatre':
			return 'springOdesaTheatre';
		case '/projects/festival':
			return 'festival';
		case '/projects/galaxy-graduates':
			return 'galaxy';
		case '/projects/galaxy-graduates/update':
			return 'galaxyUpdate';
		case '/projects/galaxy-graduates/form':
			return 'galaxyForm';
		case '/projects/galaxy-graduates/festivals':
			return 'galaxyFestivals';
		case '/projects/galaxy-graduates/groups':
			return 'galaxyGroups';
		case '/projects/galaxy-graduates/plays':
			return 'galaxyPlays';
		case '/projects/galaxy-graduates/institutions':
			return 'galaxyInstitutions';
		case '/projects/galaxy-graduates/theatres':
			return 'galaxyTheatres';
		case '/projects/galaxy-graduates/friends':
			return 'galaxyFriends';
		case '/projects/galaxy-graduates/masters':
			return 'galaxyMasters';
		case '/departments/theatre':
			return 'theatreDept';
		case '/departments/music':
			return 'musicDept';
		case '/departments/art':
			return 'artDept';
		case '/departments/aesthetic':
			return 'aestheticDept';
		case '/residents/adults':
			return 'adultsResidents';
		case '/residents/graduates':
			return 'graduatesResidents';
		case '/residents/kids':
			return 'kidsResidents';

		default:
			return 'home';
	}
}
