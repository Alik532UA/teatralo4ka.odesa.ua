import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

/**
 * Правила зібрані за CODE-QUALITY-v8 § 6.4 та SVELTE-CORE-v8 § 6.
 *
 * Ідея не в тому, щоб увімкнути якнайбільше, а в тому, щоб анти-патерни
 * зі стандарту перестали бути текстом і стали помилкою збірки.
 */
export default ts.config(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node }
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser,
				svelteConfig
			}
		}
	},
	{
		rules: {
			// Анти-патерни SVELTE-CORE-v8: застарілі ідіоми Svelte 4 та SvelteKit < 2.12.
			// Без цього правила заборона лишається текстом у документі.
			'no-restricted-imports': [
				'error',
				{
					paths: [
						{
							name: 'svelte/store',
							importNames: ['writable', 'readable', 'derived'],
							message: 'Svelte 5: використовуйте $state/$derived (SVELTE-CORE-v8, анти-патерни).'
						},
						{
							name: '$app/stores',
							message: 'Deprecated із SvelteKit 2.12: імпортуйте page з $app/state.'
						}
					]
				}
			],

			// SECURITY-v8 § 13
			'no-eval': 'error',
			'no-implied-eval': 'error',
			'no-new-func': 'error',
			'no-script-url': 'error',

			// DEBUGGING-v8: логування йде через errorLogger, а не console.
			//
			// Було `warn` із поясненням «є місця, які ще не мігровані». Заміряно
			// 2026-08-16: у застосунку таких місць НУЛЬ. Усі 12 попереджень жили в
			// `scripts/` і `vite.config.ts` — а це Node-утиліти, для яких `console`
			// і є інтерфейсом виводу, тож вони не мігрувалися б ніколи.
			//
			// Тобто число не зменшувалося не тому, що борг не платять, а тому, що
			// це був не борг. Борг у режимі `warn` мусить лише спадати
			// (CODE-QUALITY-v8 § 6.4.1); попередження, яке не може дійти до нуля,
			// вчить не читати вивід lint — того самого класу, що `off`.
			//
			// Тому: скриптам правило вимкнене нижче окремим блоком із причиною, а
			// для решти — `error`, бо порушень нуль.
			'no-console': ['error', { allow: ['warn', 'error'] }],

			// CODE-QUALITY-v8 § 1: any заборонений, але вимикати збірку на наявних
			// випадках не можна — тому warn, і список має скорочуватися.
			//
			// 31 на момент увімкнення правила, 39 на 2026-08-14. Число зросло, і
			// це рівно те, заради чого `warn` стоїть замість `off`: борг видно.
			'@typescript-eslint/no-explicit-any': 'warn',

			// CODE-QUALITY-v8 § 1: `@ts-ignore` без записаної причини. Останнє
			// правило базового набору § 6.4.1, якого тут бракувало; знахідок нуль,
			// тож одразу error.
			'@typescript-eslint/ban-ts-comment': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					// const { updatedAt, ...rest } = obj — стандартна ідіома «прибрати ключ».
					// Без цього ESLint вимагав би видалити змінну і мовчки змінив би поведінку.
					ignoreRestSiblings: true
				}
			],

			// Компіляторні a11y-попередження Svelte (ACCESSIBILITY-v8 § 10.5).
			'svelte/valid-compile': 'error',

			// I18N-v8 § 4.3, HIGH: форматування без явної локалі.
			//
			// Без аргументу метод бере локаль СИСТЕМИ, а не мову сайту. Помилка
			// невидима саме там, де її шукають: у розробника система українська,
			// сайт українською, вивід збігається. Ламається вона в англійській
			// версії на українській системі й навпаки — тобто рівно в того
			// відвідувача, який до розробника не дійде.
			//
			// Ловилося це в проєкті рівно нічим: у README пакета такий гейт
			// обіцяний, а правила не було, і `MAX_CONTENT_LEN.toLocaleString()`
			// в ArticleForm прожив до 2026-08-14.
			//
			// Селектор дивиться саме на ВІДСУТНІСТЬ аргументів: із локаллю це
			// правильний виклик, і чіпати його не треба.
			'no-restricted-syntax': [
				'error',
				{
					selector:
						"CallExpression[arguments.length=0][callee.property.name=/^toLocale(String|DateString|TimeString)$/]",
					message:
						'I18N-v8 § 4.3: передайте локаль явно — без неї береться локаль системи, а не мова сайту.'
				}
			],

			// SVELTE-CORE-v8 § 1.5. Було 8 місць у режимі warn. Два з них були
			// справжнім станом і переїхали на SvelteSet; решта шість — локальні
			// тимчасові колекції, які взагалі не мали бути реактивними, і кожна
			// має поруч записану причину. Тепер error.
			'svelte/prefer-svelte-reactivity': 'error',

			// SECURITY-v8 § 5.3. Кожен {@html} у проєкті — виняток із записаною
			// причиною і `eslint-disable-next-line` поруч. Тепер error: новий
			// {@html} без такого коментаря не пройде lint, а отже і CI.
			'svelte/no-at-html-tags': 'error',

			// SVELTE-UI-v8, HIGH. Було 60 місць у режимі warn — усі мігровані,
			// тож правило підняте до error і назад воно вже не опуститься.
			// Ціна ключа не нульова: дублікат кидає помилку в рантаймі, а не на
			// збірці. Тому ключі взято з полів, які код і так вважає унікальними
			// (id, slug, path), а не з першого-ліпшого рядка.
			'svelte/require-each-key': 'error',

			// --- Борг, що мігрується окремими комітами ---
			// Кожне з правил нижче має бути 'error'. Поки воно 'warn', бо разова
			// зміна на сотні місць непереглядна, а вимкнути її зовсім означало б
			// вдати, що проблеми немає. Кількість у коментарі — стан на момент
			// увімкнення ESLint; вона має лише зменшуватися.

			// Правила немає в стандарті v8, і спершу воно виглядало зайвим: із
			// `base: ''` шаблон `${base}/foo` дає рівно те саме, що resolve('/foo').
			// Різниця в тому, що resolve() ТИПІЗОВАНИЙ проти списку реальних
			// маршрутів проєкту, тож помилка в адресі стає помилкою компіляції.
			// Саме такий баг — '/projects/spring-Odesa-theatre' з великою «O» —
			// тримав сторінку зламаною в продакшні. Було 72 місця, лишилося 0.
			'svelte/no-navigation-without-resolve': 'error'
		}
	},
	{
		// Файли, у яких ЖОДНЕ посилання не може бути статичним, тому точкові
		// винятки на кожен рядок були б просто шумом.
		files: [
			// П'ять посилань на соцмережі, адреси беруться зі словників перекладу.
			'src/lib/components/FooterSection.svelte',
			'src/lib/components/HeroSection.svelte',
			// href приходить пропом; той, хто його передає, уже викликав resolve().
			'src/lib/components/ContentCard.svelte',
			'src/lib/components/ContentWidget.svelte',
			// Усі посилання шапки — це пункти меню з Firestore, які редагує
			// адміністратор: маршрут не відомий на збірці за визначенням.
			// Єдине статичне посилання компонента — логотип — уже на resolve().
			// Точкові коментарі тут не працюють: `eslint-disable-next-line`
			// довелося б ставити між атрибутами тега, а HTML-коментар там
			// недопустимий — перша спроба зламала компіляцію.
			'src/lib/components/HeaderSection.svelte',
			// Перемикання мови: цільова адреса — це ПОТОЧНИЙ шлях із заміненим
			// префіксом локалі (`withLocale(pathname, lang)`), а не ідентифікатор
			// маршруту. `resolve()` приймає лише другий, тож виконати правило тут
			// неможливо в принципі. Раніше цей самий виклик стояв у `HeaderSection`, який
			// уже в цьому переліку; переїзд в окремий модуль лише зробив виняток видимим.
			'src/lib/i18n/switchLanguage.ts',
			// Результати пошуку: адресу кожного вже склав `services/searchIndex`,
			// і склав саме через resolve() із літералом маршруту. Тут вона приходить
			// полем об'єкта (`hit.href`), а такого правило не відстежує в принципі —
			// воно приймає лише прямий виклик resolve() або змінну, у чиєму
			// оголошенні цей виклик стоїть.
			'src/lib/components/SearchOverlay.svelte'
		],
		rules: {
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		/**
		 * Node-утиліти збірки: `console` тут не борг, а спосіб віддати результат.
		 *
		 * `generate-sitemap`, `check-links`, `check-bundle-budget`,
		 * `validate-content` запускаються з `prebuild`/`postbuild` і спілкуються з
		 * розробником та логом CI рівно через stdout. `errorLogger` їм недосяжний
		 * за визначенням: він частина клієнтського застосунку.
		 *
		 * Межа файлова, а не проєктна — саме як вимагає CODE-QUALITY-v8 § 6.4.1.
		 */
		files: ['scripts/**', '*.config.ts', '*.config.js'],
		rules: {
			'no-console': 'off'
		}
	},
	{
		// Згенероване, зібране й службове — не наш код.
		/*
		 * `.claude/` — не вихідний код, а робочі копії інструментів. Паралельна
		 * сесія кладе туди git-worktree з ПОВНОЮ копією проєкту, разом із
		 * `tsconfig.json`; без цього рядка eslint бачить два корені конфігурації й
		 * розбирає чужу копію як свою. Заміряно 26.08 у `Slovko`: один
		 * `.claude/worktrees/…/src/lib/utils/storageMigration.ts` дав `Parsing
		 * error` — тобто `eslint .` став червоний на коді, якого в проєкті немає.
		 * Урок узятий з `VetCrewGames`, де цей рядок уже стоїть.
		 */
		ignores: [
			'build/',
			'.claude/',
			'.svelte-kit/',
			'node_modules/',
			'static/',
			'dist/',
			'firebase/',
			'design-source/',
			'.private/',
			'.temp/',
			'security-audit/',
			// Одноразовий міграційний скрипт, залишений як історія правки.
			'scripts/update_settings_ui.cjs'
		]
	},

	/**
	 * STORAGE-NAMESPACE-v8, Крок 3: прямий доступ до Web Storage заборонений.
	 *
	 * Origin спільний із сусідніми проєктами, тож ключ без префікса — це не
	 * дрібниця, а чужі дані. Доти заборона трималася лише на рядку в AGENTS.md,
	 * і три проєкти з восьми вже її порушували, чого не помітив ніхто.
	 *
	 * Правил два, і друге не зайве: `no-restricted-globals` НЕ ловить
	 * `window.localStorage`. Канон у Кроці 3 наводить лише його — а саме ця
	 * форма й трапилася в DigitalWorkshop, тричі поспіль.
	 */
	{
		rules: {
			'no-restricted-globals': [
				'error',
				{ name: 'localStorage', message: 'STORAGE-NAMESPACE-v8: лише через фасад storage.' },
				{ name: 'sessionStorage', message: 'STORAGE-NAMESPACE-v8: лише через фасад storage.' }
			],
			'no-restricted-properties': [
				'error',
				{ object: 'window', property: 'localStorage', message: 'STORAGE-NAMESPACE-v8: лише через фасад storage.' },
				{ object: 'window', property: 'sessionStorage', message: 'STORAGE-NAMESPACE-v8: лише через фасад storage.' }
			]
		}
	},
	{
		// Три категорії, і кожна законна за самим каноном:
		//   1. Фасад — тут прямий доступ Є реалізацією (Крок 3).
		//   2. Модуль міграції — читає ключі БЕЗ префікса, і це єдине легальне
		//      місце, де так можна (Крок 4). Лежить у services/ або utils/
		//      залежно від проєкту, тому шаблон без шляху.
		//   3. Тести фасаду й e2e — вони мусять читати й засівати сирі ключі,
		//      інакше нічим довести, що префікс справді додається.
		files: [
			'src/lib/services/storage.ts',
			'src/lib/services/storage/**',
			'src/lib/config/storage.ts',
			'**/storageMigration.ts',
			'**/storage.test.ts',
			'**/storage.spec.ts',
			'tests/**',
			'e2e/**'
		],
		rules: {
			'no-restricted-globals': 'off',
			'no-restricted-properties': 'off'
		}
	}
);
