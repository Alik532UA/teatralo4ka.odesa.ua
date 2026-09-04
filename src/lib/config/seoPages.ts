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
	| 'galaxyTheatres';
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
				title: 'Групи випускників',
				description:
					'Навчальні групи «Галактики випускників»: склад, майстри курсу та репертуар вистав.'
			},
			galaxyPlays: {
				title: 'Вистави та ролі',
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
				title: 'Graduate groups',
				description:
					'Study groups of the graduates galaxy: roster, course masters and the repertoire of plays.'
			},
			galaxyPlays: {
				title: 'Plays and roles',
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
				title: 'contacts',
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
		/*
		 * Галактика доти провалювалася в `default` і брала опис ГОЛОВНОЇ. Видно
		 * це було лише в прев'ю месенджера: посилання на галактику підписувалося
		 * «Офіційний сайт… Відділи, галерея, історія, контакти та умови вступу»
		 * — тобто описом іншої сторінки. Той самий клас помилки, що з хвостовою
		 * рискою й мовним префіксом вище, лише третій раз.
		 */
	
		default:
			return 'home';
	}
}
