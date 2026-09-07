/**
 * Старі адреси, які ведуть на нові, — п'ять реєстрів в одному місці.
 *
 * ## Навіщо зведено разом
 *
 * Мапи жили по одній у своїх маршрутах, і кожна поводилася однаково: стару
 * адресу НЕ пререндерили, покладаючись на те, що її віддасть
 * `fallback: '404.html'`, клієнтський роутер виконає завантажувач, побачить
 * стару назву й поведе далі. Три докблоки описували це як свідоме рішення з
 * відомою ціною («краулер без JS редиректу не побачить»).
 *
 * Заміряно 7 вересня 2026 у справжньому браузері на зібраній статиці — механізм
 * не спрацював ЖОДНОГО разу:
 *
 *   /projects/galaxy-graduates/festivals/slavianskyi-venok/ ... 404
 *   /projects/galaxy-graduates/plays/chuchelo-2016/ ............ 404
 *   /residents/adults/n-rybakova/ .............................. 404
 *   /projects/galaxy-graduates/maryna-vishtaliuk-sukhanova/ .... 404
 *
 * Причина одна на всіх: `404.html` у цьому проєкті не порожня оболонка, а готова
 * сторінка «Сторінку не знайдено». Вона гідратується як помилка й адресу заново
 * не розв'язує. Тобто ціною була не «втрата краулера» — не працювало нічого й ні
 * для кого, і всі 57 старих адрес просто вели в нікуди.
 *
 * ## Що працює натомість
 *
 * Те саме, чим у проєкті вже роками живуть новини: СТАРА адреса стоїть в
 * `entries()` свого маршруту, пререндериться, і `redirect()` у завантажувачі стає
 * сторінкою з `meta http-equiv="refresh"`. Статика віддає її з кодом 200.
 *
 * Кожна така сторінка мусить бути ще й у трьох місцях, інакше збірка червоніє
 * або сторінка тихо їде в індекс порожньою:
 *
 *   `svelte.config.js` → `PUBLIC_ENTRIES` — заради АНГЛІЙСЬКОГО дзеркала:
 *       `entries()` маршруту дає лише адресу без префікса (мову робить хук
 *       `reroute`), і без цього рядка `/en/<стара>` не існувало б;
 *   `config/redirects.ts` — інакше `checkNoEmptyPages` валить збірку на
 *       `meta refresh`, а мапа сайту кладе заглушку в індекс;
 *   `BETA_UNCOVERED_ROUTES` — інакше гейт чеклиста вимагає пунктів на сторінку,
 *       якої людина не побачить.
 *
 * Два останні переліки ВИВОДЯТЬСЯ звідси (`RENAMED_PATHS`), а не повторюються:
 * другий список розійшовся б із першим на наступному ж перейменуванні. Перший
 * повторити доводиться — конфіг збірки не читає TypeScript, — і саме тому збіг
 * стереже `src/renamed-addresses.test.ts`.
 *
 * ## Спростування, яке варто назвати
 *
 * Докблоки сторінок майстра й випускника стверджували, що заглушку зробити не
 * можна: мовляв, `target` у реєстрі — «хвіст шляху», і для СУСІДНЬОЇ сторінки він
 * не працює, бо `resolve()` віддає відносну адресу `../andrii-romanko/`. Це
 * неправда: редирект пише не `resolve()`, а `localizedPath()`, і в `meta refresh`
 * потрапляє повний шлях, у якому хвіст є. Перевірено на всіх 57 адресах.
 *
 * ## Чому новин тут немає
 *
 * `RENAMED_NEWS_IDS` лишається в `config/newsAliases.ts`: це єдина мапа, яка вже
 * була підключена правильно (стара адреса в `entries()` новин і в
 * `PUBLIC_ENTRIES`), і на неї спираються гейти реєстру новин. Переносити робочий
 * механізм заради симетрії означало б чіпати те, що працює.
 */

import { GRADUATE_ALIASES_DATA } from '../data/addressAliases.data';

/**
 * `slavianskyi-venok` була транслітерацією з РОСІЙСЬКОЇ назви («Славянский
 * венок»), тоді як сама назва українська. Адреса прожила в проді менш ніж
 * добу, але встигла потрапити в мапу сайту.
 */
