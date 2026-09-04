import { UKRAINIAN_HOLIDAYS } from '$lib/config/ukrainianHolidays';
/**
 * Дані чеклиста бета-тестування (BETA-CHECKLIST-v8).
 *
 * Це ДАНІ з інваріантами, а не текст. Різниця в тому, що текст ніхто не звіряє з
 * кодом: він застаріває мовчки й починає казати «перевірено» про те, чого вже
 * немає. Канон називає чеклист-у-вигляді-`QA.md` анти-патерном рівня HIGH саме
 * тому. Інваріанти живуть у `src/beta-checklist.test.ts`.
 *
 * ЧОМУ ТЕКСТИ ПУНКТІВ НЕ У СЛОВНИКУ. Їх два десятки, вони змінюються іншим
 * циклом, ніж інтерфейс, і паритет ключів (`translations.test.ts`) робив би
 * кожну правку двократною плюс тримав би в словнику інтерфейсу службовий текст,
 * якого не бачить жоден відвідувач. Обидві мови лежать в ОДНОМУ об'єкті, тож
 * відповідність вимагає ТИП: пункт без англійського тексту не збереться. У чужій
 * реалізації, де мови лежали двома деревами файлів, для цього знадобилося окреме
 * правило й окремий скрипт.
 *
 * З тієї самої причини тут же лежать і підписи самої сторінки (`UI_TEXT`): вона
 * службова, живе в двох мовах і правиться разом із пунктами.
 *
 * ЯК ПИСАТИ ПУНКТ (§ 2.1, § 7.2):
 *   • дія + ВИДИМИЙ або чутний наслідок. «Теми мусять працювати» — не пункт;
 *   • жодних внутрішніх назв: файлів, локаторів, сервісів, рун;
 *   • номер малює сторінка з позиції — у тексті його немає;
 *   • пункт пишеться ПІСЛЯ читання коду, який малює екран. У чужому чеклисті з
 *     90 пунктів вісім описували неправду, і три з них були просто вигадані.
 *
 * `id` СТАБІЛЬНИЙ НАЗАВЖДИ: у ньому лежить прогрес живої людини. Новий пункт
 * дописується з новим номером; перенумеровувати наявні не можна навіть тоді,
 * коли порядок змінився.
 */

export interface Localized {
	uk: string;
	en: string;
}

/**
 * Три рівні покриття (§ 3). Порядок показу — саме такий, і це не косметика:
 * людина витрачається спершу там, де машини немає; `testable` — готовий беклог
 * тестів із назвами; `covered` лишається контрольною групою — помилка, знайдена
 * в покритому місці, це звіт про дефект ТЕСТА, а не сайту.
 */
export type Coverage = 'manual' | 'testable' | 'covered';

export const COVERAGE_ORDER: readonly Coverage[] = ['manual', 'testable', 'covered'];

export interface BetaCheck {
	/** Стабільний назавжди, форма `{вкладка}_{номер}`. */
	id: string;
	category: Localized;
	text: Localized;
	coverage: Coverage;
	/** Обов'язковий для `covered`, заборонений для решти. Шлях від кореня репозиторію. */
	test?: string;
	/** Обов'язковий там, де в тексті є «натисніть». Мусить існувати в джерелах. */
	testid?: string;
	/** Перевірка МЕЖІ — «не мусить». Обов'язкова в кожній вкладці. */
	negative?: true;
}

export interface BetaTab {
	id: string;
	title: Localized;
	/**
	 * Маршрути, які ця вкладка заявляє. Саме маршрути, а не сторінки словами:
	 * перелік адрес у проєкті вже є (`prerender.entries`), і його ніхто не забуде
	 * поповнити — без нього сторінки просто не буде. Другий список, узгоджений
	 * руками, розійшовся б із першим на першій же новій сторінці.
	 */
	routes: readonly string[];
	checks: readonly BetaCheck[];
}

/**
 * Адреси, яким чеклист не потрібен. Виняток оформлюється ЯВНО, а не відсутністю
 * рядка: інакше забута сторінка виглядає точно так само, як свідомо пропущена.
 *
 * 2026-09-04, перші два записи. Обидві адреси існують заради ПРЕВ'Ю в
 * месенджері: посилання роздають руками, а `?update=open` / `?form=open`
 * власного підпису мати не можуть — query-рядок у мета-теги не потрапляє.
 * Власного вмісту в них нуль: сторінка везе мета-теги й одразу веде в галактику
 * з відкритим вікном.
 *
 * Тому перевіряти в них НІЧОГО: те, що людина побачить, — це вікно галактики, і
 * воно вже заявлене вкладкою галактики. Пункт «відкрийте адресу — маєте
 * побачити те саме вікно» дублював би наявний і старів би разом із ним.
 */
