import { resolve } from '$app/paths';

/**
 * Елемент карти сайту (розширеного меню).
 *
 * `href` — відкладений виклик `resolve()` із рядковим літералом, щоб перевірка
 * типів SvelteKit ловила неіснуючі або помилкові маршрути ще на етапі збірки.
 */
export interface SiteMapItem {
	id: string;
	icon: string;
	labelUk: string;
	labelEn: string;
	href: () => string;
	badgeUk?: string;
	badgeEn?: string;
	isSubItem?: boolean;
}

/**
 * Група посилань усередині однієї колонки.
 */
export interface SiteMapGroup {
	id: string;
	titleUk: string;
	titleEn: string;
	items: SiteMapItem[];
}

/**
 * Колонка повноформатної карти сайту (оверлею).
 */
export interface SiteMapColumn {
	id: string;
	titleUk: string;
	titleEn: string;
	groups: SiteMapGroup[];
}

/**
 * Структура чотирьох колонок карти сайту для десктопу.
 *
 * Сюди свідомо НЕ входять:
 * - постери та афіші друку (/posters);
 * - індивідуальні картки випускників, учнів, театрів, вишів і зіркових фахівців
 *   (їх сотні, вони перевантажили б навігаційний оверлей).
 *
 * Викладачі школи показуються окремим компактним горизонтальним рядом
 * круглих 34px міні-іконок під 4-ю колонкою («Галактика випускників»).
 */