export const RENAMED_FESTIVAL_SLUGS: Record<string, string> = {
	'slavianskyi-venok': 'slovianskyi-vinok'
};

/**
 * Групи, чиї картки звели в одну.
 */
export const RENAMED_GROUP_SLUGS: Record<string, string> = {
	// 2026-09-07: курс «Асорті» мав ДВІ картки — в одній склад і репертуар, у
	// другій знімки. Автор попросив звести їх у `asorti`. Стара адреса встигла
	// побувати в мапі сайту, тож просто зникнути не може.
	assorti: 'asorti'
};

/**
 * Стара адреса вистави → нова. Наслідок злиття двійників.
 *
 * ## Звідки взялися двійники
 *
 * Той самий показ приходив у реєстр двічі — з репертуару майстра й із розкладу,
 * — і назва в них написана по-різному: «Отрывки из «классики»» проти «Уривки з
 * класики», «Blondie» проти «Blondi». Дві назви ставали двома адресами.
 * Заміряно нечітким пошуком: 30 кластерів схожих назв в одному році, і лише в
 * одному з них це справді два різних покази («Показ етюдів» 2024, номери 57 і
 * 58).
 *
 * Розпізнати їх можна за тим, що номер показу школи є рівно в ОДНОГО запису
 * пари: номер веде реєстр, розклад його не знає.
 */
export const RENAMED_PLAY_IDS: Record<string, string> = {
	// Записи-уривки, згорнуті у свій вечір: уривок не вистава, а номер програми.
	'chuchelo-2016': 'boikot-2016',
	'divchynka-z-vedmedykom-2025': 'uryvky-z-klasyky-2025',
	'hrikh-2012': 'uryvky-z-dramaturhii-20-stolittia-2012',
	'romeo-i-dzhulietta-2025': 'uryvky-z-klasyky-2025',
	'stekliannyi-zverynets-2016': 'uryvky-z-klasyky-2016-2',
	'uryvky-z-klasyky-toi-shcho-otrymuie-liapasa-2012': 'uryvky-z-dramaturhii-20-stolittia-2012',
	'uryvky-z-klasyky-neznaiomka-o-bloka-2013': 'uryvky-z-klasyky-2013',
	'uryvky-z-klasyky-asia-i-turhenev-2014': 'uryvky-z-klasyky-2014',
	'uryvky-z-klasyky-unyzhennye-y-oskorblennye-2015': 'uryvky-z-klasyky-2015-3',

	// Двійники з двох джерел: репертуар майстра й розклад.
	'balahanchyk-bratev-hrymm-2019': 'balahanchyk-brativ-hrym-2019',
	'blondie-2020': 'blondi-2020',
	'chapaiev-i-vasylisa-2021': 'chapaiev-ta-vasylisa-2021',
	'hde-vse-2015': 'de-vsi-2015',
	'do-svydania-ovrah-2014': 'do-svydanyia-ovrah-2014',
	'feisbuchyk-2019': 'feis-bu-chik-2019',
	'foto-toplies-2018': 'foto-toples-2018',
	'iak-podruzhytysia-z-chakalkoiu-2023': 'iak-podruzhytys-z-chekalkoiu-2023',
	'skazka-ardennskoho-lesa-2017': 'kazka-ardenskoho-lisu-2017',
	'krestyky-nolyky-2008': 'khrestyky-nulyky-2008',
	'komnata-nevest-2008': 'kimnata-narechenoi-2008',
	'koralina-v-kriny-koshmariv-2020': 'koralina-v-kraini-koshmariv-2020',
	'natashy-2013': 'natashi-2013',
	'nikomu-ne-potribni-2023': 'nikomu-nepotribni-2023',
	'yzumrudnyi-horod-2007': 'smarahdove-misto-2007',
	'tin-2013': 'ten-2013',
	'v-poshukakh-natkhnennia-2021': 'u-poshukakh-natkhnennia-2021',
	'uryvky-z-klasyky-2023': 'uryvky-iz-klasyky-2023',
	'otryvky-yz-klassyky-2013': 'uryvky-z-klasyky-2013',
	'otryvky-yz-klassyky-2014': 'uryvky-z-klasyky-2014',
	'otryvky-yz-klassyky-2015': 'uryvky-z-klasyky-2015',
	'otryvky-yz-klassyky-2016': 'uryvky-z-klasyky-2016',
	'vse-lito-v-odyn-den-2020': 'use-lito-v-odyn-den-2020',
	'zona-turbulentnosty-2017': 'zona-turbulentnosti-2017',

	/*
	 * Заходи школи, які досі лежали як звичайні вистави курсу.
	 *
	 * Ключі змінилися з двох причин відразу. Перша — рік у двох із трьох був
	 * НЕПРАВИЛЬНИЙ, а рік стоїть у самому ключі: «Шахи» — Посвята 2013-го, не
	 * 2014-го; «Театральне королівство» — 2012-го, не 2013-го (обидві дати
	 * названі в титрах записів). Друга — усі роки Посвяти тепер живуть під одним
	 * префіксом, тобто адреса каже, що це за подія, ще до відкриття сторінки.
	 */
	'shakhy-2014': 'posviata-2013',
	'teatralnie-korolevstvo-2013': 'posviata-teatralne-korolivstvo-2012',
	'eneida-2022': 'posviata-2022',

	// Двійники через помилки в роках або написанні в анкетах
	'alysa-v-zazerkalyy-2012': 'alisa-v-zadzerkalli-2013',
	'chypollyno-2010': 'tsybulino-2010',
	'durochka-2011': 'durochka-2010',
	'feis-bu-chik-2018': 'feis-bu-chik-2019',
	'moia-voobrazylyia-2011': 'moia-voobrazylyia-2012',
	'moia-voobraziliia-2012': 'moia-voobrazylyia-2012',
	'rusalochka-2012': 'sestra-moia-rusalochka-2012',
	'skazky-skvoz-kamny-2014': 'kazky-kriz-kaminnia-2015',
	'tolpa-odynokykh-2016': 'natovp-samotnikh-2017',
	'veselyi-rodzher-2013': 'veselyi-rodzher-2014',
};