export const BETA_UNCOVERED_ROUTES: readonly string[] = [
	'/projects/galaxy-graduates/update',
	'/projects/galaxy-graduates/form'
];

export const BETA_TABS: readonly BetaTab[] = [
	{
		id: 'common',
		title: { uk: 'Спільне для сайту', en: 'Site-wide' },
		routes: ['/'],
		checks: [
			{
				id: 'common_1',
				category: { uk: 'Теми', en: 'Themes' },
				text: {
					uk: 'Натисніть кнопку налаштувань у шапці (шестерня). Мусить відкритися панель, у ній — дві мови й чотири теми, поточні позначені. Вибір теми одразу міняє кольори сторінки.',
					en: 'Press the settings button in the header (the gear). A panel must open with two languages and four themes, the current ones marked. Picking a theme changes the page colours at once.'
				},
				coverage: 'manual',
				testid: 'header-settings-btn'
			},
			{
				id: 'common_2',
				category: { uk: 'Теми', en: 'Themes' },
				text: {
					uk: 'Увімкніть темну тему й оновіть сторінку. Світлого блимання на першому кадрі бути НЕ мусить — сторінка мусить з’явитися вже темною.',
					en: 'Switch to the dark theme and reload the page. There must be NO light flash on the first frame — the page must appear dark already.'
				},
				coverage: 'manual',
				negative: true
			},
			{
				id: 'common_3',
				category: { uk: 'Мова', en: 'Language' },
				text: {
					uk: 'Натисніть EN у панелі налаштувань. В адресі мусить з’явитися /en/, а текст сторінки — стати англійським. Натисніть УКР — адреса мусить повернутися без префікса.',
					en: 'Press EN in the settings panel. The address must gain /en/ and the page text must switch to English. Press the Ukrainian button — the address must go back without the prefix.'
				},
				coverage: 'testable',
				testid: 'lang-en-btn'
			},
			{
				id: 'common_4',
				category: { uk: 'Клавіатура', en: 'Keyboard' },
				text: {
					uk: 'Не торкаючись мишки, пройдіть сторінку клавішею Tab від самого початку. На кожному кроці мусить бути видно, що саме зараз вибрано, і перший крок мусить давати посилання «Перейти до основного вмісту».',
					en: 'Without touching the mouse, walk the page with Tab from the very start. At every step it must be visible what is selected, and the first step must offer a “skip to main content” link.'
				},
				coverage: 'manual'
			},
			{
				id: 'common_5',
				category: { uk: 'Посилання', en: 'Links' },
				text: {
					uk: 'Пройдіть усіма посиланнями підвалу. Жодне НЕ мусить приводити на сторінку «Сторінку не знайдено».',
					en: 'Follow every link in the footer. None of them must land on a “page not found” screen.'
				},
				coverage: 'covered',
				test: 'scripts/check-links.ts',
				negative: true
			},
			{
				id: 'common_6',
				category: { uk: 'Пошта', en: 'Email' },
				text: {
					uk: 'Натисніть адресу пошти в підвалі. Замість поштової програми мусить з’явитися підказка біля самої адреси про те, що адресу скопійовано, і в буфері мусить справді бути адреса.',
					en: 'Press the email address in the footer. Instead of a mail client, a hint must appear next to the address itself saying it was copied — and the clipboard must really hold the address.'
				},
				coverage: 'covered',
				test: 'e2e/email-toast.spec.ts',
				testid: 'footer-email-link'
			}
		]
	},
	{
		id: 'pages',
		title: { uk: 'Сторінки з текстом', en: 'Text pages' },
		routes: [
			'/about',
			'/history',
			'/contacts',
			'/admission',
			'/documents',
			'/documents/statute',
			'/departments/theatre',
			'/departments/aesthetic',
			'/departments/music',
			'/departments/art',
			'/residents/adults',
			'/residents/kids',
			'/residents/graduates'
		],
		checks: [
			{
				id: 'pages_1',
				category: { uk: 'Вміст', en: 'Content' },
				text: {
					uk: 'Відкрийте «Про школу», «Історію» та «Вступ». Кожна мусить показати текст, а не порожню сторінку й не напис «Завантаження…», що лишився назавжди.',
					en: 'Open “About”, “History” and “Admission”. Each must show text — not an empty page and not a “Loading…” caption that stays forever.'
				},
				coverage: 'covered',
				test: 'e2e/smoke.spec.ts'
			},
			{
				id: 'pages_2',
				category: { uk: 'Вузький екран', en: 'Narrow screen' },
				text: {
					uk: 'Відкрийте «Контакти» на телефоні (або звузьте вікно до ширини телефона). Жоден текст НЕ мусить вилазити за край екрана, і сторінка НЕ мусить прокручуватися вбік.',
					en: 'Open “Contacts” on a phone (or narrow the window to phone width). No text must run off the edge, and the page must NOT scroll sideways.'
				},
				coverage: 'manual',
				negative: true
			},
			{
				id: 'pages_3',
				category: { uk: 'Читабельність', en: 'Readability' },
				text: {
					uk: 'Переберіть усі чотири теми на сторінці «Відділення: театральне». Кожен напис мусить лишатися читабельним — жоден НЕ мусить зливатися з тлом.',
					en: 'Go through all four themes on the “Theatre department” page. Every caption must stay readable — none may blend into the background.'
				},
				coverage: 'testable',
				negative: true
			},
			{
				id: 'pages_4',
				category: { uk: 'Світлини', en: 'Photos' },
				text: {
					uk: 'Відкрийте «Про школу» й натисніть будь-яку світлину галереї. Мусить відкритися велике зображення з підписом; клавіша Esc мусить його закрити.',
					en: 'Open “About” and press any gallery photo. A large image with a caption must open; Esc must close it.'
				},
				coverage: 'manual',
				testid: 'about-gallery-list'
			}
		]
	},
	{
		id: 'content',
		title: { uk: 'Новини й проєкти з бази', en: 'News and projects from the database' },
		routes: ['/news', '/news/30-y-sezon-i-17-studentiv-2026', '/projects'],
		checks: [
			{
				id: 'content_1',
				category: { uk: 'Новини', en: 'News' },
				text: {
					uk: 'Відкрийте «Новини». Спершу мусять з’явитися сірі заготовки карток, а за ними — самі новини з датами. Напис «Завантаження…» назавжди лишитися НЕ мусить.',
					en: 'Open “News”. Grey card placeholders must appear first, then the news items themselves with dates. A “Loading…” caption must NOT stay forever.'
				},
				coverage: 'manual',
				negative: true
			},
			{
				id: 'content_2',
				category: { uk: 'Новини', en: 'News' },
				text: {
					uk: 'Відкрийте новину зі списку, а потім поверніться кнопкою «назад» браузера. Список мусить лишитися на тому самому місці, а не поїхати на початок.',
					en: 'Open a news item from the list, then use the browser’s back button. The list must stay where it was instead of jumping to the top.'
				},
				coverage: 'manual'
			},
			{
				id: 'content_3',
				category: { uk: 'Мова', en: 'Language' },
				text: {
					uk: 'Перемкніть мову на англійську, стоячи на сторінці новини. Сторінка мусить лишитися тією самою новиною, а не повернути вас у список.',
					en: 'Switch the language to English while on a news item page. The page must stay on the same news item instead of returning you to the list.'
				},
				coverage: 'testable'
			},
			{
				id: 'content_4',
				category: { uk: 'Гарячі новини', en: 'Hot news' },
				text: {
					uk: 'Якщо під шапкою є смужка з гарячою новиною — закрийте її й оновіть сторінку. Та сама смужка з’явитися вдруге НЕ мусить.',
					en: 'If there is a hot-news strip under the header, close it and reload the page. The same strip must NOT come back.'
				},
				coverage: 'testable',
				negative: true
			},
			{
				id: 'content_5',
				category: { uk: 'Новина з коду', en: 'News from the code' },
				text: {
					uk: 'Відкрийте новину «Знімки початку навчального року» й вимкніть JavaScript (або подивіться вихідний код сторінки). Текст новини й одинадцять знімків мусять бути ВЖЕ в ньому — це новина з репозиторію, а не з бази.',
					en: 'Open the story “Photos from the start of the school year” and disable JavaScript (or view the page source). The text and all eleven photos must already be there — this story lives in the repository, not in the database.'
				},
				coverage: 'testable',
				testid: 'article-gallery-list'
			},
			{
				id: 'content_6',
				category: { uk: 'Новина з коду', en: 'News from the code' },
				text: {
					uk: 'На тій самій новині натисніть будь-який знімок — має відкритися велике фото зі стрілками. Далі надішліть посилання на новину собі в Telegram: у прев’ю мусить бути назва саме цієї новини, а не «Одеська театральна школа».',
					en: 'On the same story click any photo — a large image with arrows must open. Then send the story link to yourself in Telegram: the preview must show this story’s own title, not “Odesa Theatre School”.'
				},
				coverage: 'manual',
				testid: 'article-gallery-img-0'
			}
		]
	},
	{
		id: 'projects',
		title: { uk: 'Проєкти й галактика випускників', en: 'Projects and the graduates galaxy' },
		routes: [
			'/projects/teatr-pro',
			'/projects/festival',
			'/projects/galaxy-graduates',
			'/projects/photo-archive',
			'/projects/spring-odesa-theatre',
			'/projects/support-production',
			'/fest-odesa-teatr-pro',
			'/fest-odessa-teatr-pro'
		],
		checks: [
			{
				id: 'projects_1',
				category: { uk: 'Галактика', en: 'Galaxy' },
				text: {
					uk: 'Відкрийте «Галактику випускників». Імена мусять летіти по всьому екрані, і жодне НЕ мусить перетинати край — тобто обрізаних імен бути не мусить.',
					en: 'Open the “Graduates galaxy”. Names must drift across the whole screen, and none may cross the edge — no clipped names.'
				},
				coverage: 'testable',
				negative: true
			},
			{
				id: 'projects_2',
				category: { uk: 'Галактика', en: 'Galaxy' },
				text: {
					uk: 'Наведіть курсор на одне ім’я в галактиці. Зупинитися мусить лише воно; решта імен мусить летіти далі.',
					en: 'Hover one name in the galaxy. Only that one must stop; the rest must keep drifting.'
				},
				coverage: 'manual'
			},
			{
				id: 'projects_3',
				category: { uk: 'Перелік випускників', en: 'Graduates list' },
				text: {
					uk: 'Натисніть «Повний перелік» і почніть друкувати прізвище. Список мусить звужуватися на кожну літеру, а роки — лишатися підписами розділів.',
					en: 'Press “Full list” and start typing a surname. The list must narrow with every letter, while the years stay as section headings.'
				},
				coverage: 'covered',
				test: 'e2e/galaxy-roster.spec.ts',
				testid: 'galaxy-open-roster-btn'
			},
			{
				id: 'projects_4',
				category: { uk: 'Старі адреси', en: 'Old addresses' },
				text: {
					uk: 'Відкрийте адресу teatralo4ka.odesa.ua/fest-odesa-teatr-pro. Вас мусить перекинути на сторінку «Театр PRO», а не показати порожню сторінку.',
					en: 'Open teatralo4ka.odesa.ua/fest-odesa-teatr-pro. You must be redirected to the “Teatr PRO” page instead of seeing an empty page.'
				},
				coverage: 'covered',
				test: 'e2e/redirects.spec.ts'
			}
		]
	},
	{
		id: 'admin',
		title: { uk: 'Адмінка', en: 'Admin panel' },
		routes: ['/admin', '/admin/login'],
		checks: [
			{
				id: 'admin_1',
				category: { uk: 'Вхід', en: 'Sign-in' },
				text: {
					uk: 'Введіть неправильний пароль на сторінці входу. Мусить з’явитися зрозуміле повідомлення українською, а НЕ технічний текст із назвами полів чи кодами.',
					en: 'Enter a wrong password on the sign-in page. A plain-language message must appear — NOT technical text with field names or codes.'
				},
				coverage: 'manual',
				testid: 'admin-login-submit-btn',
				negative: true
			},
			{
				id: 'admin_2',
				category: { uk: 'Вхід', en: 'Sign-in' },
				text: {
					uk: 'Натисніть кнопку показу пароля в полі. Пароль мусить стати видимим, а курсор — лишитися в тому самому місці рядка. Увімкніть CapsLock — мусить з’явитися попередження.',
					en: 'Press the reveal button in the password field. The password must become visible and the cursor must stay in the same spot. Turn CapsLock on — a warning must appear.'
				},
				coverage: 'manual',
				testid: 'admin-login-email-input'
			},
			{
				id: 'admin_3',
				category: { uk: 'Статті', en: 'Articles' },
				text: {
					uk: 'Створіть статтю, збережіть, і одразу натисніть «Зберегти» вдруге. Другий раз мусить дати зрозуміле повідомлення про зачекати, а не другу копію статті в списку.',
					en: 'Create an article, save it, then press “Save” again immediately. The second time must give a plain message asking you to wait — not a second copy of the article in the list.'
				},
				coverage: 'manual',
				testid: 'admin-articles-create-btn',
				negative: true
			},
			{
				id: 'admin_4',
				category: { uk: 'Статті', en: 'Articles' },
				text: {
					uk: 'Збережіть статтю, заповнивши обидві мови, і відкрийте її на сайті англійською. Мусить показатися англійський текст, а не український.',
					en: 'Save an article with both languages filled in and open it on the site in English. The English text must show, not the Ukrainian one.'
				},
				coverage: 'testable'
			},
			{
				id: 'admin_5',
				category: { uk: 'Поля дати', en: 'Date fields' },
				text: {
					uk: 'Увімкніть у САМІЙ СИСТЕМІ темне оформлення, лишивши на сайті звичайну світлу тему, і відкрийте поле дати статті. Іконка календаря мусить бути видимою на світлому полі, а не світлою на світлому.',
					en: 'Turn on dark appearance in the OPERATING SYSTEM while keeping the ordinary light theme on the site, then open an article’s date field. The calendar icon must stay visible on the light field, not light-on-light.'
				},
				coverage: 'manual'
			},
			/*
			 * Два пункти 2026-08-23, обидва про те, що з'явилося разом із
			 * `light-dark()` у палітрі (UI-UX-v8 § 1.5.1).
			 *
			 * Перший перевіряє ВИГРАШ: сторінка тепер бере системну тему без
			 * жодного JS. Автотестом це не міряється чесно — Playwright ганяє
			 * сторінку з увімкненим JS, а вимкнути його означає перевіряти інший
			 * застосунок.
			 *
			 * Другий перевіряє ЦІНУ, і саме тому він тут, а не в коментарі: явний
			 * вибір світлої теми тепер звужує `color-scheme` до `light`, і на
			 * Android Chrome із увімкненим Force Dark це дозволяє браузеру
			 * інвертувати кольори. Перевірити можна лише на пристрої.
			 */
			{
				id: 'admin_6',
				category: { uk: 'Тема', en: 'Theme' },
				text: {
					uk: 'Вимкніть JavaScript у браузері (у Chrome: Налаштування > Конфіденційність > Налаштування сайтів > JavaScript) і відкрийте головну при ТЕМНОМУ оформленні системи. Сторінка мусить бути темною і читабельною; світла сторінка або темне тло зі темним текстом — дефект.',
					en: 'Turn JavaScript off in the browser (Chrome: Settings > Privacy > Site settings > JavaScript) and open the home page with the SYSTEM set to dark. The page must come up dark and readable; a light page, or a dark background with dark text, is a defect.'
				},
				coverage: 'manual'
			},
			{
				id: 'admin_7',
				category: { uk: 'Тема', en: 'Theme' },
				text: {
					uk: 'На Android-телефоні увімкніть у Chrome примусову темну тему (Налаштування > Спеціальні можливості > Примусова темна тема сайтів), оберіть на сайті ЯВНО світлу тему й відкрийте головну. Якщо браузер інвертує кольори — це відома ціна того, що явний вибір світлої теми звужує color-scheme; запишіть, наскільки зле це виглядає.',
					en: 'On an Android phone turn on Chrome’s force dark mode (Settings > Accessibility > Force dark mode for sites), pick the LIGHT theme on the site explicitly and open the home page. If the browser inverts the colours, that is the known cost of narrowing color-scheme for an explicit light choice; note how bad it looks.'
				},
				coverage: 'manual'
			},
			/*
			 * Святкові куліси. Число дат береться з `config/ukrainianHolidays.ts`, а
			 * не вписане: коли перелік поповнять, текст пункту оновиться сам, і
			 * тестувальник не звірятиметься зі старим числом.
			 *
			 * Пункт РУЧНИЙ, хоча гейт `e2e/splash.spec.ts` вже перевіряє і дату, і
			 * кольори половин. Машина міряє, що прапор УВІМКНУВСЯ й що стопи
			 * градієнта правильні; чи він при цьому виглядає як прапор, а не як
			 * брудна пляма, вона не бачить — і саме на цьому я вже спіймався: перша
			 * редакція давала оливкову смугу внизу, бо синій фестон лежав на жовтій
			 * половині при 55% прозорості.
			 */
			{
				id: 'admin_8',
				category: { uk: 'Заставка', en: 'Splash' },
				text: {
					uk: `Відкрийте головну з додатком ?splash=flag в адресі — тобто /?splash=flag. Заставка мусить бути прапором: синя половина згори, жовта знизу, складки тканини видно на обох. Так само мусить бути і в темній темі. Саме собою це оформлення з’являється у ${UKRAINIAN_HOLIDAYS.length} державних свят на рік, тому іншого способу подивитися його в будь-який день немає.`,
					en: `Open the home page with ?splash=flag added to the address — that is /?splash=flag. The splash must be a flag: blue half on top, yellow below, fabric folds visible on both. The dark theme must look the same. On its own this appears on ${UKRAINIAN_HOLIDAYS.length} national holidays a year, so there is no other way to see it on an ordinary day.`
				},
				coverage: 'manual'
			},
			{
				id: 'admin_9',
				category: { uk: 'Заставка', en: 'Splash' },
				text: {
					uk: 'Зайдіть НАПРЯМУ на внутрішню сторінку (наприклад /contacts/) у приватному вікні. Заставка мусить дограти до кінця — куліси розходяться в боки, — а не зникнути раптово посеред анімації.',
					en: 'Open an inner page DIRECTLY (for example /contacts/) in a private window. The splash must play through to the end — the curtains part to the sides — instead of vanishing abruptly mid-animation.'
				},
				coverage: 'testable'
			}
		]
	}
];

