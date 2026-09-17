import { UKRAINIAN_HOLIDAYS } from '$lib/config/ukrainianHolidays';
import { RENAMED_NEWS_IDS } from '$lib/config/newsAliases';
import { RENAMED_PATHS } from '$lib/config/renamedAddresses';
import { CODE_NEWS } from '$lib/config/codeNews';
/**
 * Дані чеклиста бета-тестування (BETA-CHECKLIST-v9).
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
	'/projects/galaxy-graduates/form',
	/*
	 * Старі адреси перейменованих новин — ВИВОДЯТЬСЯ, а не перелічуються.
	 *
	 * Перевіряти там нема чого: людина цієї сторінки не побачить, браузер піде
	 * далі. Що вона існує й веде куди треба, стереже `e2e/redirects.spec.ts`.
	 *
	 * Саме виводяться, бо наступне перейменування інакше знову впало б цим
	 * гейтом, і хтось дописав би рядок руками — а це вже другий список тих
	 * самих адрес. Заглушки `/fest-*` тут навпаки НЕ виводяться: у них у
	 * чеклисті є свої пункти, і це навмисно.
	 */
	...Object.keys(RENAMED_NEWS_IDS).map((id) => `/news/${id}`),
	/*
	 * Перейменовані адреси сторінок — так само виводяться, і з тієї ж причини.
	 *
	 * Виводяться саме звідси, а не з `config/redirects.ts`: там поруч лежать
	 * заглушки `/fest-*`, і в них у чеклисті СВОЇ пункти. Вивести звідти
	 * означало б мовчки зняти з перевірки й ті дві.
	 */
	...RENAMED_PATHS.map(([старий]) => старий)
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
				id: 'common_7',
				category: { uk: 'Теми', en: 'Themes' },
				text: {
					uk: 'На комп’ютері наведіть курсор на кнопку теми, якою ЗАРАЗ не користуєтесь, і не натискайте. Сторінка мусить показати цю тему цілком, а щойно ви заберете курсор — повернутися до попередньої. Самі кнопки тем мусять бути пофарбовані кожна під СВОЮ тему, а не всі під поточну.',
					en: 'On a desktop, hover the button of a theme you are NOT using and do not click. The page must show that theme in full, and return to the previous one as soon as the pointer leaves. The theme buttons themselves must each be coloured in THEIR OWN theme, not all in the current one.'
				},
				coverage: 'manual',
				testid: 'settings-theme-options-list'
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
			},
			/*
			 * ЗАЦИКЛЕНА ГОЛОВНА: три пункти, і всі три `manual` навмисно.
			 *
			 * Механізм накритий `e2e/endless-scroll.spec.ts` щільно — перестановка
			 * в обидва боки, збіг шва за текстом і глибиною заголовка, відсутність
			 * дублікатів, кільцевий повзунок, Home/End, зникнення кнопки «нагору».
			 * Дублювати це пунктами означало б роздути чеклист контрольною групою.
			 *
			 * Лишилося рівно те, чого браузер під Playwright не відтворює:
			 * ІНЕРЦІЯ справжнього тачпада (перевірка стрибає миттєвим `scrollTo`,
			 * а людина котить колесо з розгоном), СВІДОМА ЦІНА рішення — копія в
			 * переході не інтерактивна, — і ДОВГИЙ сеанс, якого автотест не живе.
			 *
			 * Другий пункт тут найцінніший, і не тому, що ловить дефект: він
			 * ЗАПОБІГАЄ хибному звіту. Тестувальник, який клацне по знімку на шві
			 * й нічого не дістане, напише «не працюють фото» — і матиме рацію в
			 * описі й помилиться у висновку.
			 */
			{
				id: 'common_8',
				category: { uk: 'Нескінченна головна', en: 'Endless home page' },
				text: {
					uk: 'На комп’ютері гортайте головну колесом донизу, не зупиняючись. Після галереї сторінка мусить продовжитися власним початком і піти на нове коло — без стрибка вмісту, без миготіння й без паузи. Те саме вгору: від шапки мусить відкритися кінець сторінки.',
					en: 'On a desktop, scroll the home page down with the wheel without stopping. After the gallery it must continue with its own beginning and start a new lap — with no content jump, no flicker and no pause. The same upwards: scrolling up from the header must reveal the end of the page.'
				},
				coverage: 'manual'
			},
			{
				id: 'common_9',
				category: { uk: 'Нескінченна головна', en: 'Endless home page' },
				text: {
					uk: 'Зупиніться на переході — коли вгорі екрана ще кінець сторінки, а внизу вже її початок. Знімки й посилання в НИЖНІЙ половині екрана там відкриватися НЕ мусять, і круглої стрілки «нагору» в кутку бути не мусить. Догорніть ще на один екран — усе нижнє мусить знову працювати.',
					en: 'Stop at the joint — where the top of the screen still shows the end of the page and the bottom already shows its beginning. Photos and links in the LOWER half must NOT open there, and the round “back to top” arrow must be absent. Scroll one more screen — everything below must work again.'
				},
				coverage: 'manual',
				negative: true
			},
			{
				id: 'common_10',
				category: { uk: 'Нескінченна головна', en: 'Endless home page' },
				text: {
					uk: 'Пройдіть головну десять кіл поспіль. Десяте коло мусить гортатися так само швидко, як перше, а вкладка браузера — не важчати й не сповільнюватися.',
					en: 'Go through the home page for ten laps in a row. The tenth lap must scroll just as fast as the first, and the browser tab must not grow heavier or slow down.'
				},
				coverage: 'manual'
			},
			{
				id: 'common_11',
				category: { uk: 'Пошук', en: 'Search' },
				text: {
					uk: 'Не відкриваючи нічого мишкою, натисніть на клавіатурі «S». Мусить відкритися пошук, і курсор мусить одразу стояти в його полі. Те саме мусить спрацювати й тоді, коли на клавіатурі зараз українська розкладка.',
					en: 'Without opening anything with the mouse, press “S” on the keyboard. Search must open with the cursor already in its field. The same must work when the keyboard is currently in a non-Latin layout.'
				},
				coverage: 'manual',
				testid: 'header-search-btn'
			},
			{
				id: 'common_12',
				category: { uk: 'Пошук', en: 'Search' },
				text: {
					uk: 'Наберіть у пошуку кілька літер і, не чіпаючи стрілок, натисніть Enter. Мусить відкритися той результат, який підсвічений першим.',
					en: 'Type a few letters into search and, without touching the arrow keys, press Enter. The result highlighted first must open.'
				},
				coverage: 'manual',
				testid: 'header-search-btn'
			},
			{
				id: 'common_13',
				category: { uk: 'Пошук', en: 'Search' },
				text: {
					uk: 'Наберіть у пошуку слово з ОДНІЄЮ помилковою літерою — наприклад «ляпоси» замість «ляпаси». Потрібне мусить знайтися попри помилку.',
					en: 'Type a word with ONE wrong letter into search — for example “teatre” instead of “theatre”. What you were looking for must still be found.'
				},
				coverage: 'manual'
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
					uk: 'Відкрийте «Про школу» й натисніть будь-яку світлину галереї. Мусить відкритися велике зображення, ліворуч — стрічка квадратних прев’ю з підсвіченою поточною; колесо миші гортає світлини, клавіша Esc закриває.',
					en: 'Open “About” and press any gallery photo. A large image must open with a rail of square previews on the left, the current one highlighted; the mouse wheel pages through the photos and Esc closes it.'
				},
				coverage: 'manual',
				testid: 'about-gallery-list'
			}
		]
	},
	{
		id: 'content',
		title: { uk: 'Новини й проєкти з бази', en: 'News and projects from the database' },
		/*
		 * Адреси новин із коду ВИВОДЯТЬСЯ з реєстру, а не перелічуються.
		 *
		 * Доти вони стояли рядком, і кожна нова новина валила гейт «сторінка є, а
		 * перевіряти її нічим» — тобто той, хто додавав новину, дописував сюди
		 * адресу руками. Це другий перелік тих самих адрес, і саме про таке вже
		 * записано вище, біля перейменованих: наступне перейменування знову впало б
		 * цим гейтом, і хтось дописав би рядок.
		 *
		 * Перевіряють їх ті самі пункти, що й решту новин: вкладка про те, ЯК
		 * виглядає новина, а не про яку саме.
		 */
		routes: ['/news', ...CODE_NEWS.map((новина) => `/news/${новина.id}`), '/projects'],
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
			},
			{
				id: 'content_7',
				category: { uk: 'Люди в тексті', en: 'People in the text' },
				text: {
					uk: 'Відкрийте новину, де згадані наші випускники чи викладачі. Перед кожним таким іменем мусить стояти кружечок: знімок, а в кого його ще немає — перша літера імені. Ім’я з кружечком НЕ мусить розриватися на два рядки.',
					en: 'Open a story that mentions our graduates or teachers. Every such name must be preceded by a circle: a photograph, or the first letter for those who have none yet. A name with its circle must NOT break across two lines.'
				},
				coverage: 'manual',
				negative: true
			},
			{
				id: 'content_8',
				category: { uk: 'Люди в тексті', en: 'People in the text' },
				text: {
					uk: 'На комп’ютері наведіть курсор на таке ім’я. Поруч мусить з’явитися невелика картка: обличчя, ім’я, рік випуску, майстри курсу школи, а нижче — заклад освіти й окремо його майстер курсу.',
					en: 'On a desktop, hover such a name. A small card must appear next to it: the face, the name, the graduation year, the school course masters, and below them the place of study with its own course master.'
				},
				coverage: 'manual'
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
			'/projects/creativity-planet',
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
			},
			{
				/*
				 * Дописано при переході на канон 9.3 (§ 3.4): вкладка мала один
				 * пункт для людини проти двох покритих, тобто контрольна група була
				 * більшою за роботу. Пункт написаний після читання `stopSlideshow()`
				 * у `routes/projects/galaxy-graduates/+page.svelte` — там же лежить
				 * і причина: автор одного разу вже побачив, що зупинка з рядка
				 * налаштувань гасила показ і ЛИШАЛА відкритою анкету останнього.
				 */
				id: 'projects_5',
				category: { uk: 'Показ анкет', en: 'Slideshow' },
				testid: 'galaxy-slideshow-stop-btn',
				text: {
					uk: 'Запустіть показ анкет у галактиці, дочекайтеся другої-третьої людини й натисніть «Спинити показ» у рядку налаштувань. На екрані мусить лишитися сама галактика: ні відкритої анкети, ні повноекранного режиму лишатися НЕ мусить.',
					en: 'Start the graduate slideshow in the galaxy, wait for the second or third person and press “Stop the slideshow” in the settings row. Only the galaxy itself must remain: no open profile card and no full-screen mode may stay behind.'
				},
				coverage: 'manual',
				negative: true
			},
			{
				id: 'projects_6',
				category: { uk: 'Показ анкет', en: 'Profile slideshow' },
				text: {
					uk: 'Пустіть показ анкет і просто на ходу перемкніть «Кого показувати» на «З закладом освіти або театром». Наступні анкети мусять бути лише тих, у кого заклад або театр справді вказані.',
					en: 'Start the profile slideshow and switch “Who to show” to “With a school or a theatre” while it runs. The profiles that follow must be only of people who really have a school or a theatre listed.'
				},
				coverage: 'manual',
				testid: 'galaxy-slideshow-filter-select'
			},
			{
				id: 'projects_7',
				category: { uk: 'Показ анкет', en: 'Profile slideshow' },
				text: {
					uk: 'Подивіться показ хвилину поспіль. Анкета мусить з’являтися одразу цілою: змісту, який дописується за мить після появи й зсуває все вниз, бути НЕ мусить.',
					en: 'Watch the slideshow for a minute. Each profile must appear complete at once: there must be NO content that arrives a moment later and pushes everything down.'
				},
				coverage: 'manual',
				negative: true
			},
			{
				id: 'projects_8',
				category: { uk: 'Анкета', en: 'Profile' },
				text: {
					uk: 'Відкрийте анкету людини, у якої є розділ «Фотографії». Знімки мусять гортатися стрілками, а крапки під ними мусять лишатися круглими навіть тоді, коли знімків кілька десятків. Натисніть будь-який — мусить відкритися на весь екран.',
					en: 'Open the profile of someone who has a “Photographs” section. The shots must be flipped with arrows, and the dots beneath them must stay round even when there are dozens of shots. Press any one — it must open full screen.'
				},
				coverage: 'manual',
				testid: 'galaxy-card-gallery-card'
			}
		]
	},
	{
		id: 'galaxy',
		title: { uk: 'Розділи галактики', en: 'Galaxy sections' },
		/*
		 * П'ять окремих сторінок, і жодної з них доти в чеклисті не було.
		 *
		 * Не тому, що їх пропустили оком: перевірка «кожен маршрут заявлений
		 * вкладкою» брала адреси зі списку, вписаного руками, а ці сторінки
		 * пререндеряться власними переліками — тобто в тому списку їх немає й
		 * не буде. Тепер адреси беруться ще й з файлової системи, і сторінка,
		 * яку нема кому перевіряти, називає себе сама.
		 */
		routes: [
			'/projects/galaxy-graduates/plays',
			'/projects/galaxy-graduates/groups',
			'/projects/galaxy-graduates/festivals',
			'/projects/galaxy-graduates/institutions',
			'/projects/galaxy-graduates/theatres',
			'/projects/galaxy-graduates/masters',
			'/projects/galaxy-graduates/friends'
		],
		checks: [
			{
				id: 'galaxy_1',
				category: { uk: 'Переліки', en: 'Listings' },
				text: {
					uk: 'Відкрийте «Вистави», «Групи», «Фестивалі», «Навчальні заклади» й «Театри». Кожен перелік мусить показати картки, а не порожнє місце й не напис про помилку.',
					en: 'Open “Plays”, “Groups”, “Festivals”, “Schools and universities” and “Theatres”. Every listing must show cards, not an empty space and not an error message.'
				},
				coverage: 'manual'
			},
			{
				id: 'galaxy_2',
				category: { uk: 'Переліки', en: 'Listings' },
				text: {
					uk: 'У полі пошуку кожного з цих переліків наберіть кілька літер назви. Список мусить звужуватися на кожну літеру, а коли не знайдено нічого — сказати про це словами, а не лишитися порожнім.',
					en: 'In the search field of each listing type a few letters of a name. The list must narrow on every letter, and when nothing is found it must say so in words rather than just go empty.'
				},
				coverage: 'manual'
			},
			{
				id: 'galaxy_3',
				category: { uk: 'Навчальні заклади', en: 'Schools' },
				text: {
					uk: 'Відкрийте будь-який навчальний заклад зі списку. Спершу мусять іти люди зі знімками, а вже за ними — ті, у кого знімка немає. Оновіть сторінку кілька разів: порядок усередині кожної з цих двох частин мусить мінятися.',
					en: 'Open any school from the list. People with photographs must come first, and only then those without. Reload the page a few times: the order inside each of those two parts must change.'
				},
				coverage: 'manual'
			},
			{
				id: 'galaxy_4',
				category: { uk: 'Навчальні заклади', en: 'Schools' },
				text: {
					uk: 'На сторінці закладу знайдіть людину, у якої вказано майстра курсу. Ім’я майстра мусить бути посиланням і відкривати його сторінку; якщо в нього є знімок — він мусить стояти поруч з ім’ям.',
					en: 'On a school page find a person with a course master named. The master’s name must be a link opening their page; if they have a photograph, it must stand next to the name.'
				},
				coverage: 'manual'
			},
			{
				id: 'galaxy_5',
				category: { uk: 'Фестивалі', en: 'Festivals' },
				text: {
					uk: 'Відкрийте фестиваль «Одеса.Театр.PRO» 2026. Унизу мусить бути розділ «Новини», а в ньому — новина про підсумки фестивалю з датою. Її заголовок мусить відкривати саму новину.',
					en: 'Open the “Odesa.Teatr.PRO” 2026 festival. At the bottom there must be a “News” section holding the story about the festival results, with its date. Its heading must open the story itself.'
				},
				coverage: 'manual'
			},
			{
				id: 'galaxy_6',
				category: { uk: 'Фестивалі', en: 'Festivals' },
				text: {
					uk: 'На сторінці фестивалю з програмкою натисніть скан програмки. Аркуш мусить відкритися на весь екран, і дрібні імена в ньому мусять читатися.',
					en: 'On a festival page that has a programme, press the scan of the programme. The sheet must open full screen, and the small names on it must be readable.'
				},
				coverage: 'manual',
				testid: 'festival-booklets-list'
			},
			{
				id: 'galaxy_7',
				category: { uk: 'Межа', en: 'Boundary' },
				text: {
					uk: 'Пройдіть переліки в кожній із чотирьох тем. Жоден напис — зокрема число поруч із назвою фільтра — НЕ мусить зливатися з тлом так, щоб його доводилося вгадувати.',
					en: 'Go through the listings in each of the four themes. No label — the count next to a filter name included — may blend into its background so much that you have to guess it.'
				},
				coverage: 'manual',
				negative: true
			},
			{
				id: 'galaxy_8',
				category: { uk: 'Театри', en: 'Theatres' },
				text: {
					uk: 'Відкрийте «Театри» й перейдіть до будь-якого театру. Мусить бути видно місто, країну й наших людей у ньому; посилання на сайт театру, якщо воно є, мусить відкриватися в новій вкладці.',
					en: 'Open “Theatres” and go to any theatre. The city, the country and our people there must be visible; the link to the theatre’s own site, if present, must open in a new tab.'
				},
				coverage: 'manual'
			},
			{
				id: 'galaxy_9',
				category: { uk: 'Зіркові митці', en: 'Star artists' },
				text: {
					uk: 'Відкрийте «Зіркові митці». Спробуйте всі три кнопки над переліком — «Всі», «Експертна Рада», «Викладають у випускників»: число поруч із кнопкою мусить збігтися з тим, скільки карток лишилося. Далі знайдіть Дмитра Богомазова й зайдіть на його сторінку: там мусять бути наші випускники, чий він майстер курсу, навчальний заклад і новини, де його згадали. З кожного з них має бути перехід — і назад до переліку теж.',
					en: 'Open “Star artists”. Try all three buttons above the listing — “All”, “Expert council”, “Teach our graduates”: the number next to a button must match how many cards remain. Then find Dmytro Bohomazov and open his page: it must show our graduates whose course master he is, the school, and the news that mention him. Each of those must be clickable — and there must be a way back to the listing.'
				},
				coverage: 'manual'
			},
			{
				id: 'galaxy_10',
				category: { uk: 'Зіркові друзі', en: 'Star friends' },
				text: {
					uk: 'Відкрийте «Зіркові друзі». Натисніть будь-яку картку — вона мусить розгорнутися на весь екран так, щоб можна було прочитати рукописне побажання; стрілками мусять гортатися сусідні картки. Перемкніть показ на «Список» — знімки зникнуть, імена лишаться.',
					en: 'Open “Star friends”. Press any card — it must open full screen so that the handwritten note is readable, and the arrows must move to the neighbouring cards. Switch the view to “List” — the images must go and the names must stay.'
				},
				coverage: 'manual',
				testid: 'galaxy-friends-open-btn-raisa-nedashkivska'
			}
		]
	},
	{
		id: 'admin',
		title: { uk: 'Адмінка', en: 'Admin panel' },
		/*
		 * Усі сторінки адмінки — однією вкладкою: пункти нижче стосуються не
		 * окремої адреси, а входу й роботи з формами, які в них спільні.
		 */
		routes: [
			'/admin',
			'/admin/login',
			'/admin/articles',
			'/admin/articles/new',
			'/admin/content',
			'/admin/content/new',
			'/admin/pages',
			'/admin/pages/new',
			'/admin/settings',
			'/admin/users'
		],
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
			 * `light-dark()` у палітрі (UI-UX-v9 § 1.5.1).
			 *
			 * Перший перевіряє ВИГРАШ: сторінка тепер бере системну тему без
			 * жодного JS. Автотестом це не міряється чесно — Playwright ганяє
			 * сторінку з увімкненим JS, а вимкнути його означає перевіряти інший
			 * застосунок.
			 *
			 * Другий перевіряє те саме місце, але з іншого боку — і формулювання
			 * в ньому мінялося на протилежне, тому варто пояснити чому.
			 *
			 * Спершу тут стояла ЦІНА: звуження схеми до `light` дозволяло Android
			 * Chrome інвертувати кольори, і пункт просив записати, наскільки зле
			 * це виглядає. 7 вересня 2026 автор надіслав знімок із телефона — це
			 * виглядало неприпустимо, і причину знайшли: рятує не `light`, а
			 * `only light`, документована відмова від Auto Dark Theme.
			 *
			 * Відтоді інверсія — ДЕФЕКТ, а не ціна, і пункт мусить казати саме
			 * так. Пункт, який називає регресію очікуваною, гірший за відсутній:
			 * єдина людська перевірка цього місця вчила б проходити повз нього.
			 * Машина сюди не дістає в принципі — Auto Dark Theme живе в браузері
			 * телефона, а не на сторінці; у коді три джерела схеми звіряє
			 * `src/theme-appearance.test.ts`.
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
					uk: 'На Android-телефоні увімкніть у Chrome примусову темну тему (Налаштування > Спеціальні можливості > Примусова темна тема сайтів), оберіть на сайті ЯВНО світлу тему й відкрийте головну. Сторінка мусить лишитися світлою й виглядати так само, як на настільному браузері. Якщо браузер перефарбував її — це ДЕФЕКТ: відмова від Auto Dark Theme перестала діяти.',
					en: 'On an Android phone turn on Chrome’s force dark mode (Settings > Accessibility > Force dark mode for sites), pick the LIGHT theme on the site explicitly and open the home page. The page must stay light and look exactly as it does on a desktop. If the browser has repainted it, that is a DEFECT: the opt-out from Auto Dark Theme has stopped working.'
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
	/**
	 * Вихід зі сторінки (§ 8.4): тестувальник приходить за прямим посиланням, у
	 * нього немає ні історії, ні пункта меню — сторінки немає в меню за § 4.
	 */
	backHome: { uk: 'На головну', en: 'Home' },
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