/**
 * Сторінки працівників: адреси приведені до конвенції «ім'я-прізвище».
 */
export const RENAMED_MASTER_SLUGS: Record<string, string> = {
	// 2026-08-24: запис був без імені («Романко»), автор дав «Романко Андрій»,
	// і slug приведено до конвенції `ім'я-прізвище`. Стара адреса була в
	// sitemap.xml, тож просто зникнути вона не може.
	romanko: 'andrii-romanko',
	// 2026-08-24: slug був на ініціалі, хоч імʼя лежало в тому самому записі
	// («Надія РИБАКОВА», `fullName` «Рибакова Надія В.») — вигадувати не
	// довелося нічого. Разом зі slug перейменований і `id`: на нього вказують
	// ТРИ випускники (`masters[].id` у `graduates.index.json` і в профілях
	// `17M`, `20M`, `20M_1`), і без цього вона втратила б усіх трьох учнів —
	// сторінка лишилася б цілою, просто порожньою.
	'n-rybakova': 'nadiia-rybakova'
};

/**
 * Адреса випускника — ідентифікатор, який людина роздавала роками, і в цьому
 * проєкті вона й досі повторює стару адресу з Google-сайту. Тому зміна адреси
 * не буває безслідною: сторінка з 404 виглядає як «людину видалили», а не як
 * «людина перейменувалася».
 */