/** Усі пункти одним переліком — у порядку оголошення. */
export const BETA_CHECKS: readonly BetaCheck[] = BETA_TABS.flatMap((tab) => tab.checks);

/**
 * Підписи сторінки. Тут, а не у словнику інтерфейсу — причина у шапці файлу.
 */
export const UI_TEXT = {
	pageTitle: { uk: 'Чеклист бета-тестування', en: 'Beta testing checklist' },
	intro: {
		uk: 'Список того, чого не вміє перевірити машина. Позначки зберігаються лише у вашому браузері й нікуди не надсилаються. Наприкінці натисніть «Скопіювати звіт» і надішліть текст автору.',
		en: 'A list of what machines cannot check. Your marks stay in this browser only and are never sent anywhere. When done, press “Copy report” and send the text to the author.'
	},
	levels: {
		manual: {
			uk: 'Лише людина — машина цього не вміє',
			en: 'Human only — machines cannot do this'
		},
		testable: {
			uk: 'Автотест можливий, але його ще немає',
			en: 'Automatable, but no test yet'
		},
		covered: {
			uk: 'Покрито автотестом — тут помилка означає дефект ТЕСТА',
			en: 'Covered by a test — a failure here means the TEST is broken'
		}
	},
	votes: {
		fail: { uk: 'Не працює', en: 'Broken' },
		weird: { uk: 'Працює, але дивно', en: 'Works, but odd' },
		ok: { uk: 'Працює', en: 'Works' }
	},
	progress: { uk: 'Позначено на цій версії', en: 'Marked on this version' },
	stale: { uk: 'позначено на іншій версії', en: 'marked on another version' },
	report: { uk: 'Скопіювати звіт', en: 'Copy report' },
	reportCopied: { uk: 'Звіт у буфері обміну', en: 'Report copied to clipboard' },
	reportFallback: {
		uk: 'Буфер обміну недоступний — скопіюйте текст із поля нижче',
		en: 'Clipboard unavailable — copy the text from the field below'
	},
	clear: { uk: 'Стерти всі позначки', en: 'Clear all marks' },
	clearConfirm: {
		uk: 'Стерти всі позначки цього чеклиста?',
		en: 'Clear every mark in this checklist?'
	},
	coveredBy: { uk: 'Покрито', en: 'Covered by' }
} as const;