export const SITE_MAP_COLUMNS: SiteMapColumn[] = [
	{
		id: 'school',
		titleUk: 'Школа',
		titleEn: 'School',
		groups: [
			{
				id: 'general',
				titleUk: '',
				titleEn: '',
				items: [
					{ id: 'home', icon: 'home', labelUk: 'Головна', labelEn: 'Home', href: () => resolve('/') },
					{ id: 'about', icon: 'school', labelUk: 'Про школу', labelEn: 'About School', href: () => resolve('/about') },
					{ id: 'history', icon: 'history', labelUk: 'Історія', labelEn: 'History', href: () => resolve('/history') },
					{ id: 'news', icon: 'newspaper', labelUk: 'Новини', labelEn: 'News', href: () => resolve('/news') },
					{ id: 'calendar', icon: 'calendar', labelUk: 'Календар', labelEn: 'Calendar', href: () => resolve('/calendar') },
					{ id: 'contacts', icon: 'phone', labelUk: 'Контакти', labelEn: 'Contacts', href: () => resolve('/contacts') }
				]
			},
			{
				id: 'official',
				titleUk: 'Офіційні дані',
				titleEn: 'Official Data',
				items: [
					{ id: 'admission', icon: 'user-check', labelUk: 'Для вступу', labelEn: 'Admission', href: () => resolve('/admission') },
					{ id: 'documents', icon: 'file-text', labelUk: 'Офіційні документи', labelEn: 'Official Documents', href: () => resolve('/documents') },
					{ id: 'statute', icon: 'scroll', labelUk: 'Статут школи', labelEn: 'School Statute', href: () => resolve('/documents/statute') }
				]
			}
		]
	},
	{
		id: 'departments-residents',
		titleUk: 'Відділення',
		titleEn: 'Departments',
		groups: [
			{
				id: 'departments',
				titleUk: '',
				titleEn: '',
				items: [
					{ id: 'theatre', icon: 'drama', labelUk: 'Театральне відділення', labelEn: 'Theatre Department', href: () => resolve('/departments/theatre') },
					{ id: 'music', icon: 'music', labelUk: 'Музичне відділення', labelEn: 'Music Department', href: () => resolve('/departments/music') },
					{ id: 'art', icon: 'palette', labelUk: 'Художнє відділення', labelEn: 'Art Department', href: () => resolve('/departments/art') },
					{ id: 'aesthetic', icon: 'sparkles', labelUk: 'Естетичне виховання', labelEn: 'Aesthetic Education', href: () => resolve('/departments/aesthetic') }
				]
			},
			{
				id: 'residents',
				titleUk: 'Мешканці',
				titleEn: 'Residents',
				items: [
					{ id: 'adults', icon: 'graduation-cap', labelUk: 'Дорослі (команда й педагоги)', labelEn: 'Adults (Team & Teachers)', href: () => resolve('/residents/adults') },
					{ id: 'kids', icon: 'smile', labelUk: 'Діти (вихованці)', labelEn: 'Kids (Students)', href: () => resolve('/residents/kids') },
					{ id: 'graduates', icon: 'users', labelUk: 'Випускники', labelEn: 'Graduates', href: () => resolve('/residents/graduates') }
				]
			}
		]
	},
	{
		id: 'projects',
		titleUk: 'Проєкти',
		titleEn: 'Projects',
		groups: [
			{
				id: 'main-projects',
				titleUk: '',
				titleEn: '',
				items: [
					{ id: 'projects-hub', icon: 'compass', labelUk: 'Всі проєкти (хаб)', labelEn: 'All Projects (Hub)', href: () => resolve('/projects') },
					{ id: 'creativity-planet', icon: 'globe', labelUk: 'Планета творчості', labelEn: 'Creativity Planet', href: () => resolve('/projects/creativity-planet') },
					{ id: 'teatr-pro', icon: 'flame', labelUk: 'Театр PRO', labelEn: 'Theatre PRO', href: () => resolve('/projects/teatr-pro') },
					{ id: 'festival', icon: 'spotlight', labelUk: 'Фестиваль', labelEn: 'Festival', href: () => resolve('/projects/festival') },
					{ id: 'spring-odesa-theatre', icon: 'sun', labelUk: 'Весняний Одеський театр', labelEn: 'Spring Odesa Theatre', href: () => resolve('/projects/spring-odesa-theatre') },
					{ id: 'uart', icon: 'theater', labelUk: 'Навчальний театр «UArt»', labelEn: 'Study Theatre "UArt"', href: () => resolve('/projects/UArt') },
					{ id: 'support-production', icon: 'heart', labelUk: 'Підтримка постановок', labelEn: 'Production Support', href: () => resolve('/projects/support-production') },
					{ id: 'tkach-perekladach', icon: 'languages', labelUk: 'Ткач-перекладач', labelEn: 'Tkach-Translator', href: () => resolve('/projects/tkach-perekladach') },
					{ id: 'photo-archive', icon: 'camera', labelUk: 'Фотоархів', labelEn: 'Photo Archive', href: () => resolve('/projects/photo-archive') },
					{ id: 'brandbook', icon: 'book-marked', labelUk: 'Брендбук', labelEn: 'Brandbook', href: () => resolve('/projects/brandbook') }
				]
			},
			{
				id: 'stage-speech',
				titleUk: 'Сценічна мова',
				titleEn: 'Stage Speech',
				items: [
					{ id: 'stage-speech-hub', icon: 'mic', labelUk: 'Сценічна мова (хаб)', labelEn: 'Stage Speech (Hub)', href: () => resolve('/projects/stage-speech') },
					{ id: 'speech-diction', icon: 'volume-2', labelUk: 'Норми вимови', labelEn: 'Diction Norms', isSubItem: true, href: () => resolve('/projects/stage-speech/diction-norm') },
					{ id: 'speech-voice', icon: 'activity', labelUk: 'Сила голосу', labelEn: 'Voice Power', isSubItem: true, href: () => resolve('/projects/stage-speech/voice-power') },
					{ id: 'speech-tongue-twisters', icon: 'shuffle', labelUk: 'Скоромовки', labelEn: 'Tongue Twisters', isSubItem: true, href: () => resolve('/projects/stage-speech/skoromovky') },
					{ id: 'speech-hexameter', icon: 'layers', labelUk: 'Гекзаметр', labelEn: 'Hexameter', isSubItem: true, href: () => resolve('/projects/stage-speech/hexameter') },
					{ id: 'speech-tales', icon: 'book-open', labelUk: 'Кумулятивні казки', labelEn: 'Cumulative Tales', isSubItem: true, href: () => resolve('/projects/stage-speech/cumulative-tales') },
					{ id: 'speech-yarmarok', icon: 'zap', labelUk: 'Ярмарок', labelEn: 'Fair (Yarmarok)', isSubItem: true, href: () => resolve('/projects/stage-speech/yarmarok') },
					{ id: 'speech-rhythm', icon: 'clock', labelUk: 'Тренажер ритму', labelEn: 'Rhythm Trainer', isSubItem: true, href: () => resolve('/projects/stage-speech/rhythm-trainer') }
				]
			}
		]
	},
	{
		id: 'galaxy',
		titleUk: 'Галактика випускників',
		titleEn: 'Galaxy of Graduates',
		groups: [
			{
				id: 'galaxy-registers',
				titleUk: '',
				titleEn: '',
				items: [
					{ id: 'galaxy-hub', icon: 'sparkles', labelUk: 'Головна Галактики', labelEn: 'Galaxy Hub', href: () => resolve('/projects/galaxy-graduates') },
					{ id: 'galaxy-plays', icon: 'theater', labelUk: 'Репертуар вистав', labelEn: 'Repertoire of Plays', href: () => resolve('/projects/galaxy-graduates/plays') },
					{ id: 'galaxy-festivals', icon: 'spotlight', labelUk: 'Фестивальні поїздки', labelEn: 'Festival Trips', href: () => resolve('/projects/galaxy-graduates/festivals') },
					{ id: 'galaxy-groups', icon: 'users', labelUk: 'Студії та групи', labelEn: 'Studios & Groups', href: () => resolve('/projects/galaxy-graduates/groups') },
					{ id: 'galaxy-theatres', icon: 'drama', labelUk: 'Театри випускників', labelEn: 'Theatres', href: () => resolve('/projects/galaxy-graduates/theatres') },
					{ id: 'galaxy-institutions', icon: 'school', labelUk: 'Заклади вищої освіти', labelEn: 'Higher Education', href: () => resolve('/projects/galaxy-graduates/institutions') },
					{ id: 'galaxy-masters', icon: 'graduation-cap', labelUk: 'Зіркові митці (майстри курсів)', labelEn: 'Star Artists (Masters)', href: () => resolve('/projects/galaxy-graduates/masters') },
					{ id: 'galaxy-friends', icon: 'book-heart', labelUk: 'Зіркові друзі', labelEn: 'Star Friends', href: () => resolve('/projects/galaxy-graduates/friends') },
					{ id: 'galaxy-update', icon: 'plus', labelUk: 'Долучитися / оновити дані', labelEn: 'Join / Update Info', href: () => resolve('/projects/galaxy-graduates/update') }
				]
			}
		]
	}
];