export const RENAMED_GRADUATE_ADDRESSES: Record<string, string> = {
	// 2026-09-01: на прохання самої людини з адреси й з ключа зв'язків прибрано
	// дівоче прізвище. Показне ім'я не змінювалося — у реєстрі вже стояло
	// «Марина Суханова», старе прізвище лишалося тільки в ідентифікаторах.
	// Разом з адресою перейменовано `id`, на який вказували дванадцять записів
	// у `play-cast.json`, група в `groups.data.json` і двоє фестивалів.
	'maryna-vishtaliuk-sukhanova': 'maryna-sukhanova',
	// 2026-09-01: у випуску 2018 стояли ДВІ «Тетяна Нікітенко» — у джерелі було
	// скорочено «Нікітенко Т» і «Нікітенко Є», тож той, хто вносив, друге ім'я
	// вгадав хибно. Замовник назвав його: Єлизавета. Стара адреса була в
	// sitemap.xml, тож просто зникнути вона не може, хоч на сторінку й не
	// вказував жоден звʼязок — ні склад вистави, ні група, ні фестиваль.
	'tetiana-nikitenko-2': 'yelyzaveta-nikitenko',
	// 2026-09-01: три написання, які замовник виправив у списку художників.
	// Великі літери посеред слова показували, де саме правка: «МаНтас» замість
	// «Мактас», «ЛунЬОва» замість «Лунєва», «Ніколаєва» замість «Николаєва».
	// Ім'я на сторінці виправили одразу, а адреса лишалася зі старим — тобто
	// суперечила тому, що людина про себе читає. Знімків і анкет у цих трьох
	// немає, тож перейменування коштувало лише цих рядків.
	'kateryna-maktas': 'kateryna-mantas',
	'yana-lunieva': 'yana-lunova',
	'krystyna-nykolaieva': 'krystyna-nikolaieva',
	// 2026-09-01: Роман Арабаджі попросив адресу `reverenciel` — під цим імʼям
	// його знають як співака (YouTube, Instagram). Ключ звʼязків `id` лишився
	// `roman-arabadzhi`: на нього вказують склади вистав і групи, і саме для
	// такого випадку id та адреса й розділені.
	'roman-arabadzhi': 'reverenciel',
	// 2026-09-01: Алла Бринза попросила адресу `al_bryn`. Підкреслення в
	// слагах не траплялося ні разу на 530, зате в адресах воно вже є — коди
	// старого сайту на кшталт `18A_1` і `kamywek_`. Ключ зв'язків `id`
	// лишився `alla-brynza`: на нього вказує склад групи «Рост-Ок».
	'alla-brynza': 'al_bryn'
};

/**
 * Стандартна адреса випускника → його особиста. ГЕНЕРУЄТЬСЯ.
 *
 * Це не перейменування: адреса `alik-zapolnov` ніколи не існувала, просто її
 * очікують — бо в решти 506 випускників адреса саме така. Механіка ж потрібна
 * та сама, що для перейменувань, тож аліаси й лежать у тому самому переліку
 * `RENAMED_PATHS`: заглушка з `meta refresh`, запис у реєстрі, рядок у чеклисті.
 *
 * Виводяться скриптом `npm run build:address-aliases` — там і розбір, звідки
 * береться пара й що робиться зі зіткненнями тезок. Двоє (`roman-arabadzhi`,
 * `alla-brynza`) сюди НЕ потрапляють: у них адресу справді міняли, і вони
 * лишаються перейменуваннями вище.
 */
export const GRADUATE_ALIASES: Record<string, string> = GRADUATE_ALIASES_DATA;

/**
 * Старі адреси повними шляхами — для реєстру заглушок і чеклиста.
 *
 * Пара «стара адреса → нова», обидві без мовного префікса й без кінцевої риски:
 * саме такої форми чекають `config/redirects.ts` (де ціль іде «хвостом») і
 * `BETA_UNCOVERED_ROUTES`.
 */
export const RENAMED_PATHS: readonly (readonly [старий: string, новий: string])[] = [
	...Object.entries(RENAMED_FESTIVAL_SLUGS).map(
		([с, н]) =>
			[
				`/projects/galaxy-graduates/festivals/${с}`,
				`projects/galaxy-graduates/festivals/${н}`
			] as const
	),
	...Object.entries(RENAMED_GROUP_SLUGS).map(
		([с, н]) =>
			[`/projects/galaxy-graduates/groups/${с}`, `projects/galaxy-graduates/groups/${н}`] as const
	),
	...Object.entries(RENAMED_PLAY_IDS).map(
		([с, н]) =>
			[`/projects/galaxy-graduates/plays/${с}`, `projects/galaxy-graduates/plays/${н}`] as const
	),
	...Object.entries(RENAMED_MASTER_SLUGS).map(
		([с, н]) => [`/residents/adults/${с}`, `residents/adults/${н}`] as const
	),
	...Object.entries(RENAMED_GRADUATE_ADDRESSES).map(
		([с, н]) => [`/projects/galaxy-graduates/${с}`, `projects/galaxy-graduates/${н}`] as const
	),
	...Object.entries(GRADUATE_ALIASES).map(
		([с, н]) => [`/projects/galaxy-graduates/${с}`, `projects/galaxy-graduates/${н}`] as const
	)
];
